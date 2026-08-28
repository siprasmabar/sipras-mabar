import React, { useState, useEffect } from 'react';
import { Land, School, User, OwnershipStatus, LandRightsType } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  MapPin,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  Building,
  FileCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LandManagerProps {
  currentUser: User;
}

export const LandManager: React.FC<LandManagerProps> = ({ currentUser }) => {
  const [lands, setLands] = useState<Land[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOwnership, setFilterOwnership] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<Partial<Land> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [landToDelete, setLandToDelete] = useState<Land | null>(null);

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
    setLands(storage.getLands(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  // Filtered & Paginated
  const filteredLands = lands.filter(land => {
    if (filterOwnership !== 'ALL' && land.ownership_status !== filterOwnership) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = land.name.toLowerCase().includes(q);
      const matchCert = (land.certificate_number || '').toLowerCase().includes(q);
      const matchHolder = (land.certificate_holder || '').toLowerCase().includes(q);
      if (!matchName && !matchCert && !matchHolder) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLands.length / itemsPerPage) || 1;
  const paginatedLands = filteredLands.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
    setEditingLand({
      id: 'lnd-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchoolId,
      name: '',
      ownership_status: 'Pemerintah Daerah',
      rights_type: 'Hak Pakai',
      certificate_number: '',
      certificate_date: new Date().toISOString().slice(0, 10),
      certificate_holder: 'Pemerintah Kabupaten Manggarai Barat',
      land_area: 1000,
      description: '',
      gps_lat: -8.5089,
      gps_lng: 119.8964
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (land: Land) => {
    setEditingLand(land);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLand || !editingLand.name || !editingLand.school_id) return;

    const landToSave: Land = {
      id: editingLand.id || 'lnd-' + Math.random().toString(36).substring(2, 9),
      school_id: editingLand.school_id,
      name: editingLand.name,
      ownership_status: (editingLand.ownership_status as OwnershipStatus) || 'Pemerintah Daerah',
      rights_type: (editingLand.rights_type as LandRightsType) || 'Hak Pakai',
      certificate_number: editingLand.certificate_number || '-',
      certificate_date: editingLand.certificate_date || new Date().toISOString().slice(0, 10),
      certificate_holder: editingLand.certificate_holder || '-',
      land_area: Number(editingLand.land_area) || 0,
      certificate_url: editingLand.certificate_url,
      photo_url: editingLand.photo_url,
      description: editingLand.description || '',
      gps_lat: Number(editingLand.gps_lat) || undefined,
      gps_lng: Number(editingLand.gps_lng) || undefined,
      created_at: editingLand.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveLand(landToSave);
    setIsModalOpen(false);
    setEditingLand(null);
  };

  const handleDelete = () => {
    if (landToDelete) {
      storage.deleteLand(landToDelete.id);
      setIsDeleteModalOpen(false);
      setLandToDelete(null);
    }
  };

  // Export handlers
  const exportColumns = [
    { header: 'Nama Lahan/Tanah', accessor: (l: Land) => l.name },
    { header: 'Sekolah', accessor: (l: Land) => storage.getSchoolById(l.school_id)?.name || '-' },
    { header: 'Status Kepemilikan', accessor: (l: Land) => l.ownership_status },
    { header: 'Jenis Hak', accessor: (l: Land) => l.rights_type },
    { header: 'No. Sertifikat', accessor: (l: Land) => l.certificate_number || '-' },
    { header: 'Atas Nama', accessor: (l: Land) => l.certificate_holder || '-' },
    { header: 'Luas Lahan (m2)', accessor: (l: Land) => l.land_area.toLocaleString('id-ID') }
  ];

  const handleExportExcel = () => exportToExcel(filteredLands, exportColumns, 'Data_Tanah_Sekolah_Mabar');
  const handleExportPDF = () => exportToPDF(filteredLands, exportColumns, 'Laporan Data Lahan & Tanah Sekolah', storage.getDocumentSigner());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-700" />
            Manajemen Data Tanah & Lahan Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan legalitas sertifikat, status hak milik/pakai, dan luas persil lahan satuan pendidikan
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
            Tambah Data Tanah
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* School filter for admin */}
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

          {/* Ownership Filter */}
          <select
            value={filterOwnership}
            onChange={e => setFilterOwnership(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Status Kepemilikan</option>
            <option value="Pemerintah Daerah">Pemerintah Daerah</option>
            <option value="Milik Sendiri">Milik Sendiri</option>
            <option value="Hibah">Hibah / Adat</option>
            <option value="Pinjam Pakai">Pinjam Pakai</option>
            <option value="Sewa">Sewa</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari lahan / no. sertifikat..."
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
                <th className="px-4 py-3.5">Nama Lahan</th>
                <th className="px-4 py-3.5">Sekolah</th>
                <th className="px-4 py-3.5">Status & Jenis Hak</th>
                <th className="px-4 py-3.5">No. Sertifikat & Pemegang</th>
                <th className="px-4 py-3.5 text-right">Luas (m²)</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data tanah atau lahan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedLands.map(land => {
                  const sch = storage.getSchoolById(land.school_id);
                  return (
                    <tr key={land.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-600" />
                          {land.name}
                        </div>
                        {land.description && (
                          <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                            {land.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {sch?.name || '-'}
                        <div className="text-[10px] text-slate-400">Kec. {sch?.district}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <Badge variant="info" size="sm">
                            {land.ownership_status}
                          </Badge>
                          <span className="block text-[11px] text-slate-500">{land.rights_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-semibold text-slate-800">
                          {land.certificate_number || '-'}
                        </div>
                        <div className="text-[11px] text-slate-500">a.n. {land.certificate_holder || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">
                        {land.land_area.toLocaleString('id-ID')} m²
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(land)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Edit Data Tanah"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setLandToDelete(land);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Data Tanah"
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
            Menampilkan {filteredLands.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredLands.length)} dari {filteredLands.length} data
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
        title={editingLand?.name ? 'Edit Data Tanah / Lahan' : 'Tambah Data Tanah / Lahan Baru'}
        subtitle="Kelola persil tanah, nomor sertifikat legalitas, dan luas lahan satuan pendidikan"
        maxWidth="xl"
      >
        {editingLand && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {!isOperator && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editingLand.school_id}
                  onChange={e => setEditingLand({ ...editingLand, school_id: e.target.value })}
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
                Nama Lahan / Persil <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editingLand.name || ''}
                onChange={e => setEditingLand({ ...editingLand, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Contoh: Tanah Kampus Utama SDN 1 Labuan Bajo"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Kepemilikan</label>
                <select
                  value={editingLand.ownership_status || 'Pemerintah Daerah'}
                  onChange={e => setEditingLand({ ...editingLand, ownership_status: e.target.value as OwnershipStatus })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Pemerintah Daerah">Pemerintah Daerah</option>
                  <option value="Milik Sendiri">Milik Sendiri</option>
                  <option value="Hibah">Hibah</option>
                  <option value="Pinjam Pakai">Pinjam Pakai</option>
                  <option value="Sewa">Sewa</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Hak Tanah</label>
                <select
                  value={editingLand.rights_type || 'Hak Pakai'}
                  onChange={e => setEditingLand({ ...editingLand, rights_type: e.target.value as LandRightsType })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="Hak Pakai">Hak Pakai</option>
                  <option value="SHM">Sertifikat Hak Milik (SHM)</option>
                  <option value="HGB">Hak Guna Bangunan (HGB)</option>
                  <option value="Girik/Adat">Girik / Surat Adat Tua Golo</option>
                  <option value="Belum Bersertifikat">Belum Bersertifikat</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Sertifikat / Bukti</label>
                <input
                  type="text"
                  value={editingLand.certificate_number || ''}
                  onChange={e => setEditingLand({ ...editingLand, certificate_number: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="24.15.xx.xx.x.xxxxx"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Sertifikat / Terbit</label>
                <input
                  type="date"
                  value={editingLand.certificate_date || ''}
                  onChange={e => setEditingLand({ ...editingLand, certificate_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atas Nama Pemegang Hak</label>
                <input
                  type="text"
                  value={editingLand.certificate_holder || ''}
                  onChange={e => setEditingLand({ ...editingLand, certificate_holder: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="Pemerintah Kab. Manggarai Barat"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Luas Tanah (m²) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={editingLand.land_area || ''}
                  onChange={e => setEditingLand({ ...editingLand, land_area: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none font-semibold"
                  placeholder="Contoh: 4500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan / Batas Lahan</label>
              <textarea
                rows={2}
                value={editingLand.description || ''}
                onChange={e => setEditingLand({ ...editingLand, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Batas utara, selatan, timur, barat atau kondisi kontur lahan..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Data Tanah
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Data Tanah"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data tanah <strong>{landToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Ya, Hapus Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
