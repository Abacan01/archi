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

  // Client-side unsigned upload (requires NEXT_PUBLIC_* vars and an upload preset)
  if (config) {
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

  // Fallback: call server-side API to perform a signed upload using server-only secrets
  try {
    const serverForm = new FormData();
    serverForm.append("file", file);

    // If the app has Firebase auth available on the client, include the ID token
    // so the server route can verify the request and perform a signed upload.
    let headers: Record<string, string> = {};
    try {
      // Importing auth dynamically to avoid module cycles in non-browser contexts
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { auth } = require("./firebase/client");
      if (auth?.currentUser && typeof auth.currentUser.getIdToken === "function") {
        // getIdToken might return a Promise
        // Note: this may throw if the user is not signed in
        // eslint-disable-next-line no-await-in-loop
        const idToken = await auth.currentUser.getIdToken();
        if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
      }
    } catch (e) {
      // ignore - auth may not be available in some environments
    }

    const res = await fetch("/api/cloudinary/upload", {
      method: "POST",
      body: serverForm,
      headers,
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.secureUrl && !payload?.secure_url) {
      const serverError = payload?.error;
      let message = "Upload failed (server proxy).";
      if (serverError) {
        if (typeof serverError === "string") message = serverError;
        else if ((serverError as any).message) message = (serverError as any).message;
        else message = JSON.stringify(serverError);
      } else if (payload) {
        message = JSON.stringify(payload);
      }
      throw new Error(message);
    }

    return (payload.secureUrl || payload.secure_url) as string;
  } catch (err) {
    throw err;
  }
}