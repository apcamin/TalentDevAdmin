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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

// DOM Elements
const menteesTableBody = document.getElementById('menteesTableBody');
const addMenteeForm = document.getElementById('addMenteeForm');
const editMenteeForm = document.getElementById('editMenteeForm');
const saveMenteeBtn = document.getElementById('saveMenteeBtn');
const updateMenteeBtn = document.getElementById('updateMenteeBtn');
const menteeSearch = document.getElementById('menteeSearch');
const menteeFilter = document.getElementById('menteeFilter');
const parentIdSelect = document.getElementById('parentId');
const editParentIdSelect = document.getElementById('editParentId');

// Pagination variables
let currentPage = 1;
const rowsPerPage = 10;
let allMentees = [];
let filteredMentees = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadMentees();
    loadGuardians();
    
    // Event listeners
    saveMenteeBtn.addEventListener('click', saveMentee);
    updateMenteeBtn.addEventListener('click', updateMentee);
    menteeSearch.addEventListener('input', filterMentees);
    menteeFilter.addEventListener('change', filterMentees);
    
    // Pagination buttons
    document.getElementById('prevPage').addEventListener('click', goToPrevPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
});

// Load all mentees from Firebase
function loadMentees() {
    database.ref('mentees').on('value', (snapshot) => {
        allMentees = [];
        snapshot.forEach((childSnapshot) => {
            const mentee = childSnapshot.val();
            mentee.id = childSnapshot.key;
            allMentees.push(mentee);
        });
        
        // Calculate age for each mentee
        allMentees.forEach(mentee => {
            if (mentee.dob) {
                const dob = new Date(mentee.dob);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                mentee.age = age;
            }
        });
        
        filteredMentees = [...allMentees];
        displayMentees();
    });
}

// Load guardians for dropdown
function loadGuardians() {
    database.ref('users').orderByChild('role').equalTo('Guardian').on('value', (snapshot) => {
        parentIdSelect.innerHTML = '<option value="">Select Parent/Guardian</option>';
        editParentIdSelect.innerHTML = '<option value="">Select Parent/Guardian</option>';
        
        snapshot.forEach((childSnapshot) => {
            const guardian = childSnapshot.val();
            const option = document.createElement('option');
            option.value = childSnapshot.key;
            option.textContent = guardian.username || guardian.email;
            parentIdSelect.appendChild(option.cloneNode(true));
            editParentIdSelect.appendChild(option);
        });
    });
}

