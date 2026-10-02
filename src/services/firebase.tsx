// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for FrieBase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const isDevelopEnv = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (
      host.includes("develop") ||
      host.includes("localhost")
    ) {
      return true;
    }
  }
  return (
    process.env.NEXT_PUBLIC_APP_ENV === "develop" ||
    process.env.NODE_ENV === "development"
  );
};

const isDev = isDevelopEnv();

const getEnvVar = (developVal?: string, prodVal?: string) => {
  if (isDev && developVal) {
    return developVal;
  }
  return prodVal || developVal;
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_AUTH_DOMAIN, process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_STORAGE_BUCKET, process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_MESSAGING_SENDER_ID, process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_APP_ID, process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: getEnvVar(process.env.NEXT_PUBLIC_FIREBASE_DEVELOP_MEASUREMENT_ID, process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Debug: Check if config is loaded
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing! Check your .env file.");
}
if (!firebaseConfig.authDomain) {
  console.error("Firebase Auth Domain is missing! Check your .env file.");
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const functions = getFunctions(app);
export default app;
