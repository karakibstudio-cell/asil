/**
 * Image optimization & High-Fidelity processing utility
 * Converts and compresses uploaded images (especially PNG with transparency and crisp posters)
 * while preserving high resolution, clean text edges, and true color accuracy.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  forcePng?: boolean;
}

/**
 * Optimizes an image File (supports PNG, JPG, WebP, SVG).
 * For PNGs, alpha transparency and crisp lines are preserved.
 * Output is an optimized Base64 Data URL.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 3840,
    maxHeight = 3840,
    quality = 0.95,
    forcePng = false
  } = options;

  // If SVG, return as standard Data URL (SVGs are vector and resolution-independent)
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Load into HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Failed to read image file'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate new dimensions preserving aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { alpha: true });
          if (!ctx) {
            resolve(src); // fallback
            return;
          }

          // Clear canvas with transparency
          ctx.clearRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

          let dataUrl: string;
          if (isPng || forcePng) {
            // Preserve PNG transparency & sharpness
            dataUrl = canvas.toDataURL('image/png');
            // If PNG is very large (>1.2MB), scale gently to maintain quality
            if (dataUrl.length > 1500000 && width > 800) {
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = Math.round(width * 0.85);
              scaledCanvas.height = Math.round(height * 0.85);
              const sCtx = scaledCanvas.getContext('2d', { alpha: true });
              if (sCtx) {
                sCtx.imageSmoothingEnabled = true;
                sCtx.imageSmoothingQuality = 'high';
                sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                dataUrl = scaledCanvas.toDataURL('image/png');
              }
            }
          } else {
            // For JPG / other formats, use WebP or High Quality JPEG
            try {
              dataUrl = canvas.toDataURL('image/webp', quality);
              if (!dataUrl.startsWith('data:image/webp')) {
                dataUrl = canvas.toDataURL('image/jpeg', quality);
              }
            } catch {
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
          }

          resolve(dataUrl);
        } catch (err) {
          console.warn('Canvas optimization error, falling back to original data URL:', err);
          resolve(src);
        }
      };

      img.onerror = () => {
        resolve(src);
      };

      img.src = src;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Safely opens any image (Base64 data URL, blob URL, or standard HTTP/HTTPS link) in a new browser tab.
 * Avoids Chromium security block when navigating the top frame to 'data:' URLs.
 */
export function openImageInNewTab(imageUrl: string, title = 'معاينة الصورة'): void {
  if (!imageUrl || !imageUrl.trim()) return;

  const url = imageUrl.trim();

  // If base64 data URL, convert to Blob URL so Chrome/Edge can display it directly in a new tab without blocking
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (win) {
        return;
      }
    } catch (err) {
      console.warn('Failed opening base64 image as blob URL, falling back to styled HTML window:', err);
    }

    // Secondary fallback: open blank window and write styled HTML image viewer
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 24px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #0c0a09;
        color: #e7e5e4;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .wrapper {
        background: #1c1917;
        border: 1px solid #44403c;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        max-width: 95vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      img {
        max-width: 85vw;
        max-height: 75vh;
        object-fit: contain;
        border-radius: 12px;
      }
      .caption {
        margin-top: 16px;
        font-size: 13px;
        color: #a8a29e;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <img src="${url}" alt="${title}" />
      <div class="caption">${title}</div>
    </div>
  </body>
</html>`);
      win.document.close();
      return;
    }
  }

  // Standard HTTP/HTTPS link or Blob URL
  window.open(url, '_blank', 'noopener,noreferrer');
}
