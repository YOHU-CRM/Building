import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfigJson from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: ((import.meta as any).env?.VITE_FIREBASE_API_KEY) || firebaseConfigJson.apiKey,
  authDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfigJson.authDomain,
  projectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || firebaseConfigJson.projectId,
  storageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfigJson.storageBucket,
  messagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfigJson.messagingSenderId,
  appId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID) || firebaseConfigJson.appId
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfigJson.firestoreDatabaseId || "(default)");

