import React from 'react';

/**
 * KPICards — Three high-level metric cards for the top banner
 */

interface KPICardsProps {
  totalActiveMeters: number;
  gridLoadRisk: 'Normal' | 'High' | 'Critical';
  pendingAlerts: number;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalActiveMeters,
  gridLoadRisk,
  pendingAlerts,
}) => {
  const riskColor =
    gridLoadRisk === 'Normal'
      ? 'text-alert-green'
      : gridLoadRisk === 'High'
      ? 'text-alert-amber'
      : 'text-alert-red';

  const riskBg =
    gridLoadRisk === 'Normal'
      ? 'bg-alert-green-light'
      : gridLoadRisk === 'High'
      ? 'bg-alert-amber-light'
      : 'bg-alert-red-light';

  const riskIcon =
    gridLoadRisk === 'Normal' ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Active Smart Meters */}
      <div className="kpi-card" id="kpi-total-meters">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Total Active Smart Meters
            </p>
            <p className="text-2xl font-bold text-slate-800 font-mono">
              {totalActiveMeters.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="w-10 h-10 bg-gov-navy bg-opacity-5 rounded-lg flex items-center justify-center text-gov-navy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
          <span>+1,246 added this quarter</span>
        </div>
      </div>

      {/* Grid Load Risk */}
      <div className="kpi-card" id="kpi-grid-risk">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Current Grid Load Risk
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-semibold ${riskColor} ${riskBg}`}>
                {riskIcon}
                {gridLoadRisk}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 bg-gov-navy bg-opacity-5 rounded-lg flex items-center justify-center text-gov-navy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Load factor: 72.4% — within safe operating range
        </div>
      </div>

      {/* Pending Alerts */}
      <div className="kpi-card" id="kpi-pending-alerts">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Pending Tamper/Theft Alerts
            </p>
            <p className="text-2xl font-bold text-alert-red font-mono">
              {pendingAlerts}
            </p>
          </div>
          <div className="w-10 h-10 bg-alert-red bg-opacity-5 rounded-lg flex items-center justify-center text-alert-red">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-alert-red text-opacity-70">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          </svg>
          <span>12 critical • 31 under review</span>
        </div>
      </div>
    </div>
  );
};
