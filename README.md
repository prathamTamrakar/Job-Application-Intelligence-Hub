# Job Application Intelligence Hub

A full-stack tracking + analytics system equipped with a companion Manifest V3 browser extension for auto-capturing application data from major job boards.

---

## Why I Built This

Job seekers frequently apply to hundreds of roles across multiple job boards, corporate portals, and email threads. Managing this pipeline manually is incredibly challenging. Job seekers lose track of:
1. Where they applied and when.
2. Which version of their resume or cover letter was used.
3. Which applications are getting replies versus which have gone cold.
4. When to follow up on outstanding applications.

**Job Application Intelligence Hub** solves these pain points by offering a single source of truth, automated job logging via a browser extension, a daily stale-application notifier, and intelligence dashboards analyzing response rates by resume version and technology keywords.

---

## System Architecture

```text
                               ┌────────────────────────┐
                               │   Chrome Extension     │ (LinkedIn, Greenhouse, Lever)
                               │  - Content Scrapers    │
                               │  - Shadow DOM overlay  │
                               └───────────┬────────────┘
                                           │
                                           │ (Authenticated Sync POSTs)
                                           ▼
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│     React Frontend     │◄────┤  Express Node Backend  ├────►│  MongoDB (Atlas/Local)  │
│  - KPI Stats & Filters │     │  - REST Controllers    │     │  - Users, Applications  │
│  - Timeline View       │     │  - cron Notifier       │     │  - Reminder Logs        │
│  - Recharts Dashboards │     │  - JWT Middleware      │     └────────────────────────┘
└────────────────────────┘     └───────────┬────────────┘
                                           │
                                           │ (Nodemailer digest)
                                           ▼
                               ┌────────────────────────┐
                               │      Email Inbox       │
                               └────────────────────────┘
```

---

## Directory Layout

*   `/server`: Node.js, Express, Mongoose, and the background reminder checker.
*   `/client`: React (Vite), Tailwind CSS v4, and Recharts.
*   `/extension`: Manifest V3 browser extension (Vanilla JS and Shadow DOM).

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Running locally on `mongodb://localhost:27017` or a MongoDB Atlas Connection String)

---

### Step 1: Server Setup

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
4. Update the variables in `.env` (MongoDB URL, JWT secret key, and SMTP credentials if using real emails).
5. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

---

### Step 2: Client Setup

1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`.

---

### Step 3: Browser Extension Installation

1. Open Google Chrome (or any Chromium-based browser) and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** using the toggle in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `/extension` directory in this repository.
5. The extension will sync immediately if you log into `http://localhost:5173`. If you want to login manually, click the extension icon and submit your credentials.

---

## Verification & Testing the Cron Engine

For easy testing without waiting 24 hours:
1. Log in to the web app.
2. Click the **Gear Icon** next to the *"Add Application"* button to open the settings panel.
3. Click **Run Scanner Manual Sync**.
4. Stale applications will immediately receive a yellow `Stale` indicator on the pipeline, a `ReminderLog` will save, and the formatted HTML digest will print to your Node console (or send via email if configured!).

---

## AI Resume Alignment & Sandbox (Phases 5 & 6)

We have integrated Groq LPU inference to power contextual resume matching and standalone resume audits.

### Setup Groq Key
1. Set `GROQ_API_KEY` in `server/.env`:
   ```env
   GROQ_API_KEY=gsk_your_real_key_here
   ```
2. Restart the server.

### 1. Contextual AI Match (Detail Page)
- Click the **Resumes** button in the dashboard header to create, edit, or delete plain text resume versions.
- Edit any application, link your resume version, paste the role's Job Description, and click **Save**.
- Click **Analyze Alignment Match** to fetch the ATS score, keyword alignment tags, and tailoring suggestions.

### 2. Standalone AI Sandbox (AI Sandbox Page)
- Navigate to the **AI Sandbox** tab in the main navbar.
- Paste your resume text and choose a job role:
  - *No Job Description*: Runs a general CV strength audit (score, strengths, weaknesses, tech stack).
  - *Predefined presets* (Frontend React, Node Backend, Python Data Science) or *Custom Job Description*: Compares the resume to the JD.

