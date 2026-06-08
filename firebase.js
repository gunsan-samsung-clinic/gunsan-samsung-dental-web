import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqU2tUjxRjZIoWC_VqPR8jx11CUM7ste8",
  authDomain: "gunsan-samsung-dental-cl-d67b5.firebaseapp.com",
  projectId: "gunsan-samsung-dental-cl-d67b5",
  storageBucket: "gunsan-samsung-dental-cl-d67b5.firebasestorage.app",
  messagingSenderId: "95708597733",
  appId: "1:95708597733:web:743fa6bbf5dae77086f30c",
  measurementId: "G-0GK73T6ZX9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);