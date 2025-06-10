document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    const dashboardContainer = document.querySelector('.dashboard-container');

    // Toggle sidebar on mobile
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });

    // Handle dropdown menus
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const navItem = this.closest('.nav-item');
            navItem.classList.toggle('active');
            
            // Close other dropdowns
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.closest('.nav-item').classList.remove('active');
                }
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-item.has-dropdown')) {
            dropdownToggles.forEach(toggle => {
                toggle.closest('.nav-item').classList.remove('active');
            });
        }
    });

    // Toggle sidebar collapse on desktop
    function handleSidebarCollapse() {
        if (window.innerWidth >= 993) {
            sidebarToggle.addEventListener('click', function() {
                dashboardContainer.classList.toggle('sidebar-collapsed');
            });
        }
    }

    // Initialize and handle resize
    handleSidebarCollapse();
    window.addEventListener('resize', handleSidebarCollapse);

    // Active nav item highlighting
    const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});