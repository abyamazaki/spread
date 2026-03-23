import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvQjj0qgJcUX19vlgfODcN8Sbce_J5tXk",
  authDomain: "test-9c21c.firebaseapp.com",
  projectId: "test-9c21c",
  storageBucket: "test-9c21c.firebasestorage.app",
  messagingSenderId: "131332920286",
  appId: "1:131332920286:web:4fdc75a0d1a4464289034f",
  measurementId: "G-4X6PM2Z4M2"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth, firebaseConfig };
