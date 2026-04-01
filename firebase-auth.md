To add the Firebase Authentication SDK to your static HTML files for Google login, you'll need to include the necessary Firebase libraries from a CDN, initialize Firebase with your project's configuration, and then implement the Google Sign-In logic.
Here's a basic example of how you can do this directly in your index.html file:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firebase Google Login</title>
</head>
<body>
    <h1>Welcome!</h1>
    <button id="google-login-button">Sign in with Google</button>
    <button id="logout-button" style="display:none;">Logout</button>
    <div id="user-info" style="display:none;">
        <p>Welcome, <span id="user-name"></span>!</p>
        <p>Email: <span id="user-email"></span></p>
    </div>

    <!-- The core Firebase JS SDK is always required and must be listed first -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <!-- Add Firebase products that you want to use -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>

    <script>
        // TODO: Replace the following with your app's Firebase project configuration
        // You can find this in your Firebase project settings (Project overview > Project settings > General > Your apps > Firebase SDK snippet > Config)
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY", // Replace with your actual API Key
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Project ID
            projectId: "YOUR_PROJECT_ID", // Replace with your Project ID
            storageBucket: "YOUR_STORAGE_BUCKET.appspot.com", // Replace with your Storage Bucket
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
            appId: "YOUR_APP_ID", // Replace with your App ID
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Get Firebase Auth instance
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();

        // --- UI Elements ---
        const googleLoginButton = document.getElementById('google-login-button');
        const logoutButton = document.getElementById('logout-button');
        const userInfoDiv = document.getElementById('user-info');
        const userNameSpan = document.getElementById('user-name');
        const userEmailSpan = document.getElementById('user-email');

        // --- Event Listeners ---
        googleLoginButton.addEventListener('click', () => {
            auth.signInWithPopup(provider)
                .then((result) => {
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential.accessToken;
                    // The signed-in user info.
                    const user = result.user;
                    console.log("User signed in:", user);
                    updateUI(user);
                })
                .catch((error) => {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    const email = error.email;
                    // The AuthCredential type that was used.
                    const credential = GoogleAuthProvider.credentialFromError(error);
                    console.error("Google Sign-in Error:", errorMessage);
                });
        });

        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out.");
                updateUI(null);
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });

        // --- Auth State Change Listener ---
        auth.onAuthStateChanged((user) => {
            updateUI(user);
        });

        // --- Helper function to update UI ---
        function updateUI(user) {
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
        }
    </script>
</body>
</html>
Expand
Explanation of the code:

Include Firebase SDKs : The script tags at the beginning of the <body> element load the core Firebase App and Firebase Authentication SDKs from a CDN. We're using the compat version ( 9.23.0/firebase-app-compat.js and 9.23.0/firebase-auth-compat.js ) because it's easier to integrate into static HTML files without a build step, aligning with your "static HTML files" description.
Firebase Configuration : You MUST replace the placeholder values in firebaseConfig with your actual project's configuration. You can find this configuration snippet in your Firebase Console under Project overview > Project settings > General > Your apps . Select your web app and look for the "Firebase SDK snippet" to get the config object.
Initialize Firebase : firebase.initializeApp(firebaseConfig); initializes the Firebase app with your project settings.
Get Auth Instance and Provider : const auth = firebase.auth(); gets the authentication service instance. const provider = new firebase.auth.GoogleAuthProvider(); creates an instance of the Google authentication provider.
Sign-in with Popup : When the "Sign in with Google" button is clicked, auth.signInWithPopup(provider) opens a Google sign-in pop-up window. After successful authentication, the then block executes, giving you access to the user's information.
Logout : The "Logout" button calls auth.signOut() to sign the user out.
Auth State Changed Listener : auth.onAuthStateChanged((user) => { updateUI(user); }); is a crucial listener. It fires whenever the user's sign-in state changes (e.g., after login, logout, or if the user's session persists on page refresh). This allows you to update your UI accordingly.
UI Update Function : The updateUI function simply toggles the visibility of the login/logout buttons and displays user information based on whether a user object is provided.
Before trying this code, ensure you have already enabled the Google Sign-In provider in your Firebase project's Authentication section, as discussed previously.
To continue, you might want to ask:
How can I store user data (beyond their profile) in my static web app after they log in?
What are some best practices for securing my apiKey in a client-side application?
How can I customize the Google Sign-In UI?To add the Firebase Authentication SDK to your static HTML files for Google login, you'll need to include the necessary Firebase libraries from a CDN, initialize Firebase with your project's configuration, and then implement the Google Sign-In logic.
Here's a basic example of how you can do this directly in your index.html file:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firebase Google Login</title>
</head>
<body>
    <h1>Welcome!</h1>
    <button id="google-login-button">Sign in with Google</button>
    <button id="logout-button" style="display:none;">Logout</button>
    <div id="user-info" style="display:none;">
        <p>Welcome, <span id="user-name"></span>!</p>
        <p>Email: <span id="user-email"></span></p>
    </div>

    <!-- The core Firebase JS SDK is always required and must be listed first -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <!-- Add Firebase products that you want to use -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>

    <script>
        // TODO: Replace the following with your app's Firebase project configuration
        // You can find this in your Firebase project settings (Project overview > Project settings > General > Your apps > Firebase SDK snippet > Config)
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY", // Replace with your actual API Key
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Project ID
            projectId: "YOUR_PROJECT_ID", // Replace with your Project ID
            storageBucket: "YOUR_STORAGE_BUCKET.appspot.com", // Replace with your Storage Bucket
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
            appId: "YOUR_APP_ID", // Replace with your App ID
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Get Firebase Auth instance
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();

        // --- UI Elements ---
        const googleLoginButton = document.getElementById('google-login-button');
        const logoutButton = document.getElementById('logout-button');
        const userInfoDiv = document.getElementById('user-info');
        const userNameSpan = document.getElementById('user-name');
        const userEmailSpan = document.getElementById('user-email');

        // --- Event Listeners ---
        googleLoginButton.addEventListener('click', () => {
            auth.signInWithPopup(provider)
                .then((result) => {
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential.accessToken;
                    // The signed-in user info.
                    const user = result.user;
                    console.log("User signed in:", user);
                    updateUI(user);
                })
                .catch((error) => {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    const email = error.email;
                    // The AuthCredential type that was used.
                    const credential = GoogleAuthProvider.credentialFromError(error);
                    console.error("Google Sign-in Error:", errorMessage);
                });
        });

        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out.");
                updateUI(null);
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });

        // --- Auth State Change Listener ---
        auth.onAuthStateChanged((user) => {
            updateUI(user);
        });

        // --- Helper function to update UI ---
        function updateUI(user) {
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
        }
    </script>
