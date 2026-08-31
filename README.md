# TalentHive — Full-Scale Freelance Marketplace Platform

An original, production-oriented freelance marketplace (Upwork-style functionality, original brand
and design). Full-stack: **React + Vite** frontend, **Node.js + Express + MongoDB** backend, with a
replaceable **AI**, **payment**, **storage**, and **email** provider architecture.

> This is a serious SaaS product build, delivered incrementally across 15 phases. See
> [docs/ROADMAP.md](docs/ROADMAP.md) for phase status.

## Tech Stack

**Frontend:** React, Vite, React Router, JavaScript/JSX, Tailwind CSS, DaisyUI, Axios, TanStack Query,
React Hook Form, Zod, Recharts, Framer Motion, Lucide React, Socket.IO client.

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Socket.IO, Multer, Cloudinary
(abstracted), Nodemailer, Zod validation, Helmet, CORS, rate limiting, Pino logging.

## Monorepo Layout

```
.
├── client/     # React + Vite frontend
├── server/     # Node + Express + MongoDB backend
├── docs/       # Architecture, API, DB, AI, Security, Deployment docs
└── README.md
```

## Quick Start

```bash
# 1. Backend
cd server
cp .env.example .env      # fill in values (works out-of-the-box with in-memory Mongo)
npm install
npm run seed              # optional: realistic fictional seed data
npm run dev               # http://localhost:5000

# 2. Frontend (separate terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Zero-config dev database
If `MONGODB_URI` is not set, the server boots an **in-memory MongoDB** (`mongodb-memory-server`) so the
app runs with no external database installed. Set `MONGODB_URI` to use a real MongoDB / Atlas cluster.

### Development admin account (dev only — never use in production)
```
admin@example.com
ChangeMe123!
```

## Documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system architecture, folder structure, layering
- [docs/DATABASE.md](docs/DATABASE.md) — Mongoose schema plan and relationships
- [docs/API.md](docs/API.md) — REST endpoints and response format
- [docs/AI.md](docs/AI.md) — AI provider abstraction and cost control
- [docs/SECURITY.md](docs/SECURITY.md) — auth, RBAC, hardening
- [docs/ROADMAP.md](docs/ROADMAP.md) — 15-phase implementation roadmap and status

## License
Original work. Does not copy Upwork branding, assets, text, or proprietary source.