// Display mentees in the table with pagination
function displayMentees() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedMentees = filteredMentees.slice(startIndex, endIndex);
    
    menteesTableBody.innerHTML = '';
    
    if (paginatedMentees.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="text-center py-4">No mentees found</td>';
        menteesTableBody.appendChild(row);
    } else {
        paginatedMentees.forEach(mentee => {
            const row = document.createElement('tr');
            
            // Format talents for display
            const talentsDisplay = mentee.talents ? mentee.talents.join(', ') : 'None';
            
            row.innerHTML = `
                <td>${mentee.id.substring(0, 8)}...</td>
                <td>${mentee.fullName || 'N/A'}</td>
                <td>${mentee.age || 'N/A'}</td>
                <td>${mentee.gender || 'N/A'}</td>
                <td>${mentee.school || 'N/A'}</td>
                <td>${mentee.location || 'N/A'}</td>
                <td>${talentsDisplay}</td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn view-btn" data-id="${mentee.id}" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" data-id="${mentee.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${mentee.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            menteesTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', viewMentee);
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editMentee);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteMentee);
        });
    }
    
    // Update pagination info
    document.getElementById('startEntry').textContent = filteredMentees.length > 0 ? startIndex + 1 : 0;
    document.getElementById('endEntry').textContent = Math.min(endIndex, filteredMentees.length);
    document.getElementById('totalEntries').textContent = filteredMentees.length;
    document.getElementById('currentPage').textContent = currentPage;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredMentees.length;
}

// Filter mentees based on search and filter criteria
function filterMentees() {
    const searchTerm = menteeSearch.value.toLowerCase();
    const filterValue = menteeFilter.value;
    
    filteredMentees = allMentees.filter(mentee => {
        const matchesSearch = 
            (mentee.fullName && mentee.fullName.toLowerCase().includes(searchTerm)) ||
            (mentee.school && mentee.school.toLowerCase().includes(searchTerm)) ||
            (mentee.location && mentee.location.toLowerCase().includes(searchTerm));
        
        const matchesFilter = 
            filterValue === 'all' || 
            (filterValue === 'male' && mentee.gender === 'Male') || 
            (filterValue === 'female' && mentee.gender === 'Female');
        
        return matchesSearch && matchesFilter;
    });
    
    currentPage = 1;
    displayMentees();
}

// Pagination functions
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayMentees();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredMentees.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayMentees();
    }
}

// Save new mentee to Firebase
function saveMentee() {
    const fullName = document.getElementById('fullName').value;
    const dob = document.getElementById('dob').value;
    const gender = document.getElementById('gender').value;
    const school = document.getElementById('school').value;
    const location = document.getElementById('location').value;
    const emergencyNumber = document.getElementById('emergencyNumber').value;
    const parentId = document.getElementById('parentId').value;
    
    // Get selected talents
    const talentsSelect = document.getElementById('talents');
    const talents = Array.from(talentsSelect.selectedOptions).map(option => option.value);
    
    if (!fullName || !dob || !gender || !school || !location || !emergencyNumber || !parentId) {
        alert('Please fill in all required fields');
        return;
    }
    
    const enrolledDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$2/$1/$3');
    
    // Calculate age
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
    }
    
    const menteeData = {
        fullName,
        dob,
        age,
        gender,
        school,
        location,
        emergencyNumber,
        parentId,
        talents,
        enrolledDate
    };
    
    // Save to Firebase
    database.ref('mentees').push(menteeData)
        .then(() => {
            alert('Mentee added successfully');
            // Reset form
            addMenteeForm.reset();
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('addMenteeModal')).hide();
        })
        .catch(error => {
            console.error('Error adding mentee:', error);
            alert('Error adding mentee. Please try again.');
        });
}

// View mentee details
function viewMentee(event) {
    const menteeId = event.currentTarget.getAttribute('data-id');
    const mentee = allMentees.find(m => m.id === menteeId);
    
    if (mentee) {
        // Format date for display
        const formattedDob = mentee.dob ? new Date(mentee.dob).toLocaleDateString() : 'N/A';
        const formattedEnrolledDate = mentee.enrolledDate ? new Date(mentee.enrolledDate).toLocaleDateString() : 'N/A';
        
        // Get parent name
        let parentName = 'N/A';
        if (mentee.parentId) {
            const parentOption = parentIdSelect.querySelector(`option[value="${mentee.parentId}"]`);
            parentName = parentOption ? parentOption.textContent : 'N/A';
        }
        
        document.getElementById('viewFullName').textContent = mentee.fullName || 'N/A';
        document.getElementById('viewAge').textContent = mentee.age || 'N/A';
        document.getElementById('viewGender').textContent = mentee.gender || 'N/A';
        document.getElementById('viewDob').textContent = formattedDob;
        document.getElementById('viewSchool').textContent = mentee.school || 'N/A';
        document.getElementById('viewLocation').textContent = mentee.location || 'N/A';
        document.getElementById('viewEmergencyNumber').textContent = mentee.emergencyNumber || 'N/A';
        document.getElementById('viewParent').textContent = parentName;
        document.getElementById('viewTalents').textContent = mentee.talents ? mentee.talents.join(', ') : 'None';
        document.getElementById('viewEnrolledDate').textContent = formattedEnrolledDate;
        
        // Show modal
        const viewModal = new bootstrap.Modal(document.getElementById('viewMenteeModal'));
        viewModal.show();
    }
}

// Edit mentee - load data into form
function editMentee(event) {
    const menteeId = event.currentTarget.getAttribute('data-id');
    const mentee = allMentees.find(m => m.id === menteeId);
    
    if (mentee) {
        document.getElementById('editMenteeId').value = mentee.id;
        document.getElementById('editFullName').value = mentee.fullName || '';
        document.getElementById('editDob').value = mentee.dob || '';
        document.getElementById('editGender').value = mentee.gender || 'Male';
        document.getElementById('editSchool').value = mentee.school || '';
        document.getElementById('editLocation').value = mentee.location || '';
        document.getElementById('editEmergencyNumber').value = mentee.emergencyNumber || '';
        
        // Set parent/guardian
        if (mentee.parentId) {
            document.getElementById('editParentId').value = mentee.parentId;
        }
        
        // Set talents
        const talentsSelect = document.getElementById('editTalents');
        Array.from(talentsSelect.options).forEach(option => {
            option.selected = mentee.talents && mentee.talents.includes(option.value);
        });
        
        // Show modal
        const editModal = new bootstrap.Modal(document.getElementById('editMenteeModal'));
        editModal.show();
    }
}

// Update mentee in Firebase
function updateMentee() {
    const menteeId = document.getElementById('editMenteeId').value;
    const fullName = document.getElementById('editFullName').value;
    const dob = document.getElementById('editDob').value;
    const gender = document.getElementById('editGender').value;
    const school = document.getElementById('editSchool').value;
    const location = document.getElementById('editLocation').value;
    const emergencyNumber = document.getElementById('editEmergencyNumber').value;
    const parentId = document.getElementById('editParentId').value;
    
    // Get selected talents
    const talentsSelect = document.getElementById('editTalents');
    const talents = Array.from(talentsSelect.selectedOptions).map(option => option.value);
    
    if (!fullName || !dob || !gender || !school || !location || !emergencyNumber || !parentId) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Calculate age
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        age--;
    }
    
    const updatedData = {
        fullName,
        dob,
        age,
        gender,
        school,
        location,
        emergencyNumber,
        parentId,
        talents
    };
    
    // Update in Firebase
    database.ref(`mentees/${menteeId}`).update(updatedData)
        .then(() => {
            alert('Mentee updated successfully');
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('editMenteeModal')).hide();
        })
        .catch(error => {
            console.error('Error updating mentee:', error);
            alert('Error updating mentee. Please try again.');
        });
}

// Delete mentee from Firebase
function deleteMentee(event) {
    if (confirm('Are you sure you want to delete this mentee?')) {
        const menteeId = event.currentTarget.getAttribute('data-id');
        
        database.ref(`mentees/${menteeId}`).remove()
            .then(() => {
                alert('Mentee deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting mentee:', error);
                alert('Error deleting mentee. Please try again.');
            });
    }
}