
// Initialize Firebase
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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM elements
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const exportPdfBtn = document.getElementById('exportPdf');

// Data arrays
let financialRequests = [];
let donations = [];
let supplierPayments = [];

// Toggle sidebar
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Toggle dropdowns
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const parent = toggle.parentElement;
        parent.classList.toggle('active');
    });
});

// Close dropdowns when clicking outside
document.addEventListener('click', () => {
    dropdownToggles.forEach(toggle => {
        toggle.parentElement.classList.remove('active');
    });
});

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    // Check if timestamp is an object (like in donations) or a number
    const date = typeof timestamp === 'object' ? 
        new Date(timestamp.time || Date.now()) : 
        new Date(timestamp);
        
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fetch data from Firebase
function fetchData() {
    // Show loading state
    document.getElementById('financialRequestsBody').innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div> Loading financial requests...
            </td>
        </tr>`;
    
    document.getElementById('donationsBody').innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div> Loading donations...
            </td>
        </tr>`;
    
    document.getElementById('supplierPaymentsBody').innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">
                <div class="loading-spinner"></div> Loading supplier payments...
            </td>
        </tr>`;

    // Fetch financial requests
    const financialRequestsRef = database.ref('financial_request');
    financialRequestsRef.on('value', (snapshot) => {
        financialRequests = [];
        snapshot.forEach((childSnapshot) => {
            const request = childSnapshot.val();
            request.id = childSnapshot.key;
            financialRequests.push(request);
        });
        renderFinancialRequests();
    });

    // Fetch donations
    const donationsRef = database.ref('donations');
    donationsRef.on('value', (snapshot) => {
        donations = [];
        snapshot.forEach((childSnapshot) => {
            const donation = childSnapshot.val();
            donation.id = childSnapshot.key;
            donations.push(donation);
        });
        renderDonations();
    });

    // Fetch supplier payments
    const supplierPaymentsRef = database.ref('supplied_payments');
    supplierPaymentsRef.on('value', (snapshot) => {
        supplierPayments = [];
        snapshot.forEach((childSnapshot) => {
            const payment = childSnapshot.val();
            payment.id = childSnapshot.key;
            supplierPayments.push(payment);
        });
        renderSupplierPayments();
    });
}

// Render financial requests table
function renderFinancialRequests() {
    const filteredRequests = filterData(financialRequests);
    const tbody = document.getElementById('financialRequestsBody');
    
    if (filteredRequests.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No financial requests found matching your criteria.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredRequests.map(request => {
        const items = request.requestedItems ? Object.values(request.requestedItems) : [];
        const itemsList = items.map(item => 
            `${item.name} (${item.requestedQuantity} x ${item.price})`
        ).join('<br>');
        
        return `
            <tr>
                <td>${request.requestId || 'N/A'}</td>
                <td>${request.supplierName || 'N/A'}</td>
                <td>${itemsList || 'N/A'}</td>
                <td>KSh ${request.totalCost?.toLocaleString() || '0'}</td>
                <td>
                    <span class="status-badge status-${request.status || 'pending'}">
                        ${request.status || 'pending'}
                    </span>
                </td>
                <td>${formatDate(request.timestamp)}</td>
            </tr>`;
    }).join('');
}

// Render donations table
function renderDonations() {
    const filteredDonations = filterData(donations);
    const tbody = document.getElementById('donationsBody');
    
    if (filteredDonations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No donations found matching your criteria.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredDonations.map(donation => {
        return `
            <tr>
                <td>${donation.username || 'Anonymous'}</td>
                <td>${donation.email || 'N/A'}</td>
                <td>KSh ${donation.amount?.toLocaleString() || '0'}</td>
                <td>${donation.paymentMethod || 'N/A'}</td>
                <td>
                    <span class="status-badge status-${donation.status || 'pending'}">
                        ${donation.status || 'pending'}
                    </span>
                </td>
                <td>${formatDate(donation.donationDate)}</td>
            </tr>`;
    }).join('');
}

// Render supplier payments table
function renderSupplierPayments() {
    const filteredPayments = filterData(supplierPayments);
    const tbody = document.getElementById('supplierPaymentsBody');
    
    if (filteredPayments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No supplier payments found matching your criteria.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = filteredPayments.map(payment => {
        // Skip entries that are just status updates
        if (Object.keys(payment).length === 1 && payment.status) {
            return '';
        }
        
        const items = payment.items ? Object.values(payment.items) : [];
        const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        
        return `
            <tr>
                <td>${payment.transactionId || 'N/A'}</td>
                <td>${payment.supplierName || 'N/A'}</td>
                <td>${payment.requestId || 'N/A'}</td>
                <td>KSh ${totalAmount.toLocaleString()}</td>
                <td>
                    <span class="status-badge status-${payment.status || 'pending'}">
                        ${payment.status || 'pending'}
                    </span>
                </td>
                <td>${formatDate(payment.timestamp)}</td>
            </tr>`;
    }).join('');
}

// Filter data based on search and status
function filterData(data) {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    
    return data.filter(item => {
        // Skip entries that are just status updates (for supplier payments)
        if (Object.keys(item).length === 1 && item.status) {
            return false;
        }
        
        const matchesSearch = 
            (item.requestId && item.requestId.toLowerCase().includes(searchTerm)) ||
            (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm)) ||
            (item.username && item.username.toLowerCase().includes(searchTerm)) ||
            (item.email && item.email.toLowerCase().includes(searchTerm)) ||
            (item.transactionId && item.transactionId.toLowerCase().includes(searchTerm));
        
        const matchesStatus = 
            status === 'all' || 
            (item.status && item.status.toLowerCase() === status);
        
        return matchesSearch && matchesStatus;
    });
}

// Export to PDF
exportPdfBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Ayiera Initiative - Payments Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Financial Requests table
    doc.setFontSize(14);
    doc.text('Financial Requests', 14, 30);
    doc.autoTable({
        startY: 35,
        head: [['Request ID', 'Supplier', 'Items', 'Total Cost', 'Status', 'Date']],
        body: filterData(financialRequests).map(request => {
            const items = request.requestedItems ? Object.values(request.requestedItems) : [];
            const itemsList = items.map(item => 
                `${item.name} (${item.requestedQuantity} x ${item.price})`
            ).join(', ');
            
            return [
                request.requestId || 'N/A',
                request.supplierName || 'N/A',
                itemsList || 'N/A',
                `KSh ${request.totalCost?.toLocaleString() || '0'}`,
                request.status || 'pending',
                formatDate(request.timestamp)
            ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 115, 232] }
    });
    
    // Donations table
    doc.setFontSize(14);
    doc.text('Donations', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Donor', 'Email', 'Amount', 'Payment Method', 'Status', 'Date']],
        body: filterData(donations).map(donation => [
            donation.username || 'Anonymous',
            donation.email || 'N/A',
            `KSh ${donation.amount?.toLocaleString() || '0'}`,
            donation.paymentMethod || 'N/A',
            donation.status || 'pending',
            formatDate(donation.donationDate)
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 115, 232] }
    });
    
    // Supplier Payments table
    doc.setFontSize(14);
    doc.text('Supplier Payments', 14, doc.lastAutoTable.finalY + 15);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Transaction ID', 'Supplier', 'Request ID', 'Amount', 'Status', 'Date']],
        body: filterData(supplierPayments)
            .filter(payment => Object.keys(payment).length > 1 || !payment.status)
            .map(payment => {
                const items = payment.items ? Object.values(payment.items) : [];
                const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                
                return [
                    payment.transactionId || 'N/A',
                    payment.supplierName || 'N/A',
                    payment.requestId || 'N/A',
                    `KSh ${totalAmount.toLocaleString()}`,
                    payment.status || 'pending',
                    formatDate(payment.timestamp)
                ];
            }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 115, 232] }
    });
    
    // Save the PDF
    doc.save('Ayiera_Payments_Report.pdf');
});

// Event listeners for search and filter
searchInput.addEventListener('input', () => {
    renderFinancialRequests();
    renderDonations();
    renderSupplierPayments();
});

statusFilter.addEventListener('change', () => {
    renderFinancialRequests();
    renderDonations();
    renderSupplierPayments();
});

// Initialize the page
document.addEventListener('DOMContentLoaded', fetchData);
