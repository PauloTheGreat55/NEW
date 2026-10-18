import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Check, User, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Profile } from '../types/database';
import { STAFF_AVATAR_PRESETS } from '../lib/supabase';

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile | null;
  onSave: (newAvatarUrl?: string) => Promise<void> | void;
  title?: string;
  subtitle?: string;
}

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  title = 'Update Profile Picture',
  subtitle = 'Upload a photo or select an avatar for your clinic profile',
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(user?.avatar_url);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      setPreviewUrl(user.avatar_url);
      const match = STAFF_AVATAR_PRESETS.find((p) => p.url === user.avatar_url);
      setSelectedPresetId(match ? match.id : null);
      setError(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
        setSelectedPresetId(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: { id: string; url: string }) => {
    setPreviewUrl(preset.url);
    setSelectedPresetId(preset.id);
    setError(null);
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    setSelectedPresetId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(previewUrl);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update picture.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200 backdrop-blur-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-teal-100/80">{user.full_name} ({user.role})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-500">{subtitle}</p>

          {/* Current / New Avatar Preview */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-teal-100 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-50 text-teal-700 flex flex-col items-center justify-center font-bold text-2xl">
                    {user.full_name ? user.full_name.charAt(0) : <User className="w-8 h-8" />}
                  </div>
                )}
              </div>

              {/* Upload badge on avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
                title="Choose new photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-800 mt-3">{user.full_name}</p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100 mt-1">
              {user.role}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3 rounded-xl border border-teal-300 bg-teal-50/50 hover:bg-teal-50 text-teal-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom Photo</span>
            </button>

            {previewUrl ? (
              <button
                type="button"
                onClick={handleRemove}
                className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Picture</span>
              </button>
            ) : (
              <div className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-medium text-xs flex items-center justify-center gap-1">
                <span>No picture selected</span>
              </div>
            )}
          </div>

          {/* Instant Clinical Avatar Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Or Choose Clinical Avatar Preset</span>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {STAFF_AVATAR_PRESETS.map((preset) => {
                const isSelected = previewUrl === preset.url || selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`relative rounded-xl p-1.5 border transition-all text-center group cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 shadow-xs ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                    title={preset.label}
                  >
                    <div className="w-10 h-10 mx-auto rounded-full overflow-hidden shadow-2xs">
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-600 truncate block mt-1">
                      {preset.label.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white rounded-full flex items-center justify-center text-[9px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Picture...' : 'Save Picture'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
