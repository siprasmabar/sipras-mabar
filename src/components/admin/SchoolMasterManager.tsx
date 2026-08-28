import React, { useState, useEffect } from 'react';
import { School, DistrictName, DISTRICT_LIST, User } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';
import {
  School as SchoolIcon,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';

interface SchoolMasterManagerProps {
  currentUser: User;
}

export const SchoolMasterManager: React.FC<SchoolMasterManagerProps> = ({ currentUser }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<Partial<School> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);

  const loadData = () => {
    let allowedLevel: 'SD' | 'SMP' | undefined = undefined;
    if (currentUser.role === 'sd_admin') allowedLevel = 'SD';
    if (currentUser.role === 'smp_admin') allowedLevel = 'SMP';

    let all = storage.getSchools();
    if (allowedLevel) {
      all = all.filter(s => s.education_level === allowedLevel);
    }
    setSchools(all);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser]);

  const filteredSchools = schools.filter(sch => {
    if (filterDistrict !== 'ALL' && sch.district !== filterDistrict) return false;
    if (filterLevel !== 'ALL' && sch.education_level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sch.name.toLowerCase().includes(q);
      const matchNpsn = sch.npsn.toLowerCase().includes(q);
      const matchPrincipal = sch.principal_name.toLowerCase().includes(q);
      if (!matchName && !matchNpsn && !matchPrincipal) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage) || 1;
  const paginatedSchools = filteredSchools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingSchool({
      id: 'sch-' + Math.random().toString(36).substring(2, 9),
      npsn: '',
      name: '',
      education_level: currentUser.role === 'smp_admin' ? 'SMP' : 'SD',
      establishment_year: 2000,
      principal_name: '',
      principal_nip: '',
      principal_phone: '',
      principal_status: 'PNS',
      school_phone: '',
      district: 'Komodo',
      address: '',
      latitude: -8.5089,
      longitude: 119.8964,
      accreditation: 'B',
      profile_completed: false
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: School) => {
    setEditingSchool(sch);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool || !editingSchool.name || !editingSchool.npsn) return;

    const schToSave: School = {
      id: editingSchool.id || 'sch-' + Math.random().toString(36).substring(2, 9),
      npsn: editingSchool.npsn,
      name: editingSchool.name,
      education_level: editingSchool.education_level || 'SD',
      establishment_year: Number(editingSchool.establishment_year) || 1995,
      principal_name: editingSchool.principal_name || '',
      principal_nip: editingSchool.principal_nip || '',
      principal_phone: editingSchool.principal_phone || '',
      principal_status: editingSchool.principal_status || 'PNS',
      school_phone: editingSchool.school_phone || '',
      district: (editingSchool.district as DistrictName) || 'Komodo',
      address: editingSchool.address || '',
      latitude: Number(editingSchool.latitude) || -8.5089,
      longitude: Number(editingSchool.longitude) || 119.8964,
      accreditation: editingSchool.accreditation || 'B',
      profile_completed: true,
      created_at: editingSchool.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveSchool(schToSave);
    setIsModalOpen(false);
    setEditingSchool(null);
  };

  const handleDelete = () => {
    if (schoolToDelete) {
      storage.deleteSchool(schoolToDelete.id);
      setIsDeleteModalOpen(false);
      setSchoolToDelete(null);
    }
  };

  const exportColumns = [
    { header: 'NPSN', accessor: (s: School) => s.npsn },
    { header: 'Nama Sekolah', accessor: (s: School) => s.name },
    { header: 'Jenjang', accessor: (s: School) => s.education_level },
    { header: 'Kecamatan', accessor: (s: School) => s.district },
    { header: 'Kepala Sekolah', accessor: (s: School) => `${s.principal_name} (${s.principal_status})` },
    { header: 'Kontak', accessor: (s: School) => s.principal_phone || s.school_phone || '-' },
    { header: 'Akreditasi', accessor: (s: School) => s.accreditation }
  ];

  const handleExportExcel = () => exportToExcel(filteredSchools, exportColumns, 'Data_Induk_Sekolah_Mabar');
  const handleExportPDF = () => exportToPDF(filteredSchools, exportColumns, 'Laporan Data Induk Sekolah Manggarai Barat', storage.getDocumentSigner());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <SchoolIcon className="w-5 h-5 text-teal-700" />
            Master Data Satuan Pendidikan (SD / SMP)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Basis data master sekolah, identitas kepala sekolah, dan sebaran 12 kecamatan Kabupaten Manggarai Barat
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
            Tambah Sekolah Baru
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterDistrict}
            onChange={e => setFilterDistrict(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">Semua Kecamatan (12)</option>
            {DISTRICT_LIST.map(d => (
              <option key={d} value={d}>
                Kec. {d}
              </option>
            ))}
          </select>

          {currentUser.role === 'super_admin' && (
            <select
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenjang (SD & SMP)</option>
              <option value="SD">Jenjang SD</option>
              <option value="SMP">Jenjang SMP</option>
            </select>
          )}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari sekolah / NPSN / Kepsek..."
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
                <th className="px-4 py-3.5">NPSN & Nama Sekolah</th>
                <th className="px-4 py-3.5">Jenjang & Akreditasi</th>
                <th className="px-4 py-3.5">Kecamatan & Alamat</th>
                <th className="px-4 py-3.5">Kepala Satuan Pendidikan</th>
                <th className="px-4 py-3.5 text-center">Status Profil</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSchools.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data sekolah yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedSchools.map(sch => (
                  <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                          {sch.npsn}
                        </span>
                        <span>{sch.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="info" size="sm">
                          {sch.education_level}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          Akred {sch.accreditation}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="font-medium text-slate-800">Kec. {sch.district}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{sch.address}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">{sch.principal_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {sch.principal_status} | {sch.principal_phone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {sch.profile_completed ? (
                        <Badge variant="success" size="sm">
                          Lengkap
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Belum Lengkap
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(sch)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                          title="Edit Sekolah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              setSchoolToDelete(sch);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                            title="Hapus Sekolah"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Menampilkan {filteredSchools.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredSchools.length)} dari {filteredSchools.length} data
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
        title={editingSchool?.name ? 'Edit Satuan Pendidikan' : 'Tambah Satuan Pendidikan Baru'}
        maxWidth="2xl"
      >
        {editingSchool && (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NPSN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSchool.npsn || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, npsn: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none font-mono"
                  placeholder="5030xxxx"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Resmi Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingSchool.name || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                  placeholder="SDN 1 Labuan Bajo"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenjang Pendidikan</label>
                <select
                  value={editingSchool.education_level || 'SD'}
                  onChange={e => setEditingSchool({ ...editingSchool, education_level: e.target.value as 'SD' | 'SMP' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="SD">Sekolah Dasar (SD)</option>
                  <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kecamatan</label>
                <select
                  value={editingSchool.district || 'Komodo'}
                  onChange={e => setEditingSchool({ ...editingSchool, district: e.target.value as DistrictName })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  {DISTRICT_LIST.map(d => (
                    <option key={d} value={d}>
                      Kec. {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Akreditasi</label>
                <select
                  value={editingSchool.accreditation || 'B'}
                  onChange={e => setEditingSchool({ ...editingSchool, accreditation: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="Belum Terakreditasi">Belum Terakreditasi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  value={editingSchool.principal_name || ''}
                  onChange={e => setEditingSchool({ ...editingSchool, principal_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Kepsek</label>
                <select
                  value={editingSchool.principal_status || 'PNS'}
                  onChange={e => setEditingSchool({ ...editingSchool, principal_status: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                >
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                  <option value="Honorer">Honorer/GTY</option>
                  <option value="Plt">Plt</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                rows={2}
                value={editingSchool.address || ''}
                onChange={e => setEditingSchool({ ...editingSchool, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Jalan / Dusun / Desa..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Satuan Pendidikan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Sekolah"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus data sekolah <strong>{schoolToDelete?.name}</strong>?
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
