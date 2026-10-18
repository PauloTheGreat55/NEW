import React from 'react';
import { Calendar, Clock, LogOut } from 'lucide-react';
import { Profile } from '../types/database';

interface NavbarProps {
  activeView: 'book' | 'dashboard' | 'info';
  setActiveView: (view: 'book' | 'dashboard' | 'info') => void;
  currentUser: Profile | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  currentUser,
  onLogout,
}) => {

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            onClick={() => setActiveView('book')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C8.5 2 6 4.5 6 8c0 2.5 1.2 5 2.5 8.5C9.5 19 10.5 22 12 22s2.5-3 3.5-5.5C16.8 13 18 10.5 18 8c0-3.5-2.5-6-6-6zm-2 5.5c.8 0 1.5.7 1.5 1.5S10.8 10.5 10 10.5 8.5 9.8 8.5 9s.7-1.5 1.5-1.5z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">PearlDent</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  CLINIC
                </span>
              </div>
              <p className="text-[11px] text-slate-700 font-medium hidden sm:block">
                Modern & Gentle Dental Care
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveView('book');
                setTimeout(() => {
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }, 50);
              }}
              className="hidden lg:flex px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <span>Treatments & Pricing</span>
            </button>

            <button
              onClick={() => {
                setActiveView('book');
                setTimeout(() => {
                  const el = document.getElementById('booking-wizard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeView === 'book'
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Book Now</span>
            </button>

            <button
              onClick={() => setActiveView('info')}
              className={`hidden md:flex px-3 py-2 rounded-lg text-sm font-medium transition-colors items-center gap-1.5 ${
                activeView === 'info'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Hours & Location</span>
            </button>

            {currentUser && (
              <button
                onClick={onLogout}
                title="Log out of Staff portal"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </nav>
        </div>
      </div>

    </header>
  );
};
