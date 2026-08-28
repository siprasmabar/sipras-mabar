import React, { useState } from 'react';
import { COMPLETE_SUPABASE_SCHEMA, DEPLOYMENT_CHECKLIST, ARCHITECTURE_NOTES } from '../../lib/schemaDocs';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Database, Copy, CheckCircle2, ShieldCheck, Server, BookOpen } from 'lucide-react';

export const SchemaDocsViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'checklist' | 'architecture'>('sql');

  const handleCopy = () => {
    navigator.clipboard.writeText(COMPLETE_SUPABASE_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-700" />
            Spesifikasi Skema Supabase & Panduan Produksi
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Skrip DDL PostgreSQL, Kebijakan Row Level Security (RLS), Triggers, Storage Buckets, dan Petunjuk Migrasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'sql' && (
            <Button
              variant="outline"
              size="sm"
              icon={copied ? CheckCircle2 : Copy}
              onClick={handleCopy}
            >
              {copied ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL DDL'}
            </Button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'sql'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Skrip SQL DDL Lengkap</span>
        </button>
        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'checklist'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Daftar Periksa Deployment</span>
        </button>
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSubTab === 'architecture'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Arsitektur Sistem & RBAC</span>
        </button>
      </div>

      {/* SQL View */}
      {activeSubTab === 'sql' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-mono">supabase_schema_sipras_mabar.sql</span>
            <Badge variant="purple" size="sm">
              PostgreSQL 15+ with RLS
            </Badge>
          </div>
          <pre className="mt-3 overflow-x-auto text-[11px] font-mono text-emerald-400/90 leading-relaxed max-h-[600px] scrollbar-thin">
            {COMPLETE_SUPABASE_SCHEMA}
          </pre>
        </div>
      )}

      {/* Checklist View */}
      {activeSubTab === 'checklist' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900">Langkah-Langkah Setup Database Produksi Supabase:</h3>
          <ol className="list-decimal pl-5 space-y-3 leading-relaxed">
            {DEPLOYMENT_CHECKLIST.map((step, idx) => (
              <li key={idx} className="font-medium">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Architecture View */}
      {activeSubTab === 'architecture' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900">Arsitektur Multi-Tenant & Model Keamanan:</h3>
          <div className="space-y-3 leading-relaxed">
            {ARCHITECTURE_NOTES.map((note, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-teal-900">{note.title}: </span>
                <span>{note.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
