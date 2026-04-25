import React from 'react';
import type { MeterDetail } from '../data/syntheticData';

/**
 * MeterDetailPanel — Detailed investigation view for a selected meter
 */

interface MeterDetailPanelProps {
  meter: MeterDetail;
  onClose: () => void;
}

export const MeterDetailPanel: React.FC<MeterDetailPanelProps> = ({ meter, onClose }) => {
  return (
    <div className="panel" id="meter-detail-panel">
      <div className="panel-header flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Meter Investigation Details
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {meter.meterId} — {meter.zone}, PIN {meter.pinCode}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close detail panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="panel-body">
        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
          <InfoRow label="Consumer Name" value={meter.consumerName} />
          <InfoRow label="Account Number" value={meter.accountNumber} mono />
          <InfoRow label="Address" value={meter.address} span2 />
          <InfoRow label="Meter Type" value={meter.meterType} />
          <InfoRow label="Sanctioned Load" value={meter.sanctionedLoad} />
          <InfoRow label="Installation Date" value={formatDate(meter.installationDate)} />
          <InfoRow label="Last Reading" value={formatDateTime(meter.lastReading)} />
        </div>

        {/* Alert History */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Alert History
          </h3>
          <div className="space-y-2">
            {meter.alertHistory.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1.5 px-3 rounded bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400">{alert.date}</span>
                  <span className="text-slate-700 font-medium">{alert.type}</span>
                </div>
                {alert.resolved ? (
                  <span className="badge badge-normal">Resolved</span>
                ) : (
                  <span className="badge badge-critical">Open</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center gap-3">
          <button className="px-4 py-2 bg-gov-navy text-white text-xs font-semibold rounded hover:bg-gov-navy-light transition-colors">
            Initiate Field Inspection
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
            Mark as Reviewed
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Helper Components ──

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  span2?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, mono, span2 }) => (
  <div className={span2 ? 'col-span-2' : ''}>
    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
      {label}
    </p>
    <p className={`text-sm text-slate-700 ${mono ? 'font-mono' : ''}`}>
      {value}
    </p>
  </div>
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
