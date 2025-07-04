import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * PUBLIC_INTERFACE
 * Firebase configuration and initialization.
 *
 * Exports:
 *   - firebaseApp: Initialized Firebase app instance.
 *   - auth: Firebase Auth object.
 *   - db: Firestore database instance.
 *   - storage: Firebase Storage instance.
 *
 * Usage:
 *   import { auth, db, storage } from "./firebase";
 */
const firebaseConfig = {
  apiKey: "AIzaSyBNA7xaoiynpwD8j3rE3qB9-daUnmDIbno",
  authDomain: "doodlefinder.firebaseapp.com",
  projectId: "doodlefinder",
  storageBucket: "doodlefinder.firebasestorage.app",
  messagingSenderId: "306458973633",
  appId: "1:306458973633:web:5862a96764e4bd75a6cb40",
  measurementId: "G-2H7VRGX2VY"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, auth, db, storage };
