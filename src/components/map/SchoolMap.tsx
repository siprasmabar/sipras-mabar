import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { School, DistrictName, DISTRICT_LIST, Building } from '../../types';
import { Badge } from '../common/Badge';
import { MapPin, Navigation, School as SchoolIcon, Filter, Layers, Phone, UserCheck } from 'lucide-react';
import { storage } from '../../lib/storage';

interface SchoolMapProps {
  schools: School[];
  selectedSchoolId?: string;
  onSelectSchool?: (school: School) => void;
  height?: string;
  showFilters?: boolean;
}

export const SchoolMap: React.FC<SchoolMapProps> = ({
  schools,
  selectedSchoolId,
  onSelectSchool,
  height = '540px',
  showFilters = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [allBuildings, setAllBuildings] = useState<Building[]>([]);

  useEffect(() => {
    setAllBuildings(storage.getBuildings());
  }, []);

  // Filter schools
  const filteredSchools = schools.filter(sch => {
    if (selectedDistrict !== 'ALL' && sch.district !== selectedDistrict) return false;
    if (selectedLevel !== 'ALL' && sch.education_level !== selectedLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sch.name.toLowerCase().includes(q);
      const matchNpsn = sch.npsn.toLowerCase().includes(q);
      const matchDistrict = sch.district.toLowerCase().includes(q);
      if (!matchName && !matchNpsn && !matchDistrict) return false;
    }

    if (selectedCondition !== 'ALL') {
      const schBuildings = allBuildings.filter(b => b.school_id === sch.id);
      if (schBuildings.length === 0) return selectedCondition === 'Baik';
      const hasCondition = schBuildings.some(b => b.condition === selectedCondition);
      if (!hasCondition) return false;
    }

    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of West Manggarai (Labuan Bajo - Flores)
      const map = L.map(mapContainerRef.current, {
        center: [-8.53, 120.05],
        zoom: 10,
        scrollWheelZoom: true
      });

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // map cleanup if unmounted
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredSchools.forEach(sch => {
      const lat = sch.latitude || -8.5089;
      const lng = sch.longitude || 119.8964;

      const schBuildings = allBuildings.filter(b => b.school_id === sch.id);
      let conditionSummary = 'Baik';
      let pinColor = '#0f766e'; // teal-700
      let pinBg = '#14b8a6';

      if (schBuildings.some(b => b.condition === 'Rusak Berat' || b.condition === 'Rusak Total')) {
        conditionSummary = 'Rusak Berat';
        pinColor = '#be123c'; // rose-700
        pinBg = '#f43f5e';
      } else if (schBuildings.some(b => b.condition === 'Rusak Sedang' || b.condition === 'Rusak Ringan')) {
        conditionSummary = 'Rusak Ringan/Sedang';
        pinColor = '#b45309'; // amber-700
        pinBg = '#f59e0b';
      }

      // Custom SVG Pin Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background-color: ${pinColor};
            color: white;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${sch.education_level}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans text-slate-800 text-xs min-w-[240px]';
      popupContent.innerHTML = `
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 10px; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
              ${sch.education_level} - NPSN: ${sch.npsn}
            </span>
            <span style="font-size: 10px; font-weight: 600; color: #64748b;">
              Kec. ${sch.district}
            </span>
          </div>
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 4px; line-height: 1.2;">
            ${sch.name}
          </h4>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; color: #475569;">
          <div><strong>Kepala Sekolah:</strong> ${sch.principal_name} (${sch.principal_status})</div>
          <div><strong>Kontak:</strong> ${sch.principal_phone || sch.school_phone || '-'}</div>
          <div><strong>Alamat:</strong> ${sch.address}</div>
          <div style="margin-top: 4px; padding: 4px 6px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
            <strong>Status Sarpras:</strong> <span style="color: ${pinColor}; font-weight: 700;">${conditionSummary}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectSchool) onSelectSchool(sch);
      });

      marker.addTo(markersGroup);
      bounds.extend([lat, lng]);
    });

    if (filteredSchools.length > 0 && map) {
      if (selectedSchoolId) {
        const found = schools.find(s => s.id === selectedSchoolId);
        if (found) {
          map.setView([found.latitude, found.longitude], 14, { animate: true });
        }
      } else {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, [filteredSchools, selectedSchoolId, allBuildings, schools, onSelectSchool]);

  const resetFilters = () => {
    setSelectedDistrict('ALL');
    setSelectedLevel('ALL');
    setSelectedCondition('ALL');
    setSearchQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-8.53, 120.05], 10);
    }
  };

  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      {/* Map Control Bar */}
      {showFilters && (
        <div className="border-b border-slate-200 bg-slate-50/80 p-3 sm:p-4 backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <SchoolIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peta Sebaran Sarpras Sekolah</h3>
                <p className="text-xs text-slate-500">
                  Menampilkan {filteredSchools.length} dari {schools.length} Sekolah di Manggarai Barat
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari sekolah / NPSN..."
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs min-w-[160px]"
              />

              {/* District Filter */}
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
              >
                <option value="ALL">Semua Kecamatan (12)</option>
                {DISTRICT_LIST.map(d => (
                  <option key={d} value={d}>
                    Kec. {d}
                  </option>
                ))}
              </select>

              {/* Level Filter */}
              <select
                value={selectedLevel}
                onChange={e => setSelectedLevel(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
              >
                <option value="ALL">Semua Jenjang (SD & SMP)</option>
                <option value="SD">Jenjang SD</option>
                <option value="SMP">Jenjang SMP</option>
              </select>

              {/* Condition Filter */}
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
              >
                <option value="ALL">Semua Kondisi</option>
                <option value="Baik">Kondisi Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Sedang">Rusak Sedang</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Rusak Total">Rusak Total</option>
              </select>

              <button
                onClick={resetFilters}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset Filter"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-md border border-slate-200/80 text-xs space-y-1.5 max-w-xs">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-700" />
            Legenda Kondisi Fisik Sarpras:
          </p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-700 border border-white shadow-xs" />
            <span className="text-slate-700">Kondisi Baik (0%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs" />
            <span className="text-slate-700">Rusak Ringan / Sedang (1% - 46%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shadow-xs" />
            <span className="text-slate-700">Rusak Berat / Total (&gt; 46%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
