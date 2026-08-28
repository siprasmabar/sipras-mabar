import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  School,
  Building,
  FacilityItem,
  User,
  DashboardSummary,
  DISTRICT_LIST
} from '../../types';
import { storage } from '../../lib/storage';
import { StatCard } from '../common/StatCard';
import { SchoolMap } from '../map/SchoolMap';
import {
  Building2,
  Package,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  School as SchoolIcon,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../common/Button';

interface OverviewDashboardProps {
  currentUser: User;
  onNavigate: (tab: string) => void;
}

const CONDITION_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ currentUser, onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary>(storage.getDashboardSummary());
  const [schools, setSchools] = useState<School[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);

  useEffect(() => {
    const loadData = () => {
      let allowedLevel: 'SD' | 'SMP' | undefined = undefined;
      if (currentUser.role === 'sd_admin') allowedLevel = 'SD';
      if (currentUser.role === 'smp_admin') allowedLevel = 'SMP';

      const schoolId = currentUser.role === 'school_operator' ? currentUser.school_id || undefined : undefined;

      setSummary(storage.getDashboardSummary(allowedLevel, schoolId));

      let allSchools = storage.getSchools();
      if (allowedLevel) {
        allSchools = allSchools.filter(s => s.education_level === allowedLevel);
      }
      if (schoolId) {
        allSchools = allSchools.filter(s => s.id === schoolId);
      }
      setSchools(allSchools);
      setBuildings(storage.getBuildings(schoolId));
      setFacilities(storage.getFacilities(schoolId));
    };

    loadData();

    const handleStorageUpdate = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('sipras_storage_update', handleStorageUpdate);
  }, [currentUser]);

  // District statistics data
  const districtData = DISTRICT_LIST.map(district => {
    const distSchools = schools.filter(s => s.district === district);
    const sdCount = distSchools.filter(s => s.education_level === 'SD').length;
    const smpCount = distSchools.filter(s => s.education_level === 'SMP').length;
    return {
      name: district,
      SD: sdCount,
      SMP: smpCount,
      Total: distSchools.length
    };
  }).filter(d => currentUser.role === 'school_operator' ? d.Total > 0 : true);

  // Condition breakdown
  const conditionCounts = {
    Baik: 0,
    'Rusak Ringan': 0,
    'Rusak Sedang': 0,
    'Rusak Berat': 0,
    'Rusak Total': 0
  };

  buildings.forEach(b => {
    if (conditionCounts[b.condition] !== undefined) {
      conditionCounts[b.condition] += 1;
    }
  });

  const conditionPieData = Object.entries(conditionCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Facility categories deficit chart
  const categoryDeficit = [
    { name: 'Mebel / Meja Kursi', deficit: 0, good: 0 },
    { name: 'Peralatan TIK', deficit: 0, good: 0 },
    { name: 'Alat Peraga IPA/Seni', deficit: 0, good: 0 },
    { name: 'Buku & Literasi', deficit: 0, good: 0 },
    { name: 'Alat Olahraga', deficit: 0, good: 0 },
    { name: 'Kesehatan UKS', deficit: 0, good: 0 }
  ];

  facilities.forEach(f => {
    if (f.category === 'furniture') {
      categoryDeficit[0].deficit += f.required_additional_quantity;
      categoryDeficit[0].good += f.good_condition;
    } else if (f.category === 'it_equipment') {
      categoryDeficit[1].deficit += f.required_additional_quantity;
      categoryDeficit[1].good += f.good_condition;
    } else if (f.category === 'learning_equipment') {
      categoryDeficit[2].deficit += f.required_additional_quantity;
      categoryDeficit[2].good += f.good_condition;
    } else if (f.category === 'books') {
      categoryDeficit[3].deficit += f.required_additional_quantity;
      categoryDeficit[3].good += f.good_condition;
    } else if (f.category === 'sports_equipment') {
      categoryDeficit[4].deficit += f.required_additional_quantity;
      categoryDeficit[4].good += f.good_condition;
    } else if (f.category === 'health_equipment') {
      categoryDeficit[5].deficit += f.required_additional_quantity;
      categoryDeficit[5].good += f.good_condition;
    }
  });

  const systemSettings = storage.getSystemSettings();
  const currentSchool = currentUser.school_id ? storage.getSchoolById(currentUser.school_id) : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-teal-900 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-200 border border-teal-400/30 backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Tahun Ajaran Aktif: {systemSettings.active_academic_year}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {currentUser.full_name}
            </h1>
            <p className="text-sm text-teal-100/90 leading-relaxed">
              {currentSchool
                ? `Portal Pendataan Sarana & Prasarana ${currentSchool.name} (NPSN: ${currentSchool.npsn}) - Kecamatan ${currentSchool.district}`
                : 'Sistem Informasi Sarana dan Prasarana Sekolah Kabupaten Manggarai Barat untuk pemantauan, validasi, dan pelaporan terpadu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser.role === 'school_operator' ? (
              <Button
                variant="primary"
                className="bg-white text-teal-900 hover:bg-teal-50 font-bold shadow-md"
                onClick={() => onNavigate('sptjm')}
              >
                Unduh / Unggah SPTJM
              </Button>
            ) : (
              <Button
                variant="primary"
                className="bg-white text-teal-900 hover:bg-teal-50 font-bold shadow-md"
                onClick={() => onNavigate('map')}
              >
                Buka Peta Sebaran GIS
              </Button>
            )}
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Satuan Pendidikan"
          value={summary.total_schools}
          subtitle={`SD: ${summary.total_sd} | SMP: ${summary.total_smp}`}
          icon={SchoolIcon}
          iconBgColor="bg-teal-100"
          iconColor="text-teal-800"
          onClick={() => onNavigate(currentUser.role === 'school_operator' ? 'profile' : 'schools')}
        />
        <StatCard
          title="Total Aset Bangunan & Ruang"
          value={summary.total_infrastructure_items}
          subtitle="Gedung, Ruang Kelas & Penunjang"
          icon={Building2}
          iconBgColor="bg-sky-100"
          iconColor="text-sky-800"
          onClick={() => onNavigate('buildings')}
        />
        <StatCard
          title="Kondisi Rusak (Perlu DAK/BOS)"
          value={summary.minor_damage_count + summary.major_damage_count}
          subtitle={`Ringan/Sedang: ${summary.minor_damage_count} | Berat: ${summary.major_damage_count}`}
          icon={AlertTriangle}
          iconBgColor="bg-amber-100"
          iconColor="text-amber-800"
          onClick={() => onNavigate('buildings')}
        />
        <StatCard
          title="Kebutuhan Penambahan Sarana"
          value={summary.required_additional_items}
          subtitle="Unit kekurangan mebel, TIK, buku"
          icon={Package}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-800"
          onClick={() => onNavigate('facilities')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Distribution Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Sebaran Sekolah Berdasarkan Kecamatan</h3>
              <p className="text-xs text-slate-500">Komparasi Satuan Pendidikan SD dan SMP di 12 Kecamatan Manggarai Barat</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-teal-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block" /> SD
              </span>
              <span className="flex items-center gap-1 text-sky-700">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> SMP
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="SD" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="SMP" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Condition Breakdown Pie Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Kondisi Bangunan Sekolah</h3>
              <p className="text-xs text-slate-500">Kategori kelayakan fisik sarpras</p>
            </div>

            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={conditionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {conditionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CONDITION_COLORS[index % CONDITION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
            {conditionPieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CONDITION_COLORS[idx] }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Facilities Deficit Breakdown & Map Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deficit Bar Chart */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-4">
            <h3 className="text-base font-bold text-slate-900">Kekurangan Sarana per Kategori</h3>
            <p className="text-xs text-slate-500">Jumlah unit usulan penambahan fasilitas</p>
          </div>

          <div className="space-y-3.5">
            {categoryDeficit.map((cat, i) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                  <span className="font-bold text-rose-600">+{cat.deficit} unit</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
                  <div
                    className="h-full bg-teal-600"
                    style={{ width: `${Math.min(100, (cat.good / (cat.good + cat.deficit || 1)) * 100)}%` }}
                    title={`Baik: ${cat.good}`}
                  />
                  <div
                    className="h-full bg-rose-500"
                    style={{ width: `${Math.min(100, (cat.deficit / (cat.good + cat.deficit || 1)) * 100)}%` }}
                    title={`Kurang: ${cat.deficit}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Kelola 7 Submodul Sarana</span>
            <Button size="sm" variant="outline" onClick={() => onNavigate('facilities')}>
              Detail Sarana <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* GIS Map Preview */}
        <div className="lg:col-span-2">
          <SchoolMap schools={schools} height="360px" showFilters={false} />
        </div>
      </div>
    </div>
  );
};
