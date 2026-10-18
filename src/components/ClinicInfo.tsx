import React from 'react';
import { Clock, MapPin, Phone, Mail, Award, ShieldCheck, HeartHandshake, Calendar } from 'lucide-react';

interface ClinicInfoProps {
  onGoToBook: () => void;
}

export const ClinicInfo: React.FC<ClinicInfoProps> = ({ onGoToBook }) => {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
          About PearlDent
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
          Patient-First Dentistry With Gentle Precision
        </h1>
        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
          Providing compassionate, state-of-the-art dental care for individuals and families.
          From routine cleanings to advanced restorative procedures, your comfort is our priority.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Hours Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Clinical Hours</h2>
          <p className="text-xs text-slate-500 mb-4">Walk-ins welcome during weekday mornings.</p>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Monday – Thursday</span>
              <span className="font-semibold text-slate-900">8:30 AM – 5:30 PM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Friday</span>
              <span className="font-semibold text-slate-900">8:30 AM – 4:00 PM</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-600">Saturday</span>
              <span className="font-semibold text-slate-900">9:00 AM – 2:00 PM</span>
            </div>
            <div className="flex justify-between py-1 text-rose-600 font-medium">
              <span>Sunday</span>
              <span>Closed (Emergency on-call)</span>
            </div>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Location & Parking</h2>
          <p className="text-xs text-slate-500 mb-4">Conveniently situated in the Medical Arts Plaza.</p>

          <div className="text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">PearlDent Dental Practice</p>
            <p>742 Evergreen Terrace, Suite 300</p>
            <p>Springfield, OR 97477</p>
            <p className="pt-2 text-slate-500">
              Validated patient parking available in the subterranean garage (Levels B1 & B2).
            </p>
          </div>
        </div>

        {/* Urgent Care Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Contact & Emergency</h2>
          <p className="text-xs text-slate-500 mb-4">Direct lines to reception and triage nurse.</p>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block">General Appointments</span>
              <a
                href="tel:+18005553368"
                className="font-bold text-teal-700 hover:underline text-sm mt-0.5 block"
              >
                +1 (800) 555-DENT
              </a>
            </div>
            <div>
              <span className="text-slate-500 block">Emergency 24/7 Dental Line</span>
              <a
                href="tel:+18005559911"
                className="font-bold text-rose-700 hover:underline text-sm mt-0.5 block"
              >
                +1 (800) 555-9911
              </a>
            </div>
            <div>
              <span className="text-slate-500 block">Patient Correspondence</span>
              <span className="text-slate-700 font-medium">care@pearldent.clinic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Team Section */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
        <div className="max-w-xl mb-6">
          <h2 className="text-lg font-bold text-slate-900">Lead Dentists & Specialists</h2>
          <p className="text-xs text-slate-500 mt-1">
            Board-certified dental surgeons with over 20 years of combined clinical excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
              GV
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Dr. Gregory Vance, DDS, FAGD</h3>
              <p className="text-xs text-teal-700 font-medium">Clinic Director & Cosmetic Specialist</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Harvard School of Dental Medicine</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-sm">
              AL
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Dr. Aisha Lin, DMD, MS</h3>
              <p className="text-xs text-teal-700 font-medium">Orthodontics & Pediatric Care</p>
              <p className="text-[11px] text-slate-500 mt-0.5">UCSF Dental Research Fellow</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Ready to schedule your visit or consult with Dr. Vance?
          </div>
          <button
            onClick={onGoToBook}
            className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Launch Booking Wizard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
