# 🦷 PearlDent Setup Guide

## Quick Start (3 steps)

### 1️⃣ Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2️⃣ Start the Application

```bash
npm run dev
```

This will start:
- **API Server** on http://localhost:4000
- **React UI** on http://localhost:3000

### 3️⃣ Open in Browser

Navigate to **http://localhost:3000**

The SQLite database (`server/pearldent.db`) will be automatically created and seeded with demo data on first run.

---

## What's Included

✅ **Pre-seeded Data**:
- 4 Staff/Admin accounts
- 8 Service categories (Preventive Care, Restorative, Cosmetics, etc.)
- 8 Dental services with Philippine Peso (₱) pricing
- 6 Sample appointments

✅ **Demo Accounts**:
- Admin: `Paulo18@gmail.com`
- Admin: `admin@pearldent.clinic`
- Staff: `jessica@pearldent.clinic`
- Staff: `marcus@pearldent.clinic`

---

## Troubleshooting

**Port already in use?**
```bash
# Kill the process and try again
# Or change ports in package.json
```

**Dependencies not installing?**
```bash
# Try with --legacy-peer-deps
npm install --legacy-peer-deps
cd server && npm install --legacy-peer-deps
```

**Database error?**
```bash
# Delete the database and restart
rm server/pearldent.db
npm run dev
```

---

## Project Structure

```
pearldent-sqlite/
├── server/
│   ├── index.js          # Express + SQLite backend
│   ├── package.json      # Server dependencies
│   └── pearldent.db      # Database (auto-created)
├── src/
│   ├── components/       # React components
│   ├── lib/supabase.ts   # API client
│   └── App.tsx
├── package.json          # Root scripts
└── vite.config.ts        # Vite config with proxy
```

---

For full documentation, see **README.md**
