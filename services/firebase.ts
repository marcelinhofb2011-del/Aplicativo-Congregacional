import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC2IHq8Z-xblE49ofSphXu-aPZ1RnAwvsA",
  authDomain: "sistema-congregacional.firebaseapp.com",
  projectId: "sistema-congregacional",
  storageBucket: "sistema-congregacional.firebasestorage.app",
  messagingSenderId: "1093095098126",
  appId: "1:1093095098126:web:3542bafb2ab79467fcb95f",
  databaseURL: "https://sistema-congregacional-default-rtdb.firebaseio.com"
};

// --- Lazy Initialization with Singleton Pattern ---
// This ensures Firebase services are only initialized when first requested,
// preventing race conditions on app startup.

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;

const getAppInstance = (): FirebaseApp => {
    if (!app) {
        app = initializeApp(firebaseConfig);
    }
    return app;
}

export const getAuthInstance = (): Auth => {
    if (!auth) {
        auth = getAuth(getAppInstance());
    }
    return auth;
};

export const getDbInstance = (): Firestore => {
    if (!db) {
        db = getFirestore(getAppInstance());
    }
    return db;
};

export const getRtdbInstance = (): Database => {
    if (!rtdb) {
        rtdb = getDatabase(getAppInstance());
    }
    return rtdb;
};


// --- Persistence Logic ---
let persistencePromise: Promise<void> | null = null;

export const ensurePersistence = async (): Promise<void> => {
    if (persistencePromise) {
        return persistencePromise;
    }

    // getDbInstance() will initialize Firestore if it hasn't been already
    const firestore = getDbInstance(); 
    
    persistencePromise = enableIndexedDbPersistence(firestore)
        .then(() => {
            console.log("Firebase persistence enabled.");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Firebase persistence failed (failed-precondition). Likely multiple tabs are open.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firebase persistence is not available in this browser.");
            }
            // In case of error, reset the promise to allow retries if applicable.
            persistencePromise = null; 
        });

    return persistencePromise;
};
