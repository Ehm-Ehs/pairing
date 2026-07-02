/**
 * Compresses an image file using canvas downscaling and JPEG compression.
 * Resolves to a base64 JPEG data URL.
 * 
 * @param file The image file to compress
 * @param maxWidth The maximum width of the output image
 * @param maxHeight The maximum height of the output image
 * @param quality The JPEG compression quality (0.0 to 1.0)
 */
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If the browser doesn't support FileReader or Image, fallback immediately
    if (typeof FileReader === "undefined" || typeof Image === "undefined") {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback to original read result if canvas context is unavailable
            resolve(event.target?.result as string || "");
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with compression quality
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        } catch (err) {
          console.error("Error during canvas image compression:", err);
          resolve(event.target?.result as string || ""); // Fallback to original
        }
      };
      img.onerror = (err) => {
        console.error("Error loading image object for compression:", err);
        resolve(event.target?.result as string || ""); // Fallback to original
      };
      img.src = event.target?.result as string || "";
    };
    reader.onerror = (err) => {
      reject(err);
    };
    reader.readAsDataURL(file);
  });
};
