/**
 * Student Performance Predictor
 * app.js — All interactive logic (Dashboard, Marks, Attendance, Assessments, Monitor)
 * Data is loaded dynamically from the Java Servlet API (/api/students)
 */

'use strict';

/* ============================================================
   SHARED DATA — loaded from Oracle DB via /api/students
   ============================================================ */
let students = [];           // Populated from API on load
let attendanceRecords = [];  // Built from API data

/* Monitor state */
let monitorSearchTerm = '';
let monitorFilterRiskOnly = false;
let monitorSelectedStudent = null;

/**
 * Fetch all students from the Java/Oracle backend.
 * Returns the student array or [] on failure.
 */
async function loadStudentsFromDB() {
  try {
    const res = await fetch('api/students');
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    // Normalise date field
    return data.map(s => ({
      ...s,
      lastUpdated: s.lastUpdated || new Date().toISOString().slice(0, 10),
      recentAssessments: s.recentAssessments || [],
      riskFactors: s.riskFactors || (s.status === 'at-risk' ? ['Low performance detected'] : []),
      // Store the original DB rate so we can always compute deltas correctly
      _baseAttendanceRate: s.attendanceRate,
    }));
  } catch (err) {
    console.error('Failed to load students from DB:', err);
    showApiError(err.message);
    return [];
  }
}

