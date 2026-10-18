/**
 * PearlDent Dental Clinic — SQLite Backend Server
 * Express + better-sqlite3
 * Runs on port 4000; Vite dev server proxies /api → http://localhost:4000
 */

import express from 'express';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SQLITE_DB_PATH || join(__dirname, 'pearldent.db');
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex'));
if (!AUTH_TOKEN_SECRET) throw new Error('AUTH_TOKEN_SECRET must be set in production.');

// ── Database setup ───────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT '₱',
    base_price REAL NOT NULL DEFAULT 0,
    is_starting_price INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
    icon TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'patient' CHECK(role IN ('patient','staff','admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
    avatar_url TEXT,
    password TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    service_id TEXT REFERENCES services(id) ON DELETE RESTRICT,
    appointment_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','completed','cancelled')),
    notes TEXT,
    email_sent INTEGER NOT NULL DEFAULT 0,
    email_sent_at TEXT,
    attachment_image_url TEXT,
    attachment_image_name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );

  CREATE TABLE IF NOT EXISTS dispatched_emails (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    to_email TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'delivered'
  );

  CREATE TABLE IF NOT EXISTS app_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
  );
`);

// ── Example data cleanup and staff initialization ────────────────────────────

function uuid() { return crypto.randomUUID(); }

function clearExampleData() {
  const migrationName = 'remove_seeded_example_data_v1';
  if (db.prepare('SELECT 1 FROM app_migrations WHERE name = ?').get(migrationName)) return;

  const exampleEmails = [
    'sarah.jenkins@example.com',
    'michael.chang@example.com',
    'elena.rostova@example.com',
    'david.m@example.com',
    'amara.okafor@example.com',
    'james.t@example.com',
  ];
  const exampleServices = [
    'Routine Teeth Cleaning & Polish',
    'Comprehensive Dental Exam & X-Rays',
    'Professional Teeth Whitening',
    'Simple Tooth Extraction',
    'Composite Dental Filling',
    'Root Canal Therapy (Endodontics)',
    'Orthodontic & Clear Aligner Consult',
    'Emergency Toothache Relief',
  ];
  const cleanup = db.transaction(() => {
    const placeholders = exampleEmails.map(() => '?').join(',');
    const exampleAppointments = db.prepare(
      `SELECT id FROM appointments WHERE patient_email IN (${placeholders})`
    ).all(...exampleEmails);
    const deleteEmails = db.prepare('DELETE FROM dispatched_emails WHERE appointment_id = ?');
    for (const appointment of exampleAppointments) deleteEmails.run(appointment.id);

    db.prepare(`DELETE FROM appointments WHERE patient_email IN (${placeholders})`).run(...exampleEmails);

    const servicePlaceholders = exampleServices.map(() => '?').join(',');
    db.prepare(`
      DELETE FROM services
      WHERE name IN (${servicePlaceholders})
        AND NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.service_id = services.id)
    `).run(...exampleServices);
    db.prepare('INSERT INTO app_migrations (name) VALUES (?)').run(migrationName);
  });

  cleanup();
}

function seedStaff() {
  const isProduction = process.env.NODE_ENV === 'production';
  const adminEmail = process.env.ADMIN_EMAIL || 'Paulo@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : 'Paulo@gmail.com');
  if (!adminPassword || (isProduction && adminPassword.length < 12)) {
    throw new Error('Set ADMIN_PASSWORD to at least 12 characters before starting in production.');
  }

  const staff = [
    { id: uuid(), full_name: 'Paulo (Admin)', email: adminEmail, password: adminPassword, role: 'admin', status: 'active' },
    ...(!isProduction ? [
      { id: uuid(), full_name: 'Jessica Reynolds (Front Desk Lead)', email: 'jessica@pearldent.clinic', password: 'jessica@pearldent.clinic', role: 'staff', status: 'active' },
      { id: uuid(), full_name: 'Marcus Bell (Patient Coordinator)', email: 'marcus@pearldent.clinic', password: 'marcus@pearldent.clinic', role: 'staff', status: 'active' },
    ] : []),
  ];
  const insertProfile = db.prepare(
    'INSERT OR IGNORE INTO profiles (id, full_name, email, role, status, password) VALUES (?,?,?,?,?,?)'
  );
  for (const profile of staff) {
    insertProfile.run(profile.id, profile.full_name, profile.email, profile.role, profile.status, hashPassword(profile.password));
  }
}

function seedCategories() {
  const categories = [
    { id: uuid(), name: 'Preventive Care', description: 'Routine checkups and cleaning' },
    { id: uuid(), name: 'Restorative', description: 'Fillings, crowns, and tooth repairs' },
    { id: uuid(), name: 'Cosmetics', description: 'Teeth whitening and aesthetic procedures' },
    { id: uuid(), name: 'Orthodontics', description: 'Braces and aligners' },
    { id: uuid(), name: 'Diagnostics', description: 'X-rays and oral examinations' },
    { id: uuid(), name: 'Urgent Care', description: 'Emergency dental services' },
    { id: uuid(), name: 'Surgical', description: 'Extractions and oral surgery' },
    { id: uuid(), name: 'Endodontics', description: 'Root canal and pulp therapy' },
  ];
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, description) VALUES (?,?,?)');
  for (const category of categories) insertCategory.run(category.id, category.name, category.description);
}

clearExampleData();
seedCategories();
seedStaff();

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();
app.use(express.json({ limit: '10mb' }));
app.set('trust proxy', 1);

// CORS for Vite dev (port 3000)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Helper ───────────────────────────────────────────────────────────────────
function boolInt(v) { return v ? 1 : 0; }

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword?.startsWith('scrypt:')) return password === storedPassword;
  const [, salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const suppliedHash = crypto.scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, 'hex');
  return expectedHash.length === suppliedHash.length && crypto.timingSafeEqual(suppliedHash, expectedHash);
}

function safeProfile(profile) {
  const { password, ...publicProfile } = profile;
  return publicProfile;
}

function createAccessToken(profile) {
  const payload = Buffer.from(JSON.stringify({
    sub: profile.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required.' });

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return res.status(401).json({ error: 'Invalid session.' });

  const expected = crypto.createHmac('sha256', AUTH_TOKEN_SECRET).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, 'base64url');
  } catch {
    return res.status(401).json({ error: 'Invalid session.' });
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Invalid session.' });
  }

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return res.status(401).json({ error: 'Invalid session.' });
  }
  if (!claims.sub || claims.exp <= Math.floor(Date.now() / 1000)) {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const profile = db.prepare(`
    SELECT id, full_name, email, role, status, avatar_url, phone, created_at
    FROM profiles WHERE id = ?
  `).get(claims.sub);
  if (!profile || profile.status !== 'active' || !['admin', 'staff'].includes(profile.role)) {
    return res.status(401).json({ error: 'This account is not active.' });
  }

  req.user = profile;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

const loginAttempts = new Map();

function limitLoginAttempts(req, res, next) {
  const now = Date.now();
  const address = req.ip || req.socket.remoteAddress || 'unknown';
  const attempts = (loginAttempts.get(address) || []).filter((time) => now - time < 15 * 60 * 1000);
  if (attempts.length >= 10) return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' });
  attempts.push(now);
  loginAttempts.set(address, attempts);
  next();
}

// ── CATEGORIES ───────────────────────────────────────────────────────────────

app.get('/api/categories', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});

app.post('/api/categories', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = uuid();
  db.prepare('INSERT INTO categories (id, name, description) VALUES (?,?,?)').run(id, name, description || '');
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id));
});

app.put('/api/categories/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description || '', req.params.id);
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id));
});

app.delete('/api/categories/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── SERVICES ─────────────────────────────────────────────────────────────────

app.get('/api/services', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, c.name AS category
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.status = 'active'
    ORDER BY s.name
  `).all();
  // Map column names to what the front-end expects
  res.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.base_price,
    duration_minutes: r.duration_minutes,
    category: r.category,
    category_id: r.category_id,
    icon: r.icon,
    currency: r.currency,
    is_starting_price: !!r.is_starting_price,
    status: r.status,
    created_at: r.created_at,
  })));
});

