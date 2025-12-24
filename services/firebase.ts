import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC2IHq8Z-xblE49ofSphXu-aPZ1RnAwvsA",
  authDomain: "sistema-congregacional.firebaseapp.com",
  projectId: "sistema-congregacional",
  storageBucket: "sistema-congregacional.firebasestorage.app",
  messagingSenderId: "1093095098126",
  appId: "1:1093095098126:web:3542bafb2ab79467fcb95f",
  databaseURL: "https://sistema-congregacional-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);