/**
 * PearlDent — API Client (SQLite backend)
 * Replaces localStorage / Supabase with REST calls to the Express server.
 * The server proxies /api → http://localhost:4000 via Vite's proxy config.
 */

import {
  Database,
  Service,
  Appointment,
  Profile,
  NewAppointmentInput,
  AppointmentStatus,
  UserRole,
  DispatchedEmail,
  Category,
} from '../types/database';

const BASE = '/api';
let accessToken: string | null = null;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || String(res.status));
  }
  return res.json() as Promise<T>;
}

// ── Supabase config stub (kept for compatibility with App.tsx banner) ─────────
export const getSupabaseConfig = () => ({
  url: '',
  anonKey: '',
  isConfigured: true, // always show as "connected" since we have our own backend
});
export const setCustomSupabaseConfig = () => {};
export const supabase = null;

// ── Session user (in-memory; no localStorage) ─────────────────────────────────
let _sessionUser: Profile | null = null;

export const getSessionUser = (): Profile | null => _sessionUser;
export const setSessionUser = (user: Profile | null) => {
  _sessionUser = user;
  if (!user) accessToken = null;
};

// ── Default data stubs (kept for backward compatibility) ──────────────────────
export const DEFAULT_SERVICES: Service[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_STAFF: Profile[] = [];

// High-fidelity staff avatar presets (unchanged)
export const STAFF_AVATAR_PRESETS = [
  {
    id: 'doctor-male',
    label: 'Dr. Gregory (Dentist)',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%230f766e' rx='50'/><circle cx='50' cy='38' r='18' fill='%23fed7aa'/><path d='M32 30c0-9 8-15 18-15s18 6 18 15v4H32z' fill='%23334155'/><path d='M20 86c0-16 13-26 30-26s30 10 30 26z' fill='%23ffffff'/><path d='M44 60h12v26H44z' fill='%230d9488'/><circle cx='50' cy='74' r='4' fill='%2338bdf8'/></svg>",
  },
  {
    id: 'hygienist-female',
    label: 'Jessica (Hygienist)',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%230284c7' rx='50'/><circle cx='50' cy='39' r='18' fill='%23fde047'/><path d='M30 36c0-12 9-18 20-18s20 6 20 18v8c0 8-5 12-10 12h-20c-5 0-10-4-10-12z' fill='%2378350f'/><circle cx='50' cy='39' r='17' fill='%23fef08a'/><path d='M22 86c0-16 12-25 28-25s28 9 28 25z' fill='%23e0f2fe'/><path d='M45 61h10v25H45z' fill='%230284c7'/></svg>",
  },
  {
    id: 'coordinator-male',
    label: 'Marcus (Coordinator)',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%236366f1' rx='50'/><circle cx='50' cy='38' r='18' fill='%23fed7aa'/><path d='M32 30c0-8 8-14 18-14s18 6 18 14z' fill='%231e293b'/><path d='M22 86c0-15 12-25 28-25s28 10 28 25z' fill='%23312e81'/><path d='M46 61h8v25h-8z' fill='%23e0e7ff'/></svg>",
  },
  {
    id: 'patient-avatar-1',
    label: 'Patient (Alex)',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23f59e0b' rx='50'/><circle cx='50' cy='38' r='18' fill='%23fed7aa'/><path d='M32 32c0-8 8-15 18-15s18 7 18 15z' fill='%2392400e'/><path d='M22 86c0-15 12-24 28-24s28 9 28 24z' fill='%23fde68a'/></svg>",
  },
  {
    id: 'patient-avatar-2',
    label: 'Patient (Sarah)',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23ec4899' rx='50'/><circle cx='50' cy='39' r='18' fill='%23fef08a'/><path d='M28 35c0-12 9-19 22-19s22 7 22 19v12H28z' fill='%23451a03'/><circle cx='50' cy='39' r='17' fill='%23fed7aa'/><path d='M22 86c0-15 12-24 28-24s28 9 28 24z' fill='%23fbcfe8'/></svg>",
  },
];

// ── Auth ──────────────────────────────────────────────────────────────────────

export const loginStaff = async (email: string, password?: string): Promise<Profile> => {
  const result = await apiFetch<{ profile: Profile; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  accessToken = result.token;
  return result.profile;
};

// ── Services ──────────────────────────────────────────────────────────────────

export const fetchServices = (): Promise<Service[]> =>
  apiFetch<Service[]>('/services');

export const fetchAllServices = (): Promise<Service[]> =>
  apiFetch<Service[]>('/services/all');

export const addService = async (
  input: Omit<Service, 'id'>
): Promise<{ success: boolean; service?: Service; error?: string }> => {
  try {
    const service = await apiFetch<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { success: true, service };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateService = async (
  id: string,
  updates: Partial<Service>
): Promise<{ success: boolean; service?: Service; error?: string }> => {
  try {
    const service = await apiFetch<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return { success: true, service };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const deleteService = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/services/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const fetchCategories = (): Promise<Category[]> =>
  apiFetch<Category[]>('/categories');

export const addCategory = async (
  name: string
): Promise<{ success: boolean; category?: Category; error?: string }> => {
  try {
    const category = await apiFetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return { success: true, category };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateCategory = async (
  id: string,
  name: string
): Promise<{ success: boolean; category?: Category; error?: string }> => {
  try {
    const category = await apiFetch<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return { success: true, category };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const deleteCategory = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// ── Appointments ──────────────────────────────────────────────────────────────

export const fetchAppointments = (): Promise<Appointment[]> =>
  apiFetch<Appointment[]>('/appointments');

export type AppointmentAvailability = Pick<Appointment, 'appointment_date' | 'time_slot' | 'status'>;

export const fetchAppointmentAvailability = (): Promise<AppointmentAvailability[]> =>
  apiFetch<AppointmentAvailability[]>('/appointments/availability');

export const createAppointment = async (
  input: NewAppointmentInput
): Promise<{ success: boolean; appointment?: Appointment; error?: string }> => {
  try {
    const appointment = await apiFetch<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return { success: true, appointment };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  newStatus: AppointmentStatus
): Promise<{ success: boolean; emailDispatched?: boolean; email?: DispatchedEmail; error?: string }> => {
  try {
    const result = await apiFetch<{ success: boolean; emailDispatched: boolean; email?: DispatchedEmail }>(
      `/appointments/${appointmentId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status: newStatus }) }
    );
    return result;
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateAppointmentAttachment = async (
  appointmentId: string,
  imageUrl: string,
  imageName: string = 'dental_photo.jpg'
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/appointments/${appointmentId}/attachment`, {
      method: 'PATCH',
      body: JSON.stringify({ attachment_image_url: imageUrl, attachment_image_name: imageName }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const deleteAppointmentAttachment = async (
  appointmentId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/appointments/${appointmentId}/attachment`, { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// ── Staff / Profiles ──────────────────────────────────────────────────────────

export const fetchStaffMembers = (): Promise<Profile[]> =>
  apiFetch<Profile[]>('/staff');

export const createStaffAccount = async (
  fullName: string,
  email: string,
  role: UserRole = 'staff',
  avatarUrl?: string,
  password?: string
): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
  try {
    const profile = await apiFetch<Profile>('/staff', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, role, avatar_url: avatarUrl, password }),
    });
    return { success: true, profile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateStaffStatus = async (
  id: string,
  status: 'active' | 'inactive'
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const updateStaffProfile = async (
  id: string,
  updates: Partial<Profile>
): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
  try {
    const profile = await apiFetch<Profile>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    // Keep in-memory session in sync
    if (_sessionUser && _sessionUser.id === id) {
      _sessionUser = profile;
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pearldent:profile_updated', { detail: profile }));
      window.dispatchEvent(new CustomEvent('pearldent:staff_updated', { detail: profile }));
    }
    return { success: true, profile };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const deleteStaffAccount = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await apiFetch(`/staff/${id}`, { method: 'DELETE' });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

// ── Dispatched Emails ─────────────────────────────────────────────────────────

export const getDispatchedEmails = async (): Promise<DispatchedEmail[]> =>
  apiFetch<DispatchedEmail[]>('/emails');

// generateApprovalEmail is now handled server-side when status → confirmed.
// This stub keeps existing import references happy.
export const generateApprovalEmail = (appointment: Appointment): DispatchedEmail => ({
  id: 'local-' + Date.now(),
  appointment_id: appointment.id,
  to_email: appointment.patient_email,
  patient_name: appointment.patient_name,
  subject: `Appointment Confirmed — ${appointment.appointment_date} at ${appointment.time_slot}`,
  body_text: `Dear ${appointment.patient_name}, your appointment has been confirmed.`,
  body_html: `<p>Dear ${appointment.patient_name}, your appointment has been confirmed.</p>`,
  sent_at: new Date().toISOString(),
  status: 'delivered',
});

// ── Local storage stubs (kept for import compatibility) ───────────────────────
// The Dashboard component imports these; we provide no-op versions so it compiles.
export const getLocalAppointments = (): Appointment[] => [];
export const saveLocalAppointments = (_: Appointment[]) => {};
export const getLocalServices = (): Service[] => [];
export const saveLocalServices = (_: Service[]) => {};
export const getLocalStaff = (): Profile[] => [];
export const saveLocalStaff = (_: Profile[]) => {};
export const LS_DISPATCHED_EMAILS_KEY = 'pearldent_dispatched_emails_v1';