app.get('/api/services/all', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, c.name AS category
    FROM services s
    LEFT JOIN categories c ON s.category_id = c.id
    ORDER BY s.name
  `).all();
  res.json(rows.map(r => ({
    id: r.id, name: r.name, description: r.description,
    price: r.base_price, duration_minutes: r.duration_minutes,
    category: r.category, category_id: r.category_id,
    icon: r.icon, currency: r.currency,
    is_starting_price: !!r.is_starting_price, status: r.status,
    created_at: r.created_at,
  })));
});

app.post('/api/services', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description, price, duration_minutes, category_id, icon, currency, is_starting_price } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = uuid();
  db.prepare(`
    INSERT INTO services (id, name, description, base_price, duration_minutes, category_id, icon, currency, is_starting_price)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, name, description || '', Number(price) || 0, Number(duration_minutes) || 30, category_id || null, icon || null, currency || '₱', boolInt(is_starting_price));
  const row = db.prepare(`SELECT s.*, c.name AS category FROM services s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = ?`).get(id);
  res.json({ id: row.id, name: row.name, description: row.description, price: row.base_price, duration_minutes: row.duration_minutes, category: row.category, category_id: row.category_id, icon: row.icon, currency: row.currency, is_starting_price: !!row.is_starting_price, status: row.status });
});

