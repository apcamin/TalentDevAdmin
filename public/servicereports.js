// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Initialize Firebase (replace with your config)
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
// It's good practice to use the namespaced `firebase` object for older SDK versions
// or to use `initializeApp` directly as imported.
// For consistency with the imports, using `initializeApp` is preferred.
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp); // Use getDatabase with the initialized app

// Global variables
let allReports = [];
let reportsTable;
let loadingPromises = [];

$(document).ready(function() {
    initializeDataTable();
    bindEventListeners();
    loadAllReports();
});

function initializeDataTable() {
    reportsTable = $('#reportsTable').DataTable({
        responsive: true,
        dom: '<"top"f>rt<"bottom"lip><"clear">',
        pageLength: 10,
        order: [[4, 'desc']], // Sort by date column descending
        processing: true, // <--- FIX: Enable processing indicator for DataTables
        columns: [
            { 
                data: 'id',
                title: 'ID',
                width: '10%'
            },
            { 
                data: 'type',
                title: 'Type',
                width: '20%'
            },
            { 
                data: 'name',
                title: 'Name',
                width: '25%'
            },
            { 
                data: 'category',
                title: 'Category',
                width: '15%'
            },
            { 
                data: 'date',
                title: 'Date',
                width: '15%'
            },
            { 
                data: 'status',
                title: 'Status',
                width: '10%',
                render: function(data, type, row) {
                    const statusClass = getStatusClass(data);
                    return `<span class="badge ${statusClass}">${data}</span>`;
                }
            },
            { 
                data: null,
                title: 'Actions',
                width: '5%',
                render: function(data, type, row) {
                    return `<button class="btn btn-sm btn-primary view-details" 
                            data-id="${row.id}" data-type="${row.type}" 
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>`;
                },
                orderable: false
            }
        ],
        language: {
            emptyTable: "No reports available",
            processing: "Loading reports...",
            search: "Search reports:",
            lengthMenu: "Show _MENU_ reports per page"
        }
    });
}

function bindEventListeners() {
    $('#applyFilters').click(applyFilters);
    $('#clearFilters').click(clearFilters);
    $('#exportPdf').click(exportToPdf);
    $('#exportExcel').click(exportToExcel);
    $('#refreshData').click(refreshData);
    
    // View details button click handler
    $(document).on('click', '.view-details', handleViewDetails);
}

function getStatusClass(status) {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('present') || statusLower.includes('active') || statusLower.includes('approved')) {
        return 'bg-success';
    } else if (statusLower.includes('absent') || statusLower.includes('rejected')) {
        return 'bg-danger';
    } else if (statusLower.includes('pending')) {
        return 'bg-warning';
    } else {
        return 'bg-secondary';
    }
}

function loadAllReports() {
    showLoadingState(true);
    allReports = [];
    loadingPromises = [];

    // Load Tournament Registrations
    const tournamentPromise = loadTournamentRegistrations();
    loadingPromises.push(tournamentPromise);

    // Load Class Registrations
    const classPromise = loadClassRegistrations();
    loadingPromises.push(classPromise);

    // Load Attendance
    const attendancePromise = loadAttendanceRecords();
    loadingPromises.push(attendancePromise);

    // Load Assigned Activities
    const activitiesPromise = loadAssignedActivities();
    loadingPromises.push(activitiesPromise);

    // Load Assigned Events
    const eventsPromise = loadAssignedEvents();
    loadingPromises.push(eventsPromise);

    // Wait for all promises to complete
    Promise.all(loadingPromises)
        .then(() => {
            updateTable();
            showLoadingState(false);
            showNotification('Reports loaded successfully', 'success');
        })
        .catch((error) => {
            console.error('Error loading reports:', error);
            showLoadingState(false);
            showNotification('Error loading reports. Please try again.', 'error');
        });
}

function loadTournamentRegistrations() {
    return new Promise((resolve, reject) => {
        // FIX: Use `ref(database, 'path')` instead of `database.ref('path')` for modular SDK
        onValue(ref(database, 'tournament_registration'), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data) {
                    allReports.push({
                        id: childSnapshot.key,
                        type: 'Tournament Registration',
                        name: data.menteeName || 'N/A',
                        category: data.tournamentCategory || 'N/A',
                        date: formatDate(data.timestamp),
                        status: data.status || 'Unknown',
                        rawData: data
                    });
                }
            });
            resolve();
        }, (error) => {
            reject(error);
        }, { onlyOnce: true }); // Use { onlyOnce: true } to fetch data once
    });
}

