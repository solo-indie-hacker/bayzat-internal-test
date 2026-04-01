import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider, isAllowedEmail } from "./firebase.js";
import './style.css';

// If already signed in with allowed domain, redirect to dashboard
onAuthStateChanged(auth, (user) => {
  if (user && isAllowedEmail(user.email)) {
    window.location.href = '/dashboard';
  }
});

// Show error if redirected back with unauthorized param
if (new URLSearchParams(window.location.search).get('error') === 'unauthorized') {
  document.getElementById('login-error').style.display = 'block';
}

document.getElementById('google-login-button').addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      if (!isAllowedEmail(result.user.email)) {
        return signOut(auth).then(() => {
          document.getElementById('login-error').style.display = 'block';
        });
      }
      window.location.href = '/dashboard';
    })
    .catch((error) => {
      console.error("Google Sign-in Error:", error.message);
    });
});
