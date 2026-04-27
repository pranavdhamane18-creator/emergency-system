import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJQt-MBsfHB-4P8ViiLQHysi4MEOMp5dU",
  authDomain: "emergency-response-syste-b9b38.firebaseapp.com",
  projectId: "emergency-response-syste-b9b38",
  storageBucket: "emergency-response-syste-b9b38.firebasestorage.app",
  messagingSenderId: "914870281739",
  appId: "1:914870281739:web:be036e2d554e87e766090e",
  measurementId: "G-X855GFB3DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
