import React from 'react';
import { DocumentSigner } from '../../types';

interface OfficialLetterheadProps {
  signer: DocumentSigner;
  className?: string;
}

export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({ signer, className = '' }) => {
  return (
    <div className={`border-b-2 border-double border-slate-900 pb-3 mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-teal-800 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-yellow-400 text-center p-1">
            PEMKAB MABAR
          </div>
        </div>

        <div className="text-center flex-1 space-y-0.5">
          <h4 className="text-sm font-bold tracking-wider uppercase text-slate-800">
            PEMERINTAH {signer.regency_name?.toUpperCase() || 'KABUPATEN MANGGARAI BARAT'}
          </h4>
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-teal-900">
            {signer.department_name?.toUpperCase() || 'DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA'}
          </h2>
          <p className="text-xs text-slate-600">
            {signer.address_line} | Kode Pos: {signer.postal_code}
          </p>
          <p className="text-xs text-slate-500">
            Telp: {signer.phone} | Email: {signer.email} | Web: {signer.website}
          </p>
        </div>

        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-300 flex flex-col items-center justify-center text-teal-800 font-extrabold text-[10px] text-center p-1">
            <span className="text-xs text-teal-700">SIPRAS</span>
            <span>MABAR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
