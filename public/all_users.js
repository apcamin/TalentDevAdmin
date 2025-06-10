// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC5hvm0j760C9N6LZzwZeNsTCZLRzzbxt0",
    authDomain: "talent-development-b8874.firebaseapp.com",
    databaseURL: "https://talent-development-b8874-default-rtdb.firebaseio.com",
    projectId: "talent-development-b8874",
    storageBucket: "talent-development-b8874.firebasestorage.app",
    messagingSenderId: "182286301943",
    appId: "1:182286301943:web:0849bb7350e72495d8b1f2",
    measurementId: "G-2BCLW7D2GH"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    // Create the user interface
    createUserInterface();
    
    // Load user data
    loadUserData();
});

function createUserInterface() {
    const contentBody = document.querySelector('.content-body');
    contentBody.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>All Users</h3>
                <div class="card-actions">
                    <button class="add-user-btn" data-bs-toggle="modal" data-bs-target="#addUserModal">
                        <i class="fas fa-plus"></i> Add User
                    </button>
                    <div class="search-filter-container">
                        <div class="search-box">
                            <input type="text" id="searchInput" placeholder="Search users...">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="filter-container">
                            <select id="statusFilter" class="filter-select">
                                <option value="">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            <select id="roleFilter" class="filter-select">
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="Donor">Donor</option>
                                <option value="Music Instructor">Music Instructor</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Drama Instructor">Drama Instructor</option>
                                <option value="Finance Manager">Finance Manager</option>
                                <option value="Inventory Manager">Inventory Manager</option>
                                <option value="Art Instructor">Art Instructor</option>
                                <option value="Tournaments Manager">Tournaments Manager</option>
                                <option value="Referee">Referee</option>
                                <option value="Supplier">Supplier</option>
                                <option value="Dance Instructor">Dance Instructor</option>
                                <option value="Slum Footie Instructor">Slum Footie Instructor</option>
                                <option value="Judge">Judge</option>
                                <option value="Talent Development Officer">Talent Development Officer</option>
                            </select>
                        </div>
                    </div>
                    <div class="export-buttons">
                        <button id="exportExcel" class="btn btn-export">
                            <i class="fas fa-file-excel"></i> Export Excel
                        </button>
                        <button id="exportPDF" class="btn btn-export">
                            <i class="fas fa-file-pdf"></i> Export PDF
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table id="usersTable" class="data-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <tr>
                                <td colspan="7" class="loading">Loading users...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="table-footer">
                    <div class="table-info">
                        Showing <span id="showingCount">0</span> of <span id="totalCount">0</span> users
                    </div>
                    <div class="pagination">
                        <button id="prevPage" disabled><i class="fas fa-chevron-left"></i></button>
                        <span id="pageInfo">Page 1</span>
                        <button id="nextPage" disabled><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add CSS styles (same as before)
    const style = document.createElement('style');
    style.textContent = `
        /* ... (keep existing styles) ... */
        
        .approve-btn {
            background-color: #28a745;
            color: white;
        }
        
        .suspend-btn {
            background-color: #dc3545;
            color: white;
        }
        
        .action-btns {
            display: flex;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);

    // Set up event listeners
    setupEventListeners();
}

function loadUserData() {
    const usersRef = database.ref('users');
    let allUsers = [];
    let filteredUsers = [];
    const itemsPerPage = 10;
    let currentPage = 1;

    usersRef.on('value', (snapshot) => {
        const usersData = snapshot.val();
        allUsers = [];
        
        if (usersData) {
            // Convert the object of users to an array
            Object.keys(usersData).forEach(key => {
                allUsers.push({
                    id: key,
                    ...usersData[key]
                });
            });
            
            // Sort users by createdAt (newest first)
            allUsers.sort((a, b) => b.createdAt - a.createdAt);
            
            // Apply initial filters
            applyFilters();
        } else {
            document.getElementById('usersTableBody').innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No users found</td>
                </tr>
            `;
            updateTableInfo();
        }
    });

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const roleFilter = document.getElementById('roleFilter').value;
        
        filteredUsers = allUsers.filter(user => {
            const matchesSearch = 
                (user.username && user.username.toLowerCase().includes(searchTerm)) || 
                (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                (user.role && user.role.toLowerCase().includes(searchTerm)) ||
                user.id.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter ? (user.status === statusFilter) : true;
            const matchesRole = roleFilter ? (user.role === roleFilter) : true;
            
            return matchesSearch && matchesStatus && matchesRole;
        });
        
        currentPage = 1; // Reset to first page when filters change
        renderTable();
    }

    function renderTable() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        const tableBody = document.getElementById('usersTableBody');
        
        if (paginatedUsers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No users match your criteria</td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = paginatedUsers.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.role || 'N/A'}</td>
                    <td>
                        <span class="status-badge status-${user.status || 'pending'}">
                            ${user.status || 'pending'}
                        </span>
                    </td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>
                        <div class="action-btns">
                            <button class="action-btn view-btn" data-id="${user.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit-btn" data-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${user.status !== 'approved' ? `
                            <button class="action-btn approve-btn" data-id="${user.id}">
                                <i class="fas fa-check"></i>
                            </button>
                            ` : ''}
                            ${user.status !== 'suspended' ? `
                            <button class="action-btn suspend-btn" data-id="${user.id}">
                                <i class="fas fa-ban"></i>
                            </button>
                            ` : ''}
                            <button class="action-btn delete-btn" data-id="${user.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        updateTableInfo();
        updatePaginationButtons();
    }

    function updateUserStatus(userId, newStatus) {
        database.ref('users/' + userId).update({
            status: newStatus
        }).then(() => {
            alert('User status updated successfully');
        }).catch(error => {
            alert('Error updating user status: ' + error.message);
        });
    }

    function createAuthUser(email, password) {
        return auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.uid;
            });
    }

    function createDatabaseUser(userData) {
        const newUserRef = database.ref('users').push();
        return newUserRef.set({
            ...userData,
            createdAt: Date.now()
        }).then(() => {
            return newUserRef.key;
        });
    }

    function setupEventListeners() {
        // Search and filter events
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);
        document.getElementById('roleFilter').addEventListener('change', applyFilters);

        // Pagination events
        document.getElementById('prevPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (currentPage * itemsPerPage < filteredUsers.length) {
                currentPage++;
                renderTable();
            }
        });

        // Export events
        document.getElementById('exportExcel').addEventListener('click', exportToExcel);
        document.getElementById('exportPDF').addEventListener('click', exportToPDF);

        // Save new user
        document.getElementById('saveUserBtn').addEventListener('click', function() {
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const status = document.getElementById('status').value;
            
            // Create auth user first
            createAuthUser(email, password)
                .then(uid => {
                    // Then create database user
                    return createDatabaseUser({
                        username: username,
                        email: email,
                        role: role,
                        status: status
                    });
                })
                .then(() => {
                    alert('User created successfully');
                    $('#addUserModal').modal('hide');
                    document.getElementById('addUserForm').reset();
                })
                .catch(error => {
                    alert('Error creating user: ' + error.message);
                });
        });

        // Action buttons
        document.getElementById('usersTableBody').addEventListener('click', function(e) {
            const target = e.target.closest('.action-btn');
            if (!target) return;
            
            const userId = target.getAttribute('data-id');
            const user = allUsers.find(u => u.id === userId);
            
            if (target.classList.contains('view-btn')) {
                alert(`View user: ${user.username}\nID: ${user.id}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}`);
            } else if (target.classList.contains('edit-btn')) {
                // Open edit modal with user data
                alert(`Edit user: ${user.username}\nThis would open an edit form in a real implementation.`);
            } else if (target.classList.contains('approve-btn')) {
                if (confirm(`Approve user ${user.username}?`)) {
                    updateUserStatus(userId, 'approved');
                }
            } else if (target.classList.contains('suspend-btn')) {
                if (confirm(`Suspend user ${user.username}?`)) {
                    updateUserStatus(userId, 'suspended');
                }
            } else if (target.classList.contains('delete-btn')) {
                if (confirm(`Are you sure you want to delete ${user.username}?`)) {
                    // In a real implementation, you would also delete the auth user
                    database.ref('users/' + userId).remove()
                        .then(() => {
                            alert('User deleted successfully');
                        })
                        .catch(error => {
                            alert('Error deleting user: ' + error.message);
                        });
                }
            }
        });
    }

    function exportToExcel() {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Add headers
        csvContent += "User ID,Username,Email,Role,Status,Created At\n";
        
        // Add data
        filteredUsers.forEach(user => {
            csvContent += `"${user.id}","${user.username || ''}","${user.email || ''}",` +
                        `"${user.role || ''}","${user.status || ''}","${formatDate(user.createdAt)}"\n`;
        });
        
        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ayiera_users.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function exportToPDF() {
        alert("PDF export functionality would be implemented here. In a real app, you would use a library like jsPDF to generate a PDF from the table data.");
    }
}