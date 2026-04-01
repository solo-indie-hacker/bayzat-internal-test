🟢 Full Plan: Replace Express App with Firebase Hosting + Firestore Rules
1. Project structure

Keep static HTML files in Firebase Hosting, no Node server needed:

Keep the current styles and design

/public
  /pages
    /public
      page1.html
      ...
    /internal
      dashboard.html
      ...
    /private
      private-dashboard.html
      ...
  /auth
    login.html
    logout.html
  /errors
    403.html
    404.html
  /js
    auth.js
    pageLoader.js
/pages/public/* → no auth needed
/pages/internal/* → @bayzat.com only
/pages/private/* → Firestore per-user access
/js → client-side scripts for auth and page access
2. Firebase setup
Create Firebase project
Enable Firebase Auth
Email/password or OAuth providers
Enable Firestore
Enable Firebase Hosting
Deploy /public folder
Configure /pages/* as rewrites if needed
3. Firestore access metadata

Collection: pageAccess

Document example:

pageAccess/private-dashboard
{
  "slug": "private-dashboard",
  "allowedUids": ["uid1", "uid2"]
}
slug → maps to the HTML file name
allowedUids → Firebase Auth UIDs allowed to access
4. Firestore Security Rules
service cloud.firestore {
  match /databases/{database}/documents {
    match /pageAccess/{slug} {
      // Only authenticated @bayzat.com users listed in allowedUids can read
      allow read: if request.auth != null
                  && request.auth.token.email.matches(".*@bayzat\\.com$")
                  && request.auth.uid in resource.data.allowedUids;
      // Optional: disallow writes from clients
      allow write: if false;
    }
  }
}
Ensures security even if JS is tampered with
Only allows access to users explicitly authorized
5. Client-side authentication script (auth.js)
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  // Optional: check @bayzat.com domain
  if (!user.email.endsWith("@bayzat.com")) {
    window.location.href = "/errors/403.html";
  }
});
Include this script on internal and private pages
6. Page access loader (pageLoader.js)
async function loadPage(slug, type) {
  const user = firebase.auth().currentUser;

  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  if (type === "internal" && !user.email.endsWith("@bayzat.com")) {
    window.location.href = "/errors/403.html";
    return;
  }

  if (type === "private") {
    const doc = await firebase.firestore().collection("pageAccess").doc(slug).get();
    if (!doc.exists || !doc.data().allowedUids.includes(user.uid)) {
      window.location.href = "/errors/403.html";
      return;
    }
  }

  // If allowed, redirect to the actual static HTML page
  window.location.href = `/pages/${type}/${slug}.html`;
}
type = "public" | "internal" | "private"
slug = page name (without .html)
Uses Firestore rules to enforce permissions