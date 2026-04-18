/* ════════════════════════════════════════════════
   CURA — Static App Data (Users, Nav, Labels)
══════════════════════════════════════════════════ */

const USERS = {
  admin:   { name: 'Admin User',       icon: '🛡️',  label: 'Administrator' },
  doctor:  { name: 'Dr. Alisha Rao',   icon: '🩻',  label: 'Doctor' },
  nurse:   { name: 'Nurse Maria Joji', icon: '💉',  label: 'Nurse' },
  patient: { name: 'Rajan Kumar',      icon: '🧑‍⚕️', label: 'Patient' },
};

const NAV_CONFIG = {
  admin: [
    { section: 'Main' },
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard' },
    { id: 'users',       icon: '👥', label: 'User Management' },
    { id: 'reports',     icon: '📊', label: 'Reports & Logs' },
    { section: 'System' },
    { id: 'settings',    icon: '⚙️',  label: 'Settings' },
    { id: 'about',       icon: 'ℹ️',  label: 'About Cura' },
  ],
  doctor: [
    { section: 'Main' },
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard' },
    { id: 'patients',    icon: '🏥', label: 'Patient Records' },
    { id: 'appointments',icon: '📅', label: 'Appointments' },
    { section: 'Clinical' },
    { id: 'vitals',      icon: '📋', label: 'View Vitals' },
    { id: 'prescribe',   icon: '💊', label: 'Prescriptions' },
    { id: 'consult',     icon: '💬', label: 'Consultations' },
    { section: 'Account' },
    { id: 'about',       icon: 'ℹ️',  label: 'About Cura' },
  ],
  nurse: [
    { section: 'Main' },
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard' },
    { id: 'patients',    icon: '🏥', label: 'My Patients' },
    { section: 'Actions' },
    { id: 'vitals',      icon: '📊', label: 'Enter Vitals' },
    { id: 'tasks',       icon: '✅', label: 'My Tasks' },
    { section: 'Account' },
    { id: 'about',       icon: 'ℹ️',  label: 'About Cura' },
  ],
  patient: [
    { section: 'Main' },
    { id: 'dashboard',     icon: '🏠', label: 'Dashboard' },
    { id: 'prescriptions', icon: '💊', label: 'My Prescriptions' },
    { id: 'appointments',  icon: '📅', label: 'My Appointments' },
    { section: 'Services' },
    { id: 'consult',       icon: '💬', label: 'Consultation' },
    { id: 'details',       icon: '📋', label: 'My Details' },
    { section: 'Account' },
    { id: 'about',         icon: 'ℹ️',  label: 'About Cura' },
  ],
};

const PANEL_LABELS = {
  dashboard: 'Dashboard',
  users: 'User Management',
  patients: 'Patient Records',
  vitals: 'Vitals',
  prescribe: 'Write Prescription',
  consult: 'Consultations',
  reports: 'Reports & Logs',
  prescriptions: 'My Prescriptions',
  details: 'My Details',
  appointments: 'Appointments',
  tasks: 'My Tasks',
  settings: 'Settings',
  about: 'About Cura',
};
