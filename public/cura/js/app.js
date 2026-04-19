/* ════════════════════════════════════════════════
   CURA — App Dashboard Behaviour (Bootstrap-aware)
══════════════════════════════════════════════════ */

let currentRole = sessionStorage.getItem('cura_role') || 'doctor';
if (!USERS[currentRole]) currentRole = 'doctor';

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
  document.getElementById('sRoleIcon').textContent = u.icon;
  document.getElementById('sRoleName').textContent = u.label;
  document.getElementById('sUserName').textContent = u.name;
  document.getElementById('topbarAv').textContent  = u.name.charAt(0).toUpperCase();

  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  NAV_CONFIG[currentRole].forEach(item => {
    if (item.section) {
      nav.innerHTML += `<div class="nav-section-label">${item.section}</div>`;
    } else {
      nav.innerHTML += `<div class="nav-item" id="nav-${item.id}" onclick="showPanel('${currentRole}','${item.id}')"><span class="ni">${item.icon}</span>${item.label}</div>`;
    }
  });

  const dt = document.getElementById('vitalsDateTime');
  if (dt) dt.value = new Date().toISOString().slice(0,16);
  const rd = document.getElementById('rxDate');
  if (rd) rd.value = new Date().toISOString().slice(0,10);

  showPanel(currentRole, 'dashboard');
}

function showPanel(role, id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const p = document.getElementById(`panel-${role}-${id}`);
  if (p) p.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const ni = document.getElementById(`nav-${id}`);
  if (ni) ni.classList.add('active');
  document.getElementById('topbarTitle').textContent = PANEL_LABELS[id] || id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
  showToast('Vitals submitted & synced to doctor dashboard', '📡');
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
    <div class="col-md-4"><label class="form-label">Medicine Name</label><input class="form-control" placeholder="e.g. Medicine 5mg"/></div>
    <div class="col-md-4"><label class="form-label">Dosage</label><input class="form-control" placeholder="e.g. 1 tablet"/></div>
    <div class="col-md-4"><label class="form-label">Frequency</label><select class="form-select"><option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>As needed</option><option>At bedtime</option></select></div>`;
  list.appendChild(div);
}
function savePrescription() {
  showToast('Prescription #PRX-00' + Math.floor(Math.random()*90+10) + ' issued & sent to patient', '💊');
}

// ── CHAT ──
function sendChat(role) {
  const inputId = role === 'patient' ? 'patientChatInput' : 'doctorChatInput';
  const areaId  = role === 'patient' ? 'patientChatArea'  : 'doctorChatArea';
  const input = document.getElementById(inputId);
  const area  = document.getElementById(areaId);
  if (!input || !area) return;
  const text = input.value.trim();
  if (!text) return;
  const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const div = document.createElement('div');
  div.className = 'msg msg-out';
  div.innerHTML = `${text}<div class="msg-time">${now}</div>`;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  input.value = '';

  setTimeout(() => {
    const replies = ["Got it — let me check.","Thanks for the update.","I'll respond shortly.","Noted. Please monitor."];
    const r = document.createElement('div');
    r.className = 'msg msg-in';
    const t2 = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    r.innerHTML = `${replies[Math.floor(Math.random()*replies.length)]}<div class="msg-time">${t2}</div>`;
    area.appendChild(r);
    area.scrollTop = area.scrollHeight;
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

// ── TASKS ──
function toggleTask(el) {
  el.classList.toggle('done');
  const label = el.querySelector('.task-label');
  if (el.classList.contains('done')) {
    label.style.textDecoration = 'line-through';
    label.style.color = 'var(--text3)';
    showToast('Task completed', '✅');
  } else {
    label.style.textDecoration = 'none';
    label.style.color = 'var(--text)';
  }
}

// ── TOAST ──
function showToast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent  = msg;
  document.getElementById('toastIcon').textContent = icon;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  boot();
});
