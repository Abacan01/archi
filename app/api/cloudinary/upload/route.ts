import crypto from "crypto";
import { NextResponse } from "next/server";
import { adminAuth, adminDb, isFirebaseAdminConfigured } from "../../../../lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Auth check: require Authorization: Bearer <idToken>
    if (!isFirebaseAdminConfigured || !adminAuth || !adminDb) {
      return NextResponse.json({ error: "Server is not configured to verify admin credentials." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer (.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
    }

    const idToken = match[1];
    let decoded: any;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (e: any) {
      return NextResponse.json({ error: "Invalid auth token." }, { status: 401 });
    }

    // ensure the user is an admin in Firestore
    try {
      const adminSnap = await adminDb.collection("admins").doc(decoded.uid).get();
      if (!adminSnap.exists) {
        return NextResponse.json({ error: "User is not authorized to perform uploads." }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ error: "Failed to verify admin role." }, { status: 500 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER || "site-content";

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary server credentials are not configured." }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    // Build signature string using all parameters that will be sent to Cloudinary
    // (Cloudinary requires signing the exact param string, e.g. "folder=...&timestamp=...").
    const paramsToSignObj: Record<string, string> = { timestamp: String(timestamp) };
    if (folder) paramsToSignObj.folder = folder;
    const sortedKeys = Object.keys(paramsToSignObj).sort();
    const paramsToSign = sortedKeys.map((k) => `${k}=${paramsToSignObj[k]}`).join("&");
    const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

    const outbound = new FormData();
    outbound.append("file", file as any);
    outbound.append("api_key", apiKey);
    outbound.append("timestamp", String(timestamp));
    outbound.append("signature", signature);
    if (folder) outbound.append("folder", folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: outbound,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.secure_url) {
      const remoteErr = payload?.error;
      let errMsg = "Upload failed.";
      if (remoteErr) {
        if (typeof remoteErr === "string") errMsg = remoteErr;
        else if ((remoteErr as any).message) errMsg = (remoteErr as any).message;
        else errMsg = JSON.stringify(remoteErr);
      } else if (payload) {
        errMsg = JSON.stringify(payload);
      }
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    return NextResponse.json({ secureUrl: payload.secure_url });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
