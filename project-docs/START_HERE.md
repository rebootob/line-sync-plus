# START HERE — LineSync Plus

Welcome to **LineSync Plus**. This document provides an onboarding overview, repository layout, build/run instructions, and key control documents for AI agents, developers, and project leads.

---

## 📌 Project Summary

**LineSync Plus** is an automated customer contact sync, customer segment grouping, and message broadcast management system for **LINE Official Account (LINE OA)**.

It consists of:
1. **Backend REST API**: Built with NestJS, TypeORM, and PostgreSQL. Handles contact database storage, group tag mappings, campaign queue dispatch, local scheduled campaign execution, and Telegram completion reporting.
2. **Dashboard UI**: Single-page web dashboard (`index.html`) offering customer contact tables, real-time filtering, group management, multi-type campaign creation, scheduled campaign management, deep analytics, and Telegram setting UI.
3. **Client Automation**: Tampermonkey userscript (`run/LineSyncApp.js` v28.2) running directly in the browser on `https://chat.line.biz/*` to send messages, attach images, detect quotas, enforce Circuit Breaker safety, exclude blocked users from error counters, and auto-return to the main chat list view.

---

## 🛠️ Technology Stack

- **Backend Framework**: NestJS (v11), Node.js, Express, RxJS
- **Database & ORM**: PostgreSQL, TypeORM (`@nestjs/typeorm`)
- **Frontend UI**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Pointer/Keyboard Events)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Build / Tooling**: TypeScript, Jest, ESLint, Prettier

---

## 📂 Key Control Documents & Reading Guide

For AI context switching and project management, start reading in this order:

1. **[`project-docs/START_HERE.md`](START_HERE.md)** (This document): Overview and quick start guide.
2. **[`project-docs/PROJECT_STATUS_ROADMAP.md`](PROJECT_STATUS_ROADMAP.md)**: Incident history, work package iterations, stability metrics, and development roadmap.
3. **[`project-docs/CURRENT_STATE.md`](CURRENT_STATE.md)**: Detailed breakdown of working features, architecture, and known issues.
4. **[`project-docs/ACTIVE_TASK.md`](ACTIVE_TASK.md)**: Active work package tracking and task status (`ACTIVE_WORK_PACKAGE = NONE`).
5. **[`project-docs/CHAT_HANDOFF.md`](CHAT_HANDOFF.md)**: Structured handoff summary for Control Plane / ChatGPT evaluation.

---

## 🚀 How to Build, Test, and Run

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure PostgreSQL credentials:
```env
PORT=3005
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=line_sync_db
```

### 3. Build & Test
```bash
# Run NestJS TypeScript compilation check
npm run build

# Run Jest unit test suite
npm test
```

### 4. Running Backend Server
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### 5. Client Userscript
Install Tampermonkey in your browser and import script from [`run/LineSyncApp.js`](../run/LineSyncApp.js). Open `https://chat.line.biz/` to start queue processing.
