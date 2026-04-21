import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

let configured = false;

function ensureCloudinaryConfig() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  folder: string;
  resourceType?: "image" | "raw" | "video" | "auto";
  publicId?: string;
  originalFilename?: string;
}) {
  ensureCloudinaryConfig();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: params.folder,
        resource_type: params.resourceType ?? "auto",
        public_id: params.publicId,
        use_filename: Boolean(params.originalFilename),
        unique_filename: true,
        filename_override: params.originalFilename,
        overwrite: false,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploadResult);
      }
    );

    stream.end(params.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resourceType: result.resource_type,
  };
}
