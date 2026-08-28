import React, { useState, useEffect } from 'react';
import { Room, Building, School, User, PhysicalCondition, ValidationStatus } from '../../types';
import { storage } from '../../lib/storage';
import { calculateConditionFromPercentage, calculateArea } from '../../lib/calculations';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  DoorOpen,
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
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

interface RoomManagerProps {
  currentUser: User;
}

export const RoomManager: React.FC<RoomManagerProps> = ({ currentUser }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

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
    setRooms(storage.getRooms(schoolFilter));
    setBuildings(storage.getBuildings(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  const filteredRooms = rooms.filter(rm => {
    if (filterType !== 'ALL' && rm.room_type !== filterType) return false;
    if (filterCondition !== 'ALL' && rm.condition !== filterCondition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchType = rm.room_type.toLowerCase().includes(q);
      const matchFunc = rm.room_function.toLowerCase().includes(q);
      const matchBld = (rm.building_name || '').toLowerCase().includes(q);
      if (!matchType && !matchFunc && !matchBld) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;
  const paginatedRooms = filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
    const availableBuildings = buildings.filter(b => b.school_id === targetSchoolId);
    const firstBld = availableBuildings[0];

    setEditingRoom({
      id: 'rm-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchoolId,
      building_id: firstBld?.id || '',
      building_name: firstBld?.name || 'Gedung Utama',
      room_type: 'Ruang Kelas',
      room_function: 'Ruang Kelas Pembelajaran',
      floor_number: 1,
      length: 8,
      width: 7,
      area: 56,
      capacity: 32,
      status: 'Aktif Digunakan',
      last_renovation_year: 2022,
      damage_percentage: 0,
      condition: 'Baik',
      notes: '',
      validation_status: 'pending'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rm: Room) => {
    setEditingRoom(rm);
    setIsModalOpen(true);
  };

  const handleFormChange = (field: keyof Room, value: any) => {
    if (!editingRoom) return;
    const updated = { ...editingRoom, [field]: value };

    if (field === 'building_id') {
      const foundBld = buildings.find(b => b.id === value);
      if (foundBld) {
        updated.building_name = foundBld.name;
      }
    }

    if (field === 'length' || field === 'width') {
      const len = field === 'length' ? Number(value) : Number(editingRoom.length || 0);
      const wid = field === 'width' ? Number(value) : Number(editingRoom.width || 0);
      updated.area = calculateArea(len, wid);
    }

    if (field === 'damage_percentage') {
      const p = Number(value) || 0;
      updated.condition = calculateConditionFromPercentage(p);
    }

    setEditingRoom(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editingRoom.room_type || !editingRoom.school_id) return;

    const damagePct = Number(editingRoom.damage_percentage) || 0;
    const calcCond = calculateConditionFromPercentage(damagePct);
    const calcArea = calculateArea(Number(editingRoom.length) || 0, Number(editingRoom.width) || 0);

    const roomToSave: Room = {
      id: editingRoom.id || 'rm-' + Math.random().toString(36).substring(2, 9),
      school_id: editingRoom.school_id,
      building_id: editingRoom.building_id || 'bld-default',
      building_name: editingRoom.building_name || 'Gedung Sekolah',
      room_type: editingRoom.room_type,
      room_function: editingRoom.room_function || editingRoom.room_type,
      floor_number: Number(editingRoom.floor_number) || 1,
      length: Number(editingRoom.length) || 0,
      width: Number(editingRoom.width) || 0,
      area: calcArea,
      capacity: Number(editingRoom.capacity) || 30,
      status: editingRoom.status || 'Aktif Digunakan',
      last_renovation_year: Number(editingRoom.last_renovation_year) || 2020,
      damage_percentage: damagePct,
      condition: calcCond,
      photo_url: editingRoom.photo_url,
      notes: editingRoom.notes || '',
      validation_status: editingRoom.validation_status || 'pending',
      created_at: editingRoom.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveRoom(roomToSave);
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleDelete = () => {
    if (roomToDelete) {
      storage.deleteRoom(roomToDelete.id);
      setIsDeleteModalOpen(false);
      setRoomToDelete(null);
    }
  };

  // Export handlers
  const exportColumns = [
    { header: 'Jenis Ruang', accessor: (r: Room) => r.room_type },
    { header: 'Fungsi Ruang', accessor: (r: Room) => r.room_function },
    { header: 'Gedung Referensi', accessor: (r: Room) => r.building_name || '-' },
    { header: 'Sekolah', accessor: (r: Room) => storage.getSchoolById(r.school_id)?.name || '-' },
    { header: 'Luas (m²)', accessor: (r: Room) => r.area },
    { header: 'Kapasitas (Orang)', accessor: (r: Room) => r.capacity },
    { header: 'Status Penggunaan', accessor: (r: Room) => r.status },
    { header: 'Kondisi Fisik', accessor: (r: Room) => `${r.condition} (${r.damage_percentage}%)` }
  ];

  const handleExportExcel = () => exportToExcel(filteredRooms, exportColumns, 'Data_Ruangan_Sekolah_Mabar');
  const handleExportPDF = () => exportToPDF(filteredRooms, exportColumns, 'Laporan Data Ruangan Satuan Pendidikan', storage.getDocumentSigner());

  const roomTypeOptions = [
    'Ruang Kelas',
    'Ruang Guru',
    'Ruang Kepala Sekolah',
    'Laboratorium IPA',
    'Laboratorium Komputer',
    'Perpustakaan',
    'UKS',
    'Toilet Guru',
    'Toilet Siswa',
    'Gudang',
    'Musholla/Ibadah',
    'Lainnya'
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-teal-700" />
            Manajemen Data Ruangan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan jenis ruang, kapasitas siswa, relasi gedung induk, dan kondisi kelayakan ruang
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
            Tambah Ruangan Baru
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
            <option value="ALL">Semua Jenis Ruangan</option>
            {roomTypeOptions.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={filterCondition}
            onChange={e => setFilterCondition(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Kondisi Ruang</option>
            <option value="Baik">Kondisi Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Sedang">Rusak Sedang</option>
            <option value="Rusak Berat">Rusak Berat</option>
            <option value="Rusak Total">Rusak Total</option>
          </select>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari jenis / fungsi ruang..."
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
                <th className="px-4 py-3.5">Jenis & Fungsi Ruang</th>
                <th className="px-4 py-3.5">Gedung Referensi</th>
                <th className="px-4 py-3.5">Dimensi & Luas (m²)</th>
                <th className="px-4 py-3.5 text-center">Kapasitas</th>
                <th className="px-4 py-3.5">Status Penggunaan</th>
                <th className="px-4 py-3.5 text-center">Kondisi Fisik</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data ruangan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedRooms.map(rm => {
                  return (
                    <tr key={rm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          <span>{rm.room_type}</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">{rm.room_function}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{rm.building_name || '-'}</div>
                        <div className="text-[10px] text-slate-400">Lantai {rm.floor_number}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{rm.area.toLocaleString('id-ID')} m²</div>
                        <div className="text-[10px] text-slate-400">
                          {rm.length}m x {rm.width}m
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                        {rm.capacity} Siswa
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={rm.status === 'Aktif Digunakan' ? 'success' : rm.status === 'Alih Fungsi' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {rm.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-1">
                          <Badge condition={rm.condition} size="sm">
                            {rm.condition}
                          </Badge>
                          <span className="block text-[10px] text-slate-500 font-medium">
                            {rm.damage_percentage}% Rusak
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(rm)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Edit Ruangan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setRoomToDelete(rm);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Ruangan"
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
            Menampilkan {filteredRooms.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredRooms.length)} dari {filteredRooms.length} data
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
        title={editingRoom?.room_type ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}
        subtitle="Kelola tipe ruang, fungsi spesifik, ukuran, daya tampung, dan kondisi kerusakan"
        maxWidth="xl"
      >
        {editingRoom && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {!isOperator && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingRoom.school_id}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gedung Induk Referensi</label>
                <select
                  value={editingRoom.building_id}
                  onChange={e => handleFormChange('building_id', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {buildings
                    .filter(b => b.school_id === editingRoom.school_id)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jenis Ruangan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingRoom.room_type || 'Ruang Kelas'}
                  onChange={e => handleFormChange('room_type', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {roomTypeOptions.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama / Fungsi Spesifik Ruang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingRoom.room_function || ''}
                  onChange={e => handleFormChange('room_function', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="Contoh: Ruang Kelas 6A / Lab Komputer ANBK"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Posisi Lantai Ke-</label>
                <input
                  type="number"
                  value={editingRoom.floor_number || 1}
                  onChange={e => handleFormChange('floor_number', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Dimension & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Panjang (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingRoom.length || ''}
                  onChange={e => handleFormChange('length', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Lebar (m)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingRoom.width || ''}
                  onChange={e => handleFormChange('width', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Luas Auto (m²)</label>
                <input
                  type="text"
                  readOnly
                  value={`${editingRoom.area || 0} m²`}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Kapasitas (Orang)</label>
                <input
                  type="number"
                  value={editingRoom.capacity || 32}
                  onChange={e => handleFormChange('capacity', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Penggunaan</label>
                <select
                  value={editingRoom.status || 'Aktif Digunakan'}
                  onChange={e => handleFormChange('status', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Aktif Digunakan">Aktif Digunakan</option>
                  <option value="Rusak/Tidak Digunakan">Rusak / Tidak Digunakan</option>
                  <option value="Alih Fungsi">Alih Fungsi (Gudang/Lainnya)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tahun Terakhir Renovasi</label>
                <input
                  type="number"
                  value={editingRoom.last_renovation_year || ''}
                  onChange={e => handleFormChange('last_renovation_year', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="2022"
                />
              </div>
            </div>

            {/* Damage Slider */}
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">
                  Tingkat Kerusakan Ruangan:
                </span>
                <Badge condition={editingRoom.condition || 'Baik'}>
                  {editingRoom.condition}
                </Badge>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={editingRoom.damage_percentage || 0}
                onChange={e => handleFormChange('damage_percentage', Number(e.target.value))}
                className="w-full accent-teal-700"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Baik)</span>
                <span>{editingRoom.damage_percentage}% Rusak</span>
                <span>100% (Total)</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Kondisi Ruangan</label>
              <textarea
                rows={2}
                value={editingRoom.notes || ''}
                onChange={e => handleFormChange('notes', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Catatan ventilasi, daun pintu, jendela, instalasi listrik..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Ruangan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Ruangan"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data ruangan <strong>{roomToDelete?.room_function}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Ya, Hapus Ruangan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