app.put('/api/services/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { name, description, price, duration_minutes, category_id, icon, currency, is_starting_price, status } = req.body;
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`
    UPDATE services SET name=?, description=?, base_price=?, duration_minutes=?, category_id=?, icon=?, currency=?, is_starting_price=?, status=?
    WHERE id=?
  `).run(
    name ?? existing.name,
    description ?? existing.description,
    price !== undefined ? Number(price) : existing.base_price,
    duration_minutes !== undefined ? Number(duration_minutes) : existing.duration_minutes,
    category_id !== undefined ? category_id : existing.category_id,
    icon ?? existing.icon,
    currency ?? existing.currency,
    is_starting_price !== undefined ? boolInt(is_starting_price) : existing.is_starting_price,
    status ?? existing.status,
    req.params.id
  );
  const row = db.prepare(`SELECT s.*, c.name AS category FROM services s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = ?`).get(req.params.id);
  res.json({ id: row.id, name: row.name, description: row.description, price: row.base_price, duration_minutes: row.duration_minutes, category: row.category, category_id: row.category_id, icon: row.icon, currency: row.currency, is_starting_price: !!row.is_starting_price, status: row.status });
});

app.delete('/api/services/:id', requireAuth, requireRole('admin'), (req, res) => {
  // Soft delete (set inactive) so existing appointments aren't broken
  db.prepare("UPDATE services SET status = 'inactive' WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// ── PROFILES / STAFF ──────────────────────────────────────────────────────────

app.get('/api/staff', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare("SELECT * FROM profiles WHERE role IN ('admin','staff') ORDER BY created_at DESC").all();
  res.json(rows.map(safeProfile));
});

app.post('/api/staff', requireAuth, requireRole('admin'), (req, res) => {
  const { full_name, email, role, avatar_url, phone, password } = req.body;
  if (!full_name || !email) return res.status(400).json({ error: 'full_name and email are required' });
  if (typeof password !== 'string' || password.trim().length < 6) {
    return res.status(400).json({ error: 'A password of at least 6 characters is required.' });
  }
  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(400).json({ error: 'A staff member with this email already exists.' });
  const id = uuid();
  db.prepare(`INSERT INTO profiles (id, full_name, email, role, avatar_url, phone, password) VALUES (?,?,?,?,?,?,?)`).run(
    id, full_name, email.toLowerCase().trim(), role || 'staff', avatar_url || null, phone || null, hashPassword(password.trim())
  );
  res.json(safeProfile(db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)));
});

app.put('/api/staff/:id', requireAuth, requireRole('admin'), (req, res) => {
  const { full_name, role, status, avatar_url, phone, password } = req.body;
  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(`UPDATE profiles SET full_name=?, role=?, status=?, avatar_url=?, phone=?, password=? WHERE id=?`).run(
    full_name ?? existing.full_name,
    role ?? existing.role,
    status ?? existing.status,
    avatar_url !== undefined ? avatar_url : existing.avatar_url,
    phone !== undefined ? phone : existing.phone,
    password !== undefined ? hashPassword(String(password).trim()) : existing.password,
    req.params.id
  );
  res.json(safeProfile(db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id)));
});

