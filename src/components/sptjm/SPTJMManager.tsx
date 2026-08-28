import React, { useState, useEffect, useRef } from 'react';
import { SPTJMRecord, School, User, DocumentSigner } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { OfficialLetterhead } from '../common/OfficialLetterhead';
import { triggerPrint } from '../../lib/exportUtils';
import {
  FileCheck2,
  Download,
  Upload,
  Printer,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Building,
  MapPin,
  Calendar,
  FileText,
  Eye,
  Lock
} from 'lucide-react';

interface SPTJMManagerProps {
  currentUser: User;
}

export const SPTJMManager: React.FC<SPTJMManagerProps> = ({ currentUser }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [sptjmRecords, setSptjmRecords] = useState<SPTJMRecord[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || 'ALL'
  );

  const [signer, setSigner] = useState<DocumentSigner>(storage.getDocumentSigner());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const [activeRecord, setActiveRecord] = useState<SPTJMRecord | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

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
    setSptjmRecords(storage.getSPTJMRecords(schoolFilter));
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => loadData();
    window.addEventListener('sipras_storage_update', handleStorage);
    return () => window.removeEventListener('sipras_storage_update', handleStorage);
  }, [currentUser, selectedSchoolId]);

  const targetSchoolId = isOperator ? currentUser.school_id || (schools[0]?.id || '') : (selectedSchoolId === 'ALL' ? schools[0]?.id || '' : selectedSchoolId);
  const targetSchool = storage.getSchoolById(targetSchoolId) || schools[0];

  // School assets summary for SPTJM body
  const schoolLands = storage.getLands(targetSchoolId);
  const schoolBuildings = storage.getBuildings(targetSchoolId);
  const schoolRooms = storage.getRooms(targetSchoolId);
  const schoolFacilities = storage.getFacilities(targetSchoolId);

  const currentYear = new Date().getFullYear();
  const currentAcademicYear = storage.getSystemSettings().active_academic_year;

  // Existing record for target school
  const currentSchoolRecord = sptjmRecords.find(r => r.school_id === targetSchoolId && r.academic_year === currentAcademicYear);

  const handleGenerateSPTJM = () => {
    if (!targetSchool) return;

    const newRecord: SPTJMRecord = {
      id: currentSchoolRecord?.id || 'sptjm-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchool.id,
      academic_year: currentAcademicYear,
      letter_number: `421.2/${targetSchool.npsn}/SPTJM-SARPRAS/${currentYear}`,
      submission_date: new Date().toISOString().slice(0, 10),
      principal_name: targetSchool.principal_name,
      principal_nip: targetSchool.principal_nip || '-',
      document_status: currentSchoolRecord?.document_status || 'draft',
      file_url: currentSchoolRecord?.file_url,
      file_name: currentSchoolRecord?.file_name,
      created_at: currentSchoolRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveSPTJMRecord(newRecord);
    setActiveRecord(newRecord);
    setIsPreviewOpen(true);
  };

  const handleSimulateUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSchool) return;

    const recordToUpdate: SPTJMRecord = {
      id: currentSchoolRecord?.id || 'sptjm-' + Math.random().toString(36).substring(2, 9),
      school_id: targetSchool.id,
      academic_year: currentAcademicYear,
      letter_number: `421.2/${targetSchool.npsn}/SPTJM-SARPRAS/${currentYear}`,
      submission_date: new Date().toISOString().slice(0, 10),
      principal_name: targetSchool.principal_name,
      principal_nip: targetSchool.principal_nip || '-',
      document_status: 'uploaded',
      file_url: uploadedFileUrl || 'https://dikpora.manggaraibaratkab.go.id/sptjm/sample-signed.pdf',
      file_name: uploadFileName || `SPTJM_${targetSchool.npsn}_Signed.pdf`,
      created_at: currentSchoolRecord?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveSPTJMRecord(recordToUpdate);
    storage.logActivity(
      currentUser,
      'Upload SPTJM',
      'SPTJM',
      recordToUpdate.id,
      `${currentUser.full_name} mengunggah berkas SPTJM basah bertandatangan untuk ${targetSchool.name}.`
    );
    setIsUploadModalOpen(false);
  };

  const handleValidateSPTJM = (status: 'verified' | 'rejected') => {
    if (!activeRecord) return;

    const updated: SPTJMRecord = {
      ...activeRecord,
      document_status: status,
      verified_by: currentUser.full_name,
      verified_at: new Date().toISOString(),
      admin_notes: adminNotes,
      updated_at: new Date().toISOString()
    };

    storage.saveSPTJMRecord(updated);
    storage.logActivity(
      currentUser,
      `Verifikasi SPTJM (${status.toUpperCase()})`,
      'SPTJM',
      activeRecord.id,
      `${currentUser.full_name} telah memverifikasi berkas SPTJM ${storage.getSchoolById(activeRecord.school_id)?.name} dengan status: ${status}.`
    );
    setIsValidationModalOpen(false);
    setActiveRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-teal-700" />
            Surat Pertanggungjawaban Mutlak (SPTJM) Sarpras
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan dokumen legalitas formal kepala sekolah atas keabsahan data sarana & prasarana tahun ajaran {currentAcademicYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOperator && (
            <>
              <Button variant="primary" size="sm" icon={Printer} onClick={handleGenerateSPTJM}>
                Cetak Format SPTJM
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={() => {
                  setUploadFileName(`SPTJM_${targetSchool?.npsn || '50302341'}_Ttd_Cap.pdf`);
                  setIsUploadModalOpen(true);
                }}
              >
                Unggah Berkas Bermaterai
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Admin Selector & Status Cards */}
      {!isOperator && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Filter Satuan Pendidikan:</span>
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
            >
              <option value="ALL">Semua Satuan Pendidikan ({schools.length})</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.education_level}] {s.name} - {s.district}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Tahun Ajaran: <strong className="text-teal-800">{currentAcademicYear}</strong>
          </div>
        </div>
      )}

      {/* Target School Status Summary (For Operator or Selected School) */}
      {targetSchool && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{targetSchool.name}</h3>
                <Badge variant="info" size="sm">
                  NPSN: {targetSchool.npsn}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kecamatan {targetSchool.district} | Kepala Sekolah: {targetSchool.principal_name} (
                {targetSchool.principal_nip || 'Non-NIP'})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status Dokumen:</span>
              {currentSchoolRecord?.document_status === 'verified' && (
                <Badge variant="success" size="md">
                  <CheckCircle2 className="w-4 h-4" /> Terverifikasi Sah
                </Badge>
              )}
              {currentSchoolRecord?.document_status === 'uploaded' && (
                <Badge variant="warning" size="md">
                  <Clock className="w-4 h-4" /> Menunggu Validasi Dinas
                </Badge>
              )}
              {currentSchoolRecord?.document_status === 'rejected' && (
                <Badge variant="danger" size="md">
                  <XCircle className="w-4 h-4" /> Ditolak / Perlu Revisi
                </Badge>
              )}
              {(!currentSchoolRecord || currentSchoolRecord.document_status === 'draft') && (
                <Badge variant="neutral" size="md">
                  <AlertCircle className="w-4 h-4" /> Belum Diunggah (Draft)
                </Badge>
              )}
            </div>
          </div>

          {/* Asset Summary Table for SPTJM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Tanah / Lahan</span>
              <p className="text-xl font-black text-slate-900 mt-1">{schoolLands.length} Persil</p>
              <p className="text-[10px] text-slate-400">
                {schoolLands.reduce((acc, l) => acc + l.land_area, 0).toLocaleString('id-ID')} m²
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Gedung / Bangunan</span>
              <p className="text-xl font-black text-slate-900 mt-1">{schoolBuildings.length} Unit</p>
              <p className="text-[10px] text-slate-400">
                {schoolBuildings.filter(b => b.condition === 'Baik').length} Baik |{' '}
                {schoolBuildings.filter(b => b.condition !== 'Baik').length} Rusak
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Ruangan Sekolah</span>
              <p className="text-xl font-black text-slate-900 mt-1">{schoolRooms.length} Ruang</p>
              <p className="text-[10px] text-slate-400">
                {schoolRooms.filter(r => r.room_type === 'Ruang Kelas').length} R. Kelas
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Sarana Terdata</span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {schoolFacilities.reduce((acc, f) => acc + f.total_quantity, 0)} Unit
              </p>
              <p className="text-[10px] text-rose-600 font-semibold">
                +{schoolFacilities.reduce((acc, f) => acc + f.required_additional_quantity, 0)} Usulan Defisit
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Eye} onClick={handleGenerateSPTJM}>
                Lihat Format SPTJM Resmi
              </Button>
              <Button variant="outline" size="sm" icon={Printer} onClick={triggerPrint}>
                Cetak Langsung
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && currentSchoolRecord && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={ShieldCheck}
                  onClick={() => {
                    setActiveRecord(currentSchoolRecord);
                    setAdminNotes(currentSchoolRecord.admin_notes || '');
                    setIsValidationModalOpen(true);
                  }}
                >
                  Verifikasi SPTJM Ini
                </Button>
              )}

              {isOperator && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  onClick={() => {
                    setUploadFileName(`SPTJM_${targetSchool.npsn}_Signed.pdf`);
                    setIsUploadModalOpen(true);
                  }}
                >
                  {currentSchoolRecord?.file_url ? 'Ganti Berkas SPTJM Terunggah' : 'Unggah Berkas SPTJM (PDF/Scan)'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Table of All School SPTJM Submissions */}
      {!isOperator && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Rekapitulasi Pengumpulan SPTJM Kabupaten Manggarai Barat
            </h3>
            <span className="text-xs text-slate-500">
              Terverifikasi: {sptjmRecords.filter(r => r.document_status === 'verified').length} / {schools.length} Sekolah
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5">Satuan Pendidikan</th>
                  <th className="px-4 py-3.5">Kecamatan</th>
                  <th className="px-4 py-3.5">Kepala Sekolah</th>
                  <th className="px-4 py-3.5">Nomor & Tanggal Surat</th>
                  <th className="px-4 py-3.5 text-center">Status Berkas</th>
                  <th className="px-4 py-3.5 text-center">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map(sch => {
                  const rec = sptjmRecords.find(r => r.school_id === sch.id);
                  return (
                    <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                            {sch.education_level}
                          </span>
                          <span>{sch.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">NPSN: {sch.npsn}</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{sch.district}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{sch.principal_name}</div>
                        <div className="text-[10px] text-slate-400">NIP: {sch.principal_nip || '-'}</div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                        {rec?.letter_number || '-'}
                        {rec?.submission_date && <div className="text-[10px] text-slate-400">{rec.submission_date}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {rec?.document_status === 'verified' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </Badge>
                        )}
                        {rec?.document_status === 'uploaded' && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3" /> Menunggu
                          </Badge>
                        )}
                        {rec?.document_status === 'rejected' && (
                          <Badge variant="danger" size="sm">
                            <XCircle className="w-3 h-3" /> Ditolak
                          </Badge>
                        )}
                        {(!rec || rec.document_status === 'draft') && (
                          <Badge variant="neutral" size="sm">
                            Belum Unggah
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSchoolId(sch.id);
                              handleGenerateSPTJM();
                            }}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            title="Lihat Format Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {rec && (
                            <button
                              onClick={() => {
                                setActiveRecord(rec);
                                setAdminNotes(rec.admin_notes || '');
                                setIsValidationModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                              title="Verifikasi Dokumen"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official SPTJM Printable Sheet Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        maxWidth="full"
        showCloseButton={true}
      >
        {targetSchool && (
          <div className="space-y-6 text-xs text-slate-900 bg-white p-4 sm:p-8 rounded-xl print:p-0">
            {/* Government Official Kop Surat */}
            <OfficialLetterhead signer={signer} />

            {/* Document Title */}
            <div className="text-center space-y-1 my-4">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide underline underline-offset-4 text-slate-900">
                SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK (SPTJM)
              </h3>
              <p className="font-mono text-xs text-slate-700">
                Nomor: 421.2/{targetSchool.npsn}/SPTJM-SARPRAS/{currentYear}
              </p>
            </div>

            {/* Content Statement */}
            <div className="space-y-4 text-justify leading-relaxed text-xs">
              <p>Yang bertanda tangan di bawah ini:</p>

              <div className="grid grid-cols-3 gap-y-1.5 pl-6 font-medium">
                <div>Nama Lengkap</div>
                <div className="col-span-2 font-bold">: {targetSchool.principal_name}</div>

                <div>NIP</div>
                <div className="col-span-2">: {targetSchool.principal_nip || '-'}</div>

                <div>Status Kepegawaian</div>
                <div className="col-span-2">: {targetSchool.principal_status}</div>

                <div>Jabatan</div>
                <div className="col-span-2">: Kepala Satuan Pendidikan</div>

                <div>Satuan Pendidikan</div>
                <div className="col-span-2 font-bold">: {targetSchool.name}</div>

                <div>NPSN</div>
                <div className="col-span-2 font-mono">: {targetSchool.npsn}</div>

                <div>Kecamatan</div>
                <div className="col-span-2">: {targetSchool.district}, Kab. Manggarai Barat</div>

                <div>Alamat Sekolah</div>
                <div className="col-span-2">: {targetSchool.address}</div>
              </div>

              <p>
                Dengan ini menyatakan dengan sesungguhnya dan penuh tanggung jawab bahwa seluruh data sarana dan prasarana
                pendidikan yang kami rekam, laporkan, dan kirimkan melalui <strong>Sistem Informasi Sarana dan Prasarana (SIPRAS MABAR)</strong> Dinas Pendidikan, Kepemudaan dan Olahraga Kabupaten Manggarai Barat untuk <strong>Tahun Ajaran {currentAcademicYear}</strong> adalah <strong>BENAR, AKURAT, DAN DAPAT DIPERTANGGUNGJAWABKAN SESUAI KONDISI FAKTUAL DI LAPANGAN</strong>, dengan rekapitulasi sebagai berikut:
              </p>

              {/* Recapitulation Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden my-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Komponen Sarana & Prasarana</th>
                      <th className="px-3 py-2 text-center">Jumlah Aset</th>
                      <th className="px-3 py-2 text-center">Kondisi Baik</th>
                      <th className="px-3 py-2 text-center">Rusak (R/S/B/T)</th>
                      <th className="px-3 py-2 text-center">Usulan Kebutuhan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-3 py-1.5 text-center">1</td>
                      <td className="px-3 py-1.5 font-medium">Lahan & Persil Tanah</td>
                      <td className="px-3 py-1.5 text-center font-bold">{schoolLands.length} Persil</td>
                      <td className="px-3 py-1.5 text-center">-</td>
                      <td className="px-3 py-1.5 text-center">-</td>
                      <td className="px-3 py-1.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-center">2</td>
                      <td className="px-3 py-1.5 font-medium">Gedung & Bangunan Fisik</td>
                      <td className="px-3 py-1.5 text-center font-bold">{schoolBuildings.length} Unit</td>
                      <td className="px-3 py-1.5 text-center text-emerald-700 font-semibold">
                        {schoolBuildings.filter(b => b.condition === 'Baik').length} Unit
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-700 font-semibold">
                        {schoolBuildings.filter(b => b.condition !== 'Baik').length} Unit
                      </td>
                      <td className="px-3 py-1.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-center">3</td>
                      <td className="px-3 py-1.5 font-medium">Ruang Kelas & Penunjang</td>
                      <td className="px-3 py-1.5 text-center font-bold">{schoolRooms.length} Ruang</td>
                      <td className="px-3 py-1.5 text-center text-emerald-700 font-semibold">
                        {schoolRooms.filter(r => r.condition === 'Baik').length} Ruang
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-700 font-semibold">
                        {schoolRooms.filter(r => r.condition !== 'Baik').length} Ruang
                      </td>
                      <td className="px-3 py-1.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 text-center">4</td>
                      <td className="px-3 py-1.5 font-medium">Inventaris Sarana (Mebel, TIK, Alat, Buku)</td>
                      <td className="px-3 py-1.5 text-center font-bold">
                        {schoolFacilities.reduce((acc, f) => acc + f.total_quantity, 0)} Unit
                      </td>
                      <td className="px-3 py-1.5 text-center text-emerald-700 font-semibold">
                        {schoolFacilities.reduce((acc, f) => acc + f.good_condition, 0)} Unit
                      </td>
                      <td className="px-3 py-1.5 text-center text-rose-700 font-semibold">
                        {schoolFacilities.reduce(
                          (acc, f) => acc + f.minor_damage + f.moderate_damage + f.major_damage + f.total_damage,
                          0
                        )}{' '}
                        Unit
                      </td>
                      <td className="px-3 py-1.5 text-center text-purple-700 font-bold">
                        +{schoolFacilities.reduce((acc, f) => acc + f.required_additional_quantity, 0)} Unit
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Apabila di kemudian hari ditemukan ketidaksesuaian atau manipulasi data antara dokumen ini dengan kondisi
                riil fisik di lapangan, kami bersedia menerima sanksi administratif dan/atau sanksi hukum sesuai ketentuan
                peraturan perundang-undangan yang berlaku di Negara Kesatuan Republik Indonesia.
              </p>

              <p>
                Demikian Surat Pernyataan Tanggung Jawab Mutlak ini dibuat dengan sadar tanpa paksaan dari pihak manapun
                untuk dipergunakan sebagai dasar validasi perencanaan Dana Alokasi Khusus (DAK), Bantuan Operasional Sekolah
                (BOS), dan intervensi sarpras daerah Kabupaten Manggarai Barat.
              </p>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6">
              <div className="text-center space-y-1">
                <p className="text-slate-500">Mengetahui / Memvalidasi:</p>
                <p className="font-bold text-slate-800">{signer.signer_title}</p>
                <div className="h-20 flex items-center justify-center text-slate-300 italic text-[11px]">
                  (Tanda Tangan & Cap Dinas)
                </div>
                <p className="font-extrabold underline text-slate-900">{signer.signer_name}</p>
                <p className="text-[10px] text-slate-600">NIP. {signer.signer_nip}</p>
              </div>

              <div className="text-center space-y-1">
                <p className="text-slate-600">
                  {targetSchool.district}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-bold text-slate-800">Kepala {targetSchool.name}</p>
                <div className="h-20 flex items-center justify-center">
                  <div className="border border-dashed border-slate-400 p-2 rounded-md text-[10px] text-slate-400">
                    Materai Rp 10.000 & Cap Sekolah
                  </div>
                </div>
                <p className="font-extrabold underline text-slate-900">{targetSchool.principal_name}</p>
                <p className="text-[10px] text-slate-600">
                  {targetSchool.principal_nip ? `NIP. ${targetSchool.principal_nip}` : `Status: ${targetSchool.principal_status}`}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 print:hidden">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Tutup
              </Button>
              <Button variant="primary" icon={Printer} onClick={triggerPrint}>
                Cetak SPTJM Ini
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upload Scanned SPTJM Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Unggah Berkas SPTJM Bermaterai & Bertandatangan"
        subtitle="Lampirkan pindaian dokumen SPTJM asli berstempel dan bermaterai basah (Format PDF / Gambar)"
        maxWidth="md"
      >
        <form onSubmit={handleSimulateUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nama Berkas SPTJM <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={uploadFileName}
              onChange={e => setUploadFileName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Pilih Berkas Dokumen (PDF / Scan JPEG/PNG)
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
              <Upload className="w-8 h-8 text-teal-700 mx-auto mb-2" />
              <p className="font-semibold text-slate-800">Klik untuk pilih file atau seret ke sini</p>
              <p className="text-[11px] text-slate-400 mt-1">Maksimal ukuran berkas 10 MB (Format PDF disarankan)</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setUploadFileName(e.target.files[0].name);
                    setUploadedFileUrl(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="hidden"
                id="sptjm-file-input"
              />
              <label
                htmlFor="sptjm-file-input"
                className="mt-3 inline-block cursor-pointer rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs"
              >
                Pilih Berkas Komputer
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Upload}>
              Simpan & Kirimkan SPTJM
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Validation Modal */}
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Verifikasi Kelayakan Dokumen SPTJM"
        subtitle="Keputusan verifikasi berkas pertanggungjawaban mutlak oleh Dinas Dikpora Manggarai Barat"
        maxWidth="md"
      >
        {activeRecord && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">
                {storage.getSchoolById(activeRecord.school_id)?.name}
              </p>
              <p className="text-slate-600">Nomor: {activeRecord.letter_number}</p>
              <p className="text-slate-500">Kepala Sekolah: {activeRecord.principal_name}</p>
              {activeRecord.file_name && (
                <div className="mt-2 text-teal-800 font-medium flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Berkas Terlampir: {activeRecord.file_name}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Catatan Verifikasi Tim Dinas</label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Catatan persetujuan atau alasan revisi jika ditolak..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => handleValidateSPTJM('rejected')}
              >
                Tolak SPTJM (Minta Revisi)
              </Button>
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleValidateSPTJM('verified')}
              >
                Setujui & Sahkan SPTJM
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
