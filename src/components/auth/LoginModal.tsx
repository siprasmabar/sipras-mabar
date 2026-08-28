import React, { useState } from 'react';
import { User } from '../../types';
import { storage } from '../../lib/storage';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  School,
  Users,
  CheckCircle2,
  KeyRound
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialUser?: User | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialUser
}) => {
  const users = storage.getUsers();

  const [email, setEmail] = useState(initialUser?.email || 'operator.sdn1@mabar.sch.id');
  const [password, setPassword] = useState('Password123!');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync if initialUser is passed
  React.useEffect(() => {
    if (initialUser) {
      setEmail(initialUser.email);
      setPassword('Password123!');
      setErrorMsg('');
    }
  }, [initialUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const res = storage.authenticate(email, password);
      if (res && res.success && res.user) {
        if (res.user.is_active === false) {
          setErrorMsg('Akun pengguna ini telah dinonaktifkan oleh administrator.');
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        onLoginSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res?.error || 'Email atau kata sandi tidak sesuai. Silakan periksa kembali kredensial Anda.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleSelectDemoUser = (demoUser: User) => {
    setEmail(demoUser.email);
    setPassword('Password123!');
    setErrorMsg('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md" showCloseButton={true}>
      <div className="space-y-5 text-xs text-slate-800">
        {/* Header */}
        <div className="text-center space-y-1 pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black text-base shadow-md border-2 border-amber-400">
            MB
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Masuk ke Portal SIPRAS MABAR</h3>
          <p className="text-xs text-slate-500">
            Sistem Informasi Sarana & Prasarana Dinas Pendidikan Kab. Manggarai Barat
          </p>
        </div>

        {/* Demo Quick Account Selectors */}
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span>Pilih Akun Demo Login Instan:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {users.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemoUser(u)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  email === u.email
                    ? 'border-teal-600 bg-teal-50/80 text-teal-900 font-bold ring-1 ring-teal-600'
                    : 'border-slate-200 bg-white hover:bg-slate-100/80 text-slate-700 font-medium'
                }`}
              >
                <div className="text-[11px] truncate">{u.full_name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{u.role.replace('_', ' ')}</div>
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email / Nama Pengguna</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@mabar.sch.id"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center font-bold shadow-md"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Memverifikasi...' : 'Masuk Aplikasi'}
            </Button>
          </div>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-400">
          Untuk reset akun operator sekolah, hubungi Tim Admin Sarpras Dinas Dikpora.
        </div>
      </div>
    </Modal>
  );
};
