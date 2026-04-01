import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, isAllowedEmail } from "./firebase.js";
import './style.css';

// If not signed in or not @bayzat.com, redirect to login
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = '/';
    return;
  }

  if (!isAllowedEmail(user.email)) {
    signOut(auth).then(() => {
      window.location.href = '/?error=unauthorized';
    });
    return;
  }

  const displayName = user.displayName || 'Anonymous';
  const email = user.email;
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  document.getElementById('user-name').textContent = displayName;
  document.getElementById('user-display-name').textContent = displayName;
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('profile-name').textContent = displayName;
  document.getElementById('profile-email').textContent = email;
});

document.getElementById('logout-button').addEventListener('click', () => {
  signOut(auth).catch((error) => {
    console.error("Logout Error:", error);
  });
});
