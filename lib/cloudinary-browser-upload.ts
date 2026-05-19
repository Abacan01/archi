type CloudinaryUploadConfig = {
  cloudName: string;
  uploadPreset: string;
  folder: string;
};

export function getCloudinaryBrowserUploadConfig(): CloudinaryUploadConfig | null {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || "site-content";

  if (!cloudName || !uploadPreset) {
    return null;
  }

  return { cloudName, uploadPreset, folder };
}

export async function uploadCloudinaryImage(file: File) {
  const config = getCloudinaryBrowserUploadConfig();
  if (!config) {
    throw new Error("Cloudinary uploads are not configured for the static build.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("folder", config.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || payload?.error || "Upload failed.");
  }

  return payload.secure_url as string;
}