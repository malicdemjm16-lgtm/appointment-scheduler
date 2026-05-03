/**
 * Appointly — Appointment Scheduler
 * app.js — Core Logic & UI Controller
 */

/* ── State ──────────────────────────────────────────────────── */
let appointments = [];
let editId       = null;
let deleteId     = null;
let currentFilter = 'all';
let calYear, calMonth;
let miniCalYear, miniCalMonth;
const STORAGE_KEY = 'appointly_v3';
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_L   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_S   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ── Persistence ────────────────────────────────────────────── */
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    appointments = raw ? JSON.parse(raw) : [];
  } catch {
    appointments = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

/* ── Date Utilities ─────────────────────────────────────────── */
function todayStr() {
  const t = new Date();
  return toDateStr(t);
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function addDays(ds, n) {
  const d = new Date(ds + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function parseDateStr(ds) {
  const [y,m,d] = ds.split('-');
  return new Date(+y, +m-1, +d);
}

function fmtDisplayDate(ds) {
  if (!ds) return { day: '?', mon: '---', full: '' };
  const d = parseDateStr(ds);
  return {
    day:  d.getDate(),
    mon:  MONTHS[d.getMonth()].slice(0, 3).toUpperCase(),
    full: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  };
}

function fmtShortDate(ds) {
  if (!ds) return '—';
  const d = parseDateStr(ds);
  return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ── Scheduling Engine ──────────────────────────────────────── */
function priorityOrder(p) {
  return p === 'high' ? 0 : p === 'medium' ? 1 : 2;
}

function scheduleAll() {
  // Sort by priority then creation time
  const sorted = [...appointments].sort((a, b) => {
    const po = priorityOrder(a.priority) - priorityOrder(b.priority);
    return po !== 0 ? po : (a.createdAt - b.createdAt);
  });

  const usedDates = new Set();
  const today = todayStr();

  sorted.forEach(appt => {
    // Start from preferred date or today, whichever is later
    let candidate = appt.preferredDate || today;
    if (candidate < today) candidate = today;

    // Find next free slot
    while (usedDates.has(candidate)) {
      candidate = addDays(candidate, 1);
    }

    usedDates.add(candidate);
    const idx = appointments.findIndex(a => a.id === appt.id);
    if (idx !== -1) appointments[idx].scheduledDate = candidate;
  });

  save();
}

/* ── UI Helpers ─────────────────────────────────────────────── */
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function showToast(msg, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show';
  setTimeout(() => t.className = 'toast', 2400);
}

function buildPriorityTag(p) {
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };
  return `<span class="priority-tag tag-${p}">${labels[p]}</span>`;
}

function buildApptCard(appt, delay = 0) {
  const { day, mon } = fmtDisplayDate(appt.scheduledDate);
  const today = todayStr();
  const isToday = appt.scheduledDate === today;
  return `
    <div class="appt-card" style="animation-delay:${delay}ms">
      <div class="appt-card-date">
        <div class="appt-card-day">${day}</div>
        <div class="appt-card-mon">${mon}</div>
      </div>
      <div class="appt-card-body">
        <div class="appt-card-title">${esc(appt.title)}</div>
        ${appt.description ? `<div class="appt-card-desc">${esc(appt.description)}</div>` : ''}
        <div class="appt-card-meta">
          ${buildPriorityTag(appt.priority)}
          ${isToday ? '<span class="today-tag">Today</span>' : ''}
        </div>
      </div>
      <div class="appt-card-actions">
        <button class="icon-btn" title="Edit" onclick="openModal('${appt.id}')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M9 1.5l2.5 2.5-7.5 7.5H1.5v-2L9 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="icon-btn del" title="Delete" onclick="openDelModal('${appt.id}')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 3h9M5 3V2h3v1M3.5 3l.5 7.5h5L9.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>`;
}

/* ── Modal ──────────────────────────────────────────────────── */
function openModal(id = null) {
  editId = id;
  document.getElementById('modal-title').textContent = id ? 'Edit Appointment' : 'New Appointment';
  document.getElementById('err-title').classList.remove('show');

  if (id) {
    const a = appointments.find(x => x.id === id);
    if (!a) return;
    document.getElementById('f-title').value    = a.title;
    document.getElementById('f-desc').value     = a.description || '';
    document.getElementById('f-date').value     = a.preferredDate || '';
    document.getElementById('f-priority').value = a.priority;
  } else {
    document.getElementById('f-title').value    = '';
    document.getElementById('f-desc').value     = '';
    document.getElementById('f-date').value     = '';
    document.getElementById('f-priority').value = 'medium';
  }

  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('f-title').focus(), 120);
}

function closeModal() {
  document.getElementById('overlay').classList.remove('open');
  editId = null;
}

function closeOnOverlay(e) {
  if (e.target === document.getElementById('overlay')) closeModal();
}

function saveAppointment() {
  const title    = document.getElementById('f-title').value.trim();
  const desc     = document.getElementById('f-desc').value.trim();
  const date     = document.getElementById('f-date').value;
  const priority = document.getElementById('f-priority').value;

  const errTitle = document.getElementById('err-title');
  if (!title) {
    errTitle.classList.add('show');
    document.getElementById('f-title').focus();
    return;
  }
  errTitle.classList.remove('show');

  if (editId) {
    const idx = appointments.findIndex(a => a.id === editId);
    if (idx !== -1) {
      appointments[idx] = { ...appointments[idx], title, description: desc, preferredDate: date, priority };
    }
  } else {
    appointments.push({
      id:            String(Date.now()),
      title,
      description:   desc,
      preferredDate: date,
      priority,
      createdAt:     Date.now(),
      scheduledDate: ''
    });
  }

  scheduleAll();
  closeModal();
  render();
  showToast(editId ? '✓ Appointment updated' : '✓ Appointment scheduled');
}

/* ── Delete Modal ───────────────────────────────────────────── */
function openDelModal(id) {
  deleteId = id;
  document.getElementById('del-overlay').classList.add('open');
}

function closeDelModal() {
  document.getElementById('del-overlay').classList.remove('open');
  deleteId = null;
}

function closeDelOnOverlay(e) {
  if (e.target === document.getElementById('del-overlay')) closeDelModal();
}

function confirmDelete() {
  if (!deleteId) return;
  appointments = appointments.filter(a => a.id !== deleteId);
  scheduleAll();
  closeDelModal();
  render();
  showToast('Appointment deleted');
}

/* ── View Switching ─────────────────────────────────────────── */
function switchView(viewName, linkEl) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  // Hide all views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');

  // Update header
  const titles = { dashboard: 'Dashboard', calendar: 'Calendar', list: 'All Appointments' };
  const subs   = { dashboard: 'Your upcoming schedule at a glance', calendar: 'Monthly view of your scheduled appointments', list: 'Manage all your appointments' };
  document.getElementById('page-title').textContent = titles[viewName];
  document.getElementById('page-sub').textContent   = subs[viewName];

  // Render specific view
  if (viewName === 'calendar') renderFullCalendar();
  if (viewName === 'list')     renderListView();
}

/* ── Stats ──────────────────────────────────────────────────── */
function renderStats() {
  document.getElementById('s-total').textContent  = appointments.length;
  document.getElementById('s-high').textContent   = appointments.filter(a => a.priority === 'high').length;
  document.getElementById('s-medium').textContent = appointments.filter(a => a.priority === 'medium').length;
  document.getElementById('s-low').textContent    = appointments.filter(a => a.priority === 'low').length;
}

/* ── Upcoming List ──────────────────────────────────────────── */
function renderUpcoming() {
  const el = document.getElementById('upcoming-list');
  const today = todayStr();

  const sorted = [...appointments]
    .filter(a => a.scheduledDate >= today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  if (!sorted.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">No appointments yet</div>
        <div class="empty-sub">Click "New Appointment" to get started</div>
      </div>`;
    return;
  }

  el.innerHTML = sorted
    .map((a, i) => buildApptCard(a, i * 30))
    .join('');
}

/* ── Mini Calendar ──────────────────────────────────────────── */
function buildMiniCalendar(year, month) {
  const el = document.getElementById('mini-cal');
  document.getElementById('mini-cal-month').textContent = `${MONTHS[month]} ${year}`;

  const today = todayStr();
  const apptMap = {};
  appointments.forEach(a => { if (a.scheduledDate) apptMap[a.scheduledDate] = a.priority; });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  let html = `<div class="mini-cal-daynames">${DAYS_S.map(d => `<div class="mini-cal-dayname">${d}</div>`).join('')}</div><div class="mini-cal-grid">`;

  const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let i = 0; i < total; i++) {
    let day, ds, other = false;
    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1;
      ds  = toDateStr(new Date(year, month - 1, day));
      other = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      ds  = toDateStr(new Date(year, month + 1, day));
      other = true;
    } else {
      day = i - firstDay + 1;
      ds  = toDateStr(new Date(year, month, day));
    }

    const isToday = ds === today;
    const priority = apptMap[ds];
    let cls = 'mini-cal-cell';
    if (other)    cls += ' other-month';
    if (isToday)  cls += ' today';
    if (priority) cls += ` has-appt has-${priority}`;

    html += `<div class="${cls}">${day}</div>`;
  }

  html += '</div>';
  el.innerHTML = html;
}

function miniCalPrev() {
  miniCalMonth--;
  if (miniCalMonth < 0) { miniCalMonth = 11; miniCalYear--; }
  buildMiniCalendar(miniCalYear, miniCalMonth);
}

function miniCalNext() {
  miniCalMonth++;
  if (miniCalMonth > 11) { miniCalMonth = 0; miniCalYear++; }
  buildMiniCalendar(miniCalYear, miniCalMonth);
}

/* ── Full Calendar ──────────────────────────────────────────── */
function renderFullCalendar() {
  const now = new Date();
  if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }

  document.getElementById('cal-full-month').textContent = `${MONTHS[calMonth]} ${calYear}`;

  // Day names
  const dnEl = document.getElementById('cal-full-daynames');
  dnEl.innerHTML = DAYS_S.map(d => `<div class="cal-full-dayname">${d}</div>`).join('');

  const today     = todayStr();
  const apptMap   = {};
  appointments.forEach(a => { if (a.scheduledDate) apptMap[a.scheduledDate] = a; });

  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calYear, calMonth, 0).getDate();
  const total       = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  let html = '';
  for (let i = 0; i < total; i++) {
    let day, ds, other = false;
    if (i < firstDay) {
      day = daysInPrev - firstDay + i + 1;
      ds  = toDateStr(new Date(calYear, calMonth - 1, day));
      other = true;
    } else if (i >= firstDay + daysInMonth) {
      day = i - firstDay - daysInMonth + 1;
      ds  = toDateStr(new Date(calYear, calMonth + 1, day));
      other = true;
    } else {
      day = i - firstDay + 1;
      ds  = toDateStr(new Date(calYear, calMonth, day));
    }

    const isToday = ds === today;
    const appt    = apptMap[ds];

    html += `<div class="cal-full-cell${other ? ' other-month' : ''}${isToday ? ' today' : ''}">
      <div class="cal-full-num">${day}</div>
      ${appt ? `<div class="cal-chip chip-${appt.priority}" title="${esc(appt.title)}" onclick="openModal('${appt.id}')">${esc(appt.title)}</div>` : ''}
    </div>`;
  }

  document.getElementById('cal-full-grid').innerHTML = html;
}

function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderFullCalendar();
}

function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderFullCalendar();
}

/* ── List View ──────────────────────────────────────────────── */
function setFilter(f, btn) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderListView();
}

function renderListView() {
  const search  = (document.getElementById('search-input')?.value || '').toLowerCase();
  const today   = todayStr();

  let filtered = [...appointments].filter(a => {
    if (currentFilter !== 'all' && a.priority !== currentFilter) return false;
    if (search && !a.title.toLowerCase().includes(search) && !(a.description || '').toLowerCase().includes(search)) return false;
    return true;
  }).sort((a, b) => {
    if (!a.scheduledDate && !b.scheduledDate) return 0;
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });

  const el = document.getElementById('list-table');

  if (!filtered.length) {
    el.innerHTML = `
      <div class="empty-state" style="border:1px solid var(--border);border-radius:var(--radius-lg)">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">${search ? 'No results found' : 'No appointments here'}</div>
        <div class="empty-sub">${search ? 'Try a different search term' : 'Add an appointment to get started'}</div>
      </div>`;
    return;
  }

  const rows = filtered.map((a, i) => {
    const isToday = a.scheduledDate === today;
    return `<div class="list-row" style="animation-delay:${i * 20}ms">
      <div class="list-row-date" style="font-size:12px">${fmtShortDate(a.scheduledDate)}</div>
      <div>
        <div class="list-row-title">${esc(a.title)}${isToday ? ' <span class="today-tag" style="font-size:10px">Today</span>':''}</div>
        <div class="list-row-desc">${esc(a.description || '—')}</div>
      </div>
      <div>${buildPriorityTag(a.priority)}</div>
      <div style="font-size:12px;color:var(--text-muted)">${fmtShortDate(a.preferredDate) || '—'}</div>
      <div class="list-row-actions">
        <button class="icon-btn" title="Edit" onclick="openModal('${a.id}')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5l2.5 2.5-7.5 7.5H1.5v-2L9 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn del" title="Delete" onclick="openDelModal('${a.id}')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M3.5 3l.5 7.5h5L9.5 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="list-table-wrap">
      <div class="list-table-head">
        <div>Date</div>
        <div>Title / Description</div>
        <div>Priority</div>
        <div>Preferred</div>
        <div style="text-align:right">Actions</div>
      </div>
      ${rows}
    </div>`;
}

/* ── Today Label ────────────────────────────────────────────── */
function setTodayLabel() {
  const d = new Date();
  const label = `${DAYS_L[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  document.getElementById('today-label').textContent = label;
}

/* ── Keyboard Shortcuts ─────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeDelModal();
  }
  if ((e.key === 'n' || e.key === 'N') && !document.getElementById('overlay').classList.contains('open')) {
    const active = document.activeElement;
    if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') {
      openModal();
    }
  }
  if (e.key === 'Enter' && document.getElementById('overlay').classList.contains('open')) {
    if (document.activeElement.tagName !== 'TEXTAREA') {
      saveAppointment();
    }
  }
});

/* ── Master Render ──────────────────────────────────────────── */
function render() {
  renderStats();
  renderUpcoming();
  buildMiniCalendar(miniCalYear, miniCalMonth);

  // Re-render active non-dashboard view
  const active = document.querySelector('.view.active');
  if (active?.id === 'view-calendar') renderFullCalendar();
  if (active?.id === 'view-list')     renderListView();
}

/* ── Init ───────────────────────────────────────────────────── */
(function init() {
  load();

  const now     = new Date();
  calYear       = now.getFullYear();
  calMonth      = now.getMonth();
  miniCalYear   = now.getFullYear();
  miniCalMonth  = now.getMonth();

  setTodayLabel();

  // Seed with sample data if empty
  if (appointments.length === 0) {
    const t = Date.now();
    appointments = [
      { id: '1', title: 'Annual Physical Exam', description: 'Fasting required from midnight', preferredDate: '', priority: 'high', createdAt: t, scheduledDate: '' },
      { id: '2', title: 'Tax Consultation', description: 'Bring receipts and prior returns', preferredDate: '', priority: 'high', createdAt: t + 1, scheduledDate: '' },
      { id: '3', title: 'Dentist Appointment', description: 'Regular 6-month checkup', preferredDate: '', priority: 'medium', createdAt: t + 2, scheduledDate: '' },
      { id: '4', title: 'Team Performance Review', description: 'Quarterly review with manager', preferredDate: '', priority: 'medium', createdAt: t + 3, scheduledDate: '' },
      { id: '5', title: 'Car Service & Oil Change', description: 'Scheduled maintenance at the dealership', preferredDate: '', priority: 'low', createdAt: t + 4, scheduledDate: '' },
    ];
    scheduleAll();
  }

  render();
})();
