import React, { useState, useEffect } from 'react';
import { ActivityLog, User } from '../../types';
import { storage } from '../../lib/storage';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  ShieldAlert,
  Search,
  Clock,
  UserCheck,
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { exportToExcel, exportToPDF, triggerPrint } from '../../lib/exportUtils';

interface ActivityLogViewProps {
  currentUser: User;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<ActivityLog[]>(storage.getActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setLogs(storage.getActivityLogs());
  }, []);

  const filteredLogs = logs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.user_name.toLowerCase().includes(q);
      const matchEmail = log.user_email.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      if (!matchUser && !matchEmail && !matchAction && !matchDetails) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportColumns = [
    { header: 'Waktu (WITA)', accessor: (l: ActivityLog) => new Date(l.created_at).toLocaleString('id-ID') },
    { header: 'Pengguna', accessor: (l: ActivityLog) => `${l.user_name} (${l.user_email})` },
    { header: 'Peran', accessor: (l: ActivityLog) => l.user_role },
    { header: 'Aksi / Modul', accessor: (l: ActivityLog) => `${l.action} - ${l.target_entity}` },
    { header: 'Rincian Log Audit', accessor: (l: ActivityLog) => l.details }
  ];

  const handleExportExcel = () => exportToExcel(filteredLogs, exportColumns, 'Audit_Log_SIPRAS_Mabar');
  const handleExportPDF = () => exportToPDF(filteredLogs, exportColumns, 'Laporan Jejak Audit & Aktivitas Sistem SIPRAS', storage.getDocumentSigner());

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-700" />
            Log Aktivitas & Jejak Audit Keamanan Sistem
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak setiap perubahan data, validasi gedung/sarpras, upload SPTJM, dan login operator (Cybersecurity Audit Trail)
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
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-700" />
          <span>Total {filteredLogs.length} Aktivitas Terekam</span>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari user / aksi / entitas..."
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
                <th className="px-4 py-3.5">Waktu (WITA)</th>
                <th className="px-4 py-3.5">Pengguna & Peran</th>
                <th className="px-4 py-3.5">Aksi & Modul</th>
                <th className="px-4 py-3.5">Rincian Perubahan / Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {paginatedLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span className="font-semibold text-slate-900">{log.user_name}</span>
                    <div className="text-[10px] text-slate-500">{log.user_email} ({log.user_role})</div>
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <Badge variant="info" size="sm">
                      {log.action}
                    </Badge>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{log.target_entity}</span>
                  </td>
                  <td className="px-4 py-3 font-sans text-slate-700 text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            Menampilkan {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
            {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari {filteredLogs.length} data
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
    </div>
  );
};
