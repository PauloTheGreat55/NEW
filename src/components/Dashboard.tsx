import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Search,
  Filter,
  UserCheck,
  Shield,
  UserPlus,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  LogOut,
  Sparkles,
  Users,
  ChevronDown,
  MailCheck,
  Send,
  ExternalLink,
  Trash2,
  Edit3,
  DollarSign,
  Power,
  Tag,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Appointment, Profile, AppointmentStatus, UserRole, DispatchedEmail, Service, Category } from '../types/database';
import {
  fetchAppointments,
  updateAppointmentStatus,
  fetchStaffMembers,
  createStaffAccount,
  INITIAL_STAFF,
  supabase,
  getDispatchedEmails,
  generateApprovalEmail,
  fetchServices,
  fetchCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addService,
  updateService,
  deleteService,
  deleteStaffAccount,
  updateStaffStatus,
  updateStaffProfile,
  loginStaff,
} from '../lib/supabase';
import { ApprovalEmailModal } from './ApprovalEmailModal';

interface DashboardProps {
  currentUser: Profile | null;
  onLogin: (user: Profile) => void;
  onLogout: () => void;
  onGoToBook: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onGoToBook,
}) => {
  // Tabs: 'appointments' | 'staff' | 'services'
  const [activeTab, setActiveTab] = useState<'appointments' | 'staff' | 'services'>('appointments');

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Staff State
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('staff');
  const [staffFormError, setStaffFormError] = useState('');
  const [staffFormSuccess, setStaffFormSuccess] = useState('');
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);

  // Services State (Admin Management)
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryFormError, setCategoryFormError] = useState('');

  // Edit Service Form State
  const [editPrice, setEditPrice] = useState<number | string>(0);
  const [editName, setEditName] = useState('');
  const [editDuration, setEditDuration] = useState<number | string>(45);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Add Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number | string>('');
  const [newServiceDuration, setNewServiceDuration] = useState<number | string>(45);
  const [newServiceCategoryId, setNewServiceCategoryId] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [serviceFormError, setServiceFormError] = useState('');

  // Admin Notification Banner
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Login Form State (when unauthenticated)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Status updating feedback
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Email Notification Modal State
  const [selectedEmail, setSelectedEmail] = useState<DispatchedEmail | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailToast, setEmailToast] = useState<{
    patientName: string;
    email: string;
    appointmentId: string;
  } | null>(null);

  // Load appointments
  const loadAppointments = async () => {
    setIsLoadingAppointments(true);
    try {
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Load staff
  const loadStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const data = await fetchStaffMembers();
      setStaffList(data);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Load services (for admin management)
  const loadServicesList = async () => {
    setIsLoadingServices(true);
    try {
      const [services, categories] = await Promise.all([fetchServices(), fetchCategories()]);
      setServicesList(services);
      setCategoriesList(categories);
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadAppointments();
      if (currentUser.role === 'admin') {
        loadStaff();
        loadServicesList();
      }
    }
  }, [currentUser]);

  // Staff Account Delete
  const handleDeleteStaff = async (id: string, name: string) => {
    if (currentUser?.id === id) {
      setAdminNotice('You cannot delete your own logged-in administrator account.');
      setTimeout(() => setAdminNotice(null), 4000);
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user account "${name}"?`)) {
      await deleteStaffAccount(id);
      loadStaff();
      setAdminNotice(`Staff account "${name}" was permanently removed.`);
      setTimeout(() => setAdminNotice(null), 4000);
    }
  };

  // Staff Status Toggle (Active / Inactive)
  const handleToggleStaffStatus = async (id: string, currentStatus?: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    await updateStaffStatus(id, nextStatus);
    loadStaff();
    setAdminNotice(`User account status updated to ${nextStatus.toUpperCase()}.`);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Open Edit Service Modal
  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setEditName(service.name);
    setEditPrice(service.price);
    setEditDuration(service.duration_minutes);
    setEditCategoryId(service.category_id || '');
    setEditDescription(service.description || '');
    setServiceFormError('');
    setIsEditServiceModalOpen(true);
  };

  // Save Service Changes (especially price)
  const handleSaveServiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    if (!editName.trim() || Number(editPrice) <= 0) {
      setServiceFormError('Please enter a valid treatment name and positive price.');
      return;
    }

    const result = await updateService(editingService.id, {
      name: editName.trim(),
      price: Number(editPrice),
      duration_minutes: Number(editDuration) || 45,
      category_id: editCategoryId || null,
      description: editDescription.trim(),
    });
    if (!result.success) {
      setServiceFormError(result.error || 'Could not update this treatment.');
      return;
    }

    setIsEditServiceModalOpen(false);
    loadServicesList();
    window.dispatchEvent(new Event('pearldent:services_updated'));
    setAdminNotice(`Price updated to $${editPrice} for "${editName}"! Published to public treatments & price.`);
    setTimeout(() => setAdminNotice(null), 5000);
  };

  // Create New Service
  const handleCreateNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || Number(newServicePrice) <= 0) {
      setServiceFormError('Please enter a valid treatment name and positive price.');
      return;
    }

    const result = await addService({
      name: newServiceName.trim(),
      price: Number(newServicePrice),
      duration_minutes: Number(newServiceDuration) || 45,
      category_id: newServiceCategoryId || null,
      description: newServiceDescription.trim() || 'Comprehensive dental treatment.',
    });

    if (!result.success) {
      setServiceFormError(result.error || 'Could not add this treatment.');
      return;
    }

    setIsAddServiceModalOpen(false);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDuration(45);
    setNewServiceCategoryId('');
    setNewServiceDescription('');
    setServiceFormError('');
    loadServicesList();
    window.dispatchEvent(new Event('pearldent:services_updated'));
    setAdminNotice(`New service "${newServiceName}" added! Published to public treatments & price.`);
    setTimeout(() => setAdminNotice(null), 5000);
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryFormError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryFormError('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    if (!name) {
      setCategoryFormError('Enter a category name.');
      return;
    }

    const result = editingCategory
      ? await updateCategory(editingCategory.id, name)
      : await addCategory(name);
    if (!result.success) {
      setCategoryFormError(result.error || 'Could not save this category.');
      return;
    }

    setIsCategoryModalOpen(false);
    await loadServicesList();
    window.dispatchEvent(new Event('pearldent:services_updated'));
    setAdminNotice(`Category "${name}" ${editingCategory ? 'updated' : 'added'}.`);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm(`Remove "${category.name}"? Treatments in this category will become uncategorized.`)) return;
    const result = await deleteCategory(category.id);
    if (!result.success) {
      setAdminNotice(result.error || 'Could not remove this category.');
      setTimeout(() => setAdminNotice(null), 4000);
      return;
    }

    await loadServicesList();
    window.dispatchEvent(new Event('pearldent:services_updated'));
    setAdminNotice(`Category "${category.name}" removed.`);
    setTimeout(() => setAdminNotice(null), 4000);
  };

  // Delete Service
  const handleDeleteService = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the clinical catalog?`)) {
      await deleteService(id);
      loadServicesList();
      setAdminNotice(`Service "${name}" was removed from the catalog.`);
      setTimeout(() => setAdminNotice(null), 4000);
    }
  };

  // Handle Standard Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email');
      return;
    }

    setIsLoggingIn(true);
    try {
      const profile = await loginStaff(loginEmail.trim(), loginPassword.trim());
      onLogin(profile);
    } catch (err: any) {
      const message = err?.message || '';
      setLoginError(
        message.toLowerCase().includes('incorrect password')
          ? 'That password is not right. Check it and try again.'
          : message.toLowerCase().includes('not found')
          ? 'No clinic account was found for that email. Check the address or contact your clinic administrator.'
          : message || 'Could not sign in. Please try again.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Update Status & Send Approval Email
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    setUpdatingId(appointmentId);
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      // update state locally
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                status: newStatus,
                email_sent: newStatus === 'confirmed' ? true : apt.email_sent,
                email_sent_at:
                  newStatus === 'confirmed'
                    ? new Date().toISOString()
                    : apt.email_sent_at,
              }
            : apt
        )
      );

      // If approved/confirmed, notify staff of the automated email dispatch
      if (result.emailDispatched && result.email) {
        setSelectedEmail(result.email);
        setEmailToast({
          patientName: result.email.patient_name,
          email: result.email.to_email,
          appointmentId,
        });
        setTimeout(() => setEmailToast(null), 8000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Approval Email Modal
  const openEmailModal = async (apt: Appointment) => {
    try {
      const allDispatched = await getDispatchedEmails();
      const found = allDispatched.find((e) => e.appointment_id === apt.id);
      if (found) {
        setSelectedEmail(found);
      } else {
        const generated = generateApprovalEmail(apt);
        setSelectedEmail(generated);
      }
    } catch {
      const generated = generateApprovalEmail(apt);
      setSelectedEmail(generated);
    }
    setIsEmailModalOpen(true);
  };

  // Handle Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError('');
    setStaffFormSuccess('');

    if (!newStaffName.trim()) {
      setStaffFormError('Staff full name is required');
      return;
    }
    if (!newStaffEmail.trim() || !/^\S+@\S+\.\S+$/.test(newStaffEmail)) {
      setStaffFormError('Valid work email is required');
      return;
    }
    if (newStaffPassword.length < 6) {
      setStaffFormError('Password must be at least 6 characters');
      return;
    }

    setIsCreatingStaff(true);
    try {
      const result = await createStaffAccount(
        newStaffName.trim(),
        newStaffEmail.trim(),
        newStaffRole,
        undefined,
        newStaffPassword
      );

      if (result.success && result.profile) {
        setStaffFormSuccess(`Staff account created successfully for ${result.profile.full_name}`);
        setNewStaffName('');
        setNewStaffEmail('');
        setNewStaffPassword('');
        loadStaff();
      } else {
        setStaffFormError(result.error || 'Failed to create staff account');
      }
    } catch (err: any) {
      setStaffFormError(err?.message || 'Error occurred creating staff account');
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // Today's date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered Appointments
  const filteredAppointments = appointments.filter((apt) => {
    // Status filter
    if (statusFilter !== 'all' && apt.status !== statusFilter) {
      return false;
    }

    // Date filter
    if (dateFilter === 'today' && apt.appointment_date !== todayStr) {
      return false;
    } else if (dateFilter === 'upcoming' && apt.appointment_date < todayStr) {
      return false;
    } else if (dateFilter === 'past' && apt.appointment_date >= todayStr) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = apt.patient_name.toLowerCase().includes(q);
      const emailMatch = apt.patient_email.toLowerCase().includes(q);
      const phoneMatch = apt.patient_phone.includes(q);
      const serviceMatch = apt.service?.name.toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || serviceMatch;
    }

    return true;
  });

  // KPI Metrics
  const metrics = {
    total: appointments.length,
    today: appointments.filter((a) => a.appointment_date === todayStr).length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  };

  // ============================================================================
  // VIEW: UNAUTHENTICATED LOGIN SCREEN
  // ============================================================================
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-center text-slate-900 tracking-tight">
            Staff Portal Sign In
          </h2>
          <p className="text-sm text-center text-slate-600 mt-2 mb-6">
            Sign in with your clinic account to manage appointments and staff access.
          </p>

          {loginError && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff-email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Staff or Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="staff-email"
                  type="email"
                  placeholder="name@pearldent.clinic"
                  autoComplete="username"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="staff-password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-12 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((visible) => !visible)}
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1.5 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In to Staff Portal'}
            </button>
            <p className="text-center text-xs text-slate-500">For authorized clinic staff only.</p>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onGoToBook}
              className="text-sm font-semibold text-teal-800 hover:text-teal-900 underline underline-offset-2"
            >
              Return to patient booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW: AUTHENTICATED STAFF & ADMIN DASHBOARD
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Profile / Role Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold text-lg">
            {currentUser.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {currentUser.full_name}
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                }`}
              >
                {currentUser.role === 'admin' ? 'Clinic Director (Admin)' : 'Front Desk Staff'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Automated Email Dispatch Notice Banner */}
      {emailToast && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <span>Appointment Approved & Email Dispatched!</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  SENT
                </span>
              </p>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Confirmation email sent to <span className="font-semibold underline">{emailToast.email}</span> for patient <span className="font-semibold">{emailToast.patientName}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-white border border-teal-300 text-teal-900 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-teal-700" />
              <span>Preview Sent Email</span>
            </button>
            <button
              onClick={() => setEmailToast(null)}
              className="p-1.5 text-teal-700 hover:text-teal-950 rounded-lg hover:bg-teal-100 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] uppercase font-bold text-slate-600 block">
            Today's Visits
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-slate-900">{metrics.today}</span>
            <span className="text-xs text-slate-600">Chair scheduled</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] uppercase font-bold text-amber-700 block">
            Pending Approval
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-700">{metrics.pending}</span>
            <span className="text-xs text-slate-600">Action needed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] uppercase font-bold text-teal-700 block">
            Confirmed Visits
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-teal-800">{metrics.confirmed}</span>
            <span className="text-xs text-slate-600">Active</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] uppercase font-bold text-emerald-700 block">
            Completed
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-800">{metrics.completed}</span>
            <span className="text-xs text-slate-600">Care delivered</span>
          </div>
        </div>
      </div>

      {/* Admin Action Notification Banner */}
      {adminNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminNotice}</span>
          </div>
          <button
            onClick={() => setAdminNotice(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 rounded hover:bg-emerald-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'appointments'
              ? 'text-teal-800 border-b-2 border-teal-600'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-teal-600" />
          <span>All Bookings ({appointments.length})</span>
        </button>

        {/* Staff Management Tab (Admin Only) */}
        {currentUser.role === 'admin' ? (
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'staff'
                ? 'text-teal-800 border-b-2 border-teal-600'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Manage Users & Staff</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </button>
        ) : (
          <div
            title="Only Admin (Dr. Vance) can manage clinic staff accounts"
            className="pb-3 text-sm font-medium text-slate-600 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Manage Staff (Admin Only)</span>
          </div>
        )}

        {/* Services & Pricing Tab (Admin Only) */}
        {currentUser.role === 'admin' ? (
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'services'
                ? 'text-teal-800 border-b-2 border-teal-600'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-teal-600" />
            <span>Services & Prices</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </button>
        ) : null}
      </div>

      {/* ========================================================================
          TAB 1: APPOINTMENTS MASTER LIST
         ======================================================================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search patient name, phone, email, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-600 font-medium hidden sm:inline">Status:</span>
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>

              <button
                onClick={loadAppointments}
                title="Refresh booking list"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingAppointments ? 'animate-spin text-teal-600' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No appointments found</p>
                <p className="text-xs text-slate-600 mt-1">
                  Try adjusting your search terms or filters above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Dental Service</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((apt) => {
                      const isPending = apt.status === 'pending';
                      const isConfirmed = apt.status === 'confirmed';
                      const isCompleted = apt.status === 'completed';
                      const isCancelled = apt.status === 'cancelled';

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Patient */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{apt.patient_name}</div>
                            {apt.notes && (
                              <p className="text-[11px] text-slate-600 truncate max-w-xs mt-0.5" title={apt.notes}>
                                Note: {apt.notes}
                              </p>
                            )}
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-600" />
                              <a
                                href={`tel:${apt.patient_phone}`}
                                className="text-slate-800 hover:text-teal-700 hover:underline font-medium"
                              >
                                {apt.patient_phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-slate-600" />
                              <a
                                href={`mailto:${apt.patient_email}`}
                                className="text-slate-600 hover:text-slate-900 truncate max-w-[150px]"
                              >
                                {apt.patient_email}
                              </a>
                            </div>
                          </td>

                          {/* Service */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {apt.service?.name || 'General Appointment'}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                              <span>${apt.service?.price || 0}</span>
                              <span>·</span>
                              <span>{apt.service?.duration_minutes || 45} mins</span>
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-teal-600" />
                              <span>{apt.appointment_date}</span>
                            </div>
                            <div className="text-[11px] text-teal-800 font-semibold flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-slate-600" />
                              <span>{apt.time_slot}</span>
                            </div>
                          </td>

                          {/* Status & Automated Email Notification Badge */}
                          <td className="py-3.5 px-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold capitalize ${
                                  isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : isConfirmed
                                    ? 'bg-teal-100 text-teal-800'
                                    : isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isPending
                                      ? 'bg-amber-500'
                                      : isConfirmed
                                      ? 'bg-teal-600'
                                      : isCompleted
                                      ? 'bg-emerald-600'
                                      : 'bg-rose-500'
                                  }`}
                                />
                                {apt.status}
                              </span>

                              {/* Email Status Indicator */}
                              {isConfirmed || apt.email_sent ? (
                                <button
                                  type="button"
                                  onClick={() => openEmailModal(apt)}
                                  className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                  title="View approval confirmation email sent to patient"
                                >
                                  <MailCheck className="w-3 h-3 text-teal-600" />
                                  <span>Approval Email Sent</span>
                                </button>
                              ) : isPending ? (
                                <span className="text-[10px] text-amber-700/90 flex items-center gap-1 mt-1 font-medium">
                                  <Clock className="w-3 h-3" />
                                  <span>Awaiting Approval</span>
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick Status Dropdown */}
                              <select
                                value={apt.status}
                                disabled={updatingId === apt.id}
                                onChange={(e) =>
                                  handleStatusChange(apt.id, e.target.value as AppointmentStatus)
                                }
                                className="py-1 px-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              {/* Primary Action: Approve & Send Email */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(apt.id, 'confirmed')}
                                  title="Approve booking and automatically send confirmation email to patient"
                                  className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Approve & Email</span>
                                </button>
                              )}

                              {/* If already confirmed: Preview or Resend Email */}
                              {isConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => openEmailModal(apt)}
                                  title="Preview the approval confirmation email sent to patient"
                                  className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-[11px] border border-teal-200 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Mail className="w-3 h-3 text-teal-600" />
                                  <span>View Email</span>
                                </button>
                              )}

                              {isConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(apt.id, 'completed')}
                                  title="Mark as Completed"
                                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] border border-emerald-200 transition-colors cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================
          TAB 2: MANAGE STAFF ACCOUNTS (ADMIN ONLY)
         ======================================================================== */}
      {activeTab === 'staff' && currentUser.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Staff Form Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">Add Staff Account</h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Create login credentials for receptionists and front-desk personnel.
              </p>

              {staffFormError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffFormError}</span>
                </div>
              )}

              {staffFormSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{staffFormSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name & Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rachel Adams (Front Desk)"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Staff Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="rachel@pearldent.clinic"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role & Permissions
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="staff">Front Desk Staff (Calendar & Booking Access)</option>
                    <option value="admin">Administrator (Full Access & Staff Management)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isCreatingStaff}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isCreatingStaff ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 block mb-1">Supabase Auth Mapping</span>
                This provisions the user in <code className="text-teal-700">auth.users</code> and sets
                role in the <code className="text-teal-700">profiles</code> table.
              </div>
            </div>
          </div>

          {/* Current Staff List Directory */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clinic Staff Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authorized front desk & administrative personnel
                  </p>
                </div>
                <button
                  onClick={loadStaff}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Refresh staff directory"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingStaff ? 'animate-spin text-teal-600' : ''}`}
                  />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {staffList.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        <span>{member.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {member.full_name}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              member.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-teal-100 text-teal-800'
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          member.status === 'inactive'
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === 'inactive' ? 'bg-slate-500' : 'bg-emerald-600'
                          }`}
                        />
                        {member.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>

                      {/* Toggle Active / Inactive */}
                      <button
                        type="button"
                        onClick={() => handleToggleStaffStatus(member.id, member.status)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg border font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                          member.status === 'inactive'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={
                          member.status === 'inactive'
                            ? 'Activate user access'
                            : 'Mark user as inactive'
                        }
                      >
                        <Power className="w-3 h-3" />
                        <span>{member.status === 'inactive' ? 'Activate' : 'Mark Inactive'}</span>
                      </button>

                      {/* Delete User Account */}
                      <button
                        type="button"
                        disabled={currentUser?.id === member.id}
                        onClick={() => handleDeleteStaff(member.id, member.full_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={
                          currentUser?.id === member.id
                            ? 'You cannot delete your own logged-in account'
                            : 'Delete user account'
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          TAB 3: SERVICES & PRICING CATALOG (ADMIN ONLY)
         ======================================================================== */}
      {activeTab === 'services' && currentUser.role === 'admin' && (
        <div className="space-y-6">
          {/* Header & Add Service Action */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Dental Services & Pricing Management
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Add new procedures, adjust durations, or update treatment fees. Changes publish live to the public Treatments & Pricing menu and Booking Wizard.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setServiceFormError('');
                setIsAddServiceModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Dental Service</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Treatment Categories</h2>
                <p className="text-xs text-slate-600 mt-0.5">Add, rename, or remove categories used by dental treatments.</p>
              </div>
              <button
                type="button"
                onClick={openAddCategoryModal}
                className="py-2 px-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {categoriesList.length === 0 ? (
              <p className="text-xs text-slate-600">No categories yet. Add one to classify treatments.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {categoriesList.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm font-medium text-slate-800">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(category)}
                        className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
                        title={`Rename ${category.name}`}
                        aria-label={`Rename ${category.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        title={`Remove ${category.name}`}
                        aria-label={`Remove ${category.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Active Treatments ({servicesList.length})
              </span>
              <button
                onClick={loadServicesList}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
                title="Refresh services list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingServices ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {servicesList.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-600">
                  No services or prices have been added yet.
                </p>
              ) : servicesList.map((service) => (
                <div
                  key={service.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{service.name}</h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {service.category || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {service.duration_minutes} minutes
                      </span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-600 block">
                        Published Price
                      </span>
                      <span className="text-xl font-extrabold text-teal-800">
                        ${service.price}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditServiceModal(service)}
                        className="py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Edit treatment price or details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                        <span>Edit Price</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteService(service.id, service.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
          onClick={() => setIsCategoryModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 id="category-modal-title" className="font-bold text-slate-900 text-sm">
                {editingCategory ? 'Rename Category' : 'Add Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                aria-label="Close category dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              {categoryFormError && (
                <p className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {categoryFormError}
                </p>
              )}
              <div>
                <label htmlFor="category-name" className="block font-semibold text-slate-700 text-xs mb-1.5">
                  Category Name
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          EDIT SERVICE PRICE & DETAILS MODAL
         ======================================================================== */}
      {isEditServiceModalOpen && editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Treatment Price & Details
                </h3>
              </div>
              <button
                onClick={() => setIsEditServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveServiceEdit} className="p-6 space-y-4 text-xs">
              {serviceFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {serviceFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Treatment / Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price in USD ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-bold text-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Live price on public page
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chair Duration (Mins) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">No category</option>
                  {categoriesList.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditServiceModalOpen(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                >
                  Save & Update Price
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================
          ADD NEW DENTAL SERVICE MODAL
         ======================================================================== */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Dental Treatment</h3>
              </div>
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewService} className="p-6 space-y-4 text-xs">
              {serviceFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200">
                  {serviceFormError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Treatment / Procedure Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dental Crown & Bridge Restoration"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Price in USD ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={newServicePrice}
                      onChange={(e) => setNewServicePrice(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-bold text-teal-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duration (Minutes) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    placeholder="45"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newServiceCategoryId}
                  onChange={(e) => setNewServiceCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">No category</option>
                  {categoriesList.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain what happens during the appointment, who it's for, and expected results..."
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                >
                  Add & Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Confirmation Email Preview & Resend Modal */}
      <ApprovalEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        email={selectedEmail}
        onResend={() => loadAppointments()}
      />

    </div>
  );
};
