import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Service, Appointment, NewAppointmentInput } from '../types/database';
import { fetchServices, fetchAppointmentAvailability, AppointmentAvailability, createAppointment } from '../lib/supabase';

interface BookingWizardProps {
  initialServiceId?: string | null;
  onBookingComplete?: (appointment: Appointment) => void;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  initialServiceId,
  onBookingComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialServiceId ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<AppointmentAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Load services and appointments
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [srvs, apts] = await Promise.all([fetchServices(), fetchAppointmentAvailability()]);
      setServices(srvs);
      setExistingAppointments(apts);
      if (initialServiceId) {
        setSelectedServiceId(initialServiceId);
        setStep(2);
      } else if (srvs.length > 0 && !selectedServiceId) {
        setSelectedServiceId(srvs[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleServicesUpdate = () => {
      fetchServices().then((srvs) => setServices(srvs));
    };

    window.addEventListener('pearldent:services_updated', handleServicesUpdate);
    return () => {
      window.removeEventListener('pearldent:services_updated', handleServicesUpdate);
    };
  }, [initialServiceId]);

  // Compute 14 upcoming valid clinic days (Clinic open Monday-Saturday)
  const availableDates = React.useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNumber: string; monthName: string; isToday: boolean }[] = [];
    const today = new Date();
    let current = new Date(today);