/** Show an error banner if the DB API fails */
function showApiError(msg) {
  const banner = document.createElement('div');
  banner.className = 'alert alert-danger m-3 position-fixed top-0 start-50 translate-middle-x z-3 shadow';
  banner.style.minWidth = '340px';
  banner.innerHTML = `<i class="bi bi-database-x me-2"></i><strong>Database Error:</strong> ${msg}.<br><small>Static data is NOT shown. Check that Oracle + Tomcat are running.</small>
    <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>`;
  document.body.prepend(banner);
}



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
  if (!tbody) return; // Dashboard was removed from index.html by user request

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
    <div class="col-12 mt-3">
      <p class="text-muted small mb-2 fw-medium">Recent Assessments:</p>
      ${student.recentAssessments && student.recentAssessments.length > 0 ? `
        <div class="table-responsive">
          <table class="table table-sm table-bordered text-center align-middle caption-top">
            <thead class="table-light">
              <tr>
                <th scope="col" style="font-size: 0.85rem">Date</th>
                <th scope="col" style="font-size: 0.85rem">Type</th>
                <th scope="col" style="font-size: 0.85rem">Subject</th>
                <th scope="col" style="font-size: 0.85rem">Score</th>
              </tr>
            </thead>
            <tbody>
              ${student.recentAssessments.map(a => `
                <tr style="font-size: 0.85rem">
                  <td class="text-muted">${a.date}</td>
                  <td class="text-capitalize">${a.type.replace('-', ' ')}</td>
                  <td class="text-capitalize">${a.subject}</td>
                  <td class="fw-medium">${a.score}/${a.maxScore} <span class="text-muted small">(${((a.score / a.maxScore) * 100).toFixed(1)}%)</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p class="text-muted small fst-italic">No assessments recorded recently.</p>'}
    </div>
  `);
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
  const grid = document.getElementById('attendance-grid');
  if (grid) {
    grid.innerHTML = '';
    attendanceRecords.forEach(rec => {
      // Extract short label from roll number (last 3 chars, e.g. "K01" from "24EG105K01")
      let label = rec.rollNo.slice(-3);
      if (rec.rollNo.includes('505K')) {
        label = 'LE' + rec.rollNo.slice(-2);
      }

      const box = document.createElement('div');
      box.id = `att-box-${rec.rollNo}`;
      box.title = `${rec.rollNo} — ${rec.studentName}`;
      box.style.cssText = `
        width: 64px; height: 64px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 10px; cursor: pointer;
        font-weight: 700; font-size: 0.85rem;
        user-select: none; transition: all 0.15s ease;
        border: 2px solid transparent;
      `;
      applyBoxStyle(box, rec.status);
      box.textContent = label;

      box.addEventListener('click', () => {
        const newStatus = rec.status === 'present' ? 'absent' : 'present';
        updateAttendanceStatus(rec.rollNo, newStatus);
        applyBoxStyle(box, newStatus);
      });

      grid.appendChild(box);
    });
  }
}

/** Apply green/red style to a single attendance box */
function applyBoxStyle(box, status) {
  if (status === 'present') {
    box.style.background = 'rgba(25, 135, 84, 0.2)';
    box.style.color = '#198754';
    box.style.borderColor = '#198754';
  } else {
    box.style.background = 'rgba(220, 53, 69, 0.2)';
    box.style.color = '#dc3545';
    box.style.borderColor = '#dc3545';
  }
}

function updateAttendanceStatus(rollNo, newStatus) {
  // 1. Update attendance record
  const rec = attendanceRecords.find(r => r.rollNo === rollNo);
  if (rec) rec.status = newStatus;
  updateAttendanceSummary();
  hideEl('attendance-records-error');

  // 2. Update this student's attendanceRate (per-student, not class-wide)
  const student = students.find(s => s.rollNo === rollNo);
  if (student) {
    const base = student._baseAttendanceRate ?? student.attendanceRate;
    student.attendanceRate = newStatus === 'absent'
      ? Math.max(0, Math.round(base - 3))
      : Math.round(base);

    // 3. Recalculate risk status
    if (student.attendanceRate < 60 || student.performanceScore < 45) {
      student.status = 'at-risk';
    } else if (student.attendanceRate >= 85 && student.performanceScore >= 75) {
      student.status = 'excellent';
    } else {
      student.status = 'average';
    }
  }

  // 4. Refresh dashboard
  refreshDashboard();
}

/** Redraws dashboard summary and table using current students[] state */
function refreshDashboard() {
  const total = students.length;
  const atRisk = students.filter(s => s.status === 'at-risk').length;
  const exc = students.filter(s => s.status === 'excellent').length;
  const avg = total > 0
    ? (students.reduce((sum, s) => sum + s.performanceScore, 0) / total).toFixed(1)
    : '0.0';

  setText('dash-total', total);
  setText('dash-atrisk', atRisk);
  setText('dash-excellent', exc);
  setText('dash-avg', avg + '%');
  setText('mon-total', total);
  setText('mon-atrisk', atRisk);
  setText('mon-excellent', exc);

  // Re-render dashboard table
  const tbody = document.getElementById('dashboard-tbody');
  if (tbody) {
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

  // Redraw the charts with fresh data
  initDashboardCharts(students);
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

  const submitBtn = document.getElementById('attendance-submit-btn');
  submitBtn.disabled = true;

  fetch('api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: date,
      records: attendanceRecords.map(r => ({ rollNo: r.rollNo, status: r.status }))
    })
  })
    .then(res => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status === 404) {
          throw new Error('Attendance API not found (404). Rebuild and redeploy the Java app so AttendanceApiServlet is included.');
        }
        return res.text().then(t => { throw new Error(res.status + ': ' + (t || res.statusText).slice(0, 80)); });
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert('Failed to save attendance: ' + data.error);
        submitBtn.disabled = false;
        return;
      }
      showEl('attendance-success-alert');
      setText('attendance-success-msg', `Attendance recorded successfully for ${date}!`);
      // Re-fetch students so dashboard shows updated attendance rates from DB
      return loadStudentsFromDB();
    })
    .then(freshStudents => {
      if (Array.isArray(freshStudents) && freshStudents.length > 0) {
        students = freshStudents;
        refreshDashboard();
        initDashboardCharts(students);
        initMonitor();
      }
      setTimeout(() => {
        hideEl('attendance-success-alert');
        submitBtn.disabled = false;
      }, 2000);
    })
    .catch(err => {
      console.error('Attendance submit error:', err);
      alert(err.message || 'Failed to save attendance. Check console.');
      submitBtn.disabled = false;
    });
}

/* ============================================================
   MARKS AND ASSESSMENT FORM
   ============================================================ */
function initMarksForm() {
  // Live percentage update
  ['marks-marksObtained', 'marks-maxMarks'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateMarksPercentage);
  });

  // Auto-set Max Score based on assessment type
  document.getElementById('marks-type')?.addEventListener('change', function () {
    const type = this.value;
    const maxScoreEl = document.getElementById('marks-maxMarks');
    if (type === 'final') {
      maxScoreEl.value = '50';
    } else if (type === 'assignment') {
      maxScoreEl.value = '10';
    } else {
      maxScoreEl.value = '20';
    }
    updateMarksPercentage();
  });

  document.getElementById('marks-form')?.addEventListener('submit', handleMarksSubmit);
}

function updateMarksPercentage() {
  const score = parseFloat(document.getElementById('marks-marksObtained').value) || 0;
  const maxScore = parseFloat(document.getElementById('marks-maxMarks').value) || 0;
  const pct = maxScore > 0 ? ((score / maxScore) * 100).toFixed(2) : '0';
  setText('marks-percentage', pct + '%');
}

function handleMarksSubmit(e) {
  e.preventDefault();
  const rollNo = document.getElementById('marks-rollNo').value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const score = document.getElementById('marks-marksObtained').value;
  const maxScore = document.getElementById('marks-maxMarks').value;

  ['marks-rollNo', 'marks-marksObtained', 'marks-maxMarks'].forEach(clearInvalid);

  let valid = true;



  if (!rollNo) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number is required');
    valid = false;
  } else if (!/^[a-zA-Z0-9]+$/.test(rollNo)) {
    markInvalid('marks-rollNo', 'marks-rollNo-error', 'Roll number must contain only letters and digits');
    valid = false;
  }

  if (!score) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', 'Score is required');
    valid = false;
  } else if (parseFloat(score) < 0) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', 'Score cannot be negative');
    valid = false;
  } else if (parseFloat(score) > parseFloat(maxScore)) {
    markInvalid('marks-marksObtained', 'marks-marksObtained-error', `Score cannot exceed ${maxScore}`);
    valid = false;
  }

  if (!maxScore) {
    markInvalid('marks-maxMarks', 'marks-maxMarks-error', 'Max score is required');
    valid = false;
  } else if (parseFloat(maxScore) <= 0) {
    markInvalid('marks-maxMarks', 'marks-maxMarks-error', 'Max score must be greater than 0');
    valid = false;
  }

  if (!valid) return;

  const submitBtn = document.getElementById('marks-submit-btn');
  submitBtn.disabled = true;

  fetch('api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rollNo: rollNo,
      assessmentType: document.getElementById('marks-type').value,
      subject: document.getElementById('marks-subject').value,
      score: score,
      maxScore: maxScore
    })
  })
    .then(res => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (res.status === 404) {
          throw new Error('Endpoint not found. Ensure Java backend is rebuilt/redeployed.');
        }
        return res.text().then(t => { throw new Error(res.status + ': ' + (t || res.statusText).slice(0, 80)); });
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert('Failed to save assessment: ' + data.error);
        submitBtn.disabled = false;
        return;
      }
      showEl('marks-success-alert');

      // Re-fetch students so dashboard shows updated performance/risk status from DB
      return loadStudentsFromDB();
    })
    .then(freshStudents => {
      if (Array.isArray(freshStudents) && freshStudents.length > 0) {
        students = freshStudents;
        refreshDashboard();
        initDashboardCharts(students);
        initMonitor();
      }
      setTimeout(() => {
        hideEl('marks-success-alert');
        document.getElementById('marks-form').reset();
        // Reset to default selection value of 20
        document.getElementById('marks-maxMarks').value = '20';
        setText('marks-percentage', '0%');
        submitBtn.disabled = false;
      }, 2000);
    })
    .catch(err => {
      console.error('Assessment submit error:', err);
      alert(err.message || 'Failed to save assessment. Check console.');
      submitBtn.disabled = false;
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
  console.log("Monitor TBody element:", tbody);
  tbody.innerHTML = '';
  console.log("Filtered students to render:", filtered.length);

  filtered.forEach(s => {
    console.log("Rendering student:", s.name, s.interventionNeeded);
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
  console.log("Monitor rendering complete.");
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

  // Group assessments by course
  const subjectMap = {};
  if (student.recentAssessments) {
    student.recentAssessments.forEach(a => {
      if (!subjectMap[a.subject]) {
        subjectMap[a.subject] = {
          courseCode: a.courseCode || 'N/A',
          'mid1': '-', 'mid2': '-', 'unit 1 test': '-', 'unit3 test': '-', 'final': '-', 'assignment': '-'
        };
      }

      const typeLower = a.type ? a.type.toLowerCase() : '';
      if (subjectMap[a.subject][typeLower] !== undefined) {
        // Evaluate true percentage for color coding
        const pct = a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0;
        subjectMap[a.subject][typeLower] = `<span class="${performanceColor(pct)} fw-bold">${a.score}</span>`;
      }
    });
  }

  let tableHtml = `
    <div class="table-responsive">
      <table class="table table-bordered table-striped align-middle mb-0 text-center" style="font-size: 0.9rem;">
        <thead class="table-dark" style="background-color: #1a2c4e; color: #fff;">
          <tr>
            <th style="width: 5%">S.No.</th>
            <th style="width: 15%">Course Code</th>
            <th class="text-start" style="width: 25%">Course Name</th>
            <th style="width: 9%">mid 1</th>
            <th style="width: 9%">mid 2</th>
            <th style="width: 9%">unit 1 test</th>
            <th style="width: 9%">unit 3 test</th>
            <th style="width: 9%">final exam</th>
            <th style="width: 10%">assignment</th>
          </tr>
        </thead>
        <tbody>
  `;

  const subjects = Object.keys(subjectMap).sort();
  if (subjects.length === 0) {
    tableHtml += `<tr><td colspan="9" class="text-muted py-3">No recent assessments available</td></tr>`;
  } else {
    subjects.forEach((subj, idx) => {
      const scores = subjectMap[subj];
      const data = subjectMap[subj];
      tableHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td class="fw-semibold text-secondary">${data.courseCode}</td>
          <td class="text-start fw-medium">${subj}</td>
          <td>${data['mid1']}</td>
          <td>${data['mid2']}</td>
          <td>${data['unit 1 test']}</td>
          <td>${data['unit3 test']}</td>
          <td>${data['final']}</td>
          <td>${data['assignment']}</td>
        </tr>
      `;
    });
  }
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
   DASHBOARD CHARTS
   ============================================================ */
