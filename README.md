# TalentLens AI

**AI-Powered HR Recruitment & Portfolio Evaluation Platform**

TalentLens AI is a production-quality, full-stack applicant screening system that combines automated resume parsing, GitHub code verification, ATS scoring, AI-driven job matching, and interactive recruiter dashboards into a single unified platform.

---

## ✨ Features

### Recruiter (HR) Portal
- **AI Resume Screening** — Bulk upload resumes (PDF, DOCX, TXT) and let the AI pipeline parse, score, and rank candidates automatically.
- **ATS Scoring Engine** — Weighted 6-factor scoring: Skill Match (40%), Experience (20%), Keyword Relevance (15%), Project Relevance (15%), Education (5%), Resume Structure (5%).
- **GitHub Code Verification** — Cross-references resume claims against actual repository files, dependencies, and commit patterns to detect supported vs. unverified claims.
- **Job Dashboard & Kanban Board** — Interactive pipeline views (New → AI Screened → Review → Shortlisted → Interview → Offer → Rejected) with quick stage transitions.
- **Candidate Comparison Matrix** — Side-by-side multi-candidate comparisons with score breakdowns, strengths, and gap analysis.
- **Semantic Talent Search** — Keyword-based search across all candidate skills, verification logs, and job fit summaries with evidence-backed explanations.
- **Recruiter Private Notes** — Organization-isolated note-taking per candidate (never visible to applicants).
- **AI Interview Questions** — Auto-generated targeted interview questions based on identified skill gaps.
- **Hiring Reports** — Downloadable CSV/JSON reports for off-platform ATS integrations.
- **Audit Logs** — Complete activity trail of all recruiter actions per organization.

### Applicant Portal
- **Application Dashboard** — View all submitted applications with real-time status tracking and pipeline progress.
- **Profile Manager** — Update contact info, GitHub URL, and portfolio links.
- **AI Feedback & Tips** — Personalized improvement recommendations based on AI evaluation results.

### Security & Architecture
- **JWT Cookie Authentication** — Secure httpOnly cookie sessions with 7-day expiry.
- **Tenant Isolation** — All recruiter queries are scoped to `organizationId`.
- **Role-Based Access Control** — Middleware-enforced route protection for HR, Applicant, and public pages.
- **Background Job Processing** — In-process, database-backed queue worker for async resume screening.
- **AI Provider Abstraction** — Supports OpenAI (GPT-4o-mini) and Google Gemini APIs, with intelligent deterministic fallback for offline/development use.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Vanilla CSS |
| Backend | Next.js App Router API Routes |
| Database | SQLite (dev) / PostgreSQL (production) via Prisma 5 |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Resume Parsing | pdf-parse, mammoth (DOCX) |
| AI/LLM | OpenAI API, Gemini API, Deterministic fallback |
| Charts | Recharts |
| Icons | Lucide React |
| Validation | Zod |
| Testing | Jest + ts-jest |
| Containerization | Docker + Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone & Install
```bash
git clone <repository-url>
cd talentlens-ai
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key-here"

# Optional — Enable live AI (leave blank for deterministic offline mode):
GEMINI_API_KEY=""
OPENAI_API_KEY=""
```

### 3. Initialize Database
```bash
npx prisma db push
npm run seed
```

This creates the SQLite database and seeds it with:
- 3 Job postings (Full Stack Developer, Data Scientist, UI/UX Designer)
- 22 Mock candidates with realistic profiles and scores
- 1 Admin recruiter account

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Demo Login
Click **"Try Demo as Recruiter"** on the landing page, or log in with:
- **Email:** `admin@talentlens.ai`
- **Password:** `password123`

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

Test coverage includes:
- **ATS Scoring Engine** — 13 tests covering strong/weak candidate scoring, sub-score breakdowns, edge cases, and education matching.
- **Authentication Module** — 10 tests covering JWT signing, verification, tamper detection, and session roundtripping.
- **AI Service (Mock Mode)** — 14 tests covering resume parsing, claim verification, and job description analysis.

---

## 🐳 Docker Deployment

### Production (Docker Compose)
```bash
# Build and start all services
docker-compose up --build -d

# Run database migrations
docker-compose exec app npx prisma db push

# Seed initial data
docker-compose exec app node prisma/seed.js
```

### Services
| Service | Port | Description |
|---|---|---|
| `app` | 3000 | TalentLens AI Next.js Application |
| `db` | 5432 | PostgreSQL 16 Database |

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string |
| `AUTH_SECRET` | Yes | JWT signing secret (change in production!) |
| `GEMINI_API_KEY` | No | Google Gemini API key for live AI |
| `OPENAI_API_KEY` | No | OpenAI API key for live AI |

---

## 📁 Project Structure

```
talentlens-ai/
├── prisma/
│   ├── schema.prisma          # Database schema (10 models)
│   ├── seed.js                # Database seeding script
│   └── dev.db                 # SQLite database (auto-generated)
├── src/
│   ├── app/
│   │   ├── api/               # Backend API routes
│   │   │   ├── auth/          # register, login, logout, me
│   │   │   ├── jobs/          # CRUD job postings
│   │   │   ├── applicants/    # upload, queue status, profile
│   │   │   ├── applications/  # list, detail, stage updates
│   │   │   ├── reports/       # CSV/JSON export
│   │   │   └── audits/        # Activity logs
│   │   ├── hr/                # Recruiter UI pages
│   │   │   ├── dashboard/     # Main recruiter dashboard
│   │   │   ├── jobs/[id]/     # Job dashboard + Kanban
│   │   │   ├── applications/[id]/ # Candidate detail analysis
│   │   │   ├── compare/       # Side-by-side comparison
│   │   │   └── search/        # Semantic talent search
│   │   ├── applicant/         # Applicant UI pages
│   │   │   └── dashboard/     # Applicant portal
│   │   ├── login/             # Authentication pages
│   │   ├── register/
│   │   ├── globals.css        # Design system tokens
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   └── Navbar.tsx         # Shared navigation
│   ├── db/
│   │   └── prisma.ts          # Prisma client singleton
│   ├── lib/
│   │   └── auth.ts            # JWT auth utilities
│   ├── middleware.ts           # Route protection
│   └── services/
│       ├── ai/                # LLM provider + prompts
│       ├── github/            # GitHub repo analyzer
│       ├── queue/             # Background job processor
│       ├── resume/            # PDF/DOCX text parser
│       ├── scoring/           # ATS scoring engine
│       └── screening/         # Claim verifier
├── tests/
│   ├── ats-scoring.test.ts    # ATS engine tests
│   ├── auth.test.ts           # Auth module tests
│   └── ai-service.test.ts     # AI mock mode tests
├── Dockerfile                 # Multi-stage production build
├── docker-compose.yml         # Full stack orchestration
├── .env.example               # Environment template
└── package.json
```

---

## 🔒 Security Considerations

- **Passwords** are hashed with bcrypt (cost factor 12).
- **JWT tokens** are stored in httpOnly, secure, SameSite=Lax cookies.
- **Tenant isolation** ensures recruiters can only see data within their organization.
- **Input validation** via Zod schemas on all API endpoints.
- **Rate limiting** should be added for production deployments (e.g., via Nginx or Cloudflare).
- **CORS** is handled by Next.js's built-in middleware.

---

## 📝 License

MIT License. See [LICENSE](LICENSE) for details.

---

Built with ❤️ by TalentLens AI