function loadClassRegistrations() {
    return new Promise((resolve, reject) => {
        // FIX: Use `ref(database, 'path')` instead of `database.ref('path')` for modular SDK
        onValue(ref(database, 'registeredClasses'), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                if (data) {
                    allReports.push({
                        id: childSnapshot.key,
                        type: 'Class Registration',
                        name: data.className || 'N/A',
                        category: 'Class',
                        date: formatDate(data.registrationDate),
                        status: data.status || 'Registered',
                        rawData: data
                    });
                }
            });
            resolve();
        }, (error) => {
            reject(error);
        }, { onlyOnce: true }); // Use { onlyOnce: true } to fetch data once
    });
}

function loadAttendanceRecords() {
    return new Promise((resolve, reject) => {
        // FIX: Use `ref(database, 'path')` instead of `database.ref('path')` for modular SDK
        onValue(ref(database, 'attendance'), (snapshot) => {
            snapshot.forEach((classSnapshot) => {
                classSnapshot.forEach((monthSnapshot) => {
                    monthSnapshot.forEach((daySnapshot) => {
                        daySnapshot.forEach((yearSnapshot) => {
                            yearSnapshot.forEach((attendanceSnapshot) => {
                                const data = attendanceSnapshot.val();
                                if (data) {
                                    allReports.push({
                                        id: attendanceSnapshot.key,
                                        type: 'Attendance',
                                        name: data.studentName || 'N/A',
                                        category: 'Attendance',
                                        date: formatDate(data.date),
                                        status: data.isPresent ? 'Present' : 'Absent',
                                        rawData: data
                                    });
                                }
                            });
                        });
                    });
                });
            });
            resolve();
        }, (error) => {
            reject(error);
        }, { onlyOnce: true }); // Use { onlyOnce: true } to fetch data once
    });
}

function loadAssignedActivities() {
    return new Promise((resolve, reject) => {
        // FIX: Use `ref(database, 'path')` instead of `database.ref('path')` for modular SDK
        onValue(ref(database, 'assigned_activities'), (snapshot) => {
            snapshot.forEach((userSnapshot) => {
                userSnapshot.forEach((activitySnapshot) => {
                    const data = activitySnapshot.val();
                    if (data) {
                        allReports.push({
                            id: activitySnapshot.key,
                            type: 'Assigned Activity',
                            name: data.className || 'N/A', // Assuming className is used here
                            category: data.talentCategory || 'N/A',
                            date: formatDateRange(data.startDate, data.endDate),
                            status: determineActivityStatus(data),
                            rawData: data
                        });
                    }
                });
            });
            resolve();
        }, (error) => {
            reject(error);
        }, { onlyOnce: true }); // Use { onlyOnce: true } to fetch data once
    });
}

function loadAssignedEvents() {
    return new Promise((resolve, reject) => {
        // FIX: Use `ref(database, 'path')` instead of `database.ref('path')` for modular SDK
        onValue(ref(database, 'assigned_events'), (snapshot) => {
            snapshot.forEach((eventSnapshot) => {
                const data = eventSnapshot.val();
                if (data) {
                    allReports.push({
                        id: eventSnapshot.key,
                        type: 'Assigned Event',
                        name: data.tournamentName || 'N/A',
                        category: data.role || 'N/A',
                        date: formatDate(data.timestamp),
                        status: data.status || 'Assigned',
                        rawData: data
                    });
                }
            });
            resolve();
        }, (error) => {
            reject(error);
        }, { onlyOnce: true }); // Use { onlyOnce: true } to fetch data once
    });
}

function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    
    let date;
    if (typeof dateInput === 'number' || (typeof dateInput === 'string' && !isNaN(new Date(dateInput)))) {
        date = new Date(dateInput);
    } else {
        return 'N/A';
    }
    
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
}

function formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return 'N/A';
    if (!startDate) return formatDate(endDate);
    if (!endDate) return formatDate(startDate);
    return `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

function determineActivityStatus(data) {
    if (!data.startDate || !data.endDate) return 'Active';
    
    const now = new Date();
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    // Ensure `end` date includes the entire day
    end.setHours(23, 59, 59, 999);

    if (now < start) return 'Scheduled';
    if (now > end) return 'Completed';
    return 'Active';
}

function updateTable() {
    if (reportsTable) {
        reportsTable.clear().rows.add(allReports).draw();
    }
}

// ... (rest of your code)

function showLoadingState(show) {
    // Ensure reportsTable is defined and has the processing method
    if (reportsTable && typeof reportsTable.processing === 'function') {
        reportsTable.processing(show);
    } else {
        // Fallback for cases where DataTables might not be fully initialized
        // or the 'processing' option wasn't set.
        // You might want to show a simple loading spinner here manually.
        console.warn("reportsTable or its processing function is not available yet.");
        // Example: $('#loadingSpinner').toggle(show);
    }
}

// ... (rest of your code)

function applyFilters() {
    const reportType = $('#reportType').val();
    const category = $('#categoryFilter').val();
    const status = $('#statusFilter').val();
    const dateFrom = $('#dateFrom').val();
    const dateTo = $('#dateTo').val();
    
    let filteredData = [...allReports];
    
    // Filter by report type
    if (reportType && reportType !== 'all') {
        const typeMap = {
            'tournament': 'Tournament Registration',
            'class': 'Class Registration',
            'attendance': 'Attendance',
            'activities': 'Assigned Activity',
            'events': 'Assigned Event'
        };
        
        if (typeMap[reportType]) {
            filteredData = filteredData.filter(item => item.type === typeMap[reportType]);
        }
    }
    
    // Filter by category
    if (category && category !== 'all') {
        filteredData = filteredData.filter(item => 
            item.category.toLowerCase().includes(category.toLowerCase())
        );
    }
    
    // Filter by status
    if (status && status !== 'all') {
        filteredData = filteredData.filter(item => 
            item.status.toLowerCase().includes(status.toLowerCase())
        );
    }
    
    // Filter by date range
    if (dateFrom || dateTo) {
        filteredData = filteredData.filter(item => {
            const itemDate = new Date(item.date);
            if (isNaN(itemDate.getTime())) return false; // Exclude items with invalid dates if date filter is active
            
            const from = dateFrom ? new Date(dateFrom) : null;
            const to = dateTo ? new Date(dateTo) : null;

            // Ensure 'to' date includes the entire day
            if (to) to.setHours(23, 59, 59, 999);
            
            if (from && itemDate < from) return false;
            if (to && itemDate > to) return false;
            return true;
        });
    }
    
    reportsTable.clear().rows.add(filteredData).draw();
    showNotification(`Applied filters. Showing ${filteredData.length} of ${allReports.length} reports.`, 'info');
}

function clearFilters() {
    $('#reportType').val('all');
    $('#categoryFilter').val('all');
    $('#statusFilter').val('all');
    $('#dateFrom').val('');
    $('#dateTo').val('');
    
    updateTable();
    showNotification('Filters cleared. Showing all reports.', 'info');
}

function refreshData() {
    showNotification('Refreshing data...', 'info');
    loadAllReports();
}

function exportToPdf() {
    try {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF library not loaded. Please ensure it\'s included before this script.');
        }
        if (typeof $.fn.dataTable.Api.register === 'undefined') {
            throw new Error('DataTables AutoTable extension for jsPDF not loaded. Please include "jspdf.plugin.autotable.js".');
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('Service Reports - Ayiera Initiative', 14, 20);
        
        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        
        // Add filters info
        doc.setFontSize(12);
        let yPos = 40;
        doc.text(`Report Type: ${$('#reportType option:selected').text()}`, 14, yPos);
        yPos += 8;
        doc.text(`Category: ${$('#categoryFilter option:selected').text()}`, 14, yPos);
        yPos += 8;
        doc.text(`Status: ${$('#statusFilter option:selected').text()}`, 14, yPos);
        yPos += 15;
        
        // Get filtered data
        const filteredData = reportsTable.rows({ search: 'applied' }).data().toArray();
        
        if (filteredData.length === 0) {
            doc.text('No data to export', 14, yPos);
            showNotification('No data to export to PDF.', 'warning');
        } else {
            // Prepare data for the table
            const tableData = filteredData.map(item => [
                item.id.substring(0, 10) + (item.id.length > 10 ? '...' : ''), // Truncate long IDs
                item.type,
                item.name.substring(0, 20) + (item.name.length > 20 ? '...' : ''),
                item.category,
                item.date,
                item.status
            ]);
            
            // Add table
            doc.autoTable({
                head: [['ID', 'Type', 'Name', 'Category', 'Date', 'Status']],
                body: tableData,
                startY: yPos,
                styles: {
                    fontSize: 9,
                    cellPadding: 2
                },
                headStyles: {
                    fillColor: [26, 115, 232],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 35 },
                    2: { cellWidth: 40 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 25 }
                }
            });
            const filename = `Service_Reports_${new Date().toISOString().slice(0,10)}.pdf`;
            doc.save(filename);
            showNotification(`PDF exported successfully: ${filename}`, 'success');
        }
        
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification(`Error exporting PDF: ${error.message}`, 'error');
    }
}

function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('XLSX library not loaded. Please ensure it\'s included before this script.');
        }
        
        // Get filtered data
        const filteredData = reportsTable.rows({ search: 'applied' }).data().toArray();
        
        if (filteredData.length === 0) {
            showNotification('No data to export to Excel.', 'warning');
            return;
        }
        
        // Prepare worksheet with metadata
        const wsData = [
            ['Service Reports - Ayiera Initiative'],
            [`Generated on: ${new Date().toLocaleString()}`],
            [`Total Records: ${filteredData.length}`],
            [],
            ['ID', 'Type', 'Name', 'Category', 'Date', 'Status'],
            ...filteredData.map(item => [
                item.id,
                item.type,
                item.name,
                item.category,
                item.date,
                item.status
            ])
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Set column widths
        const colWidths = [
            { wch: 15 }, // ID
            { wch: 20 }, // Type
            { wch: 30 }, // Name
            { wch: 15 }, // Category
            { wch: 15 }, // Date
            { wch: 12 }  // Status
        ];
        ws['!cols'] = colWidths;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Service Reports");
        
        // Export to Excel
        const filename = `Service_Reports_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, filename);
        showNotification(`Excel file exported successfully: ${filename}`, 'success');
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        showNotification(`Error exporting Excel file: ${error.message}`, 'error');
    }
}

