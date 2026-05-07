import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, isFirebaseAdminConfigured } from "../../../../lib/firebase/admin";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function parseCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return null;
  }

  try {
    const url = new URL(cloudinaryUrl);
    const parsedCloudName = url.hostname;
    const parsedApiKey = decodeURIComponent(url.username);
    const parsedApiSecret = decodeURIComponent(url.password);

    if (!parsedCloudName || !parsedApiKey || !parsedApiSecret) {
      return null;
    }

    return {
      cloudName: parsedCloudName,
      apiKey: parsedApiKey,
      apiSecret: parsedApiSecret,
    };
  } catch {
    return null;
  }
}

function createSignature(params: Record<string, string>, apiSecret: string) {
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
}

export async function POST(request: Request) {
  const cloudinaryConfig = parseCloudinaryConfig();

  if (!cloudinaryConfig) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 500 });
  }

  if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
    return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let uid = "";

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
  }

  const adminDoc = await adminDb.collection("admins").doc(uid).get();
  if (!adminDoc.exists) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 10MB)." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "site-content";
  const signature = createSignature({ folder, timestamp }, cloudinaryConfig.apiSecret);

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("api_key", cloudinaryConfig.apiKey);
  uploadForm.append("timestamp", timestamp);
  uploadForm.append("folder", folder);
  uploadForm.append("signature", signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

  const cloudinaryResponse = await fetch(uploadUrl, {
    method: "POST",
    body: uploadForm,
  });

  if (!cloudinaryResponse.ok) {
    const payload = await cloudinaryResponse.text();
    return NextResponse.json({ error: "Cloudinary upload failed.", details: payload }, { status: 502 });
  }

  const payload = (await cloudinaryResponse.json()) as { secure_url?: string };

  if (!payload.secure_url) {
    return NextResponse.json({ error: "Cloudinary did not return a secure URL." }, { status: 502 });
  }

  return NextResponse.json({ secureUrl: payload.secure_url });
}
