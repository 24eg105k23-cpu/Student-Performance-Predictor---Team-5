/**
 * Student Performance Predictor
 * app.js — All interactive logic (Dashboard, Marks, Attendance, Assessments, Monitor)
 */

'use strict';

/* ============================================================
   SHARED DATA
   ============================================================ */
const students = [
  {
    id: '1', name: 'Aarav Kumar', rollNo: '001',
    performanceScore: 45, attendanceRate: 65,
    status: 'at-risk', lastUpdated: '2024-01-20',
    recentAssessments: [
      { type: 'Quiz', subject: 'Mathematics', score: 42, date: '2024-01-20' },
      { type: 'Class Test', subject: 'English', score: 48, date: '2024-01-18' },
      { type: 'Assignment', subject: 'Science', score: 40, date: '2024-01-15' },
    ],
    riskFactors: ['Low attendance', 'Declining scores', 'Poor engagement'],
    interventionNeeded: true,
    trend: 'declining',
  },
  {
    id: '2', name: 'Priya Sharma', rollNo: '002',
    performanceScore: 78, attendanceRate: 92,
    status: 'excellent', lastUpdated: '2024-01-20',
    recentAssessments: [
      { type: 'Mid-term', subject: 'Mathematics', score: 85, date: '2024-01-20' },
      { type: 'Quiz', subject: 'English', score: 75, date: '2024-01-18' },
      { type: 'Project', subject: 'Science', score: 78, date: '2024-01-15' },
    ],
    riskFactors: [],
    interventionNeeded: false,
    trend: 'improving',
  },
  {
    id: '3', name: 'Rajesh Patel', rollNo: '003',
    performanceScore: 62, attendanceRate: 78,
    status: 'average', lastUpdated: '2024-01-20',
    recentAssessments: [
      { type: 'Quiz', subject: 'Mathematics', score: 65, date: '2024-01-20' },
      { type: 'Class Test', subject: 'English', score: 60, date: '2024-01-18' },
      { type: 'Assignment', subject: 'Science', score: 58, date: '2024-01-15' },
    ],
    riskFactors: ['Moderate attendance', 'Fluctuating scores'],
    interventionNeeded: false,
    trend: 'stable',
  },
  {
    id: '4', name: 'Neha Singh', rollNo: '004',
    performanceScore: 88, attendanceRate: 95,
    status: 'excellent', lastUpdated: '2024-01-20',
    recentAssessments: [
      { type: 'Final Exam', subject: 'Mathematics', score: 92, date: '2024-01-20' },
      { type: 'Quiz', subject: 'English', score: 88, date: '2024-01-18' },
      { type: 'Project', subject: 'Science', score: 85, date: '2024-01-15' },
    ],
    riskFactors: [],
    interventionNeeded: false,
    trend: 'improving',
  },
  {
    id: '5', name: 'Arjun Desai', rollNo: '005',
    performanceScore: 52, attendanceRate: 71,
    status: 'at-risk', lastUpdated: '2024-01-20',
    recentAssessments: [
      { type: 'Quiz', subject: 'Mathematics', score: 50, date: '2024-01-20' },
      { type: 'Class Test', subject: 'English', score: 55, date: '2024-01-18' },
      { type: 'Assignment', subject: 'Science', score: 48, date: '2024-01-15' },
    ],
    riskFactors: ['Low performance', 'Irregular attendance'],
    interventionNeeded: true,
    trend: 'declining',
  },
];

