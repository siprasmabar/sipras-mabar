import React, { useState, useEffect } from 'react';
import { SupportingFacility, School, User, PhysicalCondition } from '../../types';
import { storage } from '../../lib/storage';
import { calculateConditionFromPercentage } from '../../lib/calculations';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  Trees,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Zap,
  Droplets,
  ShieldAlert
} from 'lucide-react';

interface SupportingFacilityManagerProps {
  currentUser: User;
}

export const SupportingFacilityManager: React.FC<SupportingFacilityManagerProps> = ({ currentUser }) => {
  const [facilities, setFacilities] = useState<SupportingFacility[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Partial<SupportingFacility> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<SupportingFacility | null>(null);

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
    setFacilities(storage.getSupportingFacilities(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  const filteredFacilities = facilities.filter(f => {
    if (filterType !== 'ALL' && f.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchType = f.type.toLowerCase().includes(q);
      if (!matchName && !matchType) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredFacilities.length / itemsPerPage) || 1;
  const paginatedFacilities = filteredFacilities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
    setEditingFacility({
      id: 'sup-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchoolId,
      name: '',
      type: 'Lapangan Olahraga & Upacara',
      area: 200,
      last_renovation_date: new Date().toISOString().slice(0, 10),
      damage_percentage: 0,
      condition: 'Baik',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: SupportingFacility) => {
    setEditingFacility(f);
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof SupportingFacility, value: any) => {
    if (!editingFacility) return;
    const updated = { ...editingFacility, [field]: value };
    if (field === 'damage_percentage') {
      const p = Number(value) || 0;
      updated.condition = calculateConditionFromPercentage(p);
    }
    setEditingFacility(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility || !editingFacility.name || !editingFacility.school_id) return;

    const damagePct = Number(editingFacility.damage_percentage) || 0;
    const calcCond = calculateConditionFromPercentage(damagePct);

    const fToSave: SupportingFacility = {
      id: editingFacility.id || 'sup-' + Math.random().toString(36).substring(2, 9),
      school_id: editingFacility.school_id,
      name: editingFacility.name,
      type: editingFacility.type || 'Fasilitas Lainnya',
      area: Number(editingFacility.area) || 0,
      last_renovation_date: editingFacility.last_renovation_date || new Date().toISOString().slice(0, 10),
      damage_percentage: damagePct,
      condition: calcCond,
      photo_url: editingFacility.photo_url,
      notes: editingFacility.notes || '',
      created_at: editingFacility.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveSupportingFacility(fToSave);
    setIsModalOpen(false);
    setEditingFacility(null);
  };

  const handleDelete = () => {
    if (facilityToDelete) {
      storage.deleteSupportingFacility(facilityToDelete.id);
      setIsDeleteModalOpen(false);
      setFacilityToDelete(null);
    }
  };

  const facilityTypes = [
    'Lapangan Olahraga & Upacara',
    'Pagar Keliling & Gerbang',
    'Akses Jalan Masuk & Paving',
    'Instalasi Listrik & Tenaga Surya (PLTS)',
    'Sumber Air Bersih (Sumur/PDAM)',
    'Instalasi Sanitasi & Septic Tank',
    'Drainase & Saluran Pembuangan',
    'Kantin Sekolah',
    'Fasilitas Lainnya'
  ];

  const exportColumns = [
    { header: 'Nama Prasarana', accessor: (f: SupportingFacility) => f.name },
    { header: 'Jenis / Klasifikasi', accessor: (f: SupportingFacility) => f.type },
    { header: 'Sekolah', accessor: (f: SupportingFacility) => storage.getSchoolById(f.school_id)?.name || '-' },
    { header: 'Ukuran / Luas (m²)', accessor: (f: SupportingFacility) => f.area },
    { header: 'Kondisi Fisik', accessor: (f: SupportingFacility) => `${f.condition} (${f.damage_percentage}%)` },
    { header: 'Catatan', accessor: (f: SupportingFacility) => f.notes || '-' }
  ];

  const handleExportExcel = () => exportToExcel(filteredFacilities, exportColumns, 'Data_Prasarana_Penunjang_Mabar');
  const handleExportPDF = () => exportToPDF(filteredFacilities, exportColumns, 'Laporan Data Prasarana Penunjang Sekolah', storage.getDocumentSigner());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Trees className="w-5 h-5 text-teal-700" />
            Manajemen Prasarana Penunjang & Utilitas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan lapangan upacara, pagar keliling, sanitasi air bersih, instalasi kelistrikan, dan drainase
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
            Tambah Prasarana Penunjang
          </Button>
        </div>
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

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Prasarana</option>
            {facilityTypes.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari prasarana penunjang..."
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
                <th className="px-4 py-3.5">Nama Prasarana</th>
                <th className="px-4 py-3.5">Klasifikasi / Tipe</th>
                <th className="px-4 py-3.5">Sekolah</th>
                <th className="px-4 py-3.5 text-right">Luas/Panjang (m²)</th>
                <th className="px-4 py-3.5 text-center">Kondisi Fisik</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFacilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data prasarana penunjang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedFacilities.map(f => {
                  const sch = storage.getSchoolById(f.school_id);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {f.name}
                        {f.notes && <p className="text-[11px] font-normal text-slate-500 line-clamp-1">{f.notes}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="info" size="sm">
                          {f.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {sch?.name || '-'}
                        <div className="text-[10px] text-slate-400">Kec. {sch?.district}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-800">
                        {f.area ? `${f.area.toLocaleString('id-ID')} m²` : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-1">
                          <Badge condition={f.condition} size="sm">
                            {f.condition}
                          </Badge>
                          <span className="block text-[10px] text-slate-500">{f.damage_percentage}% Rusak</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Edit Prasarana"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFacilityToDelete(f);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Prasarana"
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacility?.name ? 'Edit Prasarana Penunjang' : 'Tambah Prasarana Penunjang Baru'}
        maxWidth="lg"
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
                  onChange={e => handleFormChange('school_id', e.target.value)}
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Prasarana Penunjang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingFacility.name || ''}
                onChange={e => handleFormChange('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Contoh: Lapangan Bola Voli & Upacara / Pagar Tembok Depan"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Klasifikasi / Tipe</label>
                <select
                  value={editingFacility.type || 'Lapangan Olahraga & Upacara'}
                  onChange={e => handleFormChange('type', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {facilityTypes.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Luas / Panjang (m² atau meter)</label>
                <input
                  type="number"
                  value={editingFacility.area || ''}
                  onChange={e => handleFormChange('area', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="300"
                />
              </div>
            </div>

            {/* Damage Percentage */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">Tingkat Kerusakan Faktual:</span>
                <Badge condition={editingFacility.condition || 'Baik'}>
                  {editingFacility.condition}
                </Badge>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editingFacility.damage_percentage || 0}
                onChange={e => handleFormChange('damage_percentage', Number(e.target.value))}
                className="w-full accent-teal-700"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Baik)</span>
                <span>{editingFacility.damage_percentage}% Rusak</span>
                <span>100% (Total)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan / Spesifikasi</label>
              <textarea
                rows={2}
                value={editingFacility.notes || ''}
                onChange={e => handleFormChange('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Rincian daya listrik VA, kedalaman sumur, material pagar..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Prasarana
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Prasarana Penunjang"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data <strong>{facilityToDelete?.name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
