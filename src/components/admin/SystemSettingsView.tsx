import React, { useState, useEffect } from 'react';
import { SystemSettings, DocumentSigner, User } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { OfficialLetterhead } from '../common/OfficialLetterhead';
import {
  Settings,
  Save,
  CheckCircle2,
  Calendar,
  Building,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  Globe
} from 'lucide-react';

interface SystemSettingsViewProps {
  currentUser: User;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<SystemSettings>(storage.getSystemSettings());
  const [signer, setSigner] = useState<DocumentSigner>(storage.getDocumentSigner());

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveSystemSettings(settings);
    storage.saveDocumentSigner(signer);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-700" />
            Pengaturan Sistem & Format Kop Dokumen Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi tahun ajaran aktif, batas cut-off usulan DAK fisik, kop surat kedinasan, dan pejabat penandatangan SPTJM
          </p>
        </div>

        {isSaved && (
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-4 h-4" /> Pengaturan Berhasil Disimpan
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Academic Year & Cut-off Settings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">1. Tahun Ajaran & Batas Penginputan (Cut-Off DAK)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tahun Ajaran Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={settings.active_academic_year}
                onChange={e => setSettings({ ...settings, active_academic_year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-500 focus:outline-none"
                placeholder="2024/2025"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Batas Waktu Pengumpulan SPTJM (Cut-Off)</label>
              <input
                type="date"
                value={settings.dak_submission_deadline}
                onChange={e => setSettings({ ...settings, dak_submission_deadline: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={settings.maintenance_mode}
                onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="rounded text-teal-700 focus:ring-teal-500 h-4 w-4"
              />
              <label htmlFor="maintenance_mode" className="font-semibold text-slate-800 cursor-pointer">
                Aktifkan Mode Pemeliharaan Sistem
              </label>
            </div>
          </div>
        </div>

        {/* Document Signer / Kop Surat */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              2. Kop Surat Resmi & Pejabat Penandatangan Validasi (Kadis Dikpora)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Instansi / Dinas</label>
              <input
                type="text"
                value={signer.department_name}
                onChange={e => setSigner({ ...signer, department_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pemerintah Kabupaten</label>
              <input
                type="text"
                value={signer.regency_name}
                onChange={e => setSigner({ ...signer, regency_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Kantor Dinas Lengkap</label>
              <input
                type="text"
                value={signer.address_line}
                onChange={e => setSigner({ ...signer, address_line: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telepon Dinas</label>
              <input
                type="text"
                value={signer.phone}
                onChange={e => setSigner({ ...signer, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
              <input
                type="text"
                value={signer.email}
                onChange={e => setSigner({ ...signer, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap Pejabat Penandatangan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={signer.signer_name}
                onChange={e => setSigner({ ...signer, signer_name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-bold focus:border-teal-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Pejabat Penandatangan</label>
              <input
                type="text"
                value={signer.signer_nip}
                onChange={e => setSigner({ ...signer, signer_nip: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 font-mono focus:border-teal-500 focus:outline-none"
                placeholder="19700101 199503 1 001"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Jabatan Resmi Penandatangan</label>
              <input
                type="text"
                value={signer.signer_title}
                onChange={e => setSigner({ ...signer, signer_title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Kop Surat Preview */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block font-semibold text-slate-700 mb-2">Pratinjau Kop Surat Resmi:</span>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <OfficialLetterhead signer={signer} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" icon={Save} size="lg">
            Simpan Seluruh Pengaturan
          </Button>
        </div>
      </form>
    </div>
  );
};