/* Attendance records (mutable) */
let attendanceRecords = [
  { rollNo: '001', studentName: 'Aarav Kumar', status: 'present' },
  { rollNo: '002', studentName: 'Priya Sharma', status: 'present' },
  { rollNo: '003', studentName: 'Rajesh Patel', status: 'absent' },
  { rollNo: '004', studentName: 'Neha Singh', status: 'present' },
  { rollNo: '005', studentName: 'Arjun Desai', status: 'leave' },
];

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
function initDashboard() {
  const atRisk = students.filter(s => s.status === 'at-risk').length;
  const exc = students.filter(s => s.status === 'excellent').length;
  const avgPerf = (students.reduce((sum, s) => sum + s.performanceScore, 0) / students.length).toFixed(1);

  setText('dash-total', students.length);
  setText('dash-atrisk', atRisk);
  setText('dash-excellent', exc);
  setText('dash-avg', avgPerf + '%');

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
  const studentName = document.getElementById('marks-studentName').value.trim();
  const rollNo = document.getElementById('marks-rollNo').value.trim();
  const marksObtained = document.getElementById('marks-marksObtained').value;
  const maxMarks = document.getElementById('marks-maxMarks').value;
  const date = document.getElementById('marks-date').value;

  // Clear previous errors
  ['marks-studentName', 'marks-rollNo', 'marks-marksObtained', 'marks-maxMarks', 'marks-date']
    .forEach(clearInvalid);

  let valid = true;

  if (!studentName) {
    markInvalid('marks-studentName', 'marks-studentName-error', 'Student name is required');
    valid = false;
  } else if (studentName.length < 2) {
    markInvalid('marks-studentName', 'marks-studentName-error', 'Student name must be at least 2 characters');
    valid = false;
  }

  if (!rollNo) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number is required');
    valid = false;
  } else if (!/^\d+$/.test(rollNo)) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number must contain only digits');
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

  // Success
  showEl('marks-success-alert');
  document.getElementById('marks-submit-btn').disabled = true;

  setTimeout(() => {
    hideEl('marks-success-alert');
    document.getElementById('marks-form').reset();
    document.getElementById('marks-date').value = today();
    document.getElementById('marks-maxMarks').value = '100';
    setText('marks-percentage', '0%');
    document.getElementById('marks-submit-btn').disabled = false;
  }, 2000);
}

/* ============================================================
   ATTENDANCE FORM
   ============================================================ */
function initAttendanceForm() {
  const dateInput = document.getElementById('attendance-date');
  if (dateInput && !dateInput.value) dateInput.value = today();

  renderAttendanceTable();
  updateAttendanceSummary();

  document.getElementById('attendance-form')?.addEventListener('submit', handleAttendanceSubmit);
}

