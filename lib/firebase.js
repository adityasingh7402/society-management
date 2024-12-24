import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';


// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyC8jgA2iFX8jW6ww7Zer4cqF5Hj6jS1VFs",
  authDomain: "societymanagmt.firebaseapp.com",
  projectId: "societymanagmt",
  storageBucket: "societymanagmt.firebasestorage.app",
  messagingSenderId: "478909442885",
  appId: "1:478909442885:web:1fc7ea91091f1d43cbec2c",
};

// Initialize Firebase only if no app is already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
const auth = getAuth(app);
auth.useDeviceLanguage(); // Set the language of the auth instance to the device's language

export { auth }; // Export the auth instance