app.patch('/api/staff/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE profiles SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

app.delete('/api/staff/:id', requireAuth, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/auth/login', limitLoginAttempts, (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare("SELECT * FROM profiles WHERE lower(email) = ? AND role IN ('staff','admin')").get(normalizedEmail);
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Staff account not found for this email.' });

  const suppliedPassword = typeof password === 'string' ? password.trim() : '';
  const storedPassword = typeof user.password === 'string' ? user.password.trim() : '';
  if (!suppliedPassword || !verifyPassword(suppliedPassword, storedPassword)) {
    return res.status(401).json({ error: 'Incorrect password for this staff account.' });
  }

  if (!storedPassword.startsWith('scrypt:')) {
    db.prepare('UPDATE profiles SET password = ? WHERE id = ?').run(hashPassword(suppliedPassword), user.id);
  }
  loginAttempts.delete(req.ip || req.socket.remoteAddress || 'unknown');

  res.json({ profile: safeProfile(user), token: createAccessToken(user) });
});

// ── APPOINTMENTS ──────────────────────────────────────────────────────────────

function joinedAppointments(rows) {
  const svcIds = [...new Set(rows.map(r => r.service_id).filter(Boolean))];
  const svcMap = {};
  if (svcIds.length) {
    db.prepare(`SELECT * FROM services WHERE id IN (${svcIds.map(() => '?').join(',')})`)
      .all(...svcIds)
      .forEach(s => { svcMap[s.id] = { id: s.id, name: s.name, description: s.description, price: s.base_price, duration_minutes: s.duration_minutes, icon: s.icon, currency: s.currency }; });
  }
  return rows.map(r => ({
    ...r,
    email_sent: !!r.email_sent,
    service: svcMap[r.service_id] || null,
  }));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

async function sendApprovalEmail(appointment) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const service = db.prepare('SELECT name FROM services WHERE id = ?').get(appointment.service_id);
  const serviceName = service?.name || 'Dental Care';
  const subject = `Your Dental Visit is Approved: ${serviceName} on ${appointment.appointment_date} at ${appointment.time_slot}`;
  const bodyText = `Dear ${appointment.patient_name},\n\nYour appointment for ${serviceName} on ${appointment.appointment_date} at ${appointment.time_slot} has been confirmed.\n\nWarm regards,\nPearlDent Clinic`;
  const bodyHtml = `<p>Dear <strong>${escapeHtml(appointment.patient_name)}</strong>,</p><p>Your appointment for <strong>${escapeHtml(serviceName)}</strong> on ${escapeHtml(appointment.appointment_date)} at ${escapeHtml(appointment.time_slot)} has been confirmed.</p><p>Warm regards,<br>PearlDent Clinic</p>`;
  const email = {
    id: uuid(),
    appointment_id: appointment.id,
    to_email: appointment.patient_email,
    patient_name: appointment.patient_name,
    subject,
    body_text: bodyText,
    body_html: bodyHtml,
    sent_at: new Date().toISOString(),
    status: 'failed',
  };

  if (!apiKey || !from) {
    return { email, emailDispatched: false, error: 'Email is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL in the service environment.' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [appointment.patient_email], subject, html: bodyHtml, text: bodyText }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { email, emailDispatched: false, error: result.message || `Email provider returned HTTP ${response.status}.` };
    }
    return { email: { ...email, status: 'sent' }, emailDispatched: true, providerMessageId: result.id };
  } catch (error) {
    console.error('Approval email request failed:', error);
    return { email, emailDispatched: false, error: 'Could not connect to the email provider.' };
  }
}

