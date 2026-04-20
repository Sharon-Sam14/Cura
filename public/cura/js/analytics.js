/* ════════════════════════════════════════════════
   CURA — Analytics (Chart.js visualizations)
   Patient · Nurse · Doctor (Admin excluded)
══════════════════════════════════════════════════ */

(function () {
  if (!window.Chart) return;

  // Brand palette pulled from theme tokens
  const COLORS = {
    primary:  '#7C9CFF',
    accent:   '#5EE6C2',
    accent2:  '#FFB86B',
    accent3:  '#A78BFA',
    accent4:  '#F472B6',
    accent5:  '#60A5FA',
    accent6:  '#FBBF24',
    crit:     '#FB7185',
    warn:     '#F59E0B',
    ok:       '#34D399',
    text:     '#E6ECFF',
    text2:    '#9AA7C7',
    grid:     'rgba(154,167,199,0.15)',
  };

  // Chart.js global defaults — match dark theme
  Chart.defaults.color = COLORS.text2;
  Chart.defaults.font.family = "'DM Sans', system-ui, sans-serif";
  Chart.defaults.borderColor = COLORS.grid;
  Chart.defaults.plugins.legend.labels.color = COLORS.text;

  const baseScales = () => ({
    x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text2 } },
    y: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text2 } },
  });

  // Track instances so we can destroy/redraw safely
  const instances = {};
  function mount(id, config) {
    const el = document.getElementById(id);
    if (!el) return;
    if (instances[id]) instances[id].destroy();
    instances[id] = new Chart(el, config);
  }

  // ─────────────────── PATIENT ───────────────────
  function renderPatient() {
    const visits = ['V1','V2','V3','V4','V5','V6','V7','V8','V9','V10'];

    mount('patVitalsChart', {
      type: 'line',
      data: {
        labels: visits,
        datasets: [
          { label: 'Heart Rate (bpm)', data: [88,84,90,82,86,80,78,82,79,82], borderColor: COLORS.accent4, backgroundColor: COLORS.accent4+'33', tension:.35, fill:false },
          { label: 'SpO₂ (%)',         data: [96,97,95,97,98,97,98,98,97,98], borderColor: COLORS.accent,  backgroundColor: COLORS.accent+'33',  tension:.35, fill:false },
          { label: 'Systolic BP',      data: [148,145,150,142,138,140,135,138,134,132], borderColor: COLORS.crit, backgroundColor: COLORS.crit+'33', tension:.35, fill:false },
        ],
      },
      options: { responsive:true, maintainAspectRatio:false, scales: baseScales() },
    });

    mount('patRiskChart', {
      type: 'line',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
          label: 'Risk score (0–10)',
          data: [7.8, 6.4, 5.1, 4.2, 3.6, 3.1],
          borderColor: COLORS.primary,
          backgroundColor: COLORS.primary+'33',
          fill: true, tension: .4,
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, scales: { ...baseScales(), y:{ ...baseScales().y, min:0, max:10 } } },
    });

    // Symptom heatmap (30-day grid)
    const heat = document.getElementById('patHeatmap');
    if (heat) {
      const symptoms = [
        { name: 'Fatigue', color: COLORS.accent3 },
        { name: 'Cough',   color: COLORS.accent5 },
        { name: 'Fever',   color: COLORS.crit },
      ];
      let html = '<div style="display:flex;flex-direction:column;gap:10px">';
      symptoms.forEach(s => {
        html += `<div><div style="font-size:12px;color:var(--text2);margin-bottom:6px">${s.name}</div><div style="display:grid;grid-template-columns:repeat(30,1fr);gap:3px">`;
        for (let i=0;i<30;i++){
          const intensity = Math.random();
          const alpha = intensity < .5 ? 0.08 : intensity < .75 ? 0.4 : intensity < .9 ? 0.7 : 1;
          html += `<div title="Day ${i+1}" style="aspect-ratio:1;border-radius:4px;background:${s.color};opacity:${alpha}"></div>`;
        }
        html += '</div></div>';
      });
      html += '</div>';
      heat.innerHTML = html;
    }

    // Adherence progress bars
    const adh = document.getElementById('patAdherence');
    if (adh) {
      const meds = [
        { name: 'Amlodipine 5mg',   pct: 92 },
        { name: 'Metformin 500mg',  pct: 78 },
        { name: 'Atorvastatin 10mg',pct: 95 },
        { name: 'Aspirin 75mg',     pct: 64 },
      ];
      adh.innerHTML = meds.map(m => `
        <div class="mb-3">
          <div class="d-flex justify-content-between" style="font-size:13px">
            <span>${m.name}</span><span style="color:var(--text2)">${m.pct}%</span>
          </div>
          <div class="progress mt-1" style="height:8px;background:rgba(154,167,199,0.15)">
            <div class="progress-bar" role="progressbar" style="width:${m.pct}%;background:${m.pct>=85?COLORS.ok:m.pct>=70?COLORS.warn:COLORS.crit}"></div>
          </div>
        </div>`).join('');
    }
  }

  // ─────────────────── NURSE ───────────────────
  function renderNurse() {
    mount('nurseTriageChart', {
      type: 'doughnut',
      data: {
        labels: ['Emergency','Urgent','Routine'],
        datasets: [{
          data: [2,1,5],
          backgroundColor: [COLORS.crit, COLORS.warn, COLORS.ok],
          borderColor: 'rgba(0,0,0,0)',
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, cutout:'60%' },
    });

    mount('nurseRespChart', {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Avg response time (min)',
          data: [4.2, 3.8, 3.5, 4.0, 3.1, 2.9, 3.2],
          borderColor: COLORS.accent5,
          backgroundColor: COLORS.accent5+'33',
          tension:.4, fill:true,
        }],
      },
      options: { responsive:true, maintainAspectRatio:false, scales: baseScales() },
    });

    mount('nurseTaskRing', {
      type: 'doughnut',
      data: {
        labels: ['Completed','Pending'],
        datasets: [{ data:[17,5], backgroundColor:[COLORS.accent, 'rgba(154,167,199,0.18)'], borderColor:'rgba(0,0,0,0)' }],
      },
      options: {
        responsive:false, maintainAspectRatio:false, cutout:'72%',
        plugins:{ legend:{ position:'bottom' } },
      },
    });

    mount('nurseSymptomChart', {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [
          { label:'Fever',    data:[1,2,1,3,4,2,4], backgroundColor: COLORS.crit },
          { label:'Cough',    data:[2,1,3,2,2,1,2], backgroundColor: COLORS.accent5 },
          { label:'Fatigue',  data:[1,1,2,1,2,3,2], backgroundColor: COLORS.accent3 },
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
      options: { responsive:true, maintainAspectRatio:false, scales:{ ...baseScales(), x:{ ...baseScales().x, stacked:true }, y:{ ...baseScales().y, stacked:true } } },
    });

    mount('docOverrideChart', {
      type: 'doughnut',
      data: {
        labels: ['Agreed with ML','Manual override'],
        datasets: [{ data:[87,13], backgroundColor:[COLORS.primary, COLORS.accent2], borderColor:'rgba(0,0,0,0)' }],
      },
      options: { responsive:true, maintainAspectRatio:false, cutout:'62%' },
    });

    mount('docConsultChart', {
      type: 'bar',
      data: {
        labels: ['Emergency','Urgent','Routine'],
        datasets: [{
          label: 'Avg minutes',
          data: [22, 12.4, 6.8],
          backgroundColor: [COLORS.crit, COLORS.warn, COLORS.ok],
        }],
      },
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
          <div class="d-flex justify-content-between" style="font-size:13px">
            <span>${f.name}</span><span style="color:var(--text2)">${f.pct}%</span>
          </div>
          <div class="progress mt-1" style="height:8px;background:rgba(154,167,199,0.15)">
            <div class="progress-bar" role="progressbar" style="width:${f.pct}%;background:${COLORS.primary}"></div>
          </div>
        </div>`).join('');
    }
  }

  // ── Hook into existing showPanel to lazy-render charts ──
  const _origShowPanel = window.showPanel;
  window.showPanel = function (role, id) {
    _origShowPanel(role, id);
    if (id !== 'analytics') return;
    // Defer so the panel becomes visible (Chart.js needs measured size)
    requestAnimationFrame(() => {
      if (role === 'patient') renderPatient();
      else if (role === 'nurse') renderNurse();
      else if (role === 'doctor') renderDoctor();
    });
  };
})();