    while (dates.length < 14) {
      // 0 is Sunday, clinic closed on Sunday
      if (current.getDay() !== 0) {
        const dateStr = current.toISOString().split('T')[0];
        dates.push({
          dateStr,
          dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: current.getDate().toString(),
          monthName: current.toLocaleDateString('en-US', { month: 'short' }),
          isToday: current.toDateString() === today.toDateString(),
        });
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, []);

  // Set default date when dates list loads
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0].dateStr);
    }
  }, [availableDates, selectedDate]);

  // Standard clinic time slots
  const morningSlots = ['09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM'];
  const afternoonSlots = ['01:30 PM', '02:15 PM', '03:00 PM', '03:45 PM', '04:30 PM'];

  // Check if slot is taken on the selected date
  const isSlotTaken = (slot: string): boolean => {
    if (!selectedDate) return false;
    return existingAppointments.some(
      (a) =>
        a.appointment_date === selectedDate &&
        a.time_slot === slot &&
        a.status !== 'cancelled'
    );
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Step 1 Validation
  const handleProceedToStep2 = () => {
    if (!selectedServiceId) {
      setErrors({ service: 'Please select a service to proceed' });
      return;
    }
    setErrors({});
    setStep(2);
  };

  // Step 2 Validation
  const handleProceedToStep3 = () => {
    if (!selectedDate) {
      setErrors({ date: 'Please choose an appointment date' });
      return;
    }
    if (!selectedTimeSlot) {
      setErrors({ time: 'Please choose an available time slot' });
      return;
    }
    setErrors({});
    setStep(3);
  };

  // Step 3 Validation & Submit
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!patientName.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!patientEmail.trim() || !/^\S+@\S+\.\S+$/.test(patientEmail)) {
      newErrors.email = 'Valid email address is required';
    }
    if (!patientPhone.trim() || patientPhone.trim().length < 7) {
      newErrors.phone = 'Valid phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const input: NewAppointmentInput = {
        patient_name: patientName.trim(),
        patient_email: patientEmail.trim(),
        patient_phone: patientPhone.trim(),
        service_id: selectedServiceId,
        appointment_date: selectedDate,
        time_slot: selectedTimeSlot,
        notes: notes.trim(),
      };

      const result = await createAppointment(input);
      if (result.success && result.appointment) {
        setConfirmedBooking(result.appointment);
        setStep(4);
        if (onBookingComplete) {
          onBookingComplete(result.appointment);
        }
      } else {
        setErrors({ form: result.error || 'Failed to submit appointment. Please retry.' });
      }
    } catch (err: any) {
      setErrors({ form: err?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedTimeSlot('');
    setPatientName('');
    setPatientEmail('');
    setPatientPhone('');
    setNotes('');
    setErrors({});
    setConfirmedBooking(null);
  };

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    if (!confirmedBooking || !confirmedBooking.service) return '#';
    const title = encodeURIComponent(`Dental Appointment: ${confirmedBooking.service.name} at PearlDent`);
    const details = encodeURIComponent(
      `Appointment at PearlDent Clinic.\nPatient: ${confirmedBooking.patient_name}\nService: ${confirmedBooking.service.name}\nDuration: ${confirmedBooking.service.duration_minutes} mins\nClinic Phone: +1 (800) 555-DENT`
    );
    const location = encodeURIComponent('PearlDent Clinic, 742 Evergreen Terrace, Suite 300');
    
    // Convert date + timeslot to UTC format (approx)
    const [year, month, day] = confirmedBooking.appointment_date.split('-').map(Number);
    const startTimeStr = confirmedBooking.time_slot; // e.g. "09:00 AM"
    const isPM = startTimeStr.includes('PM');
    const [h, m] = startTimeStr.replace(/ AM| PM/, '').split(':').map(Number);
    const hours = (isPM && h !== 12 ? h + 12 : (!isPM && h === 12 ? 0 : h));
    
    const startObj = new Date(year, month - 1, day, hours, m);
    const endObj = new Date(startObj.getTime() + (confirmedBooking.service.duration_minutes || 45) * 60000);
    
    const toGCalTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const datesParam = `${toGCalTime(startObj)}/${toGCalTime(endObj)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${datesParam}&details=${details}&location=${location}`;
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading clinical schedule & services...</p>
      </div>
    );
  }

  // STEP 4: CONFIRMATION SUCCESS VIEW
  if (step === 4 && confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-10 text-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-teal-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Request Confirmed!</h2>
          <p className="text-slate-700 text-sm mt-1.5 max-w-md mx-auto">
            Thank you, <span className="font-semibold text-slate-800">{confirmedBooking.patient_name}</span>. We have scheduled your dental visit at PearlDent Clinic.
          </p>

          {/* Reference Banner */}
          <div className="my-6 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200 inline-block text-left text-xs text-slate-700">
            <span className="text-slate-600">Booking Reference: </span>
            <span className="font-mono font-bold text-slate-900">
              PD-{confirmedBooking.id.substring(0, 8).toUpperCase()}
            </span>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-600">Status: </span>
            <span className="font-semibold text-amber-700 capitalize">{confirmedBooking.status}</span>
          </div>

          {/* Appointment Summary Box */}
          <div className="bg-teal-50/50 rounded-xl border border-teal-100 p-5 text-left space-y-3 mb-8">
            <div className="flex justify-between items-start pb-3 border-b border-teal-100/60">
              <div>
                <span className="text-xs font-semibold text-teal-800 tracking-wider uppercase">
                  Service Booked
                </span>
                <p className="text-base font-bold text-slate-900">
                  {confirmedBooking.service?.name || 'Dental Treatment'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Duration: {confirmedBooking.service?.duration_minutes} minutes
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600">Standard Fee</span>
                <p className="text-lg font-bold text-teal-900">
                  ₱{confirmedBooking.service?.price}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-teal-600" />
                <span>
                  {new Date(confirmedBooking.appointment_date + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-900">{confirmedBooking.time_slot}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                <span className="truncate">{confirmedBooking.patient_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-600" />
                <span>{confirmedBooking.patient_phone}</span>
              </div>
            </div>
          </div>

          {/* Patient Checklist */}
          <div className="text-left bg-slate-50 rounded-xl p-4 mb-8 text-xs text-slate-600 space-y-2 border border-slate-200">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Next Steps & Arrival Advice</span>
            </div>
            <p>• Please arrive 10 minutes prior to your appointment time for initial health intake.</p>
            <p>• Bring your dental insurance card and valid photo identification.</p>
            <p>• A confirmation email has been dispatched to {confirmedBooking.patient_email}.</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Add to Google Calendar</span>
            </a>
            <button
              onClick={resetWizard}
              className="py-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Title Header */}
      <div className="mb-8 text-center sm:text-left sm:flex sm:items-end sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
            Online Dental Scheduling
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Book Your Dental Visit
          </h1>
          <p className="text-slate-700 text-sm mt-1">
            Select your clinical service, pick a date & time, and reserve your chair in seconds.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 text-xs text-slate-600 bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>Office Hours: Mon–Sat 8:30 AM – 5:30 PM</span>
        </div>
      </div>

      {/* 3-Step Wizard Indicator */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Step 1 Tab */}
          <div
            onClick={() => (step > 1 ? setStep(1) : null)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              step === 1
                ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs'
                : step > 1
                ? 'bg-white border-slate-200 text-slate-800 cursor-pointer hover:bg-slate-50'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step > 1
                  ? 'bg-teal-600 text-white'
                  : step === 1
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Step 1</span>
              <span className="text-xs sm:text-sm font-semibold truncate block">Select Service</span>
            </div>
          </div>

          {/* Step 2 Tab */}
          <div
            onClick={() => (step > 2 ? setStep(2) : null)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              step === 2
                ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs'
                : step > 2
                ? 'bg-white border-slate-200 text-slate-800 cursor-pointer hover:bg-slate-50'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step > 2
                  ? 'bg-teal-600 text-white'
                  : step === 2
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Step 2</span>
              <span className="text-xs sm:text-sm font-semibold truncate block">Date & Time</span>
            </div>
          </div>

          {/* Step 3 Tab */}
          <div
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              step === 3
                ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                step === 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-slate-600 block">Step 3</span>
              <span className="text-xs sm:text-sm font-semibold truncate block">Patient Info</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 1: SELECT SERVICE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Choose a Dental Treatment</h2>
            <span className="text-xs text-slate-600">
              {services.length > 0 ? `${services.length} services available` : 'No services available'}
            </span>
          </div>

          {errors.service && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.service}</span>
            </div>
          )}

          {services.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-800">Booking is temporarily unavailable</p>
              <p className="mt-1 text-xs text-slate-600">
                The clinic has not added any treatments yet.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => {
              const isSelected = selectedServiceId === service.id;
              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      {/* Category & Duration header */}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-semibold text-teal-700">{service.category || 'General'}</span>
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {service.duration_minutes} mins
                        </span>
                      </div>

                      {/* Title */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">
                          {service.name}
                        </h3>
                      </div>

                      {/* Clinical Description: Read details first */}
                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {service.description}
                      </p>
                    </div>

                    {/* Price & Book Now Row at the bottom */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-600 block">
                          Transparent Fee
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-extrabold text-slate-900">
                            ₱{service.price}
                          </span>
                          <span className="text-[10px] text-slate-600">flat rate</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServiceId(service.id);
                          setStep(2);
                        }}
                        className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-800 border border-slate-200'
                        }`}
                      >
                        <span>{isSelected ? 'Selected' : 'Book Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Step 1 Actions */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleProceedToStep2}
              disabled={services.length === 0}
              className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Continue to Date & Time</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE DATE & TIME */}
      {step === 2 && (
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">1. Select Appointment Date</h2>
              <span className="text-xs text-slate-600">Monday to Saturday</span>
            </div>

            {/* Date horizontal selection strip */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 overflow-x-auto pb-1">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateStr;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                      setSelectedTimeSlot(''); // reset slot when date changes
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                    }`}
                  >
                    <span
                      className={`text-[11px] uppercase font-semibold block ${
                        isSelected ? 'text-teal-100' : 'text-slate-600'
                      }`}
                    >
                      {item.dayName}
                    </span>
                    <span className="text-lg font-bold block my-0.5">{item.dayNumber}</span>
                    <span
                      className={`text-[10px] block ${
                        isSelected ? 'text-teal-100' : 'text-slate-600'
                      }`}
                    >
                      {item.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.date && (
              <p className="text-xs text-rose-600 mt-2">{errors.date}</p>
            )}
          </div>

          {/* Time Slots Section */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">2. Select Time Slot</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Available chair slots for{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedDate &&
                      new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                  </span>
                </p>
              </div>
            </div>

            {/* Morning slots */}
            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2.5">
                Morning Sessions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {morningSlots.map((slot) => {
                  const taken = isSlotTaken(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={taken}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between ${
                        taken
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{slot}</span>
                      {taken ? (
                        <span className="text-[10px] text-slate-600">Booked</span>
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Afternoon slots */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2.5">
                Afternoon Sessions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {afternoonSlots.map((slot) => {
                  const taken = isSlotTaken(slot);
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={taken}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between ${
                        taken
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{slot}</span>
                      {taken ? (
                        <span className="text-[10px] text-slate-600">Booked</span>
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {errors.time && (
              <p className="text-xs text-rose-600 mt-3">{errors.time}</p>
            )}
          </div>

          {/* Step 2 Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleProceedToStep3}
              className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
            >
              <span>Continue to Contact Info</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT CONTACT INFO & CONFIRMATION */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Enter Patient Information</h2>
              <p className="text-xs text-slate-600 mb-6">
                Please provide your contact details so our reception can verify your appointment.
              </p>

              {errors.form && (
                <div className="mb-5 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Johnathan Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                        errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                          errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notes or Specific Symptoms <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={3}
                      placeholder="e.g. Sensitivity to cold water on upper right side, first time visit..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Booking</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sticky Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sticky top-24">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Booking Summary
              </h3>

              <div className="space-y-4 text-xs">
                {selectedService && (
                  <div>
                    <span className="text-slate-500 block">Selected Service</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedService.name}</p>
                    <div className="flex items-center justify-between text-slate-600 mt-1">
                      <span>{selectedService.duration_minutes} minutes</span>
                      <span className="font-bold text-teal-700 text-sm">₱{selectedService.price}</span>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-slate-500 block">Date & Time</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedDate &&
                      new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                  </p>
                  <p className="text-teal-700 font-bold mt-0.5">{selectedTimeSlot || 'Not chosen'}</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-slate-500 block">Location</span>
                  <p className="font-semibold text-slate-800 mt-0.5">PearlDent Dental Practice</p>
                  <p className="text-slate-500">742 Evergreen Terrace, Suite 300</p>
                </div>

                <div className="pt-3 border-t border-slate-200/60">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Estimated Total</span>
                    <span className="text-base text-teal-700">
                      ₱{selectedService ? selectedService.price : 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Payable at clinic check-in. Most dental insurance plans accepted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
