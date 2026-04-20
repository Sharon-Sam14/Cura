/* ════════════════════════════════════════════════
   CURA — Symptom Checker Wizard (patient)
   Mock ML-style triage suggestion based on answers.
══════════════════════════════════════════════════ */

(function () {
  const QUESTIONS = [
    {
      key: 'duration',
      title: 'How long have you been feeling unwell?',
      options: [
        { label:'Less than 24 hours', score:1 },
        { label:'1–3 days',           score:2 },
        { label:'4–7 days',           score:3 },
        { label:'More than a week',   score:4 },
      ],
    },
    {
      key: 'symptoms',
      title: 'Which symptoms are present? (multi-select)',
      multi: true,
      options: [
        { label:'Fever',         score:2, tag:'Fever' },
        { label:'Cough',         score:1, tag:'Cough' },
        { label:'Chest pain',    score:5, tag:'Chest pain' },
        { label:'Shortness of breath', score:5, tag:'Dyspnea' },
        { label:'Fatigue',       score:1, tag:'Fatigue' },
        { label:'Headache',      score:1, tag:'Headache' },
        { label:'Dizziness',     score:3, tag:'Dizziness' },
      ],
    },
    {
      key: 'severity',
      title: 'How would you rate the severity?',
      options: [
        { label:'Mild — manageable',    score:1 },
        { label:'Moderate — disruptive', score:3 },
        { label:'Severe — debilitating', score:6 },
      ],
    },
    {
      key: 'history',
      title: 'Do any of these apply?',
      multi: true,
      options: [
        { label:'I have hypertension',      score:2 },
        { label:'I have diabetes',          score:2 },
        { label:'I am pregnant',            score:2 },
        { label:'I am over 60',             score:2 },
        { label:'None of the above',        score:0 },
      ],
    },
  ];

  let step = 0;
  const answers = {};

  function triageFromScore(score) {
    if (score >= 12) return { level:'Emergency', color:'var(--accent5)', badge:'bg-cura-red',    msg:'Please seek immediate medical attention. We recommend booking an Emergency consult or going to the nearest ER.' };
    if (score >=  7) return { level:'Urgent',    color:'var(--accent4)', badge:'bg-cura-amber',  msg:'Your symptoms warrant a prompt consultation. We recommend booking an Urgent appointment within 24 hours.' };
    return                    { level:'Routine',  color:'var(--accent3)', badge:'bg-cura-green',  msg:'Your symptoms appear routine. You can monitor at home or book a routine check-in with your doctor.' };
  }

  function renderStep() {
    const host = document.getElementById('symptomCheckerBody');
    if (!host) return;
    if (step >= QUESTIONS.length) return renderResult();

    const q = QUESTIONS[step];
    const sel = answers[q.key] || (q.multi ? [] : null);

    host.innerHTML = `
      <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Step ${step+1} of ${QUESTIONS.length}</div>
      <div class="progress mb-3" style="height:6px;background:rgba(154,167,199,0.15)">
        <div class="progress-bar" style="width:${((step)/QUESTIONS.length)*100}%;background:linear-gradient(135deg, var(--accent), var(--accent2))"></div>
      </div>
      <h5 style="font-family:'Syne',sans-serif;margin-bottom:18px">${q.title}</h5>
      <div class="d-flex flex-column gap-2" id="scOptions">
        ${q.options.map((o, i) => {
          const checked = q.multi ? sel.includes(i) : sel === i;
          return `<label class="sc-option ${checked?'selected':''}" data-i="${i}">
            <input type="${q.multi?'checkbox':'radio'}" name="sc-${q.key}" ${checked?'checked':''} hidden/>
            <span class="sc-bullet"><i class="bi ${checked?(q.multi?'bi-check-square-fill':'bi-record-circle-fill'):(q.multi?'bi-square':'bi-circle')}"></i></span>
            <span>${o.label}</span>
          </label>`;
        }).join('')}
      </div>
      <div class="d-flex gap-2 mt-4">
        <button class="btn btn-cura-ghost" id="scBack" ${step===0?'disabled':''}><i class="bi bi-arrow-left"></i> Back</button>
        <button class="btn btn-cura-primary ms-auto" id="scNext">${step===QUESTIONS.length-1?'See result':'Next'} <i class="bi bi-arrow-right"></i></button>
      </div>`;

    host.querySelectorAll('.sc-option').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.i, 10);
        if (q.multi) {
          const arr = answers[q.key] || [];
          const idx = arr.indexOf(i);
          if (idx >= 0) arr.splice(idx, 1); else arr.push(i);
          answers[q.key] = arr;
        } else {
          answers[q.key] = i;
        }
        renderStep();
      });
    });
    host.querySelector('#scBack').addEventListener('click', () => { if (step>0){ step--; renderStep(); } });
    host.querySelector('#scNext').addEventListener('click', () => {
      if (q.multi && (!answers[q.key] || !answers[q.key].length)) {
        window.showToast && window.showToast('Please pick at least one option', '⚠'); return;
      }
      if (!q.multi && answers[q.key] === undefined || answers[q.key] === null) {
        if (!q.multi && answers[q.key] === undefined) {
          window.showToast && window.showToast('Please pick an option', '⚠'); return;
        }
      }
      step++; renderStep();
    });
  }

  function renderResult() {
    const host = document.getElementById('symptomCheckerBody');
    let score = 0;
    const tags = [];
    QUESTIONS.forEach(q => {
      const a = answers[q.key];
      if (a === undefined) return;
      if (q.multi) {
        a.forEach(i => { score += q.options[i].score; if (q.options[i].tag) tags.push(q.options[i].tag); });
      } else {
        score += q.options[a].score;
      }
    });
    const t = triageFromScore(score);

    // Persist symptoms for analytics heatmap
    if (window.CuraStore) {
      const today = new Date().toISOString().slice(0,10);
      tags.forEach(tag => CuraStore.addSymptom(today, tag));
    }

    host.innerHTML = `
      <div class="text-center py-3">
        <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Suggested triage</div>
        <div style="font-family:'Syne',sans-serif;font-size:36px;font-weight:800;color:${t.color};margin-bottom:6px">${t.level}</div>
        <span class="badge ${t.badge}" style="font-size:11px">Score ${score}</span>
        <p class="mt-3 mb-0" style="color:var(--text2);font-size:14px;line-height:1.6;max-width:480px;margin-left:auto;margin-right:auto">${t.msg}</p>
      </div>
      <div class="d-flex flex-wrap gap-2 mt-3 justify-content-center">
        <button class="btn btn-cura-ghost" id="scRestart"><i class="bi bi-arrow-counterclockwise"></i> Start over</button>
        <button class="btn btn-cura-primary" id="scBook"><i class="bi bi-calendar-plus"></i> Book ${t.level} appointment</button>
      </div>`;

    host.querySelector('#scRestart').addEventListener('click', () => {
      step = 0;
      Object.keys(answers).forEach(k => delete answers[k]);
      renderStep();
    });
    host.querySelector('#scBook').addEventListener('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('symptomCheckerModal'))?.hide();
      // Navigate to appointments and prefill nearest available date
      if (typeof window.showPanel === 'function') window.showPanel('patient', 'appointments');
      setTimeout(() => {
        const today = new Date(); today.setDate(today.getDate() + 1);
        const iso = today.toISOString().slice(0,10);
        const type = t.level === 'Emergency' ? 'New Consult' : t.level === 'Urgent' ? 'New Consult' : 'Routine Check';
        window.CuraCalendar?.prefillSlot(iso, 'Dr. Alisha Rao', type);
      }, 200);
    });
  }

  window.openSymptomChecker = function () {
    step = 0;
    Object.keys(answers).forEach(k => delete answers[k]);
    const modalEl = document.getElementById('symptomCheckerModal');
    if (!modalEl) return;
    new bootstrap.Modal(modalEl).show();
    setTimeout(renderStep, 50);
  };
})();
