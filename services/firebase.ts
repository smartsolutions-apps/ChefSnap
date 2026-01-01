import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzaAC-UhGU1-Kd8gHBfhfNLyOJwLAzZx4",
  authDomain: "chefsnap-app.firebaseapp.com",
  projectId: "chefsnap-app",
  storageBucket: "chefsnap-app.firebasestorage.app",
  messagingSenderId: "85643268910",
  appId: "1:85643268910:web:a7ccdc40b5e1d94c91e0bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