function handleViewDetails() {
    const id = $(this).data('id');
    const type = $(this).data('type');
    const report = allReports.find(r => r.id === id && r.type === type);
    
    if (!report) {
        showNotification('Report details not found', 'error');
        return;
    }
    
    // Remove existing modal if any to prevent duplicates
    $('#reportDetailsModal').remove();
    
    // Create a modal to display detailed information
    const modalHtml = `
        <div class="modal fade" id="reportDetailsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-info-circle me-2"></i>
                            ${type} Details
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6"><strong>ID:</strong> ${report.id}</div>
                            <div class="col-md-6"><strong>Status:</strong> 
                                <span class="badge ${getStatusClass(report.status)}">${report.status}</span>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6"><strong>Name:</strong> ${report.name}</div>
                            <div class="col-md-6"><strong>Category:</strong> ${report.category}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6"><strong>Date:</strong> ${report.date}</div>
                            <div class="col-md-6"><strong>Type:</strong> ${report.type}</div>
                        </div>
                        <hr>
                        <h6>Raw Data:</h6>
                        <div class="bg-light p-3 rounded" style="max-height: 300px; overflow-y: auto;">
                            <pre style="white-space: pre-wrap; margin: 0;">${JSON.stringify(report.rawData, null, 2)}</pre>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body and show it
    $('body').append(modalHtml);
    
    // Check if Bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(document.getElementById('reportDetailsModal'));
        modal.show();
        
        // Remove modal when hidden
        $('#reportDetailsModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
    } else {
        // Fallback for jQuery modal (if Bootstrap JS is not correctly loaded)
        $('#reportDetailsModal').modal('show');
        $('#reportDetailsModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notificationId = 'notification-' + Date.now();
    const alertClass = type === 'error' ? 'alert-danger' : 
                         type === 'success' ? 'alert-success' : 
                         type === 'warning' ? 'alert-warning' : 'alert-info';
    
    const notificationHtml = `
        <div id="${notificationId}" class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    $('body').append(notificationHtml);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        $(`#${notificationId}`).fadeOut(300, function() {
            $(this).remove();
        });
    }, 5000);
}

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred. Please check the console for details.', 'error');
});

// Handle Firebase connection errors
// FIX: Use ref(database, '.info/connected') for modular SDK
onValue(ref(database, '.info/connected'), (snapshot) => {
    if (snapshot.val() === false) {
        showNotification('Database connection lost. Please check your internet connection.', 'warning');
    }
});