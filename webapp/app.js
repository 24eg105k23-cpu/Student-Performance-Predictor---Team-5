/**
 * Student Performance Predictor
 * app.js — All interactive logic (Dashboard, Marks, Attendance, Assessments, Monitor)
 */

'use strict';

/* ============================================================
   SHARED DATA
   ============================================================ */
let students = [];

/* Attendance records (mutable) */
let attendanceRecords = [];

/* Monitor state */
let monitorSearchTerm = '';
let monitorFilterRiskOnly = false;
let monitorSelectedStudent = null;

/* ============================================================
   HELPERS
   ============================================================ */
function progressBar(value, colorClass = 'bg-primary') {
  return `<div class="progress-sm mt-1"><div class="progress-bar ${colorClass}" style="width:${value}%;height:100%;"></div></div>`;
}

function statusBadge(status) {
  const map = {
    'at-risk': ['badge-atrisk', 'At Risk'],
    'average': ['badge-average', 'Average'],
    'excellent': ['badge-excellent', 'Excellent'],
  };
  const [cls, label] = map[status] || ['badge-average', status];
  return `<span class="badge rounded-pill ${cls}">${label}</span>`;
}

function statusRowClass(status) {
  const map = { 'at-risk': 'row-atrisk', 'average': 'row-average', 'excellent': 'row-excellent' };
  return map[status] || '';
}

function performanceColor(score) {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-warning';
  return 'text-danger';
}

function performanceLevel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Improvement';
  return 'Critical';
}

function trendIcon(trend) {
  if (trend === 'improving') return '<i class="bi bi-trending-up trend-up"></i>';
  if (trend === 'declining') return '<i class="bi bi-trending-down trend-down"></i>';
  return '<i class="bi bi-dash text-secondary"></i>';
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function showEl(id) { document.getElementById(id)?.classList.remove('d-none'); }
function hideEl(id) { document.getElementById(id)?.classList.add('d-none'); }
function setHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

function markInvalid(inputId, errorId, msg) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errorId);
  if (input) input.classList.add('is-invalid');
  if (err) err.textContent = msg;
  return false;
}
function clearInvalid(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.classList.remove('is-invalid');
}

/* ============================================================
   DASHBOARD
   ============================================================ */
let dashboardChart = null;

