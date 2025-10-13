import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyACHI6eh1ej_X5SNK6lwxhgPnAdMF7h-eg",
  authDomain: "vlad-todiroaie-architects.firebaseapp.com",
  projectId: "vlad-todiroaie-architects",
  storageBucket: "vlad-todiroaie-architects.firebasestorage.app",
  messagingSenderId: "672965885895",
  appId: "1:672965885895:web:42809009cc2a8cb91ba3e2",
  measurementId: "G-FXEBG71BD8"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);