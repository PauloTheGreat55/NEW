# 🦷 PearlDent Dental Clinic Booking System

A full-stack dental clinic management system with **SQLite database**, **Express REST API**, and **React + TypeScript** frontend.

## ✨ Features

- **Patient Booking Wizard**: 3-step appointment scheduling with service selection
- **Staff Dashboard**: Manage appointments, services, categories, and staff accounts
- **Admin Panel**: Full CRUD for services, categories, and user management
- **Email Notifications**: Automated approval emails when appointments are confirmed
- **Philippine Peso (₱) Pricing**: Built-in support for PHP currency
- **Categories Management**: Organize services by categories (Preventive, Restorative, Cosmetics, etc.)
- **SQLite Backend**: Zero-config database that runs locally
- **REST API**: Clean Express.js backend with proper separation of concerns

## 🚀 Quick Start

### Prerequisites

- **Node.js** 22+ and npm

### Installation & Running

```bash
# 1. Install all dependencies (root + server)
npm run install:all

# 2. Start both API server (port 4000) and React UI (port 3000)
npm run dev
```

The app will open at **http://localhost:3000**

- API server runs on **http://localhost:4000**
- SQLite database file: `server/pearldent.db` (auto-created on first run)

## Public Demo Deployment

The repository includes a Render blueprint for a free web service at a `onrender.com` address. Free Render filesystems are temporary, so SQLite data may be lost when the service restarts or redeploys. Do not use the free deployment for real patient records; persistent storage requires a persistent disk or managed database.

## 📂 Project Structure

```
pearldent-sqlite/
├── server/
│   ├── index.js          # Express + SQLite backend
│   ├── package.json      # Server dependencies
│   └── pearldent.db      # SQLite database (auto-generated)
├── src/
│   ├── components/       # React components
│   ├── lib/
│   │   └── supabase.ts   # API client (REST calls to Express)
│   ├── types/
│   │   └── database.ts   # TypeScript types
│   └── App.tsx           # Main React app
├── package.json          # Root package with scripts
└── vite.config.ts        # Vite config with API proxy
```

## 🗄️ Database Schema

The SQLite database includes:

- **profiles**: Staff and admin accounts
- **categories**: Service categories (Preventive Care, Restorative, etc.)
- **services**: Dental services with pricing, duration, and category links
- **appointments**: Patient bookings with status tracking
- **dispatched_emails**: Email notification logs

### Pre-seeded Data

The database starts without sample patient appointments, dental services, or prices. The administrator can add the clinic's real services and prices in the Staff Portal.

## 🔑 Staff Portal Login

Open **Staff Portal** and sign in with a clinic account's email and password. Local development seeds `Paulo@gmail.com`; production requires a private `ADMIN_PASSWORD` environment variable and does not seed demo staff accounts.

## 🛠️ Available Scripts

```bash
npm run dev          # Start both server and client
npm run server       # Start API server only (port 4000)
npm run client       # Start Vite dev server only (port 3000)
npm run build        # Build for production
npm run install:all  # Install all dependencies
npm run clean        # Remove build artifacts and database
```

## 📡 API Endpoints

### Categories
- GET /api/categories - List all categories
- POST /api/categories - Create category
- PUT /api/categories/:id - Update category
- DELETE /api/categories/:id - Delete category

### Services
- GET /api/services - List active services
- GET /api/services/all - List all services (including inactive)
- POST /api/services - Create service
- PUT /api/services/:id - Update service
- DELETE /api/services/:id - Soft-delete service

### Appointments
- GET /api/appointments - List appointments (staff/admin session required)
- GET /api/appointments/availability - Public appointment time availability only
- POST /api/appointments - Create appointment
- PATCH /api/appointments/:id/status - Update status (staff/admin session required)

### Staff/Profiles
- GET /api/staff - List staff and admin accounts (admin session required)
- POST /api/staff - Create staff account (admin session required)
- POST /api/auth/login - Sign in and receive an expiring bearer token

## 🎨 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons
- **Backend**: Node.js, Express, better-sqlite3
- **Database**: SQLite 3 (file-based, zero config)

## 📝 Notes

- The database file (`server/pearldent.db`) persists across restarts
- Approval emails are logged and sent through Resend when configured
- Login sessions are held in memory in the browser; refreshing signs you out
- Free Render storage is ephemeral; do not store real patient records there
- Approval emails send through Resend after an authenticated staff/admin confirmation. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in Render; the sender domain must be verified with Resend.

---

**Built with ❤️ for PearlDent Dental Clinic**

## AI Studio Attribution

<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  <h1>Built with AI Studio</h2>

  <p>The fastest path from prompt to production with Gemini.</p>

  <a href="https://aistudio.google.com/apps">Start building</a>

</div>
