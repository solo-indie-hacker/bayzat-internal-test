// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: "cs-material-test",
  storageBucket: "cs-material-test.firebasestorage.app",
  messagingSenderId: "398771475878",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// UI Elements
const googleLoginButton = document.getElementById('google-login-button');
const logoutButton = document.getElementById('logout-button');
const userInfoDiv = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const userEmailSpan = document.getElementById('user-email');

// Sign in with Google
googleLoginButton.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("User signed in:", result.user);
    })
    .catch((error) => {
      console.error("Google Sign-in Error:", error.message);
    });
});

// Logout
logoutButton.addEventListener('click', () => {
  signOut(auth).then(() => {
    console.log("User signed out.");
  }).catch((error) => {
    console.error("Logout Error:", error);
  });
});

// Auth State Change Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    googleLoginButton.style.display = 'none';
    logoutButton.style.display = 'block';
    userInfoDiv.style.display = 'block';
    userNameSpan.textContent = user.displayName || 'Anonymous';
    userEmailSpan.textContent = user.email || 'No email';
  } else {
    googleLoginButton.style.display = 'block';
    logoutButton.style.display = 'none';
    userInfoDiv.style.display = 'none';
    userNameSpan.textContent = '';
    userEmailSpan.textContent = '';
  }
});