function initDashboard() {
  const atRisk = students.filter(s => s.status === 'at-risk').length;
  const exc = students.filter(s => s.status === 'excellent').length;
  const sumScores = students.reduce((sum, s) => sum + s.performanceScore, 0);
  const avgPerf = students.length > 0 ? (sumScores / students.length).toFixed(1) : '0.0';

  setText('dash-total', students.length);
  setText('dash-atrisk', atRisk);
  setText('dash-excellent', exc);
  setText('dash-avg', avgPerf + '%');

  // Initialize Bar Chart
  const chartCtx = document.getElementById('performanceChart');
  if (chartCtx) {
    if (dashboardChart) {
      dashboardChart.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const textColor = isDark ? '#f8f9fa' : '#212529';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    const excCount = students.filter(s => s.status === 'excellent').length;
    const avgCount = students.filter(s => s.status === 'average').length;
    const atRiskCount = students.filter(s => s.status === 'at-risk').length;

    const labels = ['Excellent', 'Average', 'At Risk'];
    const dataPoints = [excCount, avgCount, atRiskCount];
    const bgColors = [
      'rgba(25, 135, 84, 0.7)',   // Green
      'rgba(13, 110, 253, 0.7)',  // Blue
      'rgba(220, 53, 69, 0.7)'    // Red
    ];

    dashboardChart = new Chart(chartCtx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Students',
          data: dataPoints,
          backgroundColor: bgColors,
          borderWidth: 1,
          borderColor: bgColors.map(c => c.replace('0.7)', '1)'))
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            display: false,
            beginAtZero: true
          },
          x: {
            ticks: { color: textColor },
            grid: { display: false }
          }
        }
      }
    });
  }

  const tbody = document.getElementById('dashboard-tbody');
  tbody.innerHTML = '';
  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = `cursor-pointer ${statusRowClass(s.status)}`;
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td class="fw-medium">${s.name}</td>
      <td>${s.rollNo}</td>
      <td>
        <div class="fw-medium small">${s.performanceScore}%</div>
        ${progressBar(s.performanceScore, 'bg-primary')}
      </td>
      <td>
        <div class="fw-medium small">${s.attendanceRate}%</div>
        ${progressBar(s.attendanceRate, 'bg-info')}
      </td>
      <td>${statusBadge(s.status)}</td>
      <td class="text-muted small">${s.lastUpdated}</td>
    `;
    tr.addEventListener('click', () => showDashboardDetail(s));
    tbody.appendChild(tr);
  });
}

function showDashboardDetail(student) {
  showEl('dashboard-student-details');
  setText('dash-selected-name', 'Selected Student: ' + student.name);
  setHTML('dash-selected-body', `
    <div class="col-md-6">
      <p class="text-muted small mb-0">Roll Number</p>
      <p class="fw-medium fs-5 mb-0">${student.rollNo}</p>
    </div>
    <div class="col-md-6">
      <p class="text-muted small mb-0">Current Status</p>
      <p class="mb-0">${statusBadge(student.status)}</p>
    </div>
    <div class="col-md-6">
      <p class="text-muted small mb-1">Performance Score: ${student.performanceScore}%</p>
      <div class="progress" style="height:10px;">
        <div class="progress-bar bg-primary" style="width:${student.performanceScore}%"></div>
      </div>
    </div>
    <div class="col-md-6">
      <p class="text-muted small mb-1">Attendance Rate: ${student.attendanceRate}%</p>
      <div class="progress" style="height:10px;">
        <div class="progress-bar bg-info" style="width:${student.attendanceRate}%"></div>
      </div>
    </div>
  `);
}

/* ============================================================
   MARKS FORM
   ============================================================ */
function initMarksForm() {
  const dateInput = document.getElementById('marks-date');
  if (dateInput && !dateInput.value) dateInput.value = today();

  // Auto-fill max marks based on assessment type
  const marksTypeSelect = document.getElementById('marks-type');
  if (marksTypeSelect) {
    marksTypeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      const maxMarksInput = document.getElementById('marks-maxMarks');
      if (maxMarksInput) {
        if (type === 'mid1' || type === 'mid2' || type === 'unit 1 test' || type === 'unit3 test') {
          maxMarksInput.value = 20;
        } else if (type === 'assessment') {
          maxMarksInput.value = 10;
        } else if (type === 'final') {
          maxMarksInput.value = 50;
        }
        updateMarksPercentage();
      }
    });
  }

  // Live percentage update
  ['marks-marksObtained', 'marks-maxMarks'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateMarksPercentage);
  });

  document.getElementById('marks-form')?.addEventListener('submit', handleMarksSubmit);
}

function updateMarksPercentage() {
  const obtained = parseFloat(document.getElementById('marks-marksObtained').value) || 0;
  const max = parseFloat(document.getElementById('marks-maxMarks').value) || 0;
  const pct = max > 0 ? ((obtained / max) * 100).toFixed(2) : '0';
  setText('marks-percentage', pct + '%');
}

function handleMarksSubmit(e) {
  e.preventDefault();
  const rollNo = document.getElementById('marks-rollNo').value.trim().toUpperCase();
  const assessmentType = document.getElementById('marks-type').value;
  const subject = document.getElementById('marks-subject').value;
  const marksObtained = document.getElementById('marks-marksObtained').value;
  const maxMarks = document.getElementById('marks-maxMarks').value;
  const date = document.getElementById('marks-date').value;

  // Clear previous errors
  ['marks-rollNo', 'marks-marksObtained', 'marks-maxMarks', 'marks-date']
    .forEach(clearInvalid);

  let valid = true;

  if (!rollNo) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number is required');
    valid = false;
  } else if (!/^[A-Z0-9]+$/.test(rollNo)) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number must be alphanumeric');
    valid = false;
  }

  if (!marksObtained) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', 'Marks obtained is required');
    valid = false;
  } else if (parseFloat(marksObtained) < 0) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', 'Marks cannot be negative');
    valid = false;
  } else if (parseFloat(marksObtained) > parseFloat(maxMarks)) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', `Marks cannot exceed ${maxMarks}`);
    valid = false;
  }

  if (!maxMarks) {
    markInvalid('marks-maxMarks', 'marks-maxMarks-error', 'Max marks is required');
    valid = false;
  } else if (parseFloat(maxMarks) <= 0) {
    markInvalid('marks-maxMarks', 'marks-maxMarks-error', 'Max marks must be greater than 0');
    valid = false;
  }

  if (!date) {
    markInvalid('marks-date', 'marks-date-error', 'Date is required');
    valid = false;
  }

  if (!valid) return;

  document.getElementById('marks-submit-btn').disabled = true;

  const payload = {
    rollNo: rollNo,
    assessmentType: assessmentType,
    subject: subject,
    score: parseFloat(marksObtained),
    maxScore: parseFloat(maxMarks)
  };

  fetch('/spp/api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        showEl('marks-success-alert');

        setTimeout(() => {
          hideEl('marks-success-alert');
          document.getElementById('marks-form').reset();
          document.getElementById('marks-date').value = today();
          document.getElementById('marks-maxMarks').value = '100';
          setText('marks-percentage', '0%');
          document.getElementById('marks-submit-btn').disabled = false;
        }, 2000);
      } else {
        alert("Error: " + (data.error || "Failed to record marks & assessment"));
        document.getElementById('marks-submit-btn').disabled = false;
      }
    })
    .catch(err => {
      console.error("Submission Error:", err);
      alert("Network error. Please try again.");
      document.getElementById('marks-submit-btn').disabled = false;
    });
}

/* ============================================================
   ATTENDANCE FORM
   ============================================================ */
const SEM4_SUBJECTS = {
  cosm: 'COSM',
  algorithms: 'Algorithms',
  dbms: 'DBMS',
  python: 'Python',
  web_tech: 'Web Tech',
  advanced_reading: 'Adv Reading',
  aptitude: 'Aptitude',
  project: 'Project'
};

function initAttendanceForm() {
  const dateInput = document.getElementById('attendance-date');
  if (dateInput && !dateInput.value) dateInput.value = today();

  renderAttendanceGrid();
  updateAttendanceSummary();

  document.getElementById('attendance-form')?.addEventListener('submit', handleAttendanceSubmit);
}

function renderAttendanceGrid() {
  const container = document.getElementById('attendance-grid');
  if (!container) return;
  container.innerHTML = '';

  attendanceRecords.forEach(rec => {
    // Reset to generic 'present' or 'absent' if it's currently an object
    if (typeof rec.status === 'object') {
      rec.status = 'present';
    } else if (!rec.status) {
      rec.status = 'present';
    }

    // Check for Lateral Entry format (e.g. 25EG205LEK01 -> LEK01) or standard (e.g. 24EG105K01 -> K01)
    let shortRoll = '';
    const upperRoll = rec.rollNo.toUpperCase();
    if (upperRoll.includes('LEK')) {
      shortRoll = upperRoll.slice(upperRoll.indexOf('LEK')); // gets "LEK01"
    } else if (upperRoll.includes('LE')) {
      shortRoll = upperRoll.slice(upperRoll.indexOf('LE')); // gets "LE01"
    } else if (upperRoll.includes('K')) {
      shortRoll = upperRoll.slice(upperRoll.indexOf('K')); // gets "K01"
    } else {
      shortRoll = upperRoll.slice(-3); // fallback
    }

    const box = document.createElement('div');
    const isPresent = rec.status === 'present';
    box.className = `attendance-box d-flex align-items-center justify-content-center text-white fw-bold cursor-pointer rounded shadow-sm transition-colors ${isPresent ? 'bg-success' : 'bg-danger'}`;
    box.style.width = '70px';
    box.style.height = '60px';
    box.style.fontSize = '1.1rem';
    box.style.userSelect = 'none';
    box.style.transition = 'background-color 0.2s';
    box.textContent = shortRoll.toUpperCase();
    box.title = rec.studentName;
    box.id = `att-box-${rec.rollNo}`;

    box.addEventListener('click', () => {
      rec.status = rec.status === 'present' ? 'absent' : 'present';
      box.className = `attendance-box d-flex align-items-center justify-content-center text-white fw-bold cursor-pointer rounded shadow-sm transition-colors ${rec.status === 'present' ? 'bg-success' : 'bg-danger'}`;
      updateAttendanceSummary();
    });

    container.appendChild(box);
  });
}

function updateAttendanceSummary() {
  setText('att-present', attendanceRecords.filter(r => r.status === 'present').length);
  setText('att-absent', attendanceRecords.filter(r => r.status === 'absent').length);
}

function handleAttendanceSubmit(e) {
  e.preventDefault();
  const date = document.getElementById('attendance-date').value;
  clearInvalid('attendance-date');
  let valid = true;

  if (!date) {
    markInvalid('attendance-date', 'attendance-date-error', 'Date is required');
    valid = false;
  }

  if (!attendanceRecords.every(r => r.status)) {
    showEl('attendance-records-error');
    valid = false;
  }

  if (!valid) return;

  document.getElementById('attendance-submit-btn').disabled = true;

  // Send ALL student records — absent reduces by 3%, present increases by 1%
  const payload = {
    date: date,
    records: attendanceRecords
  };

  fetch('/spp/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .catch(err => {
      // If server returns non-json error, catch it
      return { status: 'error', error: 'Server connection failed.' };
    })
    .then(data => {
      if (data && data.status === 'success') {
        alert("Attendance submitted successfully!");
        showEl('attendance-success-alert');

        setTimeout(() => {
           hideEl('attendance-success-alert');
           document.getElementById('attendance-submit-btn').disabled = false;
        }, 2000);
      } else {
        alert("Error: " + (data.error || "Failed to record attendance"));
        document.getElementById('attendance-submit-btn').disabled = false;
      }
    });
}
/* ============================================================
   MONITOR TAB
   ============================================================ */
function initMonitor() {
  const atRiskCount = students.filter(s => s.interventionNeeded).length;
  const excellentCount = students.filter(s => s.performanceScore >= 80).length;
  setText('mon-total', students.length);
  setText('mon-atrisk', atRiskCount);
  setText('mon-excellent', excellentCount);

  if (atRiskCount > 0) {
    const s = atRiskCount > 1 ? 's' : '';
    setText('monitor-atrisk-msg',
      `${atRiskCount} student${s} need immediate intervention to prevent further academic decline.`);
    showEl('monitor-atrisk-alert');
  } else {
    hideEl('monitor-atrisk-alert');
  }

  document.getElementById('monitor-search')?.addEventListener('input', function () {
    monitorSearchTerm = this.value;
    renderMonitorTable();
  });

  renderMonitorTable();
}

function toggleRiskFilter() {
  monitorFilterRiskOnly = !monitorFilterRiskOnly;
  const btn = document.getElementById('monitor-filter-btn');
  if (btn) {
    if (monitorFilterRiskOnly) {
      btn.textContent = 'Show All Students';
      btn.className = 'btn btn-secondary w-100';
    } else {
      btn.textContent = 'Show At-Risk Students';
      btn.className = 'btn btn-outline-secondary w-100';
    }
  }
  renderMonitorTable();
}

function renderMonitorTable() {
  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(monitorSearchTerm.toLowerCase()) ||
      s.rollNo.includes(monitorSearchTerm);
    const matchFilter = !monitorFilterRiskOnly || s.interventionNeeded;
    return matchSearch && matchFilter;
  });

  setText('mon-count', filtered.length);

  const tbody = document.getElementById('monitor-tbody');
  tbody.innerHTML = '';
  filtered.forEach(s => {
    const tr = document.createElement('tr');
    if (s.interventionNeeded) tr.className = 'row-intervention';
    const statusBadgeHtml = s.interventionNeeded
      ? '<span class="badge rounded-pill bg-danger">At Risk</span>'
      : '<span class="badge rounded-pill bg-secondary">On Track</span>';

    tr.innerHTML = `
      <td class="fw-medium">${s.name}</td>
      <td>${s.rollNo}</td>
      <td>
        <div class="${performanceColor(s.performanceScore)} fw-semibold small">${s.performanceScore}%</div>
        ${progressBar(s.performanceScore, 'bg-primary')}
      </td>
      <td>
        <div class="fw-medium small">${s.attendanceRate}%</div>
        ${progressBar(s.attendanceRate, 'bg-info')}
      </td>
      <td>${statusBadgeHtml}</td>
      <td>${trendIcon(s.trend)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="showMonitorDetails('${s.id}')">
          View Details
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function showMonitorDetails(id) {
  const student = students.find(s => s.id === id);
  if (!student) return;
  monitorSelectedStudent = student;

  showEl('monitor-details-panel');
  setText('mon-details-name', 'Detailed Analysis: ' + student.name);

  // Info row
  const statusBadgeHtml = student.interventionNeeded
    ? '<span class="badge bg-danger">Needs Intervention</span>'
    : '<span class="badge bg-secondary">On Track</span>';

  setHTML('mon-details-info', `
    <div class="col-md-4">
      <p class="text-muted small mb-0">Roll Number</p>
      <p class="fw-semibold fs-5">${student.rollNo}</p>
    </div>
    <div class="col-md-4">
      <p class="text-muted small mb-0">Current Status</p>
      <p class="fw-semibold">${statusBadgeHtml}</p>
    </div>
    <div class="col-md-4">
      <p class="text-muted small mb-0">Performance Trend</p>
      <div class="d-flex align-items-center gap-2">
        ${trendIcon(student.trend)}
        <span class="fw-medium text-capitalize">${student.trend}</span>
      </div>
    </div>
  `);

  // Metrics
  const attColorClass = student.attendanceRate >= 75 ? 'text-success' : 'text-warning';
  const attLabel = student.attendanceRate >= 75 ? 'Good' : 'Needs Improvement';
  setHTML('mon-details-metrics', `
    <div class="mb-3">
      <div class="d-flex justify-content-between mb-1">
        <span class="small fw-medium">Performance Score: ${student.performanceScore}%</span>
        <span class="small fw-semibold ${performanceColor(student.performanceScore)}">${performanceLevel(student.performanceScore)}</span>
      </div>
      <div class="progress" style="height:10px;">
        <div class="progress-bar bg-primary" style="width:${student.performanceScore}%"></div>
      </div>
    </div>
    <div>
      <div class="d-flex justify-content-between mb-1">
        <span class="small fw-medium">Attendance Rate: ${student.attendanceRate}%</span>
        <span class="small fw-semibold ${attColorClass}">${attLabel}</span>
      </div>
      <div class="progress" style="height:10px;">
        <div class="progress-bar bg-info" style="width:${student.attendanceRate}%"></div>
      </div>
    </div>
  `);

  // Risk Factors
  let riskHtml = '<p class="fw-medium mb-2">Risk Factors:</p>';
  if (student.riskFactors.length > 0) {
    riskHtml += student.riskFactors.map(f =>
      `<div class="risk-factor-item"><i class="bi bi-exclamation-circle-fill"></i>${f}</div>`
    ).join('');
  } else {
    riskHtml += '<p class="text-muted small">No risk factors identified</p>';
  }
  setHTML('mon-details-risks', riskHtml);

  // Monitor Details Table (Subjects as rows, Assessment Types as columns)
  const assessmentTypes = ['mid1', 'mid2', 'unit 1 test', 'unit3 test', 'assessment', 'final'];
  
  // Create a map to quickly look up raw scores
  const scoreMap = {}; 
  student.recentAssessments.forEach(a => {
    if (!scoreMap[a.subject]) scoreMap[a.subject] = {};
    // Extracting the exact score out of the assessment object
    scoreMap[a.subject][a.type] = a.score;
  });

  let tableHtml = `
    <div class="table-responsive">
      <table class="table table-bordered table-sm align-middle text-center mt-3">
        <thead class="table-light">
          <tr>
            <th class="text-start">Subject</th>
            ${assessmentTypes.map(t => `<th class="text-capitalize">${t.replace(/-/g, ' ')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  // Always display the 8 specific Sem 4 subjects, mapping the dynamic DB scores to them.
  const monitorSubjects = [
    { key: 'cosm', label: 'Computer Oriented Statistical Methods' },
    { key: 'algorithms', label: 'Fundamentals of Computer Algorithms' },
    { key: 'dbms', label: 'Database Management Systems' },
    { key: 'python', label: 'Programming in Python' },
    { key: 'web-tech', label: 'Web Technologies' },
    { key: 'advanced-reading', label: 'Advanced Reading Comprehension Skills' },
    { key: 'aptitude', label: 'Quantitative Aptitude and Logical Reasoning - II' },
    { key: 'project', label: 'Integrated Project - II' }
  ];

  monitorSubjects.forEach(sub => {
    tableHtml += `<tr><td class="text-start fw-medium">${sub.label}</td>`;
    
    // Merge scores from both the DB specific string (e.g. "Computer Oriented Statistical Methods") 
    // and the select value representation (e.g. "cosm") so neither overwrite each other.
    const combinedScores = { 
      ...(scoreMap[sub.label] || {}), 
      ...(scoreMap[sub.key] || {}) 
    };

    assessmentTypes.forEach(type => {
      const score = combinedScores[type];
      const displayScore = score !== undefined ? score : '-';
      tableHtml += `<td>${displayScore}</td>`;
    });
    tableHtml += `</tr>`;
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;
  
  setHTML('mon-details-assessments', tableHtml);

  // Scroll to details
  document.getElementById('monitor-details-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const icon = document.getElementById('theme-icon');
  const html = document.documentElement;

  // Check local storage or default to dark
  const currentTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-bs-theme', currentTheme);
  updateThemeIcon(currentTheme);

  toggleBtn.addEventListener('click', () => {
    const isDark = html.getAttribute('data-bs-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill text-warning';
    } else {
      icon.className = 'bi bi-moon-stars-fill text-primary';
    }
  }
}

/* ============================================================
   MESSAGE TAB (Twilio Ready)
   ============================================================ */
function initMessageForm() {
  const form = document.getElementById('message-form');
  const recipientSelect = document.getElementById('message-recipient');
  const countEl = document.getElementById('msg-student-count');

  if (!form || !recipientSelect || !countEl) return;

  // Function to calculate recipients based on dropdown
  function updateRecipientCount() {
    const group = recipientSelect.value;
    let count = 0;

    if (group === 'all') count = students.length;
    else if (group === 'at-risk') count = students.filter(s => s.interventionNeeded).length;
    else if (group === 'low-attendance') count = students.filter(s => s.attendanceRate < 75).length;
    else if (group === 'excellent') count = students.filter(s => s.performanceScore >= 80).length;

    countEl.textContent = count;
    return count;
  }

  // Update count when dropdown changes
  recipientSelect.addEventListener('change', updateRecipientCount);

  // Set initial count
  updateRecipientCount();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const contentInput = document.getElementById('message-content');
    const content = contentInput.value.trim();
    const currentCount = updateRecipientCount();

    clearInvalid('message-content');

    if (!content) {
      markInvalid('message-content', 'message-content-error', 'Please enter a message to send.');
      return;
    }

    if (currentCount === 0) {
      alert("There are 0 students in this selected group. Message will not be sent.");
      return;
    }

    // Success - Placeholder for future Twilio Integration
    console.log(`[TWILIO SIMULATION] Sending SMS to ${currentCount} students : "${content}"`);

    showEl('message-success-alert');
    document.getElementById('message-submit-btn').disabled = true;

    setTimeout(() => {
      hideEl('message-success-alert');
      contentInput.value = ''; // Only clear the text, keep the dropdown selection
      document.getElementById('message-submit-btn').disabled = false;
    }, 3000);
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();

  try {
    const res = await fetch('/spp/api/students');
    if (res.ok) {
      students = await res.json();

      // Initialize basic attendance data for all students dynamically
      attendanceRecords = students.map(s => ({
        rollNo: s.rollNo,
        studentName: s.name,
        status: 'present' // default
      }));
    } else {
      console.error("Failed to fetch students data, using empty arrays.");
    }
  } catch (err) {
    console.error("Error fetching dynamic data:", err);
  }

  initDashboard();
  initMarksForm();
  initAttendanceForm();
  initMonitor();
  initMessageForm();
});
