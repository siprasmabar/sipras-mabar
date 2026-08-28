import React, { useState, useEffect } from 'react';
import { Building, School, User, PhysicalCondition, FundingSource, ConstructionType, OwnershipStatus, ValidationStatus } from '../../types';
import { storage } from '../../lib/storage';
import { calculateConditionFromPercentage, calculateArea, getConditionColor } from '../../lib/calculations';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  Building2,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

interface BuildingManagerProps {
  currentUser: User;
}

export const BuildingManager: React.FC<BuildingManagerProps> = ({ currentUser }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [filterValidation, setFilterValidation] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Partial<Building> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);

  // Validation modal for Admins
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validatingBuilding, setValidatingBuilding] = useState<Building | null>(null);
  const [validationNotes, setValidationNotes] = useState('');

  const isOperator = currentUser.role === 'school_operator';
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'sd_admin' || currentUser.role === 'smp_admin';

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
    setBuildings(storage.getBuildings(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  // Filtered & Paginated
  const filteredBuildings = buildings.filter(bld => {
    if (filterCondition !== 'ALL' && bld.condition !== filterCondition) return false;
    if (filterValidation !== 'ALL' && bld.validation_status !== filterValidation) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = bld.code.toLowerCase().includes(q);
      const matchName = bld.name.toLowerCase().includes(q);
      if (!matchCode && !matchName) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredBuildings.length / itemsPerPage) || 1;
  const paginatedBuildings = filteredBuildings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
    setEditingBuilding({
      id: 'bld-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchoolId,
      code: 'G-0' + (buildings.length + 1),
      name: '',
      floors: 1,
      length: 18,
      width: 8,
      area: 144,
      construction_year: 2015,
      funding_source: 'APBD',
      construction_type: 'Permanen',
      ownership_status: 'Milik Sendiri',
      damage_percentage: 0,
      condition: 'Baik',
      notes: '',
      validation_status: 'pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bld: Building) => {
    setEditingBuilding(bld);
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof Building, value: any) => {
    if (!editingBuilding) return;

    const updated = { ...editingBuilding, [field]: value };

    // Auto calculate Area
    if (field === 'length' || field === 'width') {
      const len = field === 'length' ? Number(value) : Number(editingBuilding.length || 0);
      const wid = field === 'width' ? Number(value) : Number(editingBuilding.width || 0);
      updated.area = calculateArea(len, wid);
    }

    // Auto calculate Condition from damage percentage
    if (field === 'damage_percentage') {
      const p = Number(value) || 0;
      updated.condition = calculateConditionFromPercentage(p);
    }

    setEditingBuilding(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuilding || !editingBuilding.name || !editingBuilding.school_id) return;

    const damagePct = Number(editingBuilding.damage_percentage) || 0;
    const calcCond = calculateConditionFromPercentage(damagePct);
    const calcArea = calculateArea(Number(editingBuilding.length) || 0, Number(editingBuilding.width) || 0);

    const bldToSave: Building = {
      id: editingBuilding.id || 'bld-' + Math.random().toString(36).substring(2, 9),
      school_id: editingBuilding.school_id,
      code: editingBuilding.code || 'G-01',
      name: editingBuilding.name,
      floors: Number(editingBuilding.floors) || 1,
      length: Number(editingBuilding.length) || 0,
      width: Number(editingBuilding.width) || 0,
      area: calcArea,
      construction_year: Number(editingBuilding.construction_year) || 2010,
      funding_source: (editingBuilding.funding_source as FundingSource) || 'APBD',
      construction_type: (editingBuilding.construction_type as ConstructionType) || 'Permanen',
      ownership_status: (editingBuilding.ownership_status as OwnershipStatus) || 'Milik Sendiri',
      damage_percentage: damagePct,
      condition: calcCond,
      photo_url: editingBuilding.photo_url,
      notes: editingBuilding.notes || '',
      validation_status: editingBuilding.validation_status || 'pending',
      validation_notes: editingBuilding.validation_notes,
      created_at: editingBuilding.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveBuilding(bldToSave);
    setIsModalOpen(false);
    setEditingBuilding(null);
  };

  const handleDelete = () => {
    if (buildingToDelete) {
      storage.deleteBuilding(buildingToDelete.id);
      setIsDeleteModalOpen(false);
      setBuildingToDelete(null);
    }
  };

  const handleOpenValidate = (bld: Building) => {
    setValidatingBuilding(bld);
    setValidationNotes(bld.validation_notes || '');
    setIsValidationModalOpen(true);
  };

  const handleValidateAction = (status: ValidationStatus) => {
    if (!validatingBuilding) return;
    const updated: Building = {
      ...validatingBuilding,
      validation_status: status,
      validation_notes: validationNotes,
      updated_at: new Date().toISOString()
    };
    storage.saveBuilding(updated);
    storage.logActivity(
      currentUser,
      `Validasi Bangunan (${status.toUpperCase()})`,
      'Building',
      validatingBuilding.id,
      `${currentUser.full_name} mengubah status validasi gedung ${validatingBuilding.name} menjadi ${status}.`
    );
    setIsValidationModalOpen(false);
    setValidatingBuilding(null);
  };

  // Export handlers
  const exportColumns = [
    { header: 'Kode', accessor: (b: Building) => b.code },
    { header: 'Nama Gedung / Bangunan', accessor: (b: Building) => b.name },
    { header: 'Sekolah', accessor: (b: Building) => storage.getSchoolById(b.school_id)?.name || '-' },
    { header: 'Lantai', accessor: (b: Building) => b.floors },
    { header: 'Luas (m²)', accessor: (b: Building) => b.area },
    { header: 'Tahun', accessor: (b: Building) => b.construction_year },
    { header: 'Sumber Dana', accessor: (b: Building) => b.funding_source },
    { header: 'Tingkat Kerusakan', accessor: (b: Building) => `${b.damage_percentage}%` },
    { header: 'Kondisi Fisik', accessor: (b: Building) => b.condition },
    { header: 'Status Validasi', accessor: (b: Building) => b.validation_status.toUpperCase() }
  ];

  const handleExportExcel = () => exportToExcel(filteredBuildings, exportColumns, 'Data_Bangunan_Sekolah_Mabar');
  const handleExportPDF = () => exportToPDF(filteredBuildings, exportColumns, 'Laporan Data Bangunan & Gedung Sekolah', storage.getDocumentSigner());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-700" />
            Manajemen Data Gedung & Bangunan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan dimensi, tahun bangun, sumber dana, kalkulasi otomatis luas dan formula tingkat kerusakan
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
            Tambah Bangunan Baru
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
            value={filterCondition}
            onChange={e => setFilterCondition(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Kondisi Fisik</option>
            <option value="Baik">Baik (0%)</option>
            <option value="Rusak Ringan">Rusak Ringan (1-30%)</option>
            <option value="Rusak Sedang">Rusak Sedang (31-46%)</option>
            <option value="Rusak Berat">Rusak Berat (47-85%)</option>
            <option value="Rusak Total">Rusak Total (&gt;85%)</option>
          </select>

          <select
            value={filterValidation}
            onChange={e => setFilterValidation(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Status Validasi</option>
            <option value="verified">Terverifikasi Dinas</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="rejected">Ditolak / Perlu Perbaikan</option>
          </select>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari kode / nama gedung..."
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
                <th className="px-4 py-3.5">Kode & Nama Bangunan</th>
                <th className="px-4 py-3.5">Sekolah</th>
                <th className="px-4 py-3.5">Dimensi & Luas (m²)</th>
                <th className="px-4 py-3.5">Tahun & Sumber Dana</th>
                <th className="px-4 py-3.5 text-center">Kerusakan & Kondisi</th>
                <th className="px-4 py-3.5 text-center">Status Validasi</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBuildings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data bangunan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedBuildings.map(bld => {
                  const sch = storage.getSchoolById(bld.school_id);
                  return (
                    <tr key={bld.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {bld.code}
                          </span>
                          <span>{bld.name}</span>
                        </div>
                        {bld.notes && (
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">{bld.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {sch?.name || '-'}
                        <div className="text-[10px] text-slate-400">Kec. {sch?.district}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{bld.area.toLocaleString('id-ID')} m²</div>
                        <div className="text-[10px] text-slate-400">
                          {bld.length}m x {bld.width}m ({bld.floors} Lantai)
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-slate-800 font-medium">Thn {bld.construction_year}</div>
                        <div className="text-[10px] text-slate-500">{bld.funding_source} ({bld.construction_type})</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-1">
                          <Badge condition={bld.condition} size="sm">
                            {bld.condition}
                          </Badge>
                          <span className="block text-[10px] font-semibold text-slate-600">
                            {bld.damage_percentage}% Rusak
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {bld.validation_status === 'verified' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </Badge>
                        )}
                        {bld.validation_status === 'pending' && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3" /> Pending
                          </Badge>
                        )}
                        {bld.validation_status === 'rejected' && (
                          <Badge variant="danger" size="sm">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenValidate(bld)}
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                              title="Verifikasi Validitas Gedung"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(bld)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Edit Bangunan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setBuildingToDelete(bld);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Bangunan"
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
            Menampilkan {filteredBuildings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredBuildings.length)} dari {filteredBuildings.length} data
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
        title={editingBuilding?.name ? 'Edit Data Gedung & Bangunan' : 'Tambah Bangunan Baru'}
        subtitle="Data detail bangunan, ukuran, kalkulasi luas otomatis, dan persentase kerusakan"
        maxWidth="2xl"
      >
        {editingBuilding && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {!isOperator && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingBuilding.school_id}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Gedung <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBuilding.code || ''}
                  onChange={e => handleFormChange('code', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none uppercase font-mono"
                  placeholder="G-A, G-01"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Gedung / Bangunan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingBuilding.name || ''}
                  onChange={e => handleFormChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="Contoh: Gedung Kelas Sayap Timur"
                  required
                />
              </div>
            </div>

            {/* Dimension & Auto Area */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-teal-700" />
                  Dimensi & Luas Otomatis:
                </span>
                <span className="text-xs font-extrabold text-teal-800">
                  Total Luas: {editingBuilding.area || 0} m²
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Panjang (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingBuilding.length || ''}
                    onChange={e => handleFormChange('length', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Lebar (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingBuilding.width || ''}
                    onChange={e => handleFormChange('width', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Jumlah Lantai</label>
                  <input
                    type="number"
                    value={editingBuilding.floors || 1}
                    onChange={e => handleFormChange('floors', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Pembangunan</label>
                <input
                  type="number"
                  value={editingBuilding.construction_year || ''}
                  onChange={e => handleFormChange('construction_year', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="2018"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sumber Dana</label>
                <select
                  value={editingBuilding.funding_source || 'APBD'}
                  onChange={e => handleFormChange('funding_source', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="APBD">APBD Kab. Manggarai Barat</option>
                  <option value="APBN/DAK">APBN / DAK Fisik</option>
                  <option value="BOS">Dana BOS</option>
                  <option value="Yayasan/Swasta">Yayasan / Swasta</option>
                  <option value="CSR/Donor">CSR / Donor Bantuan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Konstruksi</label>
                <select
                  value={editingBuilding.construction_type || 'Permanen'}
                  onChange={e => handleFormChange('construction_type', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Permanen">Permanen (Beton/Bata)</option>
                  <option value="Semi Permanen">Semi Permanen</option>
                  <option value="Darurat/Kayu">Darurat / Kayu</option>
                </select>
              </div>
            </div>

            {/* Damage Percentage & Auto Condition Calculation */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">
                  Tingkat Kerusakan & Kondisi Fisik (Auto-Calculated):
                </span>
                <Badge condition={editingBuilding.condition || 'Baik'}>
                  {editingBuilding.condition}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Persentase Kerusakan Faktual:</span>
                  <span className="font-bold text-slate-900">{editingBuilding.damage_percentage || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editingBuilding.damage_percentage || 0}
                  onChange={e => handleFormChange('damage_percentage', Number(e.target.value))}
                  className="w-full accent-teal-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0% (Baik)</span>
                  <span>1-30% (Ringan)</span>
                  <span>31-46% (Sedang)</span>
                  <span>47-85% (Berat)</span>
                  <span>&gt;85% (Total)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan Kerusakan / Usulan</label>
              <textarea
                rows={2}
                value={editingBuilding.notes || ''}
                onChange={e => handleFormChange('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Rincian kerusakan atap, dinding, lantai, atau fondasi..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Bangunan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Admin Validation Modal */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Verifikasi Validasi Data Gedung"
        subtitle="Otorisasi verifikasi data fisik sarpras oleh Pengawas / Admin Dinas Dikpora"
        maxWidth="md"
      >
        {validatingBuilding && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">{validatingBuilding.name} ({validatingBuilding.code})</p>
              <p className="text-slate-600">
                Kondisi: <strong>{validatingBuilding.condition} ({validatingBuilding.damage_percentage}%)</strong>
              </p>
              <p className="text-slate-500">Sekolah: {storage.getSchoolById(validatingBuilding.school_id)?.name}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Hasil Verifikasi Lapangan</label>
              <textarea
                rows={3}
                value={validationNotes}
                onChange={e => setValidationNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Tuliskan catatan verifikasi kesesuaian fisik dengan berkas..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => handleValidateAction('rejected')}
              >
                Tolak / Perlu Revisi
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleValidateAction('verified')}
              >
                Setujui & Verifikasi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Bangunan"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data gedung <strong>{buildingToDelete?.name}</strong>? Seluruh data ruangan yang berelasi dengan gedung ini juga akan terpengaruh.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Ya, Hapus Gedung
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
