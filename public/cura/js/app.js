/* ════════════════════════════════════════════════
   CURA — App Dashboard Behaviour (Bootstrap-aware)
   With localStorage persistence + mobile sidebar
══════════════════════════════════════════════════ */

let currentRole = sessionStorage.getItem('cura_role') || 'doctor';
if (!USERS[currentRole]) currentRole = 'doctor';

const ROLE_ICON_CLASS = {
  admin:   'bi-shield-fill-check',
  doctor:  'bi-clipboard2-pulse-fill',
  nurse:   'bi-heart-pulse-fill',
  patient: 'bi-person-fill',
};

const NAV_ICON_MAP = {
  dashboard:     'bi-speedometer2',
  users:         'bi-people-fill',
  reports:       'bi-bar-chart-fill',
  settings:      'bi-gear-fill',
  about:         'bi-info-circle-fill',
  analytics:     'bi-graph-up-arrow',
  patients:      'bi-hospital-fill',
  appointments:  'bi-calendar-event-fill',
  vitals:        'bi-activity',
  prescribe:     'bi-capsule',
  consult:       'bi-chat-dots-fill',
  prescriptions: 'bi-file-medical-fill',
  details:       'bi-person-vcard-fill',
  tasks:         'bi-check2-square',
};

let _addUserModalInstance = null;
function getAddUserModal() {
  const el = document.getElementById('addUserModal');
  if (!el || !window.bootstrap) return null;
  if (!_addUserModalInstance) _addUserModalInstance = new bootstrap.Modal(el);
  return _addUserModalInstance;
}

// ── BOOT ──
function boot() {
  const u = USERS[currentRole];
  const roleIcon = document.getElementById('sRoleIcon');
  if (roleIcon) roleIcon.innerHTML = `<i class="bi ${ROLE_ICON_CLASS[currentRole] || 'bi-person-circle'}"></i>`;
  document.getElementById('sRoleName').textContent = u.label;
  document.getElementById('sUserName').textContent = u.name;
  document.getElementById('topbarAv').textContent  = u.name.charAt(0).toUpperCase();

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  NAV_CONFIG[currentRole].forEach(item => {
    if (item.section) {
      nav.innerHTML += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      const iconCls = NAV_ICON_MAP[item.id] || 'bi-circle';
      nav.innerHTML += `<div class="nav-item" id="nav-${item.id}" onclick="showPanel('${currentRole}','${item.id}')"><span class="ni"><i class="bi ${iconCls}"></i></span>${item.label}</div>`;
    }
  });

  const dt = document.getElementById('vitalsDateTime');
  if (dt) dt.value = new Date().toISOString().slice(0,16);
  const rd = document.getElementById('rxDate');
  if (rd) rd.value = new Date().toISOString().slice(0,10);

  // Restore persisted task states
  hydrateTasks();
  // Restore persisted chats
  hydrateChats();
  // Render persisted prescriptions list (patient)
  hydratePatientPrescriptions();

  const last = (window.CuraStore && CuraStore.getPref('lastPanel')) || 'dashboard';
  showPanel(currentRole, last);
}

