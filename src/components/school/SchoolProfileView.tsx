import React, { useState, useEffect } from 'react';
import { School, DistrictName, DISTRICT_LIST, PrincipalStatus, User } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  School as SchoolIcon,
  MapPin,
  Phone,
  UserCheck,
  Building,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Lock,
  Unlock,
  Navigation
} from 'lucide-react';

interface SchoolProfileViewProps {
  currentUser: User;
  onProfileUpdated?: () => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({ currentUser, onProfileUpdated }) => {
  const [schools, setSchools] = useState<School[]>(storage.getSchools());
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    currentUser.school_id || (schools.length > 0 ? schools[0].id : '')
  );

  const [formData, setFormData] = useState<Partial<School>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isOperator = currentUser.role === 'school_operator';

  useEffect(() => {
    const sch = storage.getSchoolById(selectedSchoolId);
    if (sch) {
      setFormData(sch);
    }
  }, [selectedSchoolId]);

  const handleChange = (field: keyof School, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.npsn || !formData.district || !formData.address) {
      setErrorMsg('Mohon lengkapi data wajib (Nama Sekolah, NPSN, Kecamatan, dan Alamat).');
      return;
    }

    const updatedSchool: School = {
      id: selectedSchoolId,
      npsn: formData.npsn || '',
      name: formData.name || '',
      education_level: formData.education_level || 'SD',
      establishment_year: Number(formData.establishment_year) || 1990,
      principal_name: formData.principal_name || '',
      principal_nip: formData.principal_nip || '',
      principal_phone: formData.principal_phone || '',
      principal_status: (formData.principal_status as PrincipalStatus) || 'PNS',
      school_phone: formData.school_phone || '',
      district: (formData.district as DistrictName) || 'Komodo',
      address: formData.address || '',
      latitude: Number(formData.latitude) || -8.5089,
      longitude: Number(formData.longitude) || 119.8964,
      accreditation: formData.accreditation || 'B',
      profile_completed: true,
      created_at: formData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    storage.saveSchool(updatedSchool);
    setFormData(updatedSchool);
    setIsSaved(true);
    setErrorMsg('');

    if (onProfileUpdated) {
      onProfileUpdated();
    }

    setTimeout(() => setIsSaved(false), 4000);
  };

  const currentSchool = storage.getSchoolById(selectedSchoolId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              {isOperator ? 'Identitas & Profil Sekolah Saya' : 'Manajemen Data Profil Satuan Pendidikan'}
            </h2>
            {formData.profile_completed ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Profil Lengkap & Aktif
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <AlertCircle className="w-3.5 h-3.5" /> Belum Lengkap (Terkunci)
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data identitas pokok satuan pendidikan, kepala sekolah, dan titik koordinat GPS geospasial
          </p>
        </div>

        {/* School selector for Admins */}
        {!isOperator && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Pilih Sekolah:</span>
            <select
              value={selectedSchoolId}
              onChange={e => setSelectedSchoolId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
            >
              {schools.map(s => (
                <option key={s.id} value={s.id}>
                  [{s.education_level}] {s.name} - {s.district}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isOperator && !formData.profile_completed && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800 text-xs flex items-start gap-3 shadow-xs">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Perhatian: Modul Sarpras Terkunci</p>
            <p>
              Sesuai ketentuan SIPRAS MABAR, seluruh menu penginputan sarana, prasarana, dan SPTJM terkunci hingga Anda
              memverifikasi dan melengkapi seluruh isian data Profil Sekolah di bawah ini lalu menekan tombol <strong>Simpan Perubahan Profil</strong>.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSaved && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profil Sekolah berhasil disimpan dan diperbarui! Seluruh menu modul sarpras kini telah terbuka.</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Data Pokok Sekolah */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <SchoolIcon className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">1. Data Pokok Satuan Pendidikan</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenjang Pendidikan <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isOperator}
                value={formData.education_level || 'SD'}
                onChange={e => handleChange('education_level', e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 disabled:bg-slate-100 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="SD">Sekolah Dasar (SD)</option>
                <option value="SMP">Sekolah Menengah Pertama (SMP)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Pokok Sekolah Nasional (NPSN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.npsn || ''}
                onChange={e => handleChange('npsn', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Contoh: 50302341"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Resmi Satuan Pendidikan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Contoh: SDN 1 Labuan Bajo"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Pendirian / Operasional</label>
              <input
                type="number"
                value={formData.establishment_year || ''}
                onChange={e => handleChange('establishment_year', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="1985"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Akreditasi</label>
              <select
                value={formData.accreditation || 'B'}
                onChange={e => handleChange('accreditation', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="A">Terakreditasi A (Unggul)</option>
                <option value="B">Terakreditasi B (Baik)</option>
                <option value="C">Terakreditasi C (Cukup)</option>
                <option value="Belum Terakreditasi">Belum Terakreditasi</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak Sekolah</label>
              <input
                type="text"
                value={formData.school_phone || ''}
                onChange={e => handleChange('school_phone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="0385-41000 / 0812xxxx"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Data Kepala Sekolah */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">2. Data Kepala Satuan Pendidikan (Penanggung Jawab SPTJM)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Lengkap & Gelar Kepala Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.principal_name || ''}
                onChange={e => handleChange('principal_name', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Nama lengkap beserta gelar akademik"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah (Jika Ada)</label>
              <input
                type="text"
                value={formData.principal_nip || ''}
                onChange={e => handleChange('principal_nip', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="1978xxxx 2002xx x xxx"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Kepegawaian</label>
              <select
                value={formData.principal_status || 'PNS'}
                onChange={e => handleChange('principal_status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
              >
                <option value="PNS">Pegawai Negeri Sipil (PNS)</option>
                <option value="PPPK">Pegawai Pemerintah dg Perjanjian Kerja (PPPK)</option>
                <option value="Honorer">Guru Tetap Yayasan / Honorer</option>
                <option value="Plt">Pelaksana Tugas (Plt)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.principal_phone || ''}
                onChange={e => handleChange('principal_phone', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="081234567890"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Lokasi & Geospasial */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">3. Wilayah Kecamatan & Koordinat GPS Geospasial</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kecamatan di Manggarai Barat <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.district || 'Komodo'}
                onChange={e => handleChange('district', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none font-medium"
                required
              >
                {DISTRICT_LIST.map(dist => (
                  <option key={dist} value={dist}>
                    Kecamatan {dist}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Latitude (Lintang)</label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={e => handleChange('latitude', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="-8.5089"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Longitude (Bujur)</label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={e => handleChange('longitude', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="119.8964"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Lengkap / Dusun / Desa <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
                placeholder="Alamat jalan, nomor, RT/RW, Dusun, Desa/Kelurahan..."
                required
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" icon={Save} size="lg">
            Simpan Perubahan Profil
          </Button>
        </div>
      </form>
    </div>
  );
};
