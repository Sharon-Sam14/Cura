# Cura — Frontend Source Folder

A complete static frontend for **Cura — Cloud Medical Consultation Platform**, split into clean folders so each concern lives in its own file.

> Built by **Sharon · Aaron · Sam**

## 📁 Structure

```
public/cura/
├── index.html        ← Landing (hero · roles · features · testimonials · CTA)
├── about.html        ← About page (mission · pillars · story)
├── team.html         ← Meet Sharon, Aaron & Sam
├── faq.html          ← Accordion-style FAQ
├── contact.html      ← Contact form + info
├── app.html          ← Logged-in dashboard (all 4 roles)
├── css/
│   ├── styles.css    ← Shared design system (nav, hero, sections, footer, modal)
│   └── app.css       ← Dashboard-only styles (sidebar, panels, tables, chat, vitals)
└── js/
    ├── main.js       ← Public pages: login modal, FAQ, contact, scroll reveal, counters
    ├── data.js       ← Static data: USERS, NAV_CONFIG, PANEL_LABELS
    └── app.js        ← Dashboard behaviour: panels, vitals, prescriptions, chat, tasks
```

## 🚀 Open it

The site is served from `/cura/index.html` in the preview. Click any "Sign In" / "Get Started" button, pick a role, and you'll land in the dashboard.

## ✨ What's new vs. the original single-file build

- **Removed** all "Architecture" mentions from nav, hero, and features sections.
- **Added new public pages**: About, Team, FAQ, Contact (each with its own tab).
- **Added new dashboard panels**:
  - Admin → User Management (split out) · Settings (tabbed) · About
  - Doctor → Appointments grid · About
  - Nurse → Tasks (interactive checklist) · About
  - Patient → Appointments · About
- **More interactivity**: animated counters, FAQ accordion, scroll reveal, simulated chat replies, toast notifications, settings sub-tabs, completable tasks, working contact + newsletter forms.
- **Footer redesigned** with credit to Sharon, Aaron & Sam on every page.
- All original features preserved: vitals form with live colour-coded validation, prescription builder, role-based sidebars, login modal with demo, etc.
