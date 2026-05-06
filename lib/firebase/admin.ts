import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

const hasAdminConfig = Boolean(projectId && clientEmail && privateKey);

let adminApp: App | null = null;

if (hasAdminConfig) {
  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey || "",
        }),
        storageBucket,
      });
}

export const isFirebaseAdminConfigured = Boolean(adminApp);
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null;
export const adminStorage: Storage | null = adminApp ? getStorage(adminApp) : null;
