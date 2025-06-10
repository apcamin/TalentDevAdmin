// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5hvm0j760C9N6LZzwZeNsTCZLRzzbxt0",
    authDomain: "talent-development-b8874.firebaseapp.com",
    databaseURL: "https://talent-development-b8874-default-rtdb.firebaseio.com",
    projectId: "talent-development-b8874",
    storageBucket: "talent-development-b8874.appspot.com",
    messagingSenderId: "182286301943",
    appId: "1:182286301943:web:0849bb7350e72495d8b1f2",
    measurementId: "G-2BCLW7D2GH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const forgotForm = document.getElementById('forgot-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const showLogin2 = document.getElementById('show-login-2');
const showForgot = document.getElementById('show-forgot');
const rememberMe = document.getElementById('remember-me');
const notification = document.getElementById('notification');

// Form switching
const switchForm = (showForm, hideForms) => {
    hideForms.forEach(form => form.classList.remove('active'));
    showForm.classList.add('active');
};

showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(signupForm, [loginForm, forgotForm]);
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(loginForm, [signupForm, forgotForm]);
});

showLogin2.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(loginForm, [signupForm, forgotForm]);
});

showForgot.addEventListener('click', (e) => {
    e.preventDefault();
    switchForm(forgotForm, [loginForm, signupForm]);
});

// Password visibility toggle
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        const input = e.target.closest('.input-group').querySelector('.form-input');
        if (input.type === 'password') {
            input.type = 'text';
            e.target.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            e.target.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });
});

// Notification system
const showNotification = (message, isSuccess = false) => {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(isSuccess ? 'success' : 'error');
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
};

// Form validation
const validatePassword = (password, confirmPassword) => {
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!');
        return false;
    }
    if (password.length < 6) {
        showNotification('Password should be at least 6 characters!');
        return false;
    }
    return true;
};

// Sign Up
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = signupForm['signup-name'].value;
    const email = signupForm['signup-email'].value;
    const password = signupForm['signup-password'].value;
    const confirmPassword = signupForm['signup-confirm'].value;

    if (!validatePassword(password, confirmPassword)) return;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        showNotification('Account created successfully!', true);
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
    } catch (error) {
        let errorMessage;
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email is already in use!';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address!';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak!';
                break;
            default:
                errorMessage = error.message;
        }
        showNotification(errorMessage);
    }
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    const remember = rememberMe.checked;

    try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showNotification('Login successful!', true);
        window.location.href = 'dashboard.html';
    } catch (error) {
        let errorMessage;
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address!';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled!';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email!';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password!';
                break;
            default:
                errorMessage = error.message;
        }
        showNotification(errorMessage);
    }
});

// Forgot Password
forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = forgotForm['forgot-email'].value;

    try {
        await sendPasswordResetEmail(auth, email);
        showNotification('Password reset email sent! Check your inbox.', true);
    } catch (error) {
        let errorMessage;
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address!';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email!';
                break;
            default:
                errorMessage = error.message;
        }
        showNotification(errorMessage);
    }
});