import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_STAGING_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (serviceAccount) {
      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    }

    return initializeApp({
      projectId,
    });
  }
  return getApps()[0];
}

export const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