</body>
</html>
Expand
Explanation of the code:

Include Firebase SDKs : The script tags at the beginning of the <body> element load the core Firebase App and Firebase Authentication SDKs from a CDN. We're using the compat version ( 9.23.0/firebase-app-compat.js and 9.23.0/firebase-auth-compat.js ) because it's easier to integrate into static HTML files without a build step, aligning with your "static HTML files" description.
Firebase Configuration : You MUST replace the placeholder values in firebaseConfig with your actual project's configuration. You can find this configuration snippet in your Firebase Console under Project overview > Project settings > General > Your apps . Select your web app and look for the "Firebase SDK snippet" to get the config object.
Initialize Firebase : firebase.initializeApp(firebaseConfig); initializes the Firebase app with your project settings.
Get Auth Instance and Provider : const auth = firebase.auth(); gets the authentication service instance. const provider = new firebase.auth.GoogleAuthProvider(); creates an instance of the Google authentication provider.
Sign-in with Popup : When the "Sign in with Google" button is clicked, auth.signInWithPopup(provider) opens a Google sign-in pop-up window. After successful authentication, the then block executes, giving you access to the user's information.
Logout : The "Logout" button calls auth.signOut() to sign the user out.
Auth State Changed Listener : auth.onAuthStateChanged((user) => { updateUI(user); }); is a crucial listener. It fires whenever the user's sign-in state changes (e.g., after login, logout, or if the user's session persists on page refresh). This allows you to update your UI accordingly.
UI Update Function : The updateUI function simply toggles the visibility of the login/logout buttons and displays user information based on whether a user object is provided.
Before trying this code, ensure you have already enabled the Google Sign-In provider in your Firebase project's Authentication section, as discussed previously.
To continue, you might want to ask:
How can I store user data (beyond their profile) in my static web app after they log in?
What are some best practices for securing my apiKey in a client-side application?
How can I customize the Google Sign-In UI?```
Explanation of the code:

Include Firebase SDKs : The script tags at the beginning of the <body> element load the core Firebase App and Firebase Authentication SDKs from a CDN. We're using the compat version ( 9.23.0/firebase-app-compat.js and 9.23.0/firebase-auth-compat.js ) because it's easier to integrate into static HTML files without a build step, aligning with your "static HTML files" description.
Firebase Configuration : You MUST replace the placeholder values in firebaseConfig with your actual project's configuration. You can find this configuration snippet in your Firebase Console under Project overview > Project settings > General > Your apps . Select your web app and look for the "Firebase SDK snippet" to get the config object.
Initialize Firebase : firebase.initializeApp(firebaseConfig); initializes the Firebase app with your project settings.
Get Auth Instance and Provider : const auth = firebase.auth(); gets the authentication service instance. const provider = new firebase.auth.GoogleAuthProvider(); creates an instance of the Google authentication provider.
Sign-in with Popup : When the "Sign in with Google" button is clicked, auth.signInWithPopup(provider) opens a Google sign-in pop-up window. After successful authentication, the then block executes, giving you access to the user's information.
Logout : The "Logout" button calls auth.signOut() to sign the user out.
Auth State Changed Listener : auth.onAuthStateChanged((user) => { updateUI(user); }); is a crucial listener. It fires whenever the user's sign-in state changes (e.g., after login, logout, or if the user's session persists on page refresh). This allows you to update your UI accordingly.
UI Update Function : The updateUI function simply toggles the visibility of the login/logout buttons and displays user information based on whether a user object is provided.
Before trying this code, ensure you have already enabled the Google Sign-In provider in your Firebase project's Authentication section, as discussed previously.
To continue, you might want to ask:
How can I store user data (beyond their profile) in my static web app after they log in?
What are some best practices for securing my apiKey in a client-side application?
How can I customize the Google Sign-In UI?To add the Firebase Authentication SDK to your static HTML files for Google login, you'll need to include the necessary Firebase libraries from a CDN, initialize Firebase with your project's configuration, and then implement the Google Sign-In logic.
Here's a basic example of how you can do this directly in your index.html file:
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firebase Google Login</title>
</head>
<body>
    <h1>Welcome!</h1>
    <button id="google-login-button">Sign in with Google</button>
    <button id="logout-button" style="display:none;">Logout</button>
    <div id="user-info" style="display:none;">
        <p>Welcome, <span id="user-name"></span>!</p>
        <p>Email: <span id="user-email"></span></p>
    </div>

    <!-- The core Firebase JS SDK is always required and must be listed first -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <!-- Add Firebase products that you want to use -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>

    <script>
        // TODO: Replace the following with your app's Firebase project configuration
        // You can find this in your Firebase project settings (Project overview > Project settings > General > Your apps > Firebase SDK snippet > Config)
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY", // Replace with your actual API Key
            authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace with your Project ID
            projectId: "YOUR_PROJECT_ID", // Replace with your Project ID
            storageBucket: "YOUR_STORAGE_BUCKET.appspot.com", // Replace with your Storage Bucket
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
            appId: "YOUR_APP_ID", // Replace with your App ID
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Get Firebase Auth instance
        const auth = firebase.auth();
        const provider = new firebase.auth.GoogleAuthProvider();

        // --- UI Elements ---
        const googleLoginButton = document.getElementById('google-login-button');
        const logoutButton = document.getElementById('logout-button');
        const userInfoDiv = document.getElementById('user-info');
        const userNameSpan = document.getElementById('user-name');
        const userEmailSpan = document.getElementById('user-email');

        // --- Event Listeners ---
        googleLoginButton.addEventListener('click', () => {
            auth.signInWithPopup(provider)
                .then((result) => {
                    // This gives you a Google Access Token. You can use it to access the Google API.
                    const credential = GoogleAuthProvider.credentialFromResult(result);
                    const token = credential.accessToken;
                    // The signed-in user info.
                    const user = result.user;
                    console.log("User signed in:", user);
                    updateUI(user);
                })
                .catch((error) => {
                    // Handle Errors here.
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // The email of the user's account used.
                    const email = error.email;
                    // The AuthCredential type that was used.
                    const credential = GoogleAuthProvider.credentialFromError(error);
                    console.error("Google Sign-in Error:", errorMessage);
                });
        });

        logoutButton.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out.");
                updateUI(null);
            }).catch((error) => {
                console.error("Logout Error:", error);
            });
        });

        // --- Auth State Change Listener ---
        auth.onAuthStateChanged((user) => {
            updateUI(user);
        });

        // --- Helper function to update UI ---
        function updateUI(user) {
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
        }
    </script>
</body>
</html>
Expand
Explanation of the code:

Include Firebase SDKs : The script tags at the beginning of the <body> element load the core Firebase App and Firebase Authentication SDKs from a CDN. We're using the compat version ( 9.23.0/firebase-app-compat.js and 9.23.0/firebase-auth-compat.js ) because it's easier to integrate into static HTML files without a build step, aligning with your "static HTML files" description.
Firebase Configuration : You MUST replace the placeholder values in firebaseConfig with your actual project's configuration. You can find this configuration snippet in your Firebase Console under Project overview > Project settings > General > Your apps . Select your web app and look for the "Firebase SDK snippet" to get the config object.
Initialize Firebase : firebase.initializeApp(firebaseConfig); initializes the Firebase app with your project settings.
Get Auth Instance and Provider : const auth = firebase.auth(); gets the authentication service instance. const provider = new firebase.auth.GoogleAuthProvider(); creates an instance of the Google authentication provider.
Sign-in with Popup : When the "Sign in with Google" button is clicked, auth.signInWithPopup(provider) opens a Google sign-in pop-up window. After successful authentication, the then block executes, giving you access to the user's information.
Logout : The "Logout" button calls auth.signOut() to sign the user out.
Auth State Changed Listener : auth.onAuthStateChanged((user) => { updateUI(user); }); is a crucial listener. It fires whenever the user's sign-in state changes (e.g., after login, logout, or if the user's session persists on page refresh). This allows you to update your UI accordingly.
UI Update Function : The updateUI function simply toggles the visibility of the login/logout buttons and displays user information based on whether a user object is provided.