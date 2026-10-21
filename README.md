# Padel Coach CRM

A personal Customer Relationship Management (CRM) web application designed for a UK-based padel coach to manage student profiles, monitor playing ratings, track availability, and organise compatible players into private and group coaching sessions.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (modern ES Modules), responsive desktop-first design.
- **Development Tooling**: [Vite](https://vitejs.dev/) for fast local development and modular bundling.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL cloud database, Supabase Auth, Row Level Security) *(Phase 2)*.
- **Language**: British English throughout.

---

## 📁 Project Directory Structure

```text
CoachingSessions/
├── index.html                   # Main single-page application shell
├── package.json                 # Project configuration & npm scripts
├── .env.example                 # Template for Supabase environment variables
├── .gitignore                   # Excludes node_modules, .env, and build artifacts
├── README.md                    # Project documentation
├── src/
│   ├── css/
│   │   └── styles.css           # Modern sports/padel-inspired styling
│   └── js/
│       ├── main.js              # Application entry point & router
│       ├── supabaseClient.js    # Supabase SDK initialisation (Phase 2)
│       ├── auth.js              # Coach authentication & access control (Phase 2)
│       ├── students.js          # Student CRUD logic (Phase 3)
│       ├── availability.js      # Time-slot & preference management (Phase 4)
│       └── filters.js           # Player matching & range compatibility (Phase 4 & 5)
└── supabase/
    └── migrations/              # Version-controlled PostgreSQL schemas (Phase 2)
```

---

## 🚀 Getting Started (Phase 1)

### 1. Prerequisites
Ensure you have **Node.js** installed (version 18 or newer).
You can verify your installation by running:
```bash
node -v
npm -v
```

### 2. Install Dependencies
Dependencies are already configured. If starting fresh or on a new computer:
```bash
npm install
```

### 3. Run the Development Server
Start the local Vite development server:
```bash
npm run dev
```

Vite will print a local URL in your terminal (typically `http://localhost:5173`). Open that URL in your web browser.

### 4. Build for Production
To test or verify the production bundle:
```bash
npm run build
```

---

## 🗺️ Development Roadmap

- [x] **Phase 1: Project Foundation** &mdash; Vite setup, folder structure, accessible British English UI shell, and navigation.
- [ ] **Phase 2: Supabase Setup** &mdash; Cloud database creation, schema migrations, Row Level Security (RLS) policies, and authentication.
- [ ] **Phase 3: Student Management (CRUD)** &mdash; Full student lifecycle: Add, View, Edit, Search, and Archive students.
- [ ] **Phase 4: Availability & Preferences** &mdash; Weekly time periods, format preferences (1:1 &ndash; 1:4), and decimal level validation.
- [ ] **Phase 5: Find Players** &mdash; Player matching engine using overlapping level ranges and availability intersections.
- [ ] **Phase 6: Hardening & Cloud Deployment** &mdash; Production security review, multi-device testing, and hosting deployment.
