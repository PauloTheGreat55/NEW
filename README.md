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

- **Node.js** 18+ and npm

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

Open **Staff & Admin Login** and sign in with a clinic account's email and password. The seeded administrator account is `Paulo@gmail.com`.

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
- GET /api/appointments - List all appointments
- POST /api/appointments - Create appointment
- PATCH /api/appointments/:id/status - Update status (triggers email on confirm)

### Staff/Profiles
- GET /api/staff - List staff and admin accounts
- POST /api/staff - Create staff account
- POST /api/auth/login - Login (email lookup)

## 🎨 Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite, Lucide Icons
- **Backend**: Node.js, Express, better-sqlite3
- **Database**: SQLite 3 (file-based, zero config)

## 📝 Notes

- The database file (`server/pearldent.db`) persists across restarts
- Email notifications are logged but not actually sent
- Session management is in-memory (refreshing logs you out)
- For production use, add proper authentication and password hashing

---

**Built with ❤️ for PearlDent Dental Clinic**
