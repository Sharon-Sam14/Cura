/* ════════════════════════════════════════════════
   CURA — Public Pages JS (Bootstrap modal, contact, toast)
   Authors: Sharon · Aaron · Sam
══════════════════════════════════════════════════ */

let selectedLoginRole = null;
let _loginModalInstance = null;

function getLoginModal() {
  const el = document.getElementById('loginModal');
  if (!el || !window.bootstrap) return null;
  if (!_loginModalInstance) _loginModalInstance = new bootstrap.Modal(el);
  return _loginModalInstance;
}

function openLogin(role) {
  const modal = getLoginModal();
  if (!modal) { window.location.href = 'index.html#login'; return; }
  modal.show();
  if (role) pickRole(role);
}
function closeLogin() {
  const modal = getLoginModal();
  if (modal) modal.hide();
}
function pickRole(role) {
  selectedLoginRole = role;
  document.querySelectorAll('.role-select-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('rs-' + role);
  if (btn) btn.classList.add('selected');
  const err = document.getElementById('loginErr');
  if (err) err.style.display = 'none';
}
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPass').value.trim();
  const err   = document.getElementById('loginErr');
  if (!selectedLoginRole) { err.textContent = '⚠ Please select your role.'; err.style.display = 'block'; return; }
  if (!email || !pass) { err.textContent = '⚠ Please enter your email and password.'; err.style.display = 'block'; return; }
  sessionStorage.setItem('cura_role', selectedLoginRole);
  sessionStorage.setItem('cura_email', email);
  window.location.href = 'app.html';
}

// ── CONTACT FORM ──
function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('cfName')?.value.trim();
  const email = document.getElementById('cfEmail')?.value.trim();
  const msg = document.getElementById('cfMsg')?.value.trim();
  if (!name || !email || !msg) { showToast('Please fill in all required fields', '⚠'); return false; }
  showToast(`Thanks ${name.split(' ')[0]}! We'll reply within 24 hours.`, '✉');
  e.target.reset();
  return false;
}

// ── NEWSLETTER ──
function submitNewsletter(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type=email]').value.trim();
  if (!email) return false;
  showToast(`Subscribed: ${email}`, '🎉');
  e.target.reset();
  return false;
}

// ── TOAST ──
function showToast(msg, icon = '✅') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast-cura';
    t.innerHTML = `<span class="toast-icon" id="toastIcon">${icon}</span><span id="toastMsg">${msg}</span>`;
    document.body.appendChild(t);
  } else {
    document.getElementById('toastMsg').textContent  = msg;
    document.getElementById('toastIcon').textContent = icon;
  }
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

// ── SCROLL REVEAL ──
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.role-card, .feature-item, .team-card, .testi-card, .info-item, .pillar').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .55s ease, transform .55s ease';
    observer.observe(el);
  });
}

// ── ANIMATED COUNTERS ──
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) { requestAnimationFrame(tick); io.disconnect(); }
    });
    io.observe(el);
  });
}

// ── ACTIVE NAV ──
function initActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar.cura-nav .nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCounters();
  initActiveNav();
  if (window.location.hash === '#login') openLogin();
});
