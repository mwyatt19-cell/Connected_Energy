import React, { useState, useMemo } from 'react';
import { 
  Map as MapIcon, 
  Settings2, 
  Filter, 
  Zap, 
  MapPin, 
  Table2,
  ChevronDown,
  Droplets,
  AlertTriangle,
  RadioTower,
  Activity
} from 'lucide-react';

// --- MOCK DATA GENERATION ---
const NC_COUNTIES = ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Durham'];

// Generate 80 parcels across the 5 target counties
const generateMockParcels = () => {
  const parcels = [];
  const clusters = {
    'Mecklenburg': { cx: 30, cy: 80, r: 10 },
    'Wake': { cx: 75, cy: 45, r: 12 },
    'Guilford': { cx: 55, cy: 35, r: 10 },
    'Forsyth': { cx: 45, cy: 30, r: 9 },
    'Durham': { cx: 70, cy: 40, r: 8 },
  };

  for (let i = 1; i <= 80; i++) {
    const county = NC_COUNTIES[i % NC_COUNTIES.length];
    const cluster = clusters[county];
    
    // Spatial scattering within the county cluster
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * cluster.r;
    const x = cluster.cx + radius * Math.cos(angle);
    const y = cluster.cy + radius * Math.sin(angle);

    parcels.push({
      id: `NC-${county.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
      county: county,
      acreage: Math.floor(Math.random() * 350) + 50, // 50 to 400 acres
      hasWetlands: Math.random() > 0.65, // ~35% chance of containing wetlands
      hasFEMA: Math.random() > 0.75,     // ~25% chance of being in FEMA zone
      distance: (Math.random() * 9 + 1), // 1.0 to 10.0 miles
      score: Math.floor(Math.random() * 101), // 0 to 100 base suitability
      x: x,
      y: y
    });
  }
  return parcels;
};

const INITIAL_PARCELS = generateMockParcels();
const FILTER_COUNTIES = ['All', ...NC_COUNTIES];

// --- COMPONENTS ---

// Reusable Toggle Switch Component
const Toggle = ({ enabled, onChange, label, icon: Icon, colorClass }) => (
  <div className="flex items-center justify-between group cursor-pointer" onClick={onChange}>
    <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2 cursor-pointer group-hover:text-slate-200 transition-colors">
      <Icon size={14} className={enabled ? colorClass : 'text-slate-500'} /> {label}
    </label>
    <div className={`w-9 h-5 rounded-full relative transition-colors duration-300 ease-in-out ${enabled ? 'bg-emerald-500' : 'bg-slate-700 shadow-inner'}`}>
      <div 
        className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[3px] shadow-sm transition-transform duration-300 ease-in-out`} 
        style={{ transform: enabled ? 'translateX(19px)' : 'translateX(3px)' }} 
      />
    </div>
  </div>
);

export default function SunGridDashboard() {
  // State: Interactive Filters
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [excludeWetlands, setExcludeWetlands] = useState(true);
  const [excludeFEMA, setExcludeFEMA] = useState(true);
  const [maxDistance, setMaxDistance] = useState(3.0);
  
  const [hoveredParcelId, setHoveredParcelId] = useState(null);

  // Derived Data: The Spatial Filtering Pipeline
  const processedParcels = useMemo(() => {
    return INITIAL_PARCELS
      .filter(p => {
        // 1. County Filter
        if (selectedCounty !== 'All' && p.county !== selectedCounty) return false;
        
        // 2. Environmental Exclusions
        if (excludeWetlands && p.hasWetlands) return false;
        if (excludeFEMA && p.hasFEMA) return false;
        
        // 3. Infrastructure Filter
        if (p.distance > maxDistance) return false;

        return true;
      })
      .sort((a, b) => b.score - a.score) // Sort Descending by Suitability Score
      .slice(0, 10); // STRICT TOP 10 YIELD
  }, [selectedCounty, excludeWetlands, excludeFEMA, maxDistance]);

  // Visual theming based on score
  const getScoreTheme = (score) => {
    if (score >= 80) return { fill: '#10b981', ring: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' }; 
    if (score >= 60) return { fill: '#06b6d4', ring: 'rgba(6, 182, 212, 0.3)', text: 'text-cyan-400' };   
    return { fill: '#eab308', ring: 'rgba(234, 179, 8, 0.3)', text: 'text-yellow-400' };
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* LEFT SIDEBAR: FILTERS */}
      <aside className="w-[300px] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 shadow-2xl relative shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)] border border-emerald-400/50">
            <Zap className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">SunGrid</h1>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-medium">Greenfield Pipeline</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
            <Filter size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">Site Constraints</h2>
          </div>

          {/* County Select */}
          <div className="space-y-3">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
              <MapPin size={14} /> Regional Target (NC)
            </label>
            <div className="relative group">
              <select 
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 appearance-none shadow-inner transition-colors group-hover:border-slate-500 outline-none"
              >
                {FILTER_COUNTIES.map(county => (
                  <option key={county} value={county}>{county}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" />
            </div>
          </div>

          {/* Distance Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
                <RadioTower size={14} className="text-cyan-400" /> Max HV Distance
              </label>
              <span className="text-cyan-400 font-mono bg-cyan-900/30 px-2 py-0.5 rounded border border-cyan-800/50 text-xs">
                {maxDistance.toFixed(1)} mi
              </span>
            </div>
            <input 
              type="range" 
              min="1" max="10" step="0.5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 rounded-lg appearance-none h-1.5 cursor-pointer hover:bg-slate-700 transition-colors"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1.0mi</span>
              <span>10.0mi</span>
            </div>
          </div>

          {/* Environmental Toggles */}
          <div className="space-y-5 pt-2">
             <Toggle 
                enabled={excludeWetlands} 
                onChange={() => setExcludeWetlands(!excludeWetlands)} 
                label="Exclude NWI Wetlands" 
                icon={Droplets}
                colorClass="text-emerald-400"
             />
             <Toggle 
                enabled={excludeFEMA} 
                onChange={() => setExcludeFEMA(!excludeFEMA)} 
                label="Exclude FEMA (A/AE/X)" 
                icon={AlertTriangle}
                colorClass="text-emerald-400"
             />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10"><Activity size={40}/></div>
             <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Active Pipeline</div>
             <div className="font-mono text-xl font-bold text-white flex items-baseline gap-2">
               {processedParcels.length} <span className="text-[10px] text-emerald-400 font-sans tracking-wide uppercase">Top Sites Found</span>
             </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT: SPLIT PANE */}
      <main className="flex-1 flex flex-col xl:flex-row min-w-0 bg-slate-950 overflow-hidden">
        
        {/* LEFT PANE: SPATIAL MAP */}
        <div className="xl:flex-1 h-1/2 xl:h-auto relative border-b xl:border-b-0 xl:border-r border-slate-800 flex flex-col p-4 z-10 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
             <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                <MapIcon size={18} className="text-cyan-400" /> Spatial Cluster Map
             </h2>
             <div className="px-2 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-mono uppercase tracking-wider">
               Simulation Mode Active
             </div>
          </div>
          
          <div className="flex-1 w-full rounded-xl border border-slate-800/80 bg-[#0b1121] shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'linear-gradient(to right, rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
              backgroundSize: '40px 40px' 
            }}></div>
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              {/* North Carolina Rough Topographic Implication (Mock Lines) */}
              <path d="M5,50 Q20,30 50,45 T95,40" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="0.5" />
              <path d="M10,70 Q30,60 60,75 T90,60" fill="none" stroke="rgba(148, 163, 184, 0.04)" strokeWidth="0.3" />

              {/* Render Filtered Top 10 Parcels */}
              {processedParcels.map(p => {
                const theme = getScoreTheme(p.score);
                const isHovered = hoveredParcelId === p.id;
                
                return (
                  <g key={`map-${p.id}`} 
                     className="transition-all duration-200 cursor-crosshair"
                     onMouseEnter={() => setHoveredParcelId(p.id)}
                     onMouseLeave={() => setHoveredParcelId(null)}
                  >
                    {/* Pulsing ring on hover */}
                    {isHovered && (
                      <circle cx={p.x} cy={p.y} r="3" fill="none" stroke={theme.fill} strokeWidth="0.3" className="animate-ping opacity-75" />
                    )}
                    {/* Base outer ring */}
                    <circle cx={p.x} cy={p.y} r={isHovered ? "2.5" : "1.5"} fill={theme.ring} />
                    {/* Inner solid dot */}
                    <circle cx={p.x} cy={p.y} r={isHovered ? "1" : "0.6"} fill={isHovered ? "#fff" : theme.fill} />
                    
                    {/* Tooltip on Map */}
                    {isHovered && (
                      <g className="drop-shadow-2xl pointer-events-none">
                        <rect x={p.x + 2} y={p.y - 5} width="24" height="10" rx="1" fill="#020617" stroke="#1e293b" strokeWidth="0.3" />
                        <text x={p.x + 3.5} y={p.y - 2} fontSize="1.8" fill="#94a3b8" className="font-mono">{p.id}</text>
                        <text x={p.x + 3.5} y={p.y + 1.5} fontSize="1.6" fill="#cbd5e1" className="font-sans">Dist: {p.distance.toFixed(1)}m</text>
                        <text x={p.x + 3.5} y={p.y + 4} fontSize="1.8" fill="#fff" className="font-sans font-bold">
                          Score: <tspan fill={theme.fill}>{p.score}</tspan>
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* RIGHT PANE: DATA TABLE */}
        <div className="xl:flex-1 h-1/2 xl:h-auto p-4 overflow-hidden flex flex-col bg-slate-950">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <Table2 size={18} className="text-emerald-400" /> Engineering Evaluation Table
            </h2>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">Sorted by Score</div>
          </div>
          
          <div className="flex-1 overflow-auto rounded-xl border border-slate-800 bg-slate-900/40 shadow-2xl custom-scrollbar relative">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[10px] uppercase tracking-wider bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                <tr>
                  <th className="px-4 py-4 font-semibold">Rank</th>
                  <th className="px-4 py-4 font-semibold">Parcel ID</th>
                  <th className="px-4 py-4 font-semibold">County</th>
                  <th className="px-4 py-4 font-semibold text-right">Acreage</th>
                  <th className="px-4 py-4 font-semibold text-center">NWI/FEMA</th>
                  <th className="px-4 py-4 font-semibold text-right">Sub (mi)</th>
                  <th className="px-4 py-4 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {processedParcels.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-slate-500 font-mono text-sm">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
                        <AlertTriangle size={24} className="text-slate-600" />
                      </div>
                      No parcels meet the strict engineering criteria.<br/>
                      <span className="text-xs mt-2 text-slate-600 inline-block">Relax environmental constraints or increase distance limit.</span>
                    </td>
                  </tr>
                ) : (
                  processedParcels.map((parcel, idx) => {
                    const theme = getScoreTheme(parcel.score);
                    const isHovered = hoveredParcelId === parcel.id;
                    const hasRisk = parcel.hasWetlands || parcel.hasFEMA;
                    
                    return (
                      <tr 
                        key={parcel.id} 
                        className={`transition-colors cursor-pointer ${isHovered ? 'bg-slate-800/80' : 'hover:bg-slate-800/40'}`}
                        onMouseEnter={() => setHoveredParcelId(parcel.id)}
                        onMouseLeave={() => setHoveredParcelId(null)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono font-bold text-xs">
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono text-sm text-slate-200">{parcel.id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-xs font-medium">
                          {parcel.county}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <span className="font-mono text-slate-300 font-medium">{parcel.acreage}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {hasRisk ? (
                            <div className="flex gap-1 justify-center">
                              {parcel.hasWetlands && <Droplets size={14} className="text-blue-400" title="Contains Wetlands" />}
                              {parcel.hasFEMA && <AlertTriangle size={14} className="text-orange-400" title="In FEMA Flood Zone" />}
                            </div>
                          ) : (
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Clean</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-slate-400">
                          {parcel.distance.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded font-mono font-bold text-sm border bg-slate-950 ${theme.text} shadow-sm`} style={{ borderColor: theme.fill }}>
                            {parcel.score}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      
      {/* Global Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}