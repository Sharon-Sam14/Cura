/* ════════════════════════════════════════════════
   CURA — Appointment Booking Calendar
   Patient: monthly grid → pick date → pick slot
   Doctor : agenda list of upcoming bookings
══════════════════════════════════════════════════ */

(function () {
  const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  const DOCTORS = ['Dr. Alisha Rao','Dr. Philip Mathew'];

  let viewYear, viewMonth; // 0-indexed month
  let selectedDate = null; // 'YYYY-MM-DD'

  function todayISO() { return new Date().toISOString().slice(0,10); }
  function pad(n) { return String(n).padStart(2,'0'); }
  function fmtDate(y,m,d) { return `${y}-${pad(m+1)}-${pad(d)}`; }

  function getBookings() {
    return (window.CuraStore && CuraStore.state.appointments) || [];
  }

  function renderCalendar() {
    const grid = document.getElementById('curaCalGrid');
    const head = document.getElementById('curaCalMonth');
    if (!grid || !head) return;

    const now = new Date(viewYear, viewMonth, 1);
    head.textContent = now.toLocaleString('en-US', { month:'long', year:'numeric' });

    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
    const today = todayISO();
    const bookedDates = new Set(getBookings().map(b => b.date));

    let html = '';
    ['S','M','T','W','T','F','S'].forEach(d => html += `<div class="cal-dow">${d}</div>`);
    for (let i=0; i<firstDay; i++) html += `<div></div>`;
    for (let d=1; d<=daysInMonth; d++) {
      const iso = fmtDate(viewYear, viewMonth, d);
      const isPast = iso < today;
      const isToday = iso === today;
      const isSel = iso === selectedDate;
      const isBooked = bookedDates.has(iso);
      const cls = ['cal-day'];
      if (isPast) cls.push('past');
      if (isToday) cls.push('today');
      if (isSel) cls.push('selected');
      if (isBooked) cls.push('booked');
      html += `<div class="${cls.join(' ')}" data-date="${iso}" ${isPast?'':'role="button"'}>
        ${d}${isBooked ? '<span class="cal-dot"></span>' : ''}
      </div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll('.cal-day:not(.past)').forEach(el => {
      el.addEventListener('click', () => {
        selectedDate = el.dataset.date;
        renderCalendar();
        renderSlots();
      });
    });
  }

  function renderSlots() {
    const host = document.getElementById('curaCalSlots');
    if (!host) return;
    if (!selectedDate) {
      host.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:30px 10px">Pick a date to see available slots</div>';
      return;
    }
    const bookings = getBookings();
    const taken = new Set(bookings.filter(b => b.date === selectedDate).map(b => b.time));
    let html = `<div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Slots for ${selectedDate}</div>`;
    html += '<div class="d-flex flex-wrap gap-2">';
    SLOTS.forEach(s => {
      const isTaken = taken.has(s);
      html += `<button class="btn btn-sm ${isTaken?'btn-cura-ghost':'btn-cura-primary'} cura-slot-btn" data-slot="${s}" ${isTaken?'disabled':''}>${s}${isTaken?' · Taken':''}</button>`;
    });
    html += '</div>';
    html += `<div class="row g-2 mt-3">
      <div class="col-md-7"><label class="form-label">Doctor</label><select id="curaApptDoctor" class="form-select form-select-sm">${DOCTORS.map(d => `<option>${d}</option>`).join('')}</select></div>
      <div class="col-md-5"><label class="form-label">Type</label><select id="curaApptType" class="form-select form-select-sm"><option>Follow-up</option><option>New Consult</option><option>Routine Check</option></select></div>
    </div>
    <button class="btn btn-cura-primary w-100 mt-3" id="curaConfirmAppt" disabled><i class="bi bi-check-circle"></i> Confirm Booking</button>`;
    host.innerHTML = html;

    let chosen = null;
    host.querySelectorAll('.cura-slot-btn:not(:disabled)').forEach(b => {
      b.addEventListener('click', () => {
        host.querySelectorAll('.cura-slot-btn').forEach(x => x.classList.replace('btn-cura-primary','btn-cura-ghost'));
        b.classList.replace('btn-cura-ghost','btn-cura-primary');
        chosen = b.dataset.slot;
        host.querySelector('#curaConfirmAppt').disabled = false;
      });
    });
    host.querySelector('#curaConfirmAppt').addEventListener('click', () => {
      if (!chosen) return;
      const doctor = host.querySelector('#curaApptDoctor').value;
      const type   = host.querySelector('#curaApptType').value;
      const rec = { id:'A_'+Date.now(), patient:'Rajan Kumar', doctor, date:selectedDate, time:chosen, type, ts:Date.now() };
      if (window.CuraStore) {
        CuraStore.state.appointments.unshift(rec);
        CuraStore.flush();
      }
      window.showToast && window.showToast(`Appointment booked: ${selectedDate} ${chosen}`, '📅');
      selectedDate = null;
      renderCalendar();
      renderSlots();
      renderUpcoming();
      renderDoctorAgenda();
    });
  }

  function renderUpcoming() {
    const host = document.getElementById('curaUpcomingList');
    if (!host) return;
    const today = todayISO();
    const upcoming = getBookings().filter(b => b.date >= today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    if (!upcoming.length) {
      host.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:14px 0">No upcoming bookings yet.</div>';
      return;
    }
    host.innerHTML = upcoming.slice(0,6).map(b => `
      <div class="appt-card mb-2">
        <div class="appt-time">${b.date} · ${b.time}</div>
        <div class="appt-patient">${b.doctor}</div>
        <div class="appt-meta">${b.type}</div>
        <div class="mt-2 d-flex gap-2">
          <span class="badge bg-cura-cyan">Confirmed</span>
          <button class="btn btn-cura-ghost btn-sm ms-auto" data-cancel="${b.id}"><i class="bi bi-x-circle"></i> Cancel</button>
        </div>
      </div>`).join('');
    host.querySelectorAll('[data-cancel]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.cancel;
        if (!window.CuraStore) return;
        CuraStore.state.appointments = CuraStore.state.appointments.filter(x => x.id !== id);
        CuraStore.flush();
        renderCalendar(); renderUpcoming(); renderDoctorAgenda();
        window.showToast && window.showToast('Appointment cancelled', '🗑');
      });
    });
  }

  function renderDoctorAgenda() {
    const host = document.getElementById('curaDoctorAgenda');
    if (!host) return;
    const today = todayISO();
    const items = getBookings().filter(b => b.date >= today).sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
    if (!items.length) {
      host.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:14px 0">No patient bookings yet.</div>';
      return;
    }
    host.innerHTML = `<table class="table cura-table mb-0">
      <thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Type</th><th>Status</th></tr></thead>
      <tbody>${items.map(b => `<tr>
        <td>${b.date}</td><td>${b.time}</td><td><b>${b.patient}</b></td><td>${b.type}</td>
        <td><span class="badge bg-cura-cyan">Confirmed</span></td></tr>`).join('')}</tbody></table>`;
  }

  // Public API used by app.html
  window.CuraCalendar = {
    init() {
      const now = new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      selectedDate = null;
      renderCalendar();
      renderSlots();
      renderUpcoming();
      renderDoctorAgenda();
    },
    prevMonth() {
      viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    },
    nextMonth() {
      viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    },
    refreshDoctor: renderDoctorAgenda,
    prefillSlot(date, doctor, type) {
      selectedDate = date;
      renderCalendar();
      renderSlots();
      setTimeout(() => {
        const sel = document.getElementById('curaApptDoctor');
        const ty  = document.getElementById('curaApptType');
        if (sel && doctor) sel.value = doctor;
        if (ty && type) ty.value = type;
      }, 30);
    },
  };
})();
