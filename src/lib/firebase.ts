import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXlzu1BquoMP9eN-Ubt7nZz0OZtl-pSKc",
  authDomain: "clearform-284ce.firebaseapp.com",
  projectId: "clearform-284ce",
  storageBucket: "clearform-284ce.firebasestorage.app",
  messagingSenderId: "331026360088",
  appId: "1:331026360088:web:bfefc39379fd313225e06d",
  measurementId: "G-G5EKK7FQ0X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Providers
export const googleProvider = new GoogleAuthProvider();
