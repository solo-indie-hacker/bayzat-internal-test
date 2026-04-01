import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase.js";
import './style.css';

// If already signed in, redirect to dashboard
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = '/dashboard';
  }
});

document.getElementById('google-login-button').addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then(() => {
      window.location.href = '/dashboard';
    })
    .catch((error) => {
      console.error("Google Sign-in Error:", error.message);
    });
});
