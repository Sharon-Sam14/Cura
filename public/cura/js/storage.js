/* ════════════════════════════════════════════════
   CURA — localStorage Persistence Layer
   Survives page reloads for vitals, prescriptions,
   tasks, chat messages, and user preferences.
══════════════════════════════════════════════════ */

const CURA_STORAGE_KEY = 'cura_app_state_v1';

const DEFAULT_STATE = {
  vitals: [],          // [{ id, patient, dateTime, bpSys, bpDia, hr, temp, spo2, rr, glucose, weight, notes, ts }]
  prescriptions: [],   // [{ id, patient, date, diagnosis, meds:[], duration, instructions, ts }]
  tasks: {},           // { taskId: true } (completed)
  chats: {             // { conversationKey: [{ from, text, ts }] }
    'doctor-rajan': [],
    'patient-doctor': [],
  },
  appointments: [],    // [{ id, patient, doctor, date, time, type, ts }]
  symptoms: [],        // [{ date: 'YYYY-MM-DD', tags: [...] }]
  prefs: {
    sidebarCollapsed: false,
    lastPanel: null,
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(CURA_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_STATE), ...parsed };
  } catch (e) {
    console.warn('[cura/storage] load failed:', e);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  try {
    localStorage.setItem(CURA_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[cura/storage] save failed:', e);
  }
}

const CuraStore = {
  state: loadState(),

  flush() { saveState(this.state); },

  // Vitals
  addVitals(entry) {
    const rec = { id: 'v_' + Date.now(), ts: Date.now(), ...entry };
    this.state.vitals.unshift(rec);
    this.state.vitals = this.state.vitals.slice(0, 100);
    this.flush();
    return rec;
  },
  getVitals(patient) {
    return patient
      ? this.state.vitals.filter(v => v.patient === patient)
      : this.state.vitals;
  },

  // Prescriptions
  addPrescription(entry) {
    const id = 'PRX-' + String(Math.floor(Math.random() * 9000) + 1000);
    const rec = { id, ts: Date.now(), ...entry };
    this.state.prescriptions.unshift(rec);
    this.state.prescriptions = this.state.prescriptions.slice(0, 50);
    this.flush();
    return rec;
  },
  getPrescriptions(patient) {
    return patient
      ? this.state.prescriptions.filter(p => p.patient === patient)
      : this.state.prescriptions;
  },

  // Tasks
  setTask(id, done) {
    if (done) this.state.tasks[id] = true;
    else delete this.state.tasks[id];
    this.flush();
  },
  isTaskDone(id) { return !!this.state.tasks[id]; },

  // Chat
  addMessage(convKey, msg) {
    if (!this.state.chats[convKey]) this.state.chats[convKey] = [];
    const rec = { ts: Date.now(), ...msg };
    this.state.chats[convKey].push(rec);
    this.state.chats[convKey] = this.state.chats[convKey].slice(-200);
    this.flush();
    return rec;
  },
  getMessages(convKey) {
    return this.state.chats[convKey] || [];
  },

  // Symptoms (patient self-report)
  addSymptom(date, tag) {
    let entry = this.state.symptoms.find(s => s.date === date);
    if (!entry) {
      entry = { date, tags: [] };
      this.state.symptoms.push(entry);
    }
    if (!entry.tags.includes(tag)) entry.tags.push(tag);
    this.flush();
  },
  getSymptoms() { return this.state.symptoms; },

  // Prefs
  setPref(k, v) { this.state.prefs[k] = v; this.flush(); },
  getPref(k, fallback) {
    return this.state.prefs[k] !== undefined ? this.state.prefs[k] : fallback;
  },

  reset() {
    this.state = structuredClone(DEFAULT_STATE);
    this.flush();
  },
};

window.CuraStore = CuraStore;