function renderAttendanceTable() {
  const tbody = document.getElementById('attendance-tbody');
  tbody.innerHTML = '';
  attendanceRecords.forEach(rec => {
    const tr = document.createElement('tr');
    tr.className = `row-${rec.status}`;
    tr.id = `att-row-${rec.rollNo}`;
    tr.innerHTML = `
      <td class="fw-medium">${rec.rollNo}</td>
      <td>${rec.studentName}</td>
      <td>
        <select class="form-select form-select-sm" style="width:140px"
          onchange="updateAttendanceStatus('${rec.rollNo}', this.value)">
          <option value="present" ${rec.status === 'present' ? 'selected' : ''}>Present</option>
          <option value="absent"  ${rec.status === 'absent' ? 'selected' : ''}>Absent</option>
          <option value="leave"   ${rec.status === 'leave' ? 'selected' : ''}>On Leave</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateAttendanceStatus(rollNo, newStatus) {
  const rec = attendanceRecords.find(r => r.rollNo === rollNo);
  if (rec) {
    rec.status = newStatus;
    const tr = document.getElementById(`att-row-${rollNo}`);
    if (tr) {
      tr.className = `row-${newStatus}`;
    }
  }
  updateAttendanceSummary();
  hideEl('attendance-records-error');
}

function updateAttendanceSummary() {
  setText('att-present', attendanceRecords.filter(r => r.status === 'present').length);
  setText('att-absent', attendanceRecords.filter(r => r.status === 'absent').length);
  setText('att-leave', attendanceRecords.filter(r => r.status === 'leave').length);
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

  showEl('attendance-success-alert');
  setText('attendance-success-msg', `Attendance recorded successfully for ${date}!`);
  document.getElementById('attendance-submit-btn').disabled = true;

  setTimeout(() => {
    hideEl('attendance-success-alert');
    document.getElementById('attendance-submit-btn').disabled = false;
  }, 2000);
}

/* ============================================================
   ASSESSMENT FORM
   ============================================================ */
function initAssessmentForm() {
  const dateInput = document.getElementById('asmt-date');
  if (dateInput && !dateInput.value) dateInput.value = today();

  ['asmt-score', 'asmt-maxScore'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateAsmtPercentage);
  });

  document.getElementById('asmt-feedback')?.addEventListener('input', function () {
    const len = this.value.length;
    const count = document.getElementById('asmt-feedback-counter');
    if (count) {
      count.textContent = `${len}/500 characters`;
      count.className = len > 500 ? 'text-danger' : 'text-muted';
    }
  });

  document.getElementById('assessment-form')?.addEventListener('submit', handleAssessmentSubmit);
}

function updateAsmtPercentage() {
  const score = parseFloat(document.getElementById('asmt-score').value) || 0;
  const maxScore = parseFloat(document.getElementById('asmt-maxScore').value) || 0;
  const pct = maxScore > 0 ? ((score / maxScore) * 100).toFixed(2) : '0';
  setText('asmt-percentage', pct + '%');
}

function handleAssessmentSubmit(e) {
  e.preventDefault();
  const studentName = document.getElementById('asmt-studentName').value.trim();
  const rollNo = document.getElementById('asmt-rollNo').value.trim();
  const score = document.getElementById('asmt-score').value;
  const maxScore = document.getElementById('asmt-maxScore').value;
  const date = document.getElementById('asmt-date').value;
  const feedback = document.getElementById('asmt-feedback').value;

  ['asmt-studentName', 'asmt-rollNo', 'asmt-score', 'asmt-maxScore', 'asmt-date'].forEach(clearInvalid);
  hideEl('asmt-feedback-error');

  let valid = true;

  if (!studentName) {
    markInvalid('asmt-studentName', 'asmt-studentName-error', 'Student name is required');
    valid = false;
  } else if (studentName.length < 2) {
    markInvalid('asmt-studentName', 'asmt-studentName-error', 'Student name must be at least 2 characters');
    valid = false;
  }

  if (!rollNo) {
    markInvalid('asmt-rollNo', 'asmt-rollNo-error', 'Roll number is required');
    valid = false;
  } else if (!/^\d+$/.test(rollNo)) {
    markInvalid('asmt-rollNo', 'asmt-rollNo-error', 'Roll number must contain only digits');
    valid = false;
  }

  if (!score) {
    markInvalid('asmt-score', 'asmt-score-error', 'Score is required');
    valid = false;
  } else if (parseFloat(score) < 0) {
    markInvalid('asmt-score', 'asmt-score-error', 'Score cannot be negative');
    valid = false;
  } else if (parseFloat(score) > parseFloat(maxScore)) {
    markInvalid('asmt-score', 'asmt-score-error', `Score cannot exceed ${maxScore}`);
    valid = false;
  }

  if (!maxScore) {
    markInvalid('asmt-maxScore', 'asmt-maxScore-error', 'Max score is required');
    valid = false;
  } else if (parseFloat(maxScore) <= 0) {
    markInvalid('asmt-maxScore', 'asmt-maxScore-error', 'Max score must be greater than 0');
    valid = false;
  }

  if (!date) {
    markInvalid('asmt-date', 'asmt-date-error', 'Date is required');
    valid = false;
  }

  if (feedback.length > 500) {
    const errEl = document.getElementById('asmt-feedback-error');
    if (errEl) { errEl.textContent = 'Feedback must be 500 characters or less'; errEl.classList.remove('d-none'); }
    valid = false;
  }

  if (!valid) return;

  showEl('assessment-success-alert');
  document.getElementById('assessment-submit-btn').disabled = true;

  setTimeout(() => {
    hideEl('assessment-success-alert');
    document.getElementById('assessment-form').reset();
    document.getElementById('asmt-date').value = today();
    document.getElementById('asmt-maxScore').value = '100';
    setText('asmt-percentage', '0%');
    setText('asmt-feedback-counter', '0/500 characters');
    document.getElementById('assessment-submit-btn').disabled = false;
  }, 2000);
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

  // Recent Assessments
  const assessmentsHtml = student.recentAssessments.map(a => `
    <div class="assessment-item">
      <div>
        <p class="fw-medium small mb-0">${a.type}</p>
        <p class="text-muted" style="font-size:0.75rem;margin-bottom:0">${a.subject} &bull; ${a.date}</p>
      </div>
      <div class="fs-5 fw-bold ${performanceColor(a.score)}">${a.score}%</div>
    </div>
  `).join('');
  setHTML('mon-details-assessments', assessmentsHtml);

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
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initDashboard();
  initMarksForm();
  initAttendanceForm();
  initAssessmentForm();
  initMonitor();
  initMessageForm();
});
