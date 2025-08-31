import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ==========================================================================================
// IMPORTANT: Replace this placeholder with your actual Firebase project configuration.
// You can find this in your Firebase project settings.
// ==========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBIM226m58qTQbPZTyUMN5UWkpyMCo8jlg",
  authDomain: "my-budget-app-2a68b.firebaseapp.com",
  projectId: "my-budget-app-2a68b",
  storageBucket: "my-budget-app-2a68b.firebasestorage.app",
  messagingSenderId: "745344706603",
  appId: "1:745344706603:web:6866e30de02096baf8226e"
};

// Initialize Firebase App
// This check prevents re-initialization on hot reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize and export Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
