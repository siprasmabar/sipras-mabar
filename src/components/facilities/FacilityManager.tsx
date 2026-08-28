import React, { useState, useEffect } from 'react';
import {
  FacilityItem,
  FacilityCategory,
  FACILITY_CATEGORIES,
  School,
  Room,
  User
} from '../../types';
import { storage } from '../../lib/storage';
import { calculateFacilityTotal, calculateFacilityCondition } from '../../lib/calculations';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  Package,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Armchair,
  Laptop,
  GraduationCap,
  BookOpen,
  Activity,
  HeartPulse,
  MoreHorizontal,
  Calculator,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from 'lucide-react';

interface FacilityManagerProps {
  currentUser: User;
}

const CATEGORY_ICONS: Record<FacilityCategory, React.ComponentType<{ className?: string }>> = {
  furniture: Armchair,
  it_equipment: Laptop,
  learning_equipment: GraduationCap,
  books: BookOpen,
  sports_equipment: Activity,
  health_equipment: HeartPulse,
  supporting_assets: MoreHorizontal,
  other: MoreHorizontal
};

export const FacilityManager: React.FC<FacilityManagerProps> = ({ currentUser }) => {
  const [activeCategory, setActiveCategory] = useState<FacilityCategory>('furniture');
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Partial<FacilityItem> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityItem | null>(null);

  const isOperator = currentUser.role === 'school_operator';

  const loadData = () => {
    let allowedLevel: 'SD' | 'SMP' | undefined = undefined;
    if (currentUser.role === 'sd_admin') allowedLevel = 'SD';
    if (currentUser.role === 'smp_admin') allowedLevel = 'SMP';

    let allSchools = storage.getSchools();
    if (allowedLevel) {
      allSchools = allSchools.filter(s => s.education_level === allowedLevel);
    }
    setSchools(allSchools);

    const schoolFilter = isOperator ? currentUser.school_id || undefined : (selectedSchoolId === 'ALL' ? undefined : selectedSchoolId);
    setFacilities(storage.getFacilities(schoolFilter));
    setRooms(storage.getRooms(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  // Filtered by category and search
  const filteredFacilities = facilities.filter(f => {
    if (f.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchRoom = (f.room_name || '').toLowerCase().includes(q);
      const matchSpec = (f.specification || '').toLowerCase().includes(q);
      if (!matchName && !matchRoom && !matchSpec) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage) || 1;
  const paginatedFacilities = filteredFacilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
    const availableRooms = rooms.filter(r => r.school_id === targetSchoolId);
    const firstRoom = availableRooms[0];

    setEditingFacility({
      id: 'fac-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchoolId,
      category: activeCategory,
      room_id: firstRoom?.id || '',
      room_name: firstRoom?.room_function || 'Ruang Kelas',
      name: '',
      specification: '',
      good_condition: 20,
      minor_damage: 0,
      moderate_damage: 0,
      major_damage: 0,
      total_damage: 0,
      total_quantity: 20,
      required_additional_quantity: 0,
      condition: 'Baik',
      source: 'Dana BOS'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FacilityItem) => {
    setEditingFacility(f);
    setIsModalOpen(true);
  };

  const handleNumberChange = (field: keyof FacilityItem, value: number) => {
    if (!editingFacility) return;
    const num = Math.max(0, Number(value) || 0);
    const updated = { ...editingFacility, [field]: num };

    // Auto-calculate Total Quantity & Condition
    const good = field === 'good_condition' ? num : Number(updated.good_condition || 0);
    const minor = field === 'minor_damage' ? num : Number(updated.minor_damage || 0);
    const mod = field === 'moderate_damage' ? num : Number(updated.moderate_damage || 0);
    const maj = field === 'major_damage' ? num : Number(updated.major_damage || 0);
    const totDam = field === 'total_damage' ? num : Number(updated.total_damage || 0);

    updated.total_quantity = calculateFacilityTotal(good, minor, mod, maj, totDam);
    updated.condition = calculateFacilityCondition(good, minor, mod, maj, totDam);

    setEditingFacility(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility || !editingFacility.name || !editingFacility.school_id) return;

    const good = Number(editingFacility.good_condition || 0);
    const minor = Number(editingFacility.minor_damage || 0);
    const mod = Number(editingFacility.moderate_damage || 0);
    const maj = Number(editingFacility.major_damage || 0);
    const totDam = Number(editingFacility.total_damage || 0);

    const calcTotal = calculateFacilityTotal(good, minor, mod, maj, totDam);
    const calcCond = calculateFacilityCondition(good, minor, mod, maj, totDam);

    const fToSave: FacilityItem = {
      id: editingFacility.id || 'fac-' + Math.random().toString(36).substring(2, 9),
      school_id: editingFacility.school_id,
      category: activeCategory,
      room_id: editingFacility.room_id || 'rm-default',
      room_name: editingFacility.room_name || 'Ruang Sekolah',
      name: editingFacility.name,
      specification: editingFacility.specification || '',
      good_condition: good,
      minor_damage: minor,
      moderate_damage: mod,
      major_damage: maj,
      total_damage: totDam,
      total_quantity: calcTotal,
      required_additional_quantity: Number(editingFacility.required_additional_quantity || 0),
      condition: calcCond,
      source: editingFacility.source || 'Dana BOS',
      created_at: editingFacility.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveFacility(fToSave);
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  const handleDelete = () => {
    if (facilityToDelete) {
      storage.deleteFacility(facilityToDelete.id);
      setIsDeleteModalOpen(false);
      setFacilityToDelete(null);
    }
  };

  // Export handlers
  const exportColumns = [
    { header: 'Nama Sarana', accessor: (f: FacilityItem) => f.name },
    { header: 'Kategori', accessor: (f: FacilityItem) => FACILITY_CATEGORIES.find(c => c.id === f.category)?.label || f.category },
    { header: 'Penempatan Ruang', accessor: (f: FacilityItem) => f.room_name || '-' },
    { header: 'Sekolah', accessor: (f: FacilityItem) => storage.getSchoolById(f.school_id)?.name || '-' },
    { header: 'Baik', accessor: (f: FacilityItem) => f.good_condition },
    { header: 'R. Ringan', accessor: (f: FacilityItem) => f.minor_damage },
    { header: 'R. Sedang', accessor: (f: FacilityItem) => f.moderate_damage },
    { header: 'R. Berat', accessor: (f: FacilityItem) => f.major_damage },
    { header: 'R. Total', accessor: (f: FacilityItem) => f.total_damage },
    { header: 'Total Unit', accessor: (f: FacilityItem) => f.total_quantity },
    { header: 'Kekurangan (Usul)', accessor: (f: FacilityItem) => `+${f.required_additional_quantity}` },
    { header: 'Kondisi Dominan', accessor: (f: FacilityItem) => f.condition }
  ];

  const handleExportExcel = () => exportToExcel(filteredFacilities, exportColumns, `Data_Sarana_${activeCategory}_Mabar`);
  const handleExportPDF = () =>
    exportToPDF(
      filteredFacilities,
      exportColumns,
      `Laporan Sarana Sekolah - Kategori ${FACILITY_CATEGORIES.find(c => c.id === activeCategory)?.label}`,
      storage.getDocumentSigner()
    );

  const activeCategoryMeta = FACILITY_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-700" />
            Manajemen Data Sarana & Peralatan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan inventaris 7 subkategori sarana: mebel, TIK, alat peraga, buku, olahraga, UKS, dan usulan penambahan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={handleExportExcel}>
            Excel
          </Button>
          <Button variant="outline" size="sm" icon={FileText} onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="outline" size="sm" icon={Printer} onClick={triggerPrint}>
            Cetak
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Tambah Sarana Baru
          </Button>
        </div>
      </div>

      {/* 7 Subcategory Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {FACILITY_CATEGORIES.map(cat => {
          const Icon = CATEGORY_ICONS[cat.id];
          const isActive = activeCategory === cat.id;
          const catCount = facilities.filter(f => f.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'border-teal-600 bg-teal-50 text-teal-900 shadow-xs font-bold ring-1 ring-teal-600'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
              <span className="text-xs truncate w-full">{cat.label}</span>
              <span className={`text-[10px] mt-1 px-1.5 py-0.2 rounded-full ${isActive ? 'bg-teal-200/80 text-teal-800' : 'bg-slate-100 text-slate-500'}`}>
                {catCount} item
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {!isOperator && (
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">Semua Satuan Pendidikan</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.district})
                </option>
              ))}
            </select>
          )}

          <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg">
            Kategori: {activeCategoryMeta?.label} ({filteredFacilities.length} Item)
          </span>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari sarana / spesifikasi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Nama Sarana & Spesifikasi</th>
                <th className="px-4 py-3.5">Penempatan Ruang</th>
                <th className="px-4 py-3.5 text-center">Baik</th>
                <th className="px-4 py-3.5 text-center">Rusak (R/S/B/T)</th>
                <th className="px-4 py-3.5 text-center">Total Tersedia</th>
                <th className="px-4 py-3.5 text-center">Kebutuhan Usulan</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFacilities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data sarana untuk kategori <strong>{activeCategoryMeta?.label}</strong>. Silakan tambah data baru.
                  </td>
                </tr>
              ) : (
                paginatedFacilities.map(f => {
                  const sch = storage.getSchoolById(f.school_id);
                  const totalDamaged = f.minor_damage + f.moderate_damage + f.major_damage + f.total_damage;

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>{f.name}</span>
                        </div>
                        {f.specification && (
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                            {f.specification}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">Sumber: {f.source}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{f.room_name || '-'}</div>
                        <div className="text-[10px] text-slate-400">{sch?.name}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md min-w-[28px]">
                          {f.good_condition}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {totalDamaged > 0 ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-rose-700">{totalDamaged} Unit</span>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ({f.minor_damage}/{f.moderate_damage}/{f.major_damage}/{f.total_damage})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-extrabold text-slate-900 text-sm">
                        {f.total_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {f.required_additional_quantity > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md text-xs">
                            <TrendingDown className="w-3 h-3" />+{f.required_additional_quantity} Unit
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Tercukupi</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Edit Sarana"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFacilityToDelete(f);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Sarana"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Menampilkan {filteredFacilities.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredFacilities.length)} dari {filteredFacilities.length} data
          </span>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-700 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacility?.name ? 'Edit Data Sarana' : `Tambah Sarana (${activeCategoryMeta?.label})`}
        subtitle="Rincian jumlah kondisi fisik dan kalkulasi otomatis total ketersediaan aset"
        maxWidth="2xl"
      >
        {editingFacility && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {!isOperator && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingFacility.school_id}
                  onChange={e => {
                    const schId = e.target.value;
                    const schRooms = rooms.filter(r => r.school_id === schId);
                    setEditingFacility({
                      ...editingFacility,
                      school_id: schId,
                      room_id: schRooms[0]?.id || '',
                      room_name: schRooms[0]?.room_function || ''
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  required
                >
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Sarana / Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingFacility.name || ''}
                  onChange={e => setEditingFacility({ ...editingFacility, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="Contoh: Meja Siswa Kayu / Laptop Chromebook"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Penempatan Ruangan</label>
                <select
                  value={editingFacility.room_id}
                  onChange={e => {
                    const found = rooms.find(r => r.id === e.target.value);
                    setEditingFacility({
                      ...editingFacility,
                      room_id: e.target.value,
                      room_name: found?.room_function || ''
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {rooms
                    .filter(r => r.school_id === editingFacility.school_id)
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.room_function} ({r.building_name})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spesifikasi / Merek / Tipe</label>
                <input
                  type="text"
                  value={editingFacility.specification || ''}
                  onChange={e => setEditingFacility({ ...editingFacility, specification: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="Kayu Jati / Axioo Chromebook / Penerbit Kemendikbud"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Pengadaan</label>
                <select
                  value={editingFacility.source || 'Dana BOS'}
                  onChange={e => setEditingFacility({ ...editingFacility, source: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Dana BOS">Dana BOS Reguler</option>
                  <option value="DAK Fisik">DAK Fisik Kemendikbudristek</option>
                  <option value="APBD Mabar">APBD Kab. Manggarai Barat</option>
                  <option value="Bantuan Pusat">Bantuan Pemerintah Pusat</option>
                  <option value="Komite/Yayasan">Bantuan Komite / Donatur</option>
                </select>
              </div>
            </div>

            {/* Quantity Breakdowns per Condition */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-teal-700" />
                  Rincian Kondisi Fisik & Formula Otomatis
                </span>
                <span className="text-xs font-black text-teal-800">
                  Total Terdata: {editingFacility.total_quantity || 0} Unit
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold text-emerald-700 mb-1">Kondisi Baik</label>
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.good_condition ?? 0}
                    onChange={e => handleNumberChange('good_condition', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-bold focus:border-teal-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-700 mb-1">Rusak Ringan</label>
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.minor_damage ?? 0}
                    onChange={e => handleNumberChange('minor_damage', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-bold focus:border-teal-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-orange-700 mb-1">Rusak Sedang</label>
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.moderate_damage ?? 0}
                    onChange={e => handleNumberChange('moderate_damage', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-bold focus:border-teal-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-rose-700 mb-1">Rusak Berat</label>
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.major_damage ?? 0}
                    onChange={e => handleNumberChange('major_damage', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-bold focus:border-teal-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-red-900 mb-1">Rusak Total</label>
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.total_damage ?? 0}
                    onChange={e => handleNumberChange('total_damage', Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 font-bold focus:border-teal-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Deficit / Required Additional Quantity */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-rose-700">Usulan Penambahan Kebutuhan (Defisit Sarana):</span>
                  <p className="text-[11px] text-slate-500">Jumlah unit kekurangan yang diajukan ke dinas pendidikan</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editingFacility.required_additional_quantity ?? 0}
                    onChange={e => handleNumberChange('required_additional_quantity', Number(e.target.value))}
                    className="w-24 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-rose-900 font-extrabold focus:border-rose-500 focus:outline-none text-center"
                  />
                  <span className="font-semibold text-slate-700">Unit</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Sarana
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Sarana"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data sarana <strong>{facilityToDelete?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Ya, Hapus Sarana
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
