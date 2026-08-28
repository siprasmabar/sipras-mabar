import React, { useState, useEffect } from 'react';
import { User, UserRole, School } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';

interface UserManagerProps {
  currentUser: User;
}

export const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [schools, setSchools] = useState<School[]>(storage.getSchools());

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> & { new_password?: string } | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const loadData = () => {
    setUsers(storage.getUsers());
    setSchools(storage.getSchools());
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, []);

  const filteredUsers = users.filter(u => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchName = u.full_name.toLowerCase().includes(q);
      if (!matchEmail && !matchName) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingUser({
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: '',
      full_name: '',
      role: 'school_operator',
      school_id: schools[0]?.id || '',
      phone: '',
      is_active: true,
      first_login: true,
      new_password: 'Password123!'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser({ ...u });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.email || !editingUser.full_name) return;

    const userToSave: User = {
      id: editingUser.id || 'usr-' + Math.random().toString(36).substring(2, 9),
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role || 'school_operator',
      school_id: editingUser.role === 'school_operator' ? editingUser.school_id : undefined,
      phone: editingUser.phone || '',
      is_active: editingUser.is_active ?? true,
      first_login: editingUser.first_login ?? true,
      created_at: editingUser.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveUser(userToSave, editingUser.new_password);
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToReset || !newPassword) return;

    storage.saveUser({ ...userToReset, first_login: true }, newPassword);
    setResetSuccessMsg(`Password pengguna ${userToReset.email} berhasil direset menjadi: ${newPassword}`);
    setTimeout(() => {
      setIsResetModalOpen(false);
      setUserToReset(null);
      setNewPassword('');
      setResetSuccessMsg('');
    }, 2500);
  };

  const roleLabels: Record<UserRole, { label: string; badge: 'purple' | 'info' | 'success' | 'neutral' }> = {
    super_admin: { label: 'Super Admin (Kadis/Sekretaris)', badge: 'purple' },
    sd_admin: { label: 'Admin Bidang SD', badge: 'info' },
    smp_admin: { label: 'Admin Bidang SMP', badge: 'info' },
    school_operator: { label: 'Operator Satuan Pendidikan', badge: 'success' }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            Manajemen Akun Pengguna & Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan akun Super Admin, Admin Bidang SD/SMP, dan Operator Satuan Pendidikan se-Manggarai Barat
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Peran / Role</option>
            <option value="super_admin">Super Admin</option>
            <option value="sd_admin">Admin SD</option>
            <option value="smp_admin">Admin SMP</option>
            <option value="school_operator">Operator Sekolah</option>
          </select>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama / email pengguna..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Nama & Email</th>
                <th className="px-4 py-3.5">Peran / Hak Akses</th>
                <th className="px-4 py-3.5">Penugasan Sekolah</th>
                <th className="px-4 py-3.5">No. HP / WhatsApp</th>
                <th className="px-4 py-3.5 text-center">Status Akun</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(u => {
                const assignedSchool = u.school_id ? storage.getSchoolById(u.school_id) : null;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <span>{u.full_name}</span>
                          <p className="text-[11px] font-mono text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={roleLabels[u.role].badge} size="sm">
                        {roleLabels[u.role].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {assignedSchool ? (
                        <div>
                          <span className="font-medium text-slate-800">{assignedSchool.name}</span>
                          <div className="text-[10px] text-slate-400">
                            NPSN: {assignedSchool.npsn} | Kec. {assignedSchool.district}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Semua Sekolah (Dinas)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600">{u.phone || '-'}</td>
                    <td className="px-4 py-3.5 text-center">
                      {u.is_active ? (
                        <Badge variant="success" size="sm">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setUserToReset(u);
                            setNewPassword('Password123!');
                            setIsResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser?.full_name ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        maxWidth="lg"
      >
        {editingUser && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingUser.full_name || ''}
                onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Nama Pengguna"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Email (Username Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="operator@sekolah.sch.id"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="081234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran / Role Otoritas</label>
                <select
                  value={editingUser.role || 'school_operator'}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="school_operator">Operator Satuan Pendidikan</option>
                  <option value="sd_admin">Admin Bidang SD</option>
                  <option value="smp_admin">Admin Bidang SMP</option>
                  <option value="super_admin">Super Admin Dinas Dikpora</option>
                </select>
              </div>

              {editingUser.role === 'school_operator' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan Pendidikan Ditugaskan</label>
                  <select
                    value={editingUser.school_id || ''}
                    onChange={e => setEditingUser({ ...editingUser, school_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  >
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.education_level}] {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!editingUser.created_at && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Default Awal</label>
                <input
                  type="text"
                  value={editingUser.new_password || ''}
                  onChange={e => setEditingUser({ ...editingUser, new_password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none font-mono"
                  placeholder="Password123!"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Pengguna akan diwajibkan mengganti password pada saat login pertama kali.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Akun Pengguna
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Kata Sandi Pengguna"
        maxWidth="sm"
      >
        {userToReset && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Reset kata sandi untuk akun: <strong>{userToReset.full_name}</strong> ({userToReset.email})
            </p>

            {resetSuccessMsg ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg font-medium border border-emerald-200">
                {resetSuccessMsg}
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-mono focus:border-teal-500 focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
