/* ════════════════════════════════════════════════
   CURA — Analytics (Chart.js visualizations)
   Patient · Nurse · Doctor (Admin excluded)
   + Date range filters (7d/30d/90d)
   + PDF export
   + Drill-down on triage chart
══════════════════════════════════════════════════ */

(function () {
  if (!window.Chart) return;

  const COLORS = {
    primary: '#7C9CFF',
    accent:  '#5EE6C2',
    accent2: '#FFB86B',
    accent3: '#A78BFA',
    accent4: '#F472B6',
    accent5: '#60A5FA',
    accent6: '#FBBF24',
    crit:    '#FB7185',
    warn:    '#F59E0B',
    ok:      '#34D399',
    text:    '#E6ECFF',
    text2:   '#9AA7C7',
    grid:    'rgba(154,167,199,0.15)',
  };

  Chart.defaults.color = COLORS.text2;
  Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
  Chart.defaults.borderColor = COLORS.grid;
  Chart.defaults.plugins.legend.labels.color = COLORS.text;

  const baseScales = () => ({
    x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text2 } },
    y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text2 } },
  });

  const instances = {};
  function mount(id, config) {
    const el = document.getElementById(id);
    if (!el) return;
    if (instances[id]) instances[id].destroy();
    instances[id] = new Chart(el, config);
  }

  // ── Range state per role ──
  const rangeState = { patient: 30, nurse: 30, doctor: 30 };

  function sliceForRange(arr, range) {
    const ratio = range / 90;
    const n = Math.max(3, Math.round(arr.length * ratio));
    return arr.slice(-n);
  }
  function labelsForRange(range) {
    if (range <= 7)  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    if (range <= 30) return Array.from({length:10},(_,i)=>'V'+(i+1));
    return ['Jan','Feb','Mar','Apr','May','Jun'];
  }

  // ── Build filter + export toolbar ──
  function injectToolbar(role) {
    const panel = document.getElementById(`panel-${role}-analytics`);
    if (!panel || panel.querySelector('.cura-analytics-toolbar')) return;
    const bar = document.createElement('div');
    bar.className = 'cura-analytics-toolbar d-flex flex-wrap gap-2 align-items-center mb-3';
    bar.innerHTML = `
      <div class="btn-group btn-group-sm" role="group" aria-label="Range">
        <button type="button" class="btn btn-cura-ghost cura-range-btn" data-range="7">7d</button>
        <button type="button" class="btn btn-cura-ghost cura-range-btn active" data-range="30">30d</button>
        <button type="button" class="btn btn-cura-ghost cura-range-btn" data-range="90">90d</button>
      </div>
      <div class="ms-auto d-flex gap-2">
        <button type="button" class="btn btn-cura-ghost btn-sm" data-action="print">
          <i class="bi bi-printer"></i> Print
        </button>
        <button type="button" class="btn btn-cura-primary btn-sm" data-action="pdf">
          <i class="bi bi-file-earmark-arrow-down"></i> Export PDF
        </button>
      </div>`;
    panel.insertBefore(bar, panel.firstChild);

    bar.querySelectorAll('.cura-range-btn').forEach(b => {
      b.addEventListener('click', () => {
        bar.querySelectorAll('.cura-range-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        rangeState[role] = parseInt(b.dataset.range, 10);
        renderRole(role);
      });
    });
    bar.querySelector('[data-action="pdf"]').addEventListener('click', () => exportAnalyticsPdf(role));
    bar.querySelector('[data-action="print"]').addEventListener('click', () => {
      panel.classList.add('print-active');
      setTimeout(() => { window.print(); panel.classList.remove('print-active'); }, 100);
    });
  }

  // ── PDF Export ──
  async function exportAnalyticsPdf(role) {
    if (!window.jspdf) { showToastSafe('PDF library not loaded', '⚠'); return; }
    const { jsPDF } = window.jspdf;
    const panel = document.getElementById(`panel-${role}-analytics`);
    if (!panel) return;
    showToastSafe('Generating PDF…', '📄');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    let y = 40;

    // Header
    doc.setFillColor(15, 23, 38); doc.rect(0, 0, W, 70, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
    doc.text('Cura — Analytics Report', 30, 36);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(`${role.charAt(0).toUpperCase()+role.slice(1)} dashboard · Range: ${rangeState[role]}d · ${new Date().toLocaleString()}`, 30, 56);
    y = 100;

    // Render each chart canvas to image
    const canvases = panel.querySelectorAll('canvas');
    for (const c of canvases) {
      const img = c.toDataURL('image/png', 1.0);
      const ratio = c.height / c.width;
      const w = W - 60;
      const h = w * ratio;
      if (y + h > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 40; }
      const card = c.closest('.card');
      const title = card?.querySelector('.card-title')?.textContent || '';
      if (title) {
        doc.setTextColor(20,20,20); doc.setFontSize(12); doc.setFont('helvetica','bold');
        doc.text(title, 30, y); y += 14;
      }
      doc.addImage(img, 'PNG', 30, y, w, h);
      y += h + 24;
    }

    doc.setFontSize(9); doc.setTextColor(120,120,120);
    doc.text('Generated by Cura · Sharon, Aaron & Sam', 30, doc.internal.pageSize.getHeight() - 20);
    doc.save(`cura-${role}-analytics-${Date.now()}.pdf`);
    showToastSafe('PDF downloaded', '✅');
  }

  function showToastSafe(msg, icon) {
    if (typeof window.showToast === 'function') window.showToast(msg, icon);
  }

  // ── Drill-down modal ──
  function openDrilldown(title, rows) {
    let modal = document.getElementById('drilldownModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = 'drilldownModal';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content cura-modal">
            <div class="modal-header">
              <h5 class="modal-title-cura mb-0" id="ddTitle">Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="ddBody"></div>
            <div class="modal-footer"><button class="btn btn-cura-ghost" data-bs-dismiss="modal">Close</button></div>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    modal.querySelector('#ddTitle').textContent = title;
    modal.querySelector('#ddBody').innerHTML = `
      <table class="table cura-table mb-0">
        <thead><tr><th>Patient</th><th>Room</th><th>Condition</th><th>Status</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td><b>${r.name}</b></td><td>${r.room}</td><td>${r.cond}</td><td><span class="badge ${r.badge}">${r.status}</span></td></tr>`).join('')}</tbody>
      </table>`;
    new bootstrap.Modal(modal).show();
  }

  const TRIAGE_PATIENTS = {
    Emergency: [
      { name:'Rajan Kumar',  room:'304-A', cond:'Hypertensive crisis', status:'Critical', badge:'bg-cura-red' },
      { name:'Vinod Menon',  room:'ICU-2',  cond:'Acute chest pain',    status:'Critical', badge:'bg-cura-red' },
    ],
    Urgent: [
      { name:'Meera Pillai', room:'210-B', cond:'Asthma exacerbation', status:'Monitor',  badge:'bg-cura-amber' },
    ],
    Routine: [
      { name:'Saji Thomas',   room:'115-C', cond:'Diabetes Type 2',  status:'Stable', badge:'bg-cura-green' },
      { name:'Anita George',  room:'402-D', cond:'Migraine',         status:'Stable', badge:'bg-cura-green' },
      { name:'Lakshmi Iyer',  room:'301-B', cond:'Routine BP review',status:'Stable', badge:'bg-cura-green' },
      { name:'Suresh Pillai', room:'208-A', cond:'Post-op recovery', status:'Stable', badge:'bg-cura-green' },
      { name:'Kavya R.',      room:'410-C', cond:'Wellness check',   status:'Stable', badge:'bg-cura-green' },
    ],
  };

  // ─────────────────── PATIENT ───────────────────
  function renderPatient() {
    const range = rangeState.patient;
    const visits = labelsForRange(range);
    const hr  = sliceForRange([88,84,90,82,86,80,78,82,79,82,84,80,78,82], visits.length);
    const sp  = sliceForRange([96,97,95,97,98,97,98,98,97,98,98,97,99,98], visits.length);
    const bp  = sliceForRange([148,145,150,142,138,140,135,138,134,132,130,128,126,128], visits.length);

    mount('patVitalsChart', {
      type: 'line',
      data: { labels: visits, datasets: [
        { label:'Heart Rate (bpm)', data:hr.slice(-visits.length), borderColor:COLORS.accent4, backgroundColor:COLORS.accent4+'33', tension:.35 },
        { label:'SpO₂ (%)',         data:sp.slice(-visits.length), borderColor:COLORS.accent,  backgroundColor:COLORS.accent+'33',  tension:.35 },
        { label:'Systolic BP',      data:bp.slice(-visits.length), borderColor:COLORS.crit,    backgroundColor:COLORS.crit+'33',    tension:.35 },
      ] },
      options: { responsive:true, maintainAspectRatio:false, scales: baseScales() },
    });

    mount('patRiskChart', {
      type: 'line',
      data: {
        labels: range <= 7 ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : range <= 30 ? ['W1','W2','W3','W4'] : ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Risk score (0–10)',
          data: range <= 7 ? [3.2,3.0,3.1,3.4,3.0,2.8,3.1] : range <= 30 ? [4.1,3.6,3.2,3.0] : [7.8,6.4,5.1,4.2,3.6,3.1],
          borderColor: COLORS.primary, backgroundColor: COLORS.primary+'33', fill:true, tension:.4,
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, scales: { ...baseScales(), y:{ ...baseScales().y, min:0, max:10 } } },
    });

    const heat = document.getElementById('patHeatmap');
    if (heat) {
      const symptoms = [
        { name:'Fatigue', color: COLORS.accent3 },
        { name:'Cough',   color: COLORS.accent5 },
        { name:'Fever',   color: COLORS.crit },
      ];
      const days = range;
      let html = '<div style="display:flex;flex-direction:column;gap:10px">';
      symptoms.forEach(s => {
        html += `<div><div style="font-size:12px;color:var(--text2);margin-bottom:6px">${s.name}</div><div style="display:grid;grid-template-columns:repeat(${Math.min(days,30)},1fr);gap:3px">`;
        for (let i=0;i<Math.min(days,30);i++){
          const intensity = Math.random();
          const alpha = intensity<.5?.08 : intensity<.75?.4 : intensity<.9?.7 : 1;
          html += `<div title="Day ${i+1}" style="aspect-ratio:1;border-radius:4px;background:${s.color};opacity:${alpha}"></div>`;
        }
        html += '</div></div>';
      });
      html += '</div>';
      heat.innerHTML = html;
    }

    const adh = document.getElementById('patAdherence');
    if (adh) {
      const meds = [
        { name:'Amlodipine 5mg',    pct:92 },
        { name:'Metformin 500mg',   pct:78 },
        { name:'Atorvastatin 10mg', pct:95 },
        { name:'Aspirin 75mg',      pct:64 },
      ];
      adh.innerHTML = meds.map(m => `
        <div class="mb-3">
          <div class="d-flex justify-content-between" style="font-size:13px"><span>${m.name}</span><span style="color:var(--text2)">${m.pct}%</span></div>
          <div class="progress mt-1" style="height:8px;background:rgba(154,167,199,0.15)">
            <div class="progress-bar" role="progressbar" style="width:${m.pct}%;background:${m.pct>=85?COLORS.ok:m.pct>=70?COLORS.warn:COLORS.crit}"></div>
          </div>
        </div>`).join('');
    }
  }

  // ─────────────────── NURSE ───────────────────
  function renderNurse() {
    const range = rangeState.nurse;
    const labels = range <= 7 ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] : range <= 30 ? ['W1','W2','W3','W4'] : ['M1','M2','M3'];

    mount('nurseTriageChart', {
      type: 'doughnut',
      data: {
        labels: ['Emergency','Urgent','Routine'],
        datasets: [{ data:[2,1,5], backgroundColor:[COLORS.crit, COLORS.warn, COLORS.ok], borderColor:'rgba(0,0,0,0)' }],
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'60%',
        onClick: (_, els) => {
          if (!els.length) return;
          const idx = els[0].index;
          const cat = ['Emergency','Urgent','Routine'][idx];
          openDrilldown(`${cat} patients (${TRIAGE_PATIENTS[cat].length})`, TRIAGE_PATIENTS[cat]);
        },
        plugins: { tooltip: { callbacks: { afterLabel: () => 'Click to view patients' } } },
      },
    });

    mount('nurseRespChart', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Avg response time (min)',
          data: labels.map(() => +(2.5 + Math.random()*2).toFixed(1)),
          borderColor: COLORS.accent5, backgroundColor: COLORS.accent5+'33', tension:.4, fill:true,
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, scales: baseScales() },
    });

    mount('nurseTaskRing', {
      type: 'doughnut',
      data: { labels:['Completed','Pending'], datasets:[{ data:[17,5], backgroundColor:[COLORS.accent,'rgba(154,167,199,0.18)'], borderColor:'rgba(0,0,0,0)' }] },
      options: { responsive:false, maintainAspectRatio:false, cutout:'72%', plugins:{ legend:{ position:'bottom' } } },
    });

    mount('nurseSymptomChart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label:'Fever',   data: labels.map(() => Math.floor(Math.random()*5)), backgroundColor: COLORS.crit },
          { label:'Cough',   data: labels.map(() => Math.floor(Math.random()*4)), backgroundColor: COLORS.accent5 },
          { label:'Fatigue', data: labels.map(() => Math.floor(Math.random()*3)), backgroundColor: COLORS.accent3 },
        ],
      },
      options: { responsive:true, maintainAspectRatio:false, scales:{ ...baseScales(), x:{ ...baseScales().x, stacked:true }, y:{ ...baseScales().y, stacked:true } } },
    });
  }

  // ─────────────────── DOCTOR ───────────────────
  function renderDoctor() {
    mount('docTriageChart', {
      type: 'bar',
      data: {
        labels: ['Nurse Sarah','Nurse Michael','Nurse Maria','Nurse Priya'],
        datasets: [
          { label:'Emergency', data:[3,1,2,0], backgroundColor: COLORS.crit },
          { label:'Urgent',    data:[4,3,2,2], backgroundColor: COLORS.warn },
          { label:'Routine',   data:[8,11,9,12], backgroundColor: COLORS.ok },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        scales:{ ...baseScales(), x:{ ...baseScales().x, stacked:true }, y:{ ...baseScales().y, stacked:true } },
        onClick: (_, els) => {
          if (!els.length) return;
          const ds = els[0].datasetIndex;
          const cat = ['Emergency','Urgent','Routine'][ds];
          openDrilldown(`${cat} cases across all nurses`, TRIAGE_PATIENTS[cat]);
        },
        plugins: { tooltip: { callbacks: { afterLabel: () => 'Click to drill down' } } },
      },
    });

    mount('docOverrideChart', {
      type: 'doughnut',
      data: { labels:['Agreed with ML','Manual override'], datasets:[{ data:[87,13], backgroundColor:[COLORS.primary, COLORS.accent2], borderColor:'rgba(0,0,0,0)' }] },
      options: { responsive:true, maintainAspectRatio:false, cutout:'62%' },
    });

    mount('docConsultChart', {
      type: 'bar',
      data: { labels:['Emergency','Urgent','Routine'], datasets:[{ label:'Avg minutes', data:[22,12.4,6.8], backgroundColor:[COLORS.crit, COLORS.warn, COLORS.ok] }] },
      options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', scales: baseScales(), plugins:{ legend:{ display:false } } },
    });

    const rf = document.getElementById('docRiskFactors');
    if (rf) {
      const factors = [
        { name:'High Blood Pressure', pct:40 },
        { name:'Low SpO₂',            pct:28 },
        { name:'High Heart Rate',     pct:22 },
        { name:'Persistent Fever',    pct:18 },
        { name:'Chest Pain',          pct:12 },
      ];
      rf.innerHTML = factors.map(f => `
        <div class="mb-3">
          <div class="d-flex justify-content-between" style="font-size:13px"><span>${f.name}</span><span style="color:var(--text2)">${f.pct}%</span></div>
          <div class="progress mt-1" style="height:8px;background:rgba(154,167,199,0.15)">
            <div class="progress-bar" role="progressbar" style="width:${f.pct}%;background:${COLORS.primary}"></div>
          </div>
        </div>`).join('');
    }
  }

  function renderRole(role) {
    if (role === 'patient') renderPatient();
    else if (role === 'nurse') renderNurse();
    else if (role === 'doctor') renderDoctor();
  }

  // Hook into existing showPanel
  const _origShowPanel = window.showPanel;
  window.showPanel = function (role, id) {
    _origShowPanel(role, id);
    if (id !== 'analytics') return;
    requestAnimationFrame(() => {
      injectToolbar(role);
      renderRole(role);
    });
  };

  // Expose for debug
  window.CuraAnalytics = { renderRole, exportAnalyticsPdf };
})();
