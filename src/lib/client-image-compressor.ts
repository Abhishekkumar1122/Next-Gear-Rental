"use client";

export async function compressImageClient(
  file: File,
  maxDimension = 1600,
  quality = 0.82
): Promise<{ file: File; originalSizeKB: number; compressedSizeKB: number; dataUrl: string }> {
  const originalSizeKB = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context creation failed"));
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image compression failed"));
            return;
          }

          const compressedSizeKB = Math.round(blob.size / 1024);
          const cleanName = file.name.replace(/\.[^.]+$/, "") + ".webp";
          const compressedFile = new File([blob], cleanName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          const dataUrl = canvas.toDataURL("image/webp", quality);

          resolve({
            file: compressedFile,
            originalSizeKB,
            compressedSizeKB,
            dataUrl,
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}
