# Payment Manager — Multi-User (React + Tailwind + Google Sheets)

A multi-user payment management app. Each user creates their own account
(email + password), and on signup the system **automatically creates a
private Google Spreadsheet just for them**. All payment records are
isolated per user, with monthly sheets auto-created inside their
spreadsheet (e.g. `January 2026`, `February 2026`, ...).

An **admin role** (the first person who signs up) can view the list of
all users and inspect/manage any user's data.

---

## Stack

- **React 19** + **TypeScript**, Tailwind CSS v3, lucide-react, react-hot-toast
- **Google Apps Script** as the entire backend — auth, sessions, and
  per-user spreadsheet creation/CRUD, no separate server needed

---

## How auth + multi-tenancy works

- One **master spreadsheet** (deployed once, owned by you/the admin)
  holds two internal sheets: `Users` and `Sessions`
- **Signup**: hashes the password (HMAC-SHA256 + per-user salt), creates
  a brand-new private Google Spreadsheet titled `Payment Manager — <email>`,
  and stores that spreadsheet's ID against the user's row
- **Login**: verifies the password hash, issues a session token (7-day
  expiry) stored in the `Sessions` sheet
- **The very first person to sign up becomes admin automatically.**
  Every signup after that is a regular user.
- Every API call (list sheets, get/add/update/delete records) requires
  a valid session token and only ever touches the **calling user's own
  spreadsheet** — except when an admin explicitly passes `targetEmail`
  to view another user's data (the "All Users" panel does this via a
  "View data" button)

---

## Project structure

```
payment-manager/
├── apps-script/
│   └── Code.gs                ← the entire backend — paste into Apps Script
├── src/
│   ├── components/
│   │   ├── AuthScreen.tsx     ← login / signup UI + backend URL config
│   │   ├── AdminPanel.tsx     ← admin-only: list & impersonate users
│   │   ├── Header.tsx         ← user info, admin button, "viewing as" banner
│   │   ├── MonthBar.tsx
│   │   ├── StatsBar.tsx
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentTable.tsx
│   │   └── MethodBadge.tsx
│   ├── hooks/
│   │   ├── useAuth.ts         ← signup/login/logout/session persistence
│   │   └── usePayments.ts     ← CRUD + admin impersonation
│   ├── lib/sheets.ts          ← typed API client
│   ├── types/index.ts
│   └── App.tsx
├── tailwind.config.js
└── package.json
```

---

## Setup

### 1. Create the master spreadsheet (one-time, admin only)

1. Create a **new Google Sheet** — this is your master/admin spreadsheet.
   (It will auto-create `Users` and `Sessions` tabs the first time the
   script runs — you don't need to set those up manually.)
2. Open it → **Extensions → Apps Script**
3. Delete the default code, paste in the full contents of `apps-script/Code.gs`
4. Save (Ctrl/Cmd + S)
5. **Deploy → New Deployment** → Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize access, then **copy the Web App URL**

> ⚠️ Keep this master spreadsheet private — it stores password hashes
> and session tokens for every user. Do not share edit access to it.

### 2. Install & run the frontend

```bash
cd payment-manager
npm install
npm start
```

Opens at `http://localhost:3000`. On first load it'll ask for the Apps
Script Web App URL — paste the one from step 1.

### 3. Create accounts

- The **first person to sign up becomes the admin** automatically.
- Every signup after that creates a regular user with their own private
  spreadsheet (visible in their own Google Drive, owned by the Apps
  Script's executing account — i.e. the admin's Google account, since
  the script runs "as Me").

### 4. Build for production

```bash
npm run build
```

---

## Admin capabilities

Logged in as admin, click **All Users** in the header to:
- See every registered user, their role, and join date
- Click **View data** next to any user to browse their payments
  (a "Viewing data for ... as admin" banner appears; click
  **Return to my data** to go back to your own account)

---

## Security notes

- Passwords are hashed with HMAC-SHA256 + a random per-user salt before
  storage — plaintext passwords are never stored
- Sessions expire after 7 days (`SESSION_TTL_MS` in `Code.gs`)
- Anyone with the Web App URL can call `signup`/`login` — for stricter
  control, set `ADMIN_BOOTSTRAP_EMAIL` in `Code.gs` if you want a
  specific email forced to admin, or close public signup later by
  guarding the `signup` action with an invite code

## Redeploying the backend after changes

Apps Script requires a **new deployment** for code changes to go live:
**Deploy → New Deployment** → repeat the steps above.
