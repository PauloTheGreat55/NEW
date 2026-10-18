import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Copy, Check, Send, ExternalLink, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { DispatchedEmail } from '../types/database';

interface ApprovalEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: DispatchedEmail | null;
  onResend?: (email: DispatchedEmail) => void;
}

export const ApprovalEmailModal: React.FC<ApprovalEmailModalProps> = ({
  isOpen,
  onClose,
  email,
  onResend,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'text'>('preview');
  const [copied, setCopied] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (!isOpen || !email) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(email.body_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResend = () => {
    setIsResending(true);
    setTimeout(() => {
      setIsResending(false);
      setResendSuccess(true);
      if (onResend) onResend(email);
      setTimeout(() => setResendSuccess(false), 2500);
    }, 600);
  };

  const mailtoUrl = `mailto:${encodeURIComponent(email.to_email)}?subject=${encodeURIComponent(
    email.subject
  )}&body=${encodeURIComponent(email.body_text)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Staff Approval Confirmation Email
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Delivered to Patient</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dispatched automatically when staff approved the appointment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Metadata Strip */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium">To: </span>
              <span className="font-semibold text-slate-900">{email.to_email}</span>
              <span className="text-slate-400 mx-1.5">({email.patient_name})</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Sent: {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date(email.sent_at).toLocaleDateString()})
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Subject: </span>
            <span className="font-bold text-slate-800">{email.subject}</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-200 bg-white">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Formatted HTML Email
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Plain Text
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopyText}
              className="text-[11px] py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <a
              href={mailtoUrl}
              className="text-[11px] py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in Mail App</span>
            </a>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'preview' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-w-lg mx-auto">
              {/* Email Content Header */}
              <div className="bg-slate-900 text-white p-6 text-center">
                <span className="inline-block bg-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-2">
                  Appointment Approved
                </span>
                <h3 className="text-lg font-bold text-white">PearlDent Dental Clinic</h3>
                <p className="text-xs text-slate-400 mt-1">Your upcoming dental chair visit is confirmed</p>
              </div>

              {/* Email Content Body */}
              <div className="p-6 text-xs text-slate-700 space-y-4">
                <p className="text-sm">
                  Dear <strong className="text-slate-900">{email.patient_name}</strong>,
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Great news! Our reception staff has officially reviewed and{' '}
                  <strong className="text-emerald-700">approved</strong> your requested dental appointment.
                </p>

                {/* Summary Box */}
                <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 space-y-2">
                  <div className="font-bold text-teal-950 pb-2 border-b border-teal-100 flex items-center justify-between">
                    <span>Approved Booking Details</span>
                    <span className="text-[10px] bg-teal-200/60 text-teal-900 font-bold px-1.5 py-0.5 rounded">
                      CONFIRMED
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Recipient</span>
                      <span className="font-semibold text-slate-900">{email.patient_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Contact</span>
                      <span className="font-semibold text-slate-900 truncate block">{email.to_email}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-600 space-y-1 border border-slate-200">
                  <span className="font-bold text-slate-800 block">Pre-Visit Check-in Advice:</span>
                  <p>• Please arrive 10 minutes early to complete initial registration.</p>
                  <p>• Bring your dental insurance card and a valid photo ID.</p>
                  <p>• Validated complimentary parking is available on levels B1 & B2.</p>
                </div>
              </div>

              {/* Email Footer */}
              <div className="bg-slate-100/70 p-4 text-center text-[10px] text-slate-500 border-t border-slate-200">
                PearlDent Dental Practice · 742 Evergreen Terrace, Suite 300 · Tel: +1 (800) 555-DENT
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {email.body_text}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs">
            {resendSuccess && (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approval email re-dispatched to {email.to_email}!
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleResend}
              disabled={isResending}
              className="py-1.5 px-3.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-1.5 px-3.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
