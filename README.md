# ClientPulse — AI Solo-Business Operating System

> **Ek app, do workspaces, ek shared database, aur ek AI Copilot jo har action se pehle aapki manual approval le.**

ClientPulse is a full-stack, single-user operating system engineered specifically for solo service businesses and solopreneurs. It is founded on the strict principle of **Database-first + Workflow-first + AI-second**.

---

## 🔒 The 5 Non-Negotiable Hard Approval Gates

The AI engine acts strictly as an intelligence, drafting, and organizing layer. It is prohibited at the API and database level from autonomously executing external or financial actions:

| Gate | Target Field | Trigger Action | Enforcement Rule |
| :--- | :--- | :--- | :--- |
| **Gate 1** | `Interaction.confirmed_sent` | User clicks **"Mark as Sent"** after copying draft | Starts `false`. AI draft only generates editable text. |
| **Gate 2** | `Proposal.approved_at` | User clicks **"Approve Proposal"** | Required before a proposal can generate final documents or unlock dispatch. |
| **Gate 3** | `Proposal.sent_confirmed_at` | User clicks **"Mark Proposal as Sent"** | Blocked at API level until Gate 2 approval exists. Never automated. |
| **Gate 4** | `Invoice.sent_confirmed_at` | User clicks **"Mark Invoice as Sent"** | Confirms manual dispatch of invoice to client. |
| **Gate 5** | `Invoice.paid_confirmed_at` | User clicks **"Confirm Payment Received"** | Never auto-set. **Only allowed automated side-effect:** Triggers auto-creation of client's Onboarding checklist. |

---

## 🧠 Fact vs Inference vs Unknown (No Fabrication)

- **Fact:** Directly from CSV or verified client inputs (e.g., business name, phone, email, website).
- **AI Inference:** Synthesized exclusively from confirmed facts (e.g. potential opportunity based on service niche). Tagged with visual badges.
- **Unknown:** If information is absent, the system outputs `"Not available"`. Never hallucinated or guessed.

---

## 🖥️ Screen Architecture (12 Screens)

### Global
- **S1 — Dashboard (My Work):** Actionable focus list (Targets quota `x/3`, Follow-ups due, Waiting for You, Overdue tasks, Onboarding count).
- **S10 — AI Copilot Panel:** Persistent sidebar auto-loading the active screen's record ("Business Brain"). Answers *"What should I do next?"* and provides contextual advice.
- **S11 — Global Search (`Ctrl+K`):** Instant search across Leads, Clients, Proposals, Invoices, and Interactions.
- **S12 — Settings:** Follow-up cadence rules, daily target quota (default 3), starting message templates, and read-only Approval Gate audit log.

### Workspace A (Lead Intelligence & Outreach)
- **S2 — CSV Import:** Column mapper, duplicate check (website/phone/email), preview, and AI snapshot generator.
- **S3 — Lead List:** Filterable by status, niche, location, 4-day silence window, and 3-target daily quota.
- **S4 — Lead Detail (Lead Card):** Verified Facts header, Fact/Inference snapshot, interaction timeline, Gate 1 outreach modal, call booking.

### Workspace B (Client Conversion & Delivery)
- **S5 — Client List:** Portfolio of won leads with stage and payment status.
- **S6 — Client Detail (Timeline):** Complete chronological milestone journey and linked document vault.
- **S7 — Proposal Builder:** Line items, auto investment total, AI scope drafting, Gate 2 approval, Gate 3 dispatch, and client-ready PDF generation.
- **S8 — Invoice Builder:** Sequential numbering (`INV-YYYY-XXXX`), line items, Gate 4 dispatch, Gate 5 payment confirmation, and downloadable PDF.
- **S9 — Onboarding Checklist:** Post-payment setup checklist auto-created from Gate 5. Promoting completed checklist sets client stage to **Active**.

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
GEMINI_API_KEY="AIzaSy..."
SESSION_SECRET="c9a2e7f84b1d6e3c0a5b8f2e4d7a9c1b3f6e8d0a2c4e7b9f1a3d5c7e9b0d2f4a"
```

### 2. Push Database Schema to Supabase
```bash
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment to Hostinger via GitHub

1. Commit and push this repository to your GitHub account.
2. In Hostinger Web Hosting control panel (hPanel):
   - Go to **Node.js Web App** or **Git Deployment**.
   - Connect your GitHub repository.
   - Set Build Command: `npm run build`.
   - Set Start Command: `npm start`.
   - In Environment Variables, paste `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY`, and `SESSION_SECRET`.
