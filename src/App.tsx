/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientExperience } from './components/PatientExperience';
import { BookingWizard } from './components/BookingWizard';
import { Dashboard } from './components/Dashboard';
import { ClinicInfo } from './components/ClinicInfo';
import { Profile, Appointment } from './types/database';
import { getSessionUser, setSessionUser } from './lib/supabase';
import { Calendar, CheckCircle, ArrowRight, Heart } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'book' | 'dashboard' | 'info'>('book');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize session user and listen for updates
  useEffect(() => {
    const user = getSessionUser();
    if (user) {
      setCurrentUser(user);
    }

    const handleProfileUpdated = (e: any) => {
      const updated = e.detail;
      if (updated && currentUser?.id === updated.id) {
        setCurrentUser(updated);
      } else {
        const u = getSessionUser();
        if (u) setCurrentUser(u);
      }
    };

    window.addEventListener('pearldent:profile_updated', handleProfileUpdated);
    return () => {
      window.removeEventListener('pearldent:profile_updated', handleProfileUpdated);
    };
  }, [currentUser?.id]);

  const handleLogin = (user: Profile) => {
    setCurrentUser(user);
    setSessionUser(user);
    setActiveView('dashboard');
    showToast(`Signed in as ${user.full_name} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSessionUser(null);
    setActiveView('book');
    showToast('Signed out of Staff portal');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleBookingComplete = (apt: Appointment) => {
    showToast(`Appointment confirmed for ${apt.patient_name}!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Notification Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-medium py-2.5 px-4 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header / Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Sub-Header Notice / Quick Switcher Banner */}
      <div className="bg-white border-b border-slate-200/80 py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-700">PearlDent Clinical System:</span>
            <span>Running in Local Interactive Demo</span>
          </div>

          <div className="flex items-center gap-3">
            {activeView !== 'book' && (
              <button
                onClick={() => setActiveView('book')}
                className="text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
              >
                <span>Switch to Patient Booking</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1">
        {activeView === 'book' && (
          <PatientExperience
            onBookingComplete={handleBookingComplete}
          />
        )}

        {activeView === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onGoToBook={() => setActiveView('book')}
          />
        )}

        {activeView === 'info' && (
          <ClinicInfo onGoToBook={() => setActiveView('book')} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">PearlDent Dental Clinic</span>
            <span>·</span>
            <span>742 Evergreen Terrace, Suite 300</span>
            <span>·</span>
            <span>Tel: +1 (800) 555-DENT</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('book')}
              className="hover:text-slate-800 transition-colors"
            >
              Patient Booking
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              className="hover:text-slate-800 transition-colors"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
