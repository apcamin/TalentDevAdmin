document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const showLogin2 = document.getElementById('show-login-2');
    const showForgot = document.getElementById('show-forgot');
    const notification = document.getElementById('notification');
    
    // Form switching functionality
    function switchForm(hideForm, showForm) {
        hideForm.classList.remove('active');
        hideForm.classList.add('exit');
        
        setTimeout(() => {
            hideForm.classList.remove('exit');
            showForm.classList.add('active');
        }, 300);
    }
    
    // Event listeners for form toggling
    showSignup.addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(loginForm, signupForm);
    });
    
    showLogin.addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(signupForm, loginForm);
    });
    
    showLogin2.addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(forgotForm, loginForm);
    });
    
    showForgot.addEventListener('click', function(e) {
        e.preventDefault();
        switchForm(loginForm, forgotForm);
    });
    
    // Form submission handlers
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Login successful! Redirecting...');
        // Here you would typically handle the actual login logic
    });
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Account created successfully!');
        // Here you would typically handle the actual signup logic
    });
    
    forgotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        showNotification('Password reset link sent to your email!');
        // Here you would typically handle the forgot password logic
    });
    
    // Notification function
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Input animations
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        // Add focus/blur events for better UX
        input.addEventListener('focus', function() {
            this.parentElement.querySelector('.input-icon').style.color = '#1a73e8';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.querySelector('.input-icon').style.color = '#757575';
        });
        
        // Handle label animation when there's a value
        input.addEventListener('input', function() {
            const label = this.nextElementSibling;
            if (this.value) {
                label.classList.add('has-value');
            } else {
                label.classList.remove('has-value');
            }
        });
    });
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.submit-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
        });
    });
});