# Appointly — Appointment Scheduler

A clean, dark-themed appointment scheduling app with priority-based automatic date assignment. No framework, no build step — just open `index.html`.

---

## Getting Started

### Open directly in a browser
Double-click `index.html` — works out of the box.

### Open with VS Code Live Server (recommended)
1. Install the **Live Server** extension in VS Code (`ritwickdey.LiveServer`)
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

---

## Project Structure

```
appointment-scheduler/
├── index.html          # Main HTML — layout, views, modals
├── css/
│   └── style.css       # All styles — dark theme, components, responsive
├── js/
│   └── app.js          # Scheduling logic, state, rendering
└── README.md
```

---

## Features

### Scheduling Logic
- Appointments sorted by **priority** (High → Medium → Low), then by creation time
- Each appointment assigned to the **nearest available date** from today
- **One appointment per day** — no overlap allowed
- **Preferred date** respected if set (scheduler starts from that date)
- When priority changes, the **entire schedule reshuffles** automatically

### Priority System
| Priority | Color  | Gets scheduled |
|----------|--------|----------------|
| High     | Red    | Earliest dates |
| Medium   | Amber  | Mid dates      |
| Low      | Green  | Latest dates   |

### Views
| View       | Description |
|------------|-------------|
| Dashboard  | Stats summary + upcoming appointments + mini calendar |
| Calendar   | Full monthly grid with appointment chips |
| List       | Searchable, filterable table of all appointments |

### UI
- **Dark luxury theme** — `#0f0f11` base, warm cream accent (`#c8b8a2`)
- **DM Serif Display** for headings, **DM Sans** for body text
- Smooth animations on card entry and modal open
- Fully **responsive** — adapts to mobile, tablet, and desktop
- **Keyboard shortcuts**: `N` to open new appointment, `Esc` to close modals, `Enter` to save

### Data
- Stored in **localStorage** (`appointly_v3` key) — persists across browser sessions
- Seeded with 5 sample appointments on first load

---

## Customization

### Add a new priority level
In `app.js`, update `priorityOrder()` and in `style.css` add matching CSS variables and classes.

### Change the color theme
Edit the CSS variables in `:root` inside `style.css`. The entire theme flows from those variables.

### Connect to a backend
Replace the `load()` and `save()` functions in `app.js` with `fetch()` calls to your API. The rest of the scheduling and rendering logic stays the same.

---

## Browser Support
All modern browsers (Chrome, Firefox, Edge, Safari). No IE support.
