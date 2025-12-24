import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// This configuration should be stored securely, e.g., in environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyC2IHq8Z-xblE49ofSphXu-aPZ1RnAwvsA",
  authDomain: "sistema-congregacional.firebaseapp.com",
  projectId: "sistema-congregacional",
  storageBucket: "sistema-congregacional.firebasestorage.app",
  messagingSenderId: "1093095098126",
  appId: "1:1093095098126:web:3542bafb2ab79467fcb95f",
  databaseURL: "https://sistema-congregacional.firebaseio.com/"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);