function initDashboardCharts(studentData) {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const textColor = isDark ? '#adb5bd' : '#495057';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  // --- Derive data from student array ---
  const buckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
  let highRisk = 0, medRisk = 0, lowRisk = 0;
  studentData.forEach(s => {
    const p = s.performanceScore;
    if (p <= 20) buckets[0]++;
    else if (p <= 40) buckets[1]++;
    else if (p <= 60) buckets[2]++;
    else if (p <= 80) buckets[3]++;
    else buckets[4]++;

    if (s.status === 'at-risk') highRisk++;
    else if (s.status === 'average') medRisk++;
    else lowRisk++;
  });

  // --- 1. Bar Chart: Performance Distribution ---
  const ctxBar = document.getElementById('dash-bar-chart');
  if (ctxBar) {
    // destroy previous instance if exists
    if (window._dashBarChart) window._dashBarChart.destroy();
    window._dashBarChart = new Chart(ctxBar.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
        datasets: [{
          label: 'Students',
          data: buckets,
          backgroundColor: ['#dc3545cc', '#fd7e14cc', '#ffc107cc', '#198754cc', '#0d6efdcc'],
          borderWidth: 0,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} students` } }
        },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, beginAtZero: true },
          x: { grid: { display: false }, ticks: { color: textColor } }
        }
      }
    });
  }

  // --- 2. Doughnut Chart: Risk Levels ---
  const ctxPie = document.getElementById('dash-pie-chart');
  if (ctxPie) {
    if (window._dashPieChart) window._dashPieChart.destroy();
    window._dashPieChart = new Chart(ctxPie.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['At Risk', 'Average', 'Excellent'],
        datasets: [{
          data: [highRisk || 1, medRisk || 1, lowRisk || 1],
          backgroundColor: ['#dc3545', '#fd7e14', '#198754'],
          borderWidth: 0,
          cutout: '68%'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: textColor, padding: 10, font: { size: 11 } } }
        }
      }
    });
  }

  // --- 3. Line Chart: Attendance Trend (mock weekly trend) ---
  const ctxLine = document.getElementById('dash-line-chart');
  if (ctxLine) {
    if (window._dashLineChart) window._dashLineChart.destroy();
    const avgAtt = (studentData.reduce((s, x) => s + x.attendanceRate, 0) / (studentData.length || 1)).toFixed(1);
    window._dashLineChart = new Chart(ctxLine.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Now'],
        datasets: [{
          label: 'Avg Attendance %',
          data: [
            Math.max(0, avgAtt - 8), Math.max(0, avgAtt - 5),
            Math.max(0, avgAtt - 3), Math.max(0, avgAtt - 1),
            avgAtt - 0.5, avgAtt
          ].map(v => parseFloat(v).toFixed(1)),
          borderColor: '#0dcaf0',
          backgroundColor: 'rgba(13,202,240,0.12)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0dcaf0',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { grid: { color: gridColor }, ticks: { color: textColor }, min: 0, max: 100 },
          x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } }
        }
      }
    });
  }
}

/* ============================================================
   INIT — All rendering waits for live DB data
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initThemeToggle();
  initMarksForm();
  initMessageForm();

  // Show a loading spinner until DB data arrives
  const tbody = document.getElementById('dashboard-tbody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">
      <span class="spinner-border text-primary me-2" role="status"></span>Loading students from database...
    </td></tr>`;
  }

  // --- Fetch live data from Oracle via Java API ---
  students = await loadStudentsFromDB();

  // Build attendanceRecords from live student data
  attendanceRecords = students.map(s => ({
    rollNo: s.rollNo,
    studentName: s.name,
    status: 'present'   // default — teacher changes on the form
  }));

  // --- Render everything with real data ---
  try {
    console.log("Starting dashboard init");
    initDashboard();
    console.log("Starting chart init");
    initDashboardCharts(students);
    console.log("Starting monitor init");
    initMonitor();
    console.log("Starting attendance init");
    initAttendanceForm();
  } catch (err) {
    console.error("FATAL UI ERROR:", err);
    const errBanner = document.createElement('div');
    errBanner.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999;background:red;color:white;padding:20px;font-family:monospace;white-space:pre-wrap;';
    errBanner.innerHTML = `<h3>FATAL UI RENDER ERROR</h3>${err.toString()}<br><br>${err.stack}`;
    document.body.prepend(errBanner);
  }
});

