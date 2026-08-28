import React, { useState } from 'react';
import { School, User } from '../../types';
import { storage } from '../../lib/storage';
import { SchoolMap } from '../map/SchoolMap';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  School as SchoolIcon,
  Building2,
  Package,
  ShieldCheck,
  MapPin,
  FileCheck2,
  LogIn,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Sparkles,
  HelpCircle,
  KeyRound,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: (presetUser?: User) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  const schools = storage.getSchools();
  const summary = storage.getDashboardSummary();
  const settings = storage.getSystemSettings();
  const users = storage.getUsers();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'SD' | 'SMP'>('ALL');

  const filteredSchools = schools.filter(s => {
    if (selectedRoleFilter === 'ALL') return true;
    return s.education_level === selectedRoleFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Government Strip */}
      <div className="bg-teal-950 text-teal-200 text-xs py-1.5 px-4 sm:px-8 border-b border-teal-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Portal Resmi Pemerintah Kabupaten Manggarai Barat - NTT</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-teal-300">
          <span>Tahun Ajaran: {settings.active_academic_year}</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Dinas Pendidikan, Kepemudaan dan Olahraga</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-amber-400">
              MABAR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-teal-950 tracking-tight">SIPRAS</span>
                <span className="font-black text-lg text-amber-600 tracking-tight">MABAR</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Sistem Informasi Sarana dan Prasarana Sekolah Kab. Manggarai Barat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#peta-sebaran"
              className="text-xs font-semibold text-slate-600 hover:text-teal-800 transition-colors hidden md:inline-block px-3 py-1.5"
            >
              Peta Sebaran
            </a>
            <a
              href="#statistik"
              className="text-xs font-semibold text-slate-600 hover:text-teal-800 transition-colors hidden md:inline-block px-3 py-1.5"
            >
              Statistik Sarpras
            </a>
            <Button
              variant="primary"
              size="sm"
              icon={LogIn}
              onClick={() => onLoginClick()}
              className="font-bold shadow-md"
            >
              Masuk Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-teal-900 via-teal-800 to-slate-900 text-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3.5 py-1 text-xs font-semibold text-teal-200 border border-teal-400/30 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Sistem Terintegrasi DAK & BOS TA {settings.active_academic_year}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Pendataan Sarana & Prasarana Sekolah{' '}
              <span className="text-amber-400">Kabupaten Manggarai Barat</span>
            </h1>

            <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-2xl">
              Platform digital terpadu Dinas Pendidikan, Kepemudaan dan Olahraga untuk pencatatan, pemetaan spasial GIS,
              validasi kondisi fisik gedung, dan penerbitan SPTJM jenjang SD & SMP di 12 Kecamatan.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={LogIn}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-xl border-none"
                onClick={() => onLoginClick()}
              >
                Login Operator / Dinas
              </Button>
              <a href="#peta-sebaran">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-xs font-bold"
                >
                  Eksplorasi Peta Geospasial
                </Button>
              </a>
            </div>

            {/* Quick Demo Role Logins */}
            <div className="pt-4 border-t border-teal-700/50">
              <p className="text-xs font-semibold text-teal-200 mb-2">Akses Cepat Demo Akun:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onLoginClick(users.find(u => u.role === 'super_admin'))}
                  className="px-2.5 py-1 rounded-md bg-teal-950/60 hover:bg-teal-950 text-[11px] font-medium text-teal-200 border border-teal-600/40 transition-colors"
                >
                  Super Admin (Kadis)
                </button>
                <button
                  onClick={() => onLoginClick(users.find(u => u.role === 'sd_admin'))}
                  className="px-2.5 py-1 rounded-md bg-teal-950/60 hover:bg-teal-950 text-[11px] font-medium text-teal-200 border border-teal-600/40 transition-colors"
                >
                  Admin Bidang SD
                </button>
                <button
                  onClick={() => onLoginClick(users.find(u => u.role === 'smp_admin'))}
                  className="px-2.5 py-1 rounded-md bg-teal-950/60 hover:bg-teal-950 text-[11px] font-medium text-teal-200 border border-teal-600/40 transition-colors"
                >
                  Admin Bidang SMP
                </button>
                <button
                  onClick={() => onLoginClick(users.find(u => u.role === 'school_operator'))}
                  className="px-2.5 py-1 rounded-md bg-teal-950/60 hover:bg-teal-950 text-[11px] font-medium text-amber-300 border border-amber-500/40 transition-colors"
                >
                  Operator Sekolah (SDN 1 Labuan Bajo)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Hero Card */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl space-y-4 text-white">
            <h3 className="text-sm font-bold tracking-wide uppercase text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Ikhtisar Sarpras Manggarai Barat
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-950/50 p-3.5 rounded-xl border border-teal-500/20">
                <span className="text-[11px] text-teal-200">Total Sekolah</span>
                <p className="text-2xl font-black text-white mt-1">{summary.total_schools}</p>
                <span className="text-[10px] text-teal-300">SD: {summary.total_sd} | SMP: {summary.total_smp}</span>
              </div>

              <div className="bg-teal-950/50 p-3.5 rounded-xl border border-teal-500/20">
                <span className="text-[11px] text-teal-200">Total Bangunan</span>
                <p className="text-2xl font-black text-white mt-1">{summary.total_infrastructure_items}</p>
                <span className="text-[10px] text-teal-300">Gedung & Ruang</span>
              </div>

              <div className="bg-teal-950/50 p-3.5 rounded-xl border border-teal-500/20">
                <span className="text-[11px] text-amber-300">Perlu DAK / Rehab</span>
                <p className="text-2xl font-black text-amber-400 mt-1">
                  {summary.minor_damage_count + summary.major_damage_count}
                </p>
                <span className="text-[10px] text-amber-200">Kondisi Rusak Ringan/Berat</span>
              </div>

              <div className="bg-teal-950/50 p-3.5 rounded-xl border border-teal-500/20">
                <span className="text-[11px] text-teal-200">Kekurangan Sarana</span>
                <p className="text-2xl font-black text-white mt-1">+{summary.required_additional_items}</p>
                <span className="text-[10px] text-teal-300">Usulan Tambahan Unit</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs flex items-center gap-2.5">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-300" />
              <span>
                Batas Pengumpulan SPTJM: <strong>{settings.dak_submission_deadline || '31 Oktober 2025'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* GIS Map Section */}
      <section id="peta-sebaran" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-teal-700" />
              Peta Sebaran Geospasial Satuan Pendidikan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sebaran titik koordinat lokasi SD dan SMP di 12 Kecamatan wilayah Kabupaten Manggarai Barat
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedRoleFilter === 'ALL' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({schools.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('SD')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedRoleFilter === 'SD' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SD ({schools.filter(s => s.education_level === 'SD').length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('SMP')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedRoleFilter === 'SMP' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SMP ({schools.filter(s => s.education_level === 'SMP').length})
            </button>
          </div>
        </div>

        <SchoolMap schools={filteredSchools} height="520px" showFilters={true} />
      </section>

      {/* 12 Districts Overview Section */}
      <section id="statistik" className="py-12 bg-white border-y border-slate-200 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">Cakupan 12 Kecamatan Manggarai Barat</h2>
            <p className="text-xs text-slate-500">
              Komparasi jumlah satuan pendidikan dan status kesiapan sarana prasarana di tiap kecamatan
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'Komodo',
              'Boleng',
              'Mbeliling',
              'Sano Nggoang',
              'Lembor',
              'Lembor Selatan',
              'Welak',
              'Pacar',
              'Macang Pacar',
              'Ndoso',
              'Kuwus',
              'Kuwus Barat'
            ].map(dist => {
              const distSchools = schools.filter(s => s.district === dist);
              const sdCount = distSchools.filter(s => s.education_level === 'SD').length;
              const smpCount = distSchools.filter(s => s.education_level === 'SMP').length;

              return (
                <div
                  key={dist}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 hover:border-teal-400 hover:bg-teal-50/30 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">Kec. {dist}</span>
                    <span className="text-xs font-black text-teal-800 bg-teal-100 px-2 py-0.5 rounded-md">
                      {distSchools.length} Sekolah
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>SD: {sdCount} unit</span>
                    <span>SMP: {smpCount} unit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 px-4 sm:px-8 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="h-7 w-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs">
                MB
              </div>
              <span>SIPRAS MABAR</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Sistem Informasi Sarana dan Prasarana Sekolah Kabupaten Manggarai Barat, Nusa Tenggara Timur. Dibangun untuk
              mendukung akuntabilitas dan efektivitas intervensi fasilitas pendidikan.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Kontak & Alamat Kedinasan</h4>
            <p className="text-[11px]">
              Dinas Pendidikan, Kepemudaan dan Olahraga Kab. Manggarai Barat
            </p>
            <p className="text-[11px]">Jl. Frans Nala No. 1, Labuan Bajo, Flores - NTT 86554</p>
            <p className="text-[11px]">Email: dikpora@manggaraibaratkab.go.id | Telp: (0385) 41234</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Bantuan & Layanan</h4>
            <p className="text-[11px]">Helpdesk Sarpras: 0812-3890-4411 (WhatsApp Tim Teknis DAK)</p>
            <p className="text-[11px]">Jam Operasional Layanan: Senin - Jumat (08.00 - 16.00 WITA)</p>
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={() => onLoginClick()} className="text-white border-slate-700">
                Masuk ke Akun Anda <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-[11px]">
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Manggarai Barat. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </footer>
    </div>
  );
};