function showPanel(role, id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const p = document.getElementById(`panel-${role}-${id}`);
  if (p) p.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const ni = document.getElementById(`nav-${id}`);
  if (ni) ni.classList.add('active');
  document.getElementById('topbarTitle').textContent = PANEL_LABELS[id] || id;
  if (window.CuraStore) CuraStore.setPref('lastPanel', id);
  // Calendar hooks
  if (id === 'appointments' && role === 'patient' && window.CuraCalendar) {
    requestAnimationFrame(() => window.CuraCalendar.init());
  }
  if (id === 'appointments' && role === 'doctor' && window.CuraCalendar) {
    requestAnimationFrame(() => window.CuraCalendar.refreshDoctor());
  }
  // Auto-close mobile sidebar on nav
  if (window.matchMedia('(max-width: 880px)').matches) toggleSidebar(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── MOBILE SIDEBAR TOGGLE ──
function toggleSidebar(force) {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  if (!sb || !bd) return;
  const willOpen = typeof force === 'boolean' ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', willOpen);
  bd.classList.toggle('show', willOpen);
}

function doLogout() {
  sessionStorage.removeItem('cura_role');
  sessionStorage.removeItem('cura_email');
  window.location.href = 'index.html';
}

// ── VITALS ──
function classifyVital(input, min, max) {
  const v = parseFloat(input.value);
  input.classList.remove('ok','warn','crit');
  if (isNaN(v)) return;
  if (v >= min && v <= max) input.classList.add('ok');
  else if (v < min * 0.85 || v > max * 1.15) input.classList.add('crit');
  else input.classList.add('warn');
}
function saveVitals() {
  const get = id => document.getElementById(id)?.value || '';
  if (window.CuraStore) {
    CuraStore.addVitals({
      patient: 'Rajan Kumar',
      dateTime: get('vitalsDateTime'),
      bpSys: get('bpSys'), bpDia: get('bpDia'),
      hr: get('heartRate'), temp: get('temp'),
      spo2: get('spo2'), rr: get('rr'),
      glucose: get('glucose'), weight: get('weight'),
      notes: get('nurseNotes'),
    });
  }
  showToast('Vitals submitted & saved locally', '📡');
  clearVitals();
}
function clearVitals() {
  ['bpSys','bpDia','heartRate','temp','spo2','rr','glucose','weight','nurseNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('ok','warn','crit'); }
  });
}

// ── PRESCRIPTION ──
function addMed() {
  const list = document.getElementById('medList');
  const div = document.createElement('div');
  div.className = 'row g-3 mb-3 med-entry';
  div.innerHTML = `
    <div class="col-md-4"><label class="form-label">Medicine Name</label><input class="form-control med-name-input" placeholder="e.g. Medicine 5mg"/></div>
    <div class="col-md-4"><label class="form-label">Dosage</label><input class="form-control med-dose-input" placeholder="e.g. 1 tablet"/></div>
    <div class="col-md-4"><label class="form-label">Frequency</label><select class="form-select med-freq-input"><option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>As needed</option><option>At bedtime</option></select></div>`;
  list.appendChild(div);
}
function savePrescription() {
  const meds = [];
  document.querySelectorAll('#medList .med-entry').forEach(row => {
    const name = row.querySelector('input:nth-of-type(1)')?.value || '';
    const dose = row.querySelectorAll('input')[1]?.value || '';
    const freq = row.querySelector('select')?.value || '';
    if (name) meds.push({ name, dose, freq });
  });
  let id = 'PRX-' + String(Math.floor(Math.random()*9000)+1000);
  if (window.CuraStore) {
    const rec = CuraStore.addPrescription({
      patient: 'Rajan Kumar',
      date: document.getElementById('rxDate')?.value || new Date().toISOString().slice(0,10),
      meds,
    });
    id = rec.id;
    hydratePatientPrescriptions();
  }
  showToast('Prescription #' + id + ' issued & saved', '💊');
}

// Re-render patient prescriptions panel from store
function hydratePatientPrescriptions() {
  const panel = document.getElementById('panel-patient-prescriptions');
  if (!panel || !window.CuraStore) return;
  const stored = CuraStore.getPrescriptions('Rajan Kumar');
  if (!stored.length) return;
  // Find first card and prepend new ones
  const host = panel.querySelector('.card.cura-card')?.parentElement;
  if (!host) return;
  // Avoid duplicating: tag with data attribute
  panel.querySelectorAll('[data-cura-rx]').forEach(n => n.remove());
  stored.slice(0, 5).forEach(rx => {
    const wrap = document.createElement('div');
    wrap.setAttribute('data-cura-rx', rx.id);
    wrap.innerHTML = `
      <div class="card cura-card">
        <div class="card-header">
          <div><div style="font-weight:700;font-size:15px">Prescription #${rx.id}</div>
          <div style="font-size:12px;color:var(--text2)">Saved locally · ${new Date(rx.ts).toLocaleString()}</div></div>
          <button class="btn btn-cura-ghost btn-sm" onclick="printPrescription('${rx.id}')"><i class="bi bi-printer"></i> Print</button>
        </div>
        <div class="card-body">
          ${(rx.meds||[]).map(m => `<div class="med-row"><span class="med-name">${m.name}</span><span class="med-dose">${m.dose}</span><span class="med-freq">${m.freq}</span></div>`).join('') || '<div style="color:var(--text3);font-size:12.5px">No medications recorded</div>'}
        </div>
      </div>`;
    host.insertBefore(wrap, host.firstChild?.nextSibling || null);
  });
}

function printPrescription(id) {
  showToast('Opening print dialog…', '🖨');
  setTimeout(() => window.print(), 200);
}

// ── CHAT (with persistence) ──
function chatConvKey(role) {
  return role === 'patient' ? 'patient-doctor' : 'doctor-rajan';
}
function appendChatMsg(areaId, msg) {
  const area = document.getElementById(areaId);
  if (!area) return;
  const time = new Date(msg.ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const div = document.createElement('div');
  div.className = 'msg msg-' + (msg.from === 'me' ? 'out' : 'in');
  div.innerHTML = `${msg.text}<div class="msg-time">${time}</div>`;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}
function hydrateChats() {
  if (!window.CuraStore) return;
  ['patientChatArea', 'doctorChatArea'].forEach(areaId => {
    const area = document.getElementById(areaId);
    if (!area) return;
    const role = areaId === 'patientChatArea' ? 'patient' : 'doctor';
    const stored = CuraStore.getMessages(chatConvKey(role));
    stored.forEach(m => appendChatMsg(areaId, m));
  });
}
function sendChat(role) {
  const inputId = role === 'patient' ? 'patientChatInput' : 'doctorChatInput';
  const areaId  = role === 'patient' ? 'patientChatArea'  : 'doctorChatArea';
  const input = document.getElementById(inputId);
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const msg = { from: 'me', text, ts: Date.now() };
  appendChatMsg(areaId, msg);
  if (window.CuraStore) CuraStore.addMessage(chatConvKey(role), msg);
  input.value = '';

  setTimeout(() => {
    const replies = ["Got it — let me check.","Thanks for the update.","I'll respond shortly.","Noted. Please monitor."];
    const r = { from: 'them', text: replies[Math.floor(Math.random()*replies.length)], ts: Date.now() };
    appendChatMsg(areaId, r);
    if (window.CuraStore) CuraStore.addMessage(chatConvKey(role), r);
  }, 1100);
}

// ── ADMIN ──
function openAddUserModal() {
  const m = getAddUserModal();
  if (m) m.show();
}
function addUser() {
  const name = document.getElementById('newUserName').value.trim();
  if (!name) { showToast('Please enter a name', '⚠'); return; }
  const role = document.getElementById('newUserRole').value;
  const dept = document.getElementById('newUserDept').value || '—';
  const cls  = { Doctor:'bg-cura-blue', Nurse:'bg-cura-purple', Patient:'bg-cura-amber' }[role];
  const table = document.getElementById('adminUserTable');
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><b>${name}</b></td><td><span class="badge ${cls}">${role}</span></td><td>${dept}</td><td><span class="badge bg-cura-green">Active</span></td><td><button class="btn btn-cura-ghost btn-sm">Edit</button></td>`;
  table.appendChild(tr);
  const m = getAddUserModal();
  if (m) m.hide();
  showToast(`User ${name} added successfully`, '✅');
}

// ── TASKS (persisted) ──
function taskIdFromEl(el) {
  // Use the task label text as a stable id
  const lbl = el.querySelector('.task-label')?.textContent?.trim() || '';
  return 't_' + btoa(unescape(encodeURIComponent(lbl))).slice(0, 16);
}
function applyTaskDoneStyles(el, done) {
  const label = el.querySelector('.task-label');
  const cb = el.querySelector('input[type="checkbox"]');
  if (cb) cb.checked = done;
  el.classList.toggle('done', done);
  if (label) {
    label.style.textDecoration = done ? 'line-through' : 'none';
    label.style.color = done ? 'var(--text3)' : 'var(--text)';
  }
}
function hydrateTasks() {
  if (!window.CuraStore) return;
  document.querySelectorAll('#panel-nurse-tasks .alert-card').forEach(el => {
    const id = taskIdFromEl(el);
    if (CuraStore.isTaskDone(id)) applyTaskDoneStyles(el, true);
  });
}
function toggleTask(el) {
  const id = taskIdFromEl(el);
  const isDone = !el.classList.contains('done');
  applyTaskDoneStyles(el, isDone);
  if (window.CuraStore) CuraStore.setTask(id, isDone);
  if (isDone) showToast('Task completed', '✅');
}

// ── TOAST ──
function showToast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  boot();
  // Close sidebar when ESC pressed (mobile)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleSidebar(false);
  });
});
