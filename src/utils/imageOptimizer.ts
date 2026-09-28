/**
 * Image optimization & PNG processing utility
 * Converts and compresses uploaded images (especially PNG with transparency) 
 * so they fit safely within localStorage and Firestore quotas while keeping crisp quality.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 to 1
  forcePng?: boolean;
}

/**
 * Optimizes an image File (supports PNG, JPG, WebP, SVG).
 * For PNGs, transparency is preserved.
 * Output is an optimized Base64 Data URL.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.85,
    forcePng = false
  } = options;

  // If SVG, return as standard Data URL (SVGs are vector and usually tiny)
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
            // Preserve PNG transparency
            dataUrl = canvas.toDataURL('image/png');
            // If PNG is still over ~600KB, try scaling slightly down once more
            if (dataUrl.length > 700000 && width > 400) {
              const scaledCanvas = document.createElement('canvas');
              scaledCanvas.width = Math.round(width * 0.7);
              scaledCanvas.height = Math.round(height * 0.7);
              const sCtx = scaledCanvas.getContext('2d', { alpha: true });
              if (sCtx) {
                sCtx.imageSmoothingEnabled = true;
                sCtx.imageSmoothingQuality = 'high';
                sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
                dataUrl = scaledCanvas.toDataURL('image/png');
              }
            }
          } else {
            // For JPG / other formats, use JPEG or WebP
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
