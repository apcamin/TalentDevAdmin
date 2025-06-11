document.addEventListener('DOMContentLoaded', function () {
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyC5hvm0j760C9N6LZzwZeNsTCZLRzzbxt0",
        authDomain: "talent-development-b8874.firebaseapp.com",
        databaseURL: "https://talent-development-b8874-default-rtdb.firebaseio.com",
        projectId: "talent-development-b8874",
        storageBucket: "talent-development-b8874.appspot.com",
        messagingSenderId: "182286301943",
        appId: "1:182286301943:web:0849bb7350e72495d8b1f2"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // DOM Elements
    const contentBody = document.getElementById('contentBody');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.getElementById('mainContent');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    // --- State Management ---
    let fullAttendanceData = [];

    // --- Sidebar and UI Interactivity ---
    sidebarToggle?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
             sidebar.classList.toggle('show');
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        }
    });

    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.parentElement.classList.toggle('open');
        });
    });

    // --- Data Handling and Rendering ---

    /**
     * Renders the main card structure including new filter controls.
     */
    function renderAttendanceCardFrame() {
        contentBody.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3>Attendance Records</h3>
                    <div class="card-actions-grid">
                        <div class="search-box">
                            <input type="text" id="nameSearch" placeholder="Filter by name...">
                            <i class="fas fa-search"></i>
                        </div>
                        <input type="date" id="startDate" class="filter-date">
                        <input type="date" id="endDate" class="filter-date">
                        <select id="statusFilter" class="filter-select">
                            <option value="all">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                        <button class="btn-clear" id="clearFiltersBtn">Clear Filters</button>
                        <button class="btn-export excel" id="exportExcelBtn"><i class="fas fa-file-excel"></i> Excel</button>
                        <button class="btn-export pdf" id="exportPdfBtn"><i class="fas fa-file-pdf"></i> PDF</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Class ID</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody">
                            <tr><td colspan="4" class="loading">Loading data...</td></tr>
                        </tbody>
                    </table>
                </div>
                <div class="table-footer">
                    <div class="data-summary" id="dataSummary"></div>
                </div>
            </div>
        `;
        // Add some styling for the new grid layout
        const style = document.createElement('style');
        style.innerHTML = `
            .card-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; width: 100%; }
            .filter-date, .filter-select, .btn-clear { padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
            .btn-clear { background: #6c757d; color: white; cursor: pointer; border: none; }
        `;
        document.head.appendChild(style);
        addEventListenersToControls();
    }

    /**
     * Renders the rows of the attendance table based on provided data.
     * @param {Array<Object>} attendanceData - The data to render.
     */
    function renderTableRows(attendanceData) {
        const tableBody = document.getElementById('attendanceTableBody');
        const summary = document.getElementById('dataSummary');

        if (!tableBody) return;

        if (attendanceData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No records match your filters.</td></tr>';
            summary.textContent = 'Showing 0 records';
            return;
        }

        tableBody.innerHTML = attendanceData.map(record => {
            const statusClass = record.isPresent ? 'status-approved' : 'status-suspended';
            const statusText = record.isPresent ? 'Present' : 'Absent';
            return `
                <tr>
                    <td>${record.studentName || 'N/A'}</td>
                    <td>${record.date || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${record.classId || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        summary.textContent = `Showing ${attendanceData.length} of ${fullAttendanceData.length} records`;
    }

    /**
     * Adds event listeners for all filter controls and export buttons.
     */
    function addEventListenersToControls() {
        document.getElementById('nameSearch')?.addEventListener('input', applyFilters);
        document.getElementById('startDate')?.addEventListener('change', applyFilters);
        document.getElementById('endDate')?.addEventListener('change', applyFilters);
        document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
        document.getElementById('clearFiltersBtn')?.addEventListener('click', clearFilters);
        document.getElementById('exportPdfBtn')?.addEventListener('click', handleExportPDF);
        document.getElementById('exportExcelBtn')?.addEventListener('click', handleExportExcel);
    }
    
    // --- Event Handlers & Filtering Logic ---

    /**
     * Gets the currently filtered data based on all active filter controls.
     * @returns {Array<Object>} The filtered data array.
     */
    function getFilteredData() {
        const searchTerm = document.getElementById('nameSearch').value.toLowerCase();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('statusFilter').value;

        return fullAttendanceData.filter(record => {
            // Name filter
            const nameMatch = record.studentName.toLowerCase().includes(searchTerm);

            // Status filter
            const statusMatch = status === 'all' || 
                               (status === 'present' && record.isPresent) || 
                               (status === 'absent' && !record.isPresent);

            // Date filter
            // Note: This relies on the browser parsing both date formats correctly.
            // For production, a more robust date parsing library like date-fns or moment.js is recommended.
            const recordDate = new Date(record.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start) start.setHours(0, 0, 0, 0); // Normalize to start of day
            if (end) end.setHours(23, 59, 59, 999); // Normalize to end of day

            const dateMatch = (!start || recordDate >= start) && (!end || recordDate <= end);
            
            return nameMatch && statusMatch && dateMatch;
        });
    }

    /**
     * Applies all active filters and re-renders the table.
     */
    function applyFilters() {
        const filteredData = getFilteredData();
        renderTableRows(filteredData);
    }

    /**
     * Clears all filter inputs and re-renders the table with the full dataset.
     */
    function clearFilters() {
        document.getElementById('nameSearch').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('statusFilter').value = 'all';
        applyFilters();
    }

    /**
     * Handles the PDF export, including a title and date.
     */
    function handleExportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const dataToExport = getFilteredData();
        const today = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

        // Add a title
        doc.setFontSize(18);
        doc.text("Attendance Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${today}`, 14, 30);

        doc.autoTable({
            head: [['Student Name', 'Date', 'Status', 'Class ID']],
            body: dataToExport.map(record => [
                record.studentName, record.date, record.isPresent ? 'Present' : 'Absent', record.classId
            ]),
            startY: 35 // Start table below the title
        });
        doc.save(`attendance-report-${new Date().toISOString().slice(0,10)}.pdf`);
    }

    /**
     * Handles the Excel export.
     */
    function handleExportExcel() {
        const dataToExport = getFilteredData();
        const ws = XLSX.utils.json_to_sheet(dataToExport.map(record => ({
            "Student Name": record.studentName,
            "Date": record.date,
            "Status": record.isPresent ? 'Present' : 'Absent',
            "Class ID": record.classId
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        XLSX.writeFile(wb, `attendance-report-${new Date().toISOString().slice(0,10)}.xlsx`);
    }

    /**
     * Fetches all attendance data from Firebase and performs the initial render.
     */
    function fetchAttendanceData() {
        renderAttendanceCardFrame();
        const attendanceRef = db.ref('attendance');

        attendanceRef.on('value', (snapshot) => {
            const allData = snapshot.val();
            const flattenedData = [];

            if (allData) {
                for (const classId in allData) {
                    for (const month in allData[classId]) {
                        for (const day in allData[classId][month]) {
                            for (const year in allData[classId][month][day]) {
                                for (const studentId in allData[classId][month][day][year]) {
                                    flattenedData.push(allData[classId][month][day][year][studentId]);
                                }
                            }
                        }
                    }
                }
            }
            
            // Sort data by date, most recent first, then store it
            flattenedData.sort((a, b) => new Date(b.date) - new Date(a.date));
            fullAttendanceData = flattenedData; 
            
            // Perform the initial render with all data
            renderTableRows(fullAttendanceData);

        }, (error) => {
            console.error("Firebase data fetch error:", error);
            const tableBody = document.getElementById('attendanceTableBody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Error fetching data.</td></tr>';
            }
        });
    }

    // Initial call to start the process
    fetchAttendanceData();
});