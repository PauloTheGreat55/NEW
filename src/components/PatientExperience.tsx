import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ArrowDown,
  ArrowRight,
  Smile,
  Zap,
  CreditCard,
  Star,
  CalendarCheck,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { Service, Appointment } from '../types/database';
import { fetchServices } from '../lib/supabase';
import { BookingWizard } from './BookingWizard';

interface PatientExperienceProps {
  onBookingComplete?: (appointment: Appointment) => void;
}

export const PatientExperience: React.FC<PatientExperienceProps> = ({
  onBookingComplete,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);
  const [wizardKey, setWizardKey] = useState<number>(0);

  const servicesRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);

  const loadServices = async () => {
    const data = await fetchServices();
    setServices(data);
  };

  useEffect(() => {
    loadServices();

    const handleServicesUpdate = () => {
      setSelectedCategory('All');
      loadServices();
    };

    window.addEventListener('pearldent:services_updated', handleServicesUpdate);
    return () => {
      window.removeEventListener('pearldent:services_updated', handleServicesUpdate);
    };
  }, []);

  const categories = [
    'All',
    ...Array.from(new Set(services.map((service) => service.category).filter((category): category is string => Boolean(category)))).sort(),
  ];

  const filteredServices = services.filter((s) => {
    if (selectedCategory === 'All') return true;
    return s.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookService = (serviceId: string) => {
    setPreSelectedServiceId(serviceId);
    setWizardKey((prev) => prev + 1);
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickBookNow = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full">
      {/* =====================================================================
          1. HERO SECTION: INTRODUCE THE CLINIC & INVITE SCROLLING
         ===================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 border-b border-slate-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-5">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100/80 border border-teal-200 text-teal-900 text-xs font-semibold shadow-xs">
              <span className="flex text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
              </span>
              <span className="text-slate-600">·</span>
              <span>Rated 4.9/5 by 1,200+ Verified Patients</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Gentle, Modern Dental Care <br />
              <span className="text-teal-700">With 100% Upfront Pricing</span>
            </h1>

            {/* Subhead */}
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Scroll down to explore our dental treatments, review our transparent fee schedule, and reserve your chair in under 60 seconds with zero surprise bills.
            </p>

            {/* Action Buttons: Scroll First, Then Book */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={scrollToServices}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore Treatments & Pricing</span>
                <ArrowDown className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleQuickBookNow}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Jump Straight to Booking</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-teal-600 mb-1" />
                <div className="font-bold text-slate-900 text-xs">Zero Surprise Fees</div>
                <div className="text-[11px] text-slate-500">Fixed upfront pricing</div>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <Smile className="w-5 h-5 text-teal-600 mb-1" />
                <div className="font-bold text-slate-900 text-xs">Pain-Free Protocol</div>
                <div className="text-[11px] text-slate-500">Gentle local anesthesia</div>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <Clock className="w-5 h-5 text-teal-600 mb-1" />
                <div className="font-bold text-slate-900 text-xs">On-Time Seating</div>
                <div className="text-[11px] text-slate-500">Zero waiting room delays</div>
              </div>
              <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <CreditCard className="w-5 h-5 text-teal-600 mb-1" />
                <div className="font-bold text-slate-900 text-xs">Direct Insurance</div>
                <div className="text-[11px] text-slate-500">Instant claims submission</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SCROLLABLE CLINIC HIGHLIGHTS
         ===================================================================== */}
      <section className="py-12 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Step 1: Scroll & Explore Treatments
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Read about what happens in the dental chair, view clinical durations, and understand what is included in each procedure before making a decision.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Step 2: Check Transparent Pricing
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See exact fees clearly stated. No hospital facility charges, no hidden add-ons. We accept all major dental insurances and submit claims on your behalf.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50/70 border border-teal-200">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-bold text-teal-950 text-base mb-1">
                Step 3: Click "Book Now"
              </h3>
              <p className="text-xs text-teal-900 leading-relaxed">
                Select your preferred day and time slot with real-time chair availability. You will get immediate booking confirmation and SMS/Email reminders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SCROLLABLE SERVICES & PRICE CARDS: "SCROLL FIRST, LOOK AT PRICE, THEN BOOK NOW"
         ===================================================================== */}
      <section ref={servicesRef} className="py-14 sm:py-20 bg-slate-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-3 py-1 rounded-full">
              Clinical Menu & Transparent Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              {services.length > 0 ? 'Explore Our Dental Procedures' : 'Services & Pricing'}
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-2">
              {services.length > 0
                ? <>Browse available treatments and review their published prices before booking.</>
                : 'No treatments or prices have been published yet.'}
            </p>

            {/* Category Filter Pills */}
            {services.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 flex-wrap mt-6">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Cards Grid */}
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition-all group"
              >
                <div>
                  {/* Category & Duration header */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100">
                    <span className="font-semibold text-teal-700">{service.category || 'General'}</span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {service.duration_minutes} mins in chair
                    </span>
                  </div>

                  {/* Treatment Title */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2 leading-snug">
                    {service.name}
                  </h3>

                  {/* Clinical Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* What is Included checklist */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-6 space-y-1.5 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Doctor Exam & Consultation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Comfortable, pain-free delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Direct insurance claims filing</span>
                    </div>
                  </div>
                </div>

                {/* THE PRICE & BOOK NOW CTA */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-[11px] text-slate-500 block uppercase font-medium">
                        Standard Fee
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900">
                          ${service.price}
                        </span>
                        <span className="text-[11px] text-slate-500">all-inclusive</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                        Insurance Eligible
                      </span>
                    </div>
                  </div>

                  {/* Primary "Book Now" Button */}
                  <button
                    type="button"
                    onClick={() => handleBookService(service.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 group-hover:shadow-sm cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto border border-slate-200 bg-white p-6 sm:p-8 text-center rounded-xl">
              <h3 className="text-base font-bold text-slate-900">Online booking is not available yet</h3>
              <p className="text-sm text-slate-600 mt-2">
                The clinic will publish its treatments and prices here once they are configured.
              </p>
            </div>
          )}

          {/* Pricing Guarantee Banner */}
          {services.length > 0 && (
          <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Transparent Billing Policy
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                No Surprise Fees. No Post-Visit Hidden Costs.
              </h3>
              <p className="text-xs text-slate-600 max-w-xl">
                We accept Delta Dental, Cigna, MetLife, Guardian, Aetna, Humana, and UnitedHealthcare.
                If you have dental insurance, your co-pay is often $0 for preventive exams & cleanings.
              </p>
            </div>

            <button
              type="button"
              onClick={handleQuickBookNow}
              className="shrink-0 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>Book Appointment Now</span>
            </button>
          </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          4. INTERACTIVE 3-STEP BOOKING WIZARD SECTION
         ===================================================================== */}
      <section ref={bookingRef} id="booking-wizard" className="py-14 sm:py-20 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Online Chair Reservation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Complete Your Booking
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Select your service, choose your preferred chair date & time slot, and confirm your visit.
            </p>
          </div>

          <BookingWizard
            key={wizardKey}
            initialServiceId={preSelectedServiceId}
            onBookingComplete={onBookingComplete}
          />
        </div>
      </section>
    </div>
  );
};
