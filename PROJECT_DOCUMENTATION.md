# � OrganizO - Project Documentation

## 📑 Overview
OrganizO is a **purely client-side productivity web app** that prioritizes user privacy and calm focus. This document provides a technical breakdown for developers and auditors.

OrganizO intentionally avoids a backend to maximize privacy, reduce complexity, eliminate server costs, and allow offline usage.

🌎 **Live Deployment**: [https://organizolife.netlify.app/](https://organizolife.netlify.app/)

---

## 🛡️ Architecture & Security

| Aspect | Implementation |
| :--- | :--- |
| **Platform** | 100% Client-side (HTML/CSS/JS) |
| **Storage** | `localStorage` (No server, no database) |
| **Security** | Comprehensive XSS Sanitization & strict CSP |
| **Headers** | X-Frame-Options, HSTS, Permissions-Policy enabled |

### Key Security Measures:
- **XSS Prevention**: All user input is processed through `sanitize()` before rendering.
- **Privacy**: No tracking, no cookies, no third-party scripts (except Google Fonts).
- **Resilience**: `try-catch` blocks on all `JSON.parse` operations to prevent data-corruption crashes.

---

## 📂 Core Components

### 1. `app.js` (The Brain)
Handles the core logic of the application:
- **State Management**: Manages tasks, habits, and focus timer state.
- **Rendering Engine**: Dynamically updates the DOM based on the current view.
- **Sanitization**: Centralized `sanitize()` method for all user-facing strings.

### 2. `app.html` & `app-styles.css`
The main application environment:
- **Sidebar**: Contextual navigation (Dashboard, Calendar, Tasks, Insights).
- **Glassmorphism**: High-end UI effects using `backdrop-filter`.

### 3. `index.html` & `styles.css`
The public-facing storefront and landing page.

---

## 🚥 Working Features vs. Roadmap

### ✅ Currently Functional
- **Dashboard**: Integrated view of tasks, habits, and intentions.
- **Tasks & Habits**: Full CRUD with streak tracking.
- **Focus Timer**: Zen Pomodoro timer.
- **Calendar**: Monthly view with event/task integration.
- **Global Search**: Filters content across all major views.

### 🔜 On the Roadmap (Coming Soon)
- **Notes**: Rich-text capture.
- **Goals**: Visual milestone tracking.
- **AI Insights**: Personalized productivity patterns.
- **Cloud Sync**: Optional cross-device persistence.

---

## 🛠️ Local Development

To run the project locally without any build steps:

```bash
npx -y serve@latest -l 3000
```

Access the app at `http://localhost:3000`.

---

## 🧪 Verification Steps
1. **XSS Test**: Add a task with `<script>alert(1)</script>`. It should render as text.
2. **Search Test**: Type into the search bar in "Calendar" to see days highlight/dim based on content.
3. **Data Test**: Clear `localStorage` to verify the app initializes with default state gracefully.

---

*Written by Shrishti on 2026-02-26.*
