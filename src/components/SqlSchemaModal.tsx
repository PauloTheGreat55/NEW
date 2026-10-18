import React, { useState } from 'react';
import { X, Copy, Check, Terminal, ExternalLink, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../data/sqlSchema';
import { getSupabaseConfig, setCustomSupabaseConfig } from '../lib/supabase';

interface SqlSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSchemaModal: React.FC<SqlSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const currentConfig = getSupabaseConfig();
  
  const [urlInput, setUrlInput] = useState(currentConfig.url);
  const [anonKeyInput, setAnonKeyInput] = useState(currentConfig.anonKey);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSupabaseConfig(urlInput, anonKeyInput);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Supabase Database Schema & Setup
              </h2>
              <p className="text-xs text-slate-500">
                PostgreSQL tables, Row Level Security (RLS) policies & sample seed data
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Quick Setup Instructions */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4">
            <h3 className="font-bold text-teal-900 text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>3-Step Supabase Setup Guide</span>
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed">
              <li>
                Go to your{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-teal-700 underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and open or create a project.
              </li>
              <li>
                Navigate to <strong>SQL Editor</strong> on the left sidebar, click{' '}
                <strong>New Query</strong>, and paste the script below.
              </li>
              <li>
                Click <strong>Run</strong>. The <code className="bg-teal-100 px-1 rounded">profiles</code>,{' '}
                <code className="bg-teal-100 px-1 rounded">services</code>, and{' '}
                <code className="bg-teal-100 px-1 rounded">appointments</code> tables will be created
                with RLS and sample treatments!
              </li>
            </ol>
          </div>

          {/* Connect Live Supabase Project (Optional) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Connect Your Live Supabase Keys (Optional)
                </h3>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  currentConfig.isConfigured
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentConfig.isConfigured ? 'Connected to Supabase' : 'Running in Interactive Local Mode'}
              </span>
            </div>
            <p className="text-slate-500 text-xs mb-3">
              The system runs right in this preview out of the box. If you have your own Supabase project,
              paste your project credentials below or into <code className="text-slate-800 font-mono">.env.local</code>.
            </p>

            <form onSubmit={handleSaveCredentials} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKeyInput}
                  onChange={(e) => setAnonKeyInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-1">
                {saveSuccess ? (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Credentials saved! Refreshing...
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Keys are securely stored in your local session.
                  </span>
                )}

                <div className="flex gap-2">
                  {currentConfig.isConfigured && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSupabaseConfig('', '');
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 text-xs rounded-lg text-slate-600 hover:text-rose-600 border border-slate-200 hover:bg-slate-100"
                    >
                      Clear & Reset to Local Mode
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    Save & Connect
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* SQL Editor Code Block */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Full PostgreSQL Initialization Script
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Script</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>supabase_schema.sql</span>
                <span>PostgreSQL 15+</span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed text-emerald-300/90 selection:bg-teal-800">
                <code>{SUPABASE_SQL_SCRIPT}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
