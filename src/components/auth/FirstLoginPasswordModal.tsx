import React, { useState } from 'react';
import { User } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { KeyRound, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface FirstLoginPasswordModalProps {
  currentUser: User;
  onPasswordChanged: (updatedUser: User) => void;
}

export const FirstLoginPasswordModal: React.FC<FirstLoginPasswordModalProps> = ({
  currentUser,
  onPasswordChanged
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser.first_login) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Kata sandi baru harus memiliki minimal 8 karakter.');
      return;
    }
    if (newPassword === 'Password123!') {
      setErrorMsg('Kata sandi baru tidak boleh sama dengan kata sandi default.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    const updatedUser: User = {
      ...currentUser,
      first_login: false,
      updated_at: new Date().toISOString()
    };

    storage.saveUser(updatedUser, newPassword);
    storage.setCurrentUser(updatedUser);
    storage.logActivity(
      updatedUser,
      'Ganti Password Pertama',
      'Auth',
      updatedUser.id,
      `${updatedUser.full_name} berhasil memperbarui kata sandi default saat login pertama.`
    );

    setTimeout(() => {
      setIsLoading(false);
      onPasswordChanged(updatedUser);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Wajib Ganti Kata Sandi</h3>
            <p className="text-xs text-slate-500">Ketentuan Keamanan Akun Login Pertama</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Demi menjaga keamanan data sarana & prasarana satuan pendidikan Anda, Anda wajib mengganti kata sandi bawaan sistem sebelum melanjutkan.
          </span>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center font-bold"
              disabled={isLoading}
            >
              {isLoading ? 'Memperbarui...' : 'Simpan Kata Sandi & Lanjutkan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
