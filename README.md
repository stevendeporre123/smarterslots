# Apartment Visit Slot Booker

A minimal booking tool for 20-minute visit time slots (Node.js + Express + SQLite + EJS).
Includes an admin area with login, bulk slot generation, notes, and booking on behalf of a visitor.
Styled with Tailwind (Slate) via CDN. Docker included.

## Quick start (local)
```bash
npm install
cp .env.example .env
npm start   # or: npm run dev
```
- Public: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Docker
```bash
docker compose up -d --build
```

## Bulk generation
In admin: pick **date**, **start**, **end**, **duration** (default 20). End time is exclusive.
Existing slots are kept (no duplicates).
