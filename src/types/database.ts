export type UserRole = 'patient' | 'staff' | 'admin';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  status?: 'active' | 'inactive';
  created_at?: string;
  email?: string;
  avatar_url?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description?: string;
  category?: string;
  category_id?: string | null;
  icon?: string;
  image_url?: string;
}

export interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  time_slot: string; // e.g. "09:00 AM"
  status: AppointmentStatus;
  created_at: string;
  notes?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  attachment_image_url?: string;
  attachment_image_name?: string;
  // joined service
  service?: Service;
}

export interface DispatchedEmail {
  id: string;
  appointment_id: string;
  to_email: string;
  patient_name: string;
  subject: string;
  body_text: string;
  body_html: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface NewAppointmentInput {
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  service_id: string;
  appointment_date: string;
  time_slot: string;
  notes?: string;
  attachment_image_url?: string;
  attachment_image_name?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id'>;
        Update: Partial<Omit<Service, 'id'>>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'id' | 'created_at' | 'status' | 'service'> & {
          status?: AppointmentStatus;
        };
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'service'>>;
      };
    };
  };
}
