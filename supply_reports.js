// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM Elements
const reportsTable = document.getElementById('reportsTable');
const reportsTableBody = document.getElementById('reportsTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const exportBtn = document.getElementById('exportBtn');

// Global variables
let allReports = [];
let filteredReports = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadSupplyReports();
    
    // Event listeners
    searchInput.addEventListener('input', filterReports);
    statusFilter.addEventListener('change', filterReports);
    exportBtn.addEventListener('click', exportToPDF);
});

// Load supply reports from Firebase
function loadSupplyReports() {
    const reportsRef = ref(database, 'supply_requests');
    
    onValue(reportsRef, (snapshot) => {
        const data = snapshot.val();
        allReports = [];
        
        if (data) {
            // Convert object to array
            Object.keys(data).forEach(key => {
                const report = data[key];
                report.id = key;
                
                // Calculate total items
                let totalItems = 0;
                if (report.requestedItems) {
                    Object.values(report.requestedItems).forEach(item => {
                        totalItems += item.requestedQuantity || 0;
                    });
                }
                report.totalItems = totalItems;
                
                // Format timestamp
                report.formattedDate = formatDate(report.timestamp);
                
                allReports.push(report);
            });
            
            // Sort by date (newest first)
            allReports.sort((a, b) => b.timestamp - a.timestamp);
            
            // Display all reports initially
            filteredReports = [...allReports];
            renderReports();
        } else {
            reportsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No supply reports found</td></tr>';
        }
    });
}

// Render reports to the table
function renderReports() {
    reportsTableBody.innerHTML = '';
    
    if (filteredReports.length === 0) {
        reportsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No matching reports found</td></tr>';
        return;
    }
    
    filteredReports.forEach(report => {
        const row = document.createElement('tr');
        
        // Get item names (concatenate if multiple items)
        let itemNames = [];
        if (report.requestedItems) {
            itemNames = Object.values(report.requestedItems).map(item => `${item.name} (${item.requestedQuantity})`);
        }
        
        row.innerHTML = `
            <td>${report.requestId || 'N/A'}</td>
            <td>${report.supplierName || 'N/A'}</td>
            <td>${itemNames.join(', ') || 'N/A'}</td>
            <td>${report.totalItems || 0}</td>
            <td>${report.totalCost ? 'KSh ' + report.totalCost.toLocaleString() : 'N/A'}</td>
            <td><span class="status-badge ${report.status}">${report.status || 'N/A'}</span></td>
            <td>${report.formattedDate || 'N/A'}</td>
        `;
        
        reportsTableBody.appendChild(row);
    });
}

// Filter reports based on search and status
function filterReports() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    
    filteredReports = allReports.filter(report => {
        // Filter by status
        if (status !== 'all' && report.status !== status) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const matchesSupplier = report.supplierName?.toLowerCase().includes(searchTerm);
            let matchesItems = false;
            
            if (report.requestedItems) {
                matchesItems = Object.values(report.requestedItems).some(item => 
                    item.name.toLowerCase().includes(searchTerm)
                );
            }
            
            return matchesSupplier || matchesItems;
        }
        
        return true;
    });
    
    renderReports();
}

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export to PDF
// Updated exportToPDF function
function exportToPDF() {
    // Check if libraries are loaded
    if (window.jspdf && window.html2canvas) {
        const { jsPDF } = window.jspdf;
        
        // Title for the PDF
        const title = "Supply Reports - Ayiera Initiative";
        const date = new Date().toLocaleDateString();
        
        // Create a temporary element for export
        const pdfElement = document.createElement('div');
        pdfElement.style.position = 'absolute';
        pdfElement.style.left = '-9999px';
        pdfElement.style.width = '800px';
        
        // Clone the table and add title
        const tableClone = reportsTable.cloneNode(true);
        pdfElement.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 20px; color: #1a73e8;">${title}</h2>
            ${tableClone.outerHTML}
            <p style="text-align: right; margin-top: 20px; font-size: 12px; color: #666;">
                Generated on ${date}
            </p>
        `;
        
        document.body.appendChild(pdfElement);
        
        html2canvas(pdfElement, {
            scale: 2, // Higher quality
            logging: false,
            useCORS: true
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190; // Reduced from 210 to add margins
            const imgHeight = canvas.height * imgWidth / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`supply_reports_${new Date().getTime()}.pdf`);
            
            // Clean up
            document.body.removeChild(pdfElement);
        }).catch(err => {
            console.error('Error generating PDF:', err);
            alert('Error generating PDF. Please try again.');
            document.body.removeChild(pdfElement);
        });
    } else {
        // If libraries aren't loaded, show a more helpful message
        alert('PDF generation requires additional libraries. Please wait a moment and try again, or check your internet connection.');
        
        // Attempt to load the libraries dynamically
        const jsPDFScript = document.createElement('script');
        jsPDFScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        
        const html2canvasScript = document.createElement('script');
        html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        
        document.head.appendChild(jsPDFScript);
        document.head.appendChild(html2canvasScript);
        
        // Inform the user to try again after libraries load
        setTimeout(() => {
            if (window.jspdf && window.html2canvas) {
                alert('Libraries have now loaded. Please try exporting again.');
            }
        }, 2000);
    }
}

// Add CSS for status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: capitalize;
    }
    
    .status-badge.approved {
        background-color: #d4edda;
        color: #155724;
    }
    
    .status-badge.pending {
        background-color: #fff3cd;
        color: #856404;
    }
    
    .status-badge.rejected {
        background-color: #f8d7da;
        color: #721c24;
    }
`;
document.head.appendChild(style);