function saveEmailLog(email) {
  db.prepare(`
    INSERT INTO dispatched_emails (id,appointment_id,to_email,patient_name,subject,body_text,body_html,sent_at,status)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(
    email.id, email.appointment_id, email.to_email, email.patient_name,
    email.subject, email.body_text, email.body_html, email.sent_at, email.status
  );
}

app.get('/api/appointments/availability', (req, res) => {
  const rows = db.prepare(`
    SELECT appointment_date, time_slot, status
    FROM appointments
    WHERE status != 'cancelled' AND appointment_date >= date('now')
    ORDER BY appointment_date ASC, time_slot ASC
  `).all();
  res.json(rows);
});

app.get('/api/appointments', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments ORDER BY appointment_date ASC, time_slot ASC').all();
  res.json(joinedAppointments(rows));
});

app.post('/api/appointments', (req, res) => {
  const { patient_name, patient_email, patient_phone, service_id, appointment_date, time_slot, notes, attachment_image_url, attachment_image_name } = req.body;
  if (!patient_name || !patient_email || !patient_phone || !service_id || !appointment_date || !time_slot) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const id = uuid();
  db.prepare(`
    INSERT INTO appointments (id, patient_name, patient_email, patient_phone, service_id, appointment_date, time_slot, notes, attachment_image_url, attachment_image_name)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, patient_name, patient_email, patient_phone, service_id, appointment_date, time_slot, notes || '', attachment_image_url || null, attachment_image_name || null);
  const row = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.json(joinedAppointments([row])[0]);
});

app.patch('/api/appointments/:id/status', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) return res.status(404).json({ error: 'Not found' });

  let emailDispatched = false;
  let emailRecord = null;
  let emailError;

  if (status === 'confirmed' && !apt.email_sent) {
    const result = await sendApprovalEmail(apt);
    emailRecord = result.email;
    emailDispatched = result.emailDispatched;
    emailError = result.error;
    saveEmailLog(emailRecord);
    if (emailDispatched) {
      db.prepare('UPDATE appointments SET status=?, email_sent=1, email_sent_at=? WHERE id=?')
        .run(status, emailRecord.sent_at, req.params.id);
    } else {
      db.prepare('UPDATE appointments SET status=? WHERE id=?').run(status, req.params.id);
    }
  } else {
    db.prepare("UPDATE appointments SET status=? WHERE id=?").run(status, req.params.id);
  }

  res.json({ success: true, emailDispatched, email: emailRecord, emailError });
});

app.post('/api/appointments/:id/approval-email/resend', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
  if (appointment.status !== 'confirmed') return res.status(409).json({ error: 'Only approved appointments can receive a confirmation email.' });

  const result = await sendApprovalEmail(appointment);
  saveEmailLog(result.email);
  if (result.emailDispatched) {
    db.prepare('UPDATE appointments SET email_sent=1, email_sent_at=? WHERE id=?')
      .run(result.email.sent_at, appointment.id);
  }
  res.json({ success: result.emailDispatched, emailDispatched: result.emailDispatched, email: result.email, emailError: result.error });
});

app.patch('/api/appointments/:id/attachment', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const { attachment_image_url, attachment_image_name } = req.body;
  db.prepare("UPDATE appointments SET attachment_image_url=?, attachment_image_name=? WHERE id=?")
    .run(attachment_image_url || null, attachment_image_name || null, req.params.id);
  res.json({ success: true });
});

app.delete('/api/appointments/:id/attachment', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  db.prepare("UPDATE appointments SET attachment_image_url=NULL, attachment_image_name=NULL WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// ── DISPATCHED EMAILS ─────────────────────────────────────────────────────────

app.get('/api/emails', requireAuth, requireRole('admin', 'staff'), (req, res) => {
  const rows = db.prepare('SELECT * FROM dispatched_emails ORDER BY sent_at DESC').all();
  res.json(rows);
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ ok: true }));

const DIST_PATH = join(__dirname, '..', 'dist');
if (existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(join(DIST_PATH, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || process.env.API_PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦷 PearlDent API server running on http://localhost:${PORT}`);
});
