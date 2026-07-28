import { toast } from "react-toastify";

/**
 * Compresses an image file using canvas downscaling and JPEG compression.
 * Ensures the output base64 JPEG string stays strictly under Firestore's 1MB limit.
 * 
 * @param file The image file to compress
 * @param maxWidth The maximum width of the output image (default 800)
 * @param maxHeight The maximum height of the output image (default 800)
 * @param quality The JPEG compression quality (0.0 to 1.0, default 0.7)
 */
export const compressImage = (
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check initial file size (max 5MB input limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image file is too large. Maximum allowed file size is 5MB.");
      reject(new Error("File size exceeds 5MB limit"));
      return;
    }

    if (typeof FileReader === "undefined" || typeof Image === "undefined") {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = (event.target?.result as string) || "";
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
              width = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            if (rawResult.length > 900000) {
              toast.error("Image size exceeds maximum storage limit (1MB). Please select a smaller image.");
              resolve("");
            } else {
              resolve(rawResult);
            }
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with compression quality
          let dataUrl = canvas.toDataURL("image/jpeg", quality);

          // If still over ~675KB (900,000 chars), try aggressive compression (0.4 quality & 500px)
          if (dataUrl.length > 900000) {
            const smallCanvas = document.createElement("canvas");
            const scale = Math.min(500 / width, 500 / height, 1);
            smallCanvas.width = Math.round(width * scale);
            smallCanvas.height = Math.round(height * scale);
            const smallCtx = smallCanvas.getContext("2d");
            if (smallCtx) {
              smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
              dataUrl = smallCanvas.toDataURL("image/jpeg", 0.5);
            }
          }

          if (dataUrl.length > 950000) {
            toast.error("Image is too large for storage. Please select a smaller or lower resolution image.");
            resolve("");
            return;
          }

          resolve(dataUrl);
        } catch (err) {
          console.error("Error during canvas image compression:", err);
          if (rawResult.length > 900000) {
            toast.error("Image size exceeds maximum storage limit. Please select a smaller image.");
            resolve("");
          } else {
            resolve(rawResult);
          }
        }
      };

      img.onerror = (err) => {
        console.error("Error loading image object for compression:", err);
        if (rawResult.length > 900000) {
          toast.error("Image size exceeds maximum storage limit. Please select a smaller image.");
          resolve("");
        } else {
          resolve(rawResult);
        }
      };

      img.src = rawResult;
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
};
