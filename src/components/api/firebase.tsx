// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCx3DQLMhR6tCGZh6FHKTcqcSKxf5NFS-U",
  authDomain: "pairing-login.firebaseapp.com",
  projectId: "pairing-login",
  storageBucket: "pairing-login.appspot.com",
  messagingSenderId: "903704917637",
  appId: "1:903704917637:web:13cdadbee90deb0cc95bec",
  measurementId: "G-BBZJ01DP7V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth();
export const db = getFirestore(app);
export default app;
