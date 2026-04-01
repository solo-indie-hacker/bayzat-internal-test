import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "cs-material-test",
  storageBucket: "cs-material-test.firebasestorage.app",
  messagingSenderId: "398771475878",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const ALLOWED_DOMAIN = 'bayzat.com';

export function isAllowedEmail(email) {
  return email && email.endsWith('@' + ALLOWED_DOMAIN);
}
