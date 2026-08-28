import React, { useState } from 'react';
import { User, School } from '../../types';
import { storage } from '../../lib/storage';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  LayoutDashboard,
  MapPin,
  School as SchoolIcon,
  Layers,
  Building,
  DoorOpen,
  Boxes,
  Package,
  FileCheck2,
  Users,
  Settings,
  ShieldAlert,
  Database,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Globe,
  Bell,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'map'
  | 'school_profile'
  | 'land'
  | 'building'
  | 'room'
  | 'supporting'
  | 'facility'
  | 'sptjm'
  | 'admin_schools'
  | 'admin_users'
  | 'admin_settings'
  | 'admin_logs'
  | 'admin_schema';

interface AppLayoutProps {
  currentUser: User;
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  onLogout: () => void;
  onBackToPortal: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  onBackToPortal,
  children
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isOperator = currentUser.role === 'school_operator';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'sd_admin' || currentUser.role === 'smp_admin';
  const isSuperAdmin = currentUser.role === 'super_admin';

  const userSchool: School | null = isOperator && currentUser.school_id ? storage.getSchoolById(currentUser.school_id) : null;
  const isProfileCompleted = userSchool ? userSchool.profile_completed : true;

  const settings = storage.getSystemSettings();

  const roleLabelMap: Record<string, string> = {
    super_admin: 'Super Admin Dinas',
    sd_admin: 'Admin Bidang SD',
    smp_admin: 'Admin Bidang SMP',
    school_operator: 'Operator Sekolah'
  };

  const navItems = [
    {
      group: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard Sarpras', icon: LayoutDashboard },
        { id: 'map', label: 'Peta Geospasial (GIS)', icon: MapPin }
      ]
    },
    {
      group: 'DATA SEKOLAH',
      items: [
        {
          id: 'school_profile',
          label: 'Profil Sekolah',
          icon: SchoolIcon,
          badge: isOperator && !isProfileCompleted ? 'Wajib Diisi' : undefined
        }
      ]
    },
    {
      group: 'PRASARANA (INFRASTRUKTUR)',
      locked: isOperator && !isProfileCompleted,
      items: [
        { id: 'land', label: 'Tanah & Lahan', icon: Layers },
        { id: 'building', label: 'Gedung / Bangunan', icon: Building },
        { id: 'room', label: 'Ruang Kelas & Fasilitas', icon: DoorOpen },
        { id: 'supporting', label: 'Prasarana Penunjang', icon: Boxes }
      ]
    },
    {
      group: 'SARANA (INVENTARIS)',
      locked: isOperator && !isProfileCompleted,
      items: [{ id: 'facility', label: 'Sarana & Alat Pendidikan', icon: Package }]
    },
    {
      group: 'DOKUMEN & PERTANGGUNGJAWABAN',
      locked: isOperator && !isProfileCompleted,
      items: [{ id: 'sptjm', label: 'SPTJM & Verifikasi', icon: FileCheck2 }]
    },
    ...(isAdmin
      ? [
          {
            group: 'ADMINISTRASI DINAS',
            items: [
              { id: 'admin_schools', label: 'Master Satuan Pendidikan', icon: SchoolIcon },
              ...(isSuperAdmin
                ? [
                    { id: 'admin_users', label: 'Manajemen Akun & RBAC', icon: Users },
                    { id: 'admin_settings', label: 'Pengaturan & Format Kop', icon: Settings },
                    { id: 'admin_logs', label: 'Audit Log & Keamanan', icon: ShieldAlert }
                  ]
                : []),
              { id: 'admin_schema', label: 'Skema Supabase & Panduan', icon: Database }
            ]
          }
        ]
      : [])
  ];

  const handleTabClick = (id: string, locked?: boolean) => {
    if (locked) return;
    onSelectTab(id as NavTabId);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-100/70 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-30 select-none">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs shadow-md border-2 border-amber-400">
            MB
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm text-white tracking-tight">SIPRAS</span>
              <span className="font-extrabold text-sm text-amber-400 tracking-tight">MABAR</span>
            </div>
            <p className="text-[10px] text-teal-400 font-medium">Kab. Manggarai Barat</p>
          </div>
        </div>

        {/* Current Operator School Banner */}
        {userSchool && (
          <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-teal-950/80 border border-teal-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <SchoolIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{userSchool.name}</span>
            </div>
            <p className="text-[10px] text-teal-300 mt-0.5">
              NPSN: {userSchool.npsn} | Kec. {userSchool.district}
            </p>
          </div>
        )}

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {navItems.map((grp, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase flex items-center justify-between">
                <span>{grp.group}</span>
                {grp.locked && <Lock className="w-3 h-3 text-amber-500" />}
              </div>

              <div className="space-y-0.5">
                {grp.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isLocked = grp.locked;

                  return (
                    <button
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => handleTabClick(item.id, isLocked)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-teal-700 text-white shadow-sm'
                          : isLocked
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>TA: {settings.active_academic_year}</span>
          <span className="text-emerald-400 font-medium">● Online</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="font-black text-xs text-slate-900">SIPRAS MABAR</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-medium text-slate-500 capitalize">
                {activeTab.replace('_', ' ').replace('admin', 'Admin')}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-700" />
              <span>Portal Publik</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">{currentUser.full_name}</div>
                  <div className="text-[10px] text-teal-700 font-semibold leading-none mt-0.5">
                    {roleLabelMap[currentUser.role]}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{currentUser.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{currentUser.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onBackToPortal();
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Globe className="w-3.5 h-3.5 text-teal-700" />
                    <span>Lihat Halaman Publik</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Profile Lock Alert for School Operator */}
        {isOperator && !isProfileCompleted && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-amber-600 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Perhatian:</strong> Seluruh menu sarpras (Tanah, Bangunan, Ruang, Sarana, SPTJM) terkunci sampai Profil Sekolah Anda dilengkapi.
              </span>
            </div>
            <button
              onClick={() => onSelectTab('school_profile')}
              className="px-2.5 py-1 rounded bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-900"
            >
              Lengkapi Sekarang
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 text-slate-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  MB
                </div>
                <span className="font-bold text-sm text-white">SIPRAS MABAR</span>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {navItems.map((grp, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <div className="px-2 text-[10px] font-extrabold text-slate-500 uppercase flex items-center justify-between">
                    <span>{grp.group}</span>
                    {grp.locked && <Lock className="w-3 h-3 text-amber-500" />}
                  </div>
                  {grp.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        disabled={grp.locked}
                        onClick={() => handleTabClick(item.id, grp.locked)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold ${
                          isActive
                            ? 'bg-teal-700 text-white'
                            : grp.locked
                            ? 'opacity-40 text-slate-500'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-800">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-900/60 text-rose-200 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
