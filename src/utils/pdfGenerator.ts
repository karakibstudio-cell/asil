import type { jsPDF } from 'jspdf';

export interface GeneratePdfOptions {
  fileName?: string;
  quality?: number;
}

/**
 * Capture an HTML DOM element and generate a high-definition PDF file or Base64 string
 * Supports Arabic RTL text with full typography fidelity (Cairo / Tajawal)
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: GeneratePdfOptions = {}
): Promise<{ pdf: jsPDF; base64: string; blob: Blob }> {
  // Dynamically load heavy PDF engines only on demand
  const [{ default: jsPdfConstructor }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);

  // 1. Temporarily ensure element is visible and styles are rendered
  const originalWidth = element.style.width;
  element.style.width = '794px'; // Standard A4 width at 96 DPI

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: 794,
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        try {
          // Helper canvas for converting any modern CSS color to RGB/Hex
          const helperCanvas = document.createElement('canvas');
          helperCanvas.width = 1;
          helperCanvas.height = 1;
          const ctx = helperCanvas.getContext('2d');

          const safeConvertColor = (colorStr: string): string => {
            if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) return colorStr;
            return colorStr.replace(/oklch\([^)]+\)/g, (match) => {
              if (!ctx) return '#888888';
              try {
                ctx.fillStyle = '#000000';
                ctx.fillStyle = match;
                return ctx.fillStyle;
              } catch {
                return '#888888';
              }
            });
          };

          // 1. Sanitize all <style> tags in cloned document
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((tag) => {
            if (tag.textContent && tag.textContent.includes('oklch')) {
              tag.textContent = safeConvertColor(tag.textContent);
            }
          });

          // 2. Sanitize all elements inside cloned container
          const colorProperties = [
            'color',
            'backgroundColor',
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor',
            'fill',
            'stroke'
          ];

          const allNodes = clonedElement.querySelectorAll('*');
          allNodes.forEach((node) => {
            const el = node as HTMLElement;
            if (!el.style) return;
            try {
              const computed = window.getComputedStyle(el);
              colorProperties.forEach((prop) => {
                const val = (computed as any)[prop];
                if (val && typeof val === 'string' && val.includes('oklch')) {
                  (el.style as any)[prop] = safeConvertColor(val);
                }
              });
            } catch {}
          });
        } catch (e) {
          console.warn('[PDF Generator] Sanitizer non-fatal warning:', e);
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', options.quality || 0.95);
    
    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPdfConstructor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages if content exceeds 1 page
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Get Base64 string (without the data URL prefix)
    const dataUri = pdf.output('datauristring');
    const base64 = dataUri.split(',')[1] || '';
    const blob = pdf.output('blob');

    return { pdf, base64, blob };
  } finally {
    element.style.width = originalWidth;
  }
}

/**
 * Download generated PDF to client's device
 */
export async function downloadInvoicePdf(
  element: HTMLElement,
  fileName: string = 'Prestige-Invoice.pdf'
): Promise<string> {
  const { pdf, base64 } = await generatePdfFromElement(element, { fileName });
  pdf.save(fileName);
  return base64;
}
