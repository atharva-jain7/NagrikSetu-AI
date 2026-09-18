import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Complaint, IssueCluster } from '../../types';
import { Layers, Filter, Eye, AlertTriangle, Users, MapPin, Building2, Flame } from 'lucide-react';

interface AdminGISViewProps {
  complaints: Complaint[];
  clusters: IssueCluster[];
  onSelectCluster: (clusterId: string) => void;
  onSelectComplaint: (complaint: Complaint) => void;
}

export const AdminGISView: React.FC<AdminGISViewProps> = ({
  complaints,
  clusters,
  onSelectCluster,
  onSelectComplaint
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<{
    complaints: L.LayerGroup;
    clusters: L.LayerGroup;
    hotspots: L.LayerGroup;
  } | null>(null);

  // Active GIS Layers Toggle
  const [activeLayers, setActiveLayers] = useState<{
    complaints: boolean;
    clusters: boolean;
    hotspots: boolean;
  }>({
    complaints: true,
    clusters: true,
    hotspots: true
  });

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered around Thane Municipal Corporation zone
    const map = L.map(mapContainerRef.current, {
      center: [19.225, 72.975],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const complaintsLayer = L.layerGroup().addTo(map);
    const clustersLayer = L.layerGroup().addTo(map);
    const hotspotsLayer = L.layerGroup().addTo(map);

    layersGroupRef.current = {
      complaints: complaintsLayer,
      clusters: clustersLayer,
      hotspots: hotspotsLayer
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers based on Filters & Active Layers
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const { complaints: cLayer, clusters: clLayer, hotspots: hLayer } = layersGroupRef.current;
    cLayer.clearLayers();
    clLayer.clearLayers();
    hLayer.clearLayers();

    // Filter complaints
    const filteredComplaints = complaints.filter((c) => {
      if (selectedDept !== 'ALL' && c.department_id !== selectedDept) return false;
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (selectedPriority !== 'ALL' && c.priority_level !== selectedPriority) return false;
      if (selectedWard !== 'ALL' && c.ward !== selectedWard) return false;
      return true;
    });

    // Filter clusters
    const filteredClusters = clusters.filter((cl) => {
      if (selectedDept !== 'ALL' && cl.department_id !== selectedDept) return false;
      if (selectedCategory !== 'ALL' && cl.category !== selectedCategory) return false;
      if (selectedPriority !== 'ALL' && cl.priority_level !== selectedPriority) return false;
      if (selectedWard !== 'ALL' && cl.ward !== selectedWard) return false;
      return true;
    });

    // 1. LAYER 1: COMPLAINTS MAP (Individual Level 1 points)
    if (activeLayers.complaints) {
      filteredComplaints.slice(0, 150).forEach((c) => {
        const color =
          c.priority_level === 'CRITICAL'
            ? '#ef4444'
            : c.priority_level === 'HIGH'
            ? '#f97316'
            : c.priority_level === 'MEDIUM'
            ? '#eab308'
            : '#10b981';

        const marker = L.circleMarker([c.latitude, c.longitude], {
          radius: 5,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: system-ui; max-width: 220px; font-size: 12px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">${c.id} · ${c.category}</div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">📍 ${c.address}</div>
            <p style="margin: 0 0 6px 0; color: #334155; line-height: 1.3;">"${c.raw_text.substring(0, 80)}..."</p>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              <span style="color: ${color};">${c.priority_level} (${c.priority_score})</span>
              <span style="color: #2563eb;">${c.department_id}</span>
            </div>
          </div>
        `);

        cLayer.addLayer(marker);
      });
    }

    // 2. LAYER 2: ISSUE CLUSTERS MAP (Aggregated Level 3 Centroids + Radius)
    if (activeLayers.clusters) {
      filteredClusters.forEach((cl) => {
        const isCritical = cl.priority_level === 'CRITICAL';
        const color = isCritical ? '#dc2626' : '#d97706';

        // Representative Centroid Radius circle
        const radiusCircle = L.circle([cl.latitude, cl.longitude], {
          radius: Math.max(150, cl.radius_meters),
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: isCritical ? '4, 4' : undefined,
        });

        // Pulsing custom div marker
        const customIcon = L.divIcon({
          className: 'custom-cluster-icon',
          html: `
            <div style="
              background: ${color};
              color: white;
              border: 2px solid white;
              border-radius: 9999px;
              width: 38px;
              height: 38px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 900;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              <span>👥${cl.citizen_count}</span>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const clusterMarker = L.marker([cl.latitude, cl.longitude], { icon: customIcon });

        clusterMarker.bindPopup(`
          <div style="font-family: system-ui; max-width: 250px; font-size: 12px; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-weight: 900; color: #1d4ed8; font-size: 11px;">${cl.id}</span>
              <span style="background: ${isCritical ? '#fee2e2' : '#fef3c7'}; color: ${isCritical ? '#991b1b' : '#92400e'}; padding: 1px 6px; border-radius: 9999px; font-weight: 800; font-size: 10px;">${cl.priority_level}</span>
            </div>
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px; font-size: 13px;">${cl.title}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${cl.ward} · Impact Score: <strong>${cl.impact_score}/100</strong></div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 11px;">
              <div>👥 <strong>${cl.citizen_count} Citizens</strong> affected</div>
              <div>📈 Trend: <strong style="color: #dc2626;">${cl.trend}</strong> in 72h</div>
              <div>🏢 Dept: <strong>${cl.department_name}</strong></div>
            </div>
            <button id="btn-cluster-${cl.id}" style="width: 100%; background: #2563eb; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 11px;">
              Open Issue Intelligence →
            </button>
          </div>
        `);

        clusterMarker.on('popupopen', () => {
          const btn = document.getElementById(`btn-cluster-${cl.id}`);
          if (btn) {
            btn.onclick = () => onSelectCluster(cl.id);
          }
        });

        clLayer.addLayer(radiusCircle);
        clLayer.addLayer(clusterMarker);
      });
    }

    // 3. LAYER 3: HOTSPOTS MAP (Emerging High Concentration Halos)
    if (activeLayers.hotspots) {
      // Hotspots around Ward 14 (Water & Road) and Ward 8 (Garbage)
      const hotspotsData = [
        { lat: 19.2612, lon: 72.9734, radius: 900, label: 'Emerging Hotspot: Ward 14 Road (+300%)' },
        { lat: 19.2550, lon: 72.9810, radius: 1200, label: 'Critical Outage Hotspot: Ward 14 Water (+240%)' },
        { lat: 19.2185, lon: 72.9860, radius: 800, label: 'Waste Accumulation Hotspot: Ward 8 (+85%)' }
      ];

      hotspotsData.forEach((h) => {
        const halo = L.circle([h.lat, h.lon], {
          radius: h.radius,
          color: '#e11d48',
          fillColor: '#fb7185',
          fillOpacity: 0.18,
          weight: 2,
        });

        halo.bindTooltip(h.label, { permanent: false, direction: 'top' });
        hLayer.addLayer(halo);
      });
    }
  }, [complaints, clusters, activeLayers, selectedDept, selectedCategory, selectedPriority, selectedWard]);

  return (
    <div className="space-y-4">
      {/* Top Filter and Layer Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Layer Toggles */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 flex items-center mr-2">
            <Layers className="w-4 h-4 mr-1 text-blue-600" />
            GIS Layers:
          </span>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, clusters: !p.clusters }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              activeLayers.clusters
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Issue Clusters ({clusters.length})</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, complaints: !p.complaints }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              activeLayers.complaints
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Complaints ({complaints.length})</span>
          </button>

          <button
            onClick={() => setActiveLayers((p) => ({ ...p, hotspots: !p.hotspots }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              activeLayers.hotspots
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Emerging Hotspots</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="PWD">PWD (Roads)</option>
              <option value="WATER">Water Supply</option>
              <option value="SANITATION">Sanitation</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="ELECTRICAL">Electrical</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🟠 High</option>
              <option value="MEDIUM">🟡 Medium</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-slate-500 font-semibold">Ward:</span>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Wards</option>
              <option value="Ward 14">Ward 14 (Ghodbunder/Hiranandani)</option>
              <option value="Ward 8">Ward 8 (Majiwada)</option>
              <option value="Ward 6">Ward 6 (Vartak Nagar)</option>
              <option value="Ward 2">Ward 2 (Station West)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-md h-[600px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Legend */}
        <div className="absolute bottom-5 left-5 z-[1000] bg-white/95 backdrop-blur p-3.5 rounded-xl border border-slate-200 shadow-lg text-xs space-y-2">
          <div className="font-bold text-slate-900 mb-1">GIS Map Legend</div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border border-white" />
            <span className="text-slate-700">🔴 Critical Priority / Issue Centroid</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white" />
            <span className="text-slate-700">🟠 High Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border-2 border-dashed border-rose-600 bg-rose-500/20" />
            <span className="text-slate-700">Cluster Radius Boundary</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-rose-500/20 border border-rose-600" />
            <span className="text-slate-700">Emerging Hotspot Halo (+200%+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
