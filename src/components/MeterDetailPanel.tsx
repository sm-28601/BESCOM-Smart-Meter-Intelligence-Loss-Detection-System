import React, { useState } from 'react';
import { toast } from 'sonner';
import type { MeterDetail } from '../data/syntheticData';

/**
 * MeterDetailPanel — Detailed investigation view for a selected meter
 */

interface MeterDetailPanelProps {
  meter: MeterDetail;
  onClose: () => void;
}

export const MeterDetailPanel: React.FC<MeterDetailPanelProps> = ({ meter, onClose }) => {
  const [isReviewed, setIsReviewed] = useState(false);
  const [inspectionDispatched, setInspectionDispatched] = useState(false);

  // ── Initiate Field Inspection ──
  // Creates a timestamped inspection dispatch record and downloads it as a .txt work order
  const handleInitiateInspection = () => {
    if (inspectionDispatched) {
      toast.warning('Field inspection already dispatched for this meter.');
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });

    const workOrder = [
      '═══════════════════════════════════════════════',
      '       BESCOM — FIELD INSPECTION WORK ORDER',
      '═══════════════════════════════════════════════',
      '',
      `Work Order ID     : FI-${meter.meterId}-${Date.now()}`,
      `Dispatch Time     : ${timestamp}`,
      `Dispatched By     : SDO Office (Dashboard)`,
      '',
      '── METER DETAILS ──',
      `Meter ID          : ${meter.meterId}`,
      `Consumer Name     : ${meter.consumerName}`,
      `Account Number    : ${meter.accountNumber}`,
      `Address           : ${meter.address}`,
      `Zone              : ${meter.zone} (PIN ${meter.pinCode})`,
      `Meter Type        : ${meter.meterType}`,
      `Sanctioned Load   : ${meter.sanctionedLoad}`,
      '',
      '── ALERT CONTEXT ──',
      ...meter.alertHistory.filter(a => !a.resolved).map(a =>
        `  • ${a.date} — ${a.type} [OPEN]`
      ),
      '',
      '── INSTRUCTIONS ──',
      '1. Verify physical meter seal integrity',
      '2. Check CT ratio and wiring configuration',
      '3. Compare on-site reading with remote data',
      '4. Document findings with photographs',
      '5. Submit inspection report within 24 hours',
      '',
      '═══════════════════════════════════════════════',
    ].join('\n');

    const blob = new Blob([workOrder], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inspection_${meter.meterId}_${now.toISOString().slice(0, 10)}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    setInspectionDispatched(true);
    toast.success(`Field inspection dispatched for ${meter.meterId}. Work order downloaded.`);
  };

  // ── Download Report ──
  // Generates a comprehensive meter investigation report and downloads as .txt
  const handleDownloadReport = () => {
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

    const anomalyPoint = meter.consumptionData.find(d => d.anomaly);
    const avgConsumption = (
      meter.consumptionData.reduce((sum, d) => sum + d.householdConsumption, 0) /
      meter.consumptionData.length
    ).toFixed(2);
    const avgBaseline = (
      meter.consumptionData.reduce((sum, d) => sum + d.peerBaseline, 0) /
      meter.consumptionData.length
    ).toFixed(2);

    const report = [
      '═══════════════════════════════════════════════',
      '    BESCOM — METER INVESTIGATION REPORT',
      '═══════════════════════════════════════════════',
      '',
      `Generated         : ${timestamp}`,
      `Report ID         : RPT-${meter.meterId}-${Date.now()}`,
      '',
      '── CONSUMER INFORMATION ──',
      `Meter ID          : ${meter.meterId}`,
      `Consumer Name     : ${meter.consumerName}`,
      `Account Number    : ${meter.accountNumber}`,
      `Address           : ${meter.address}`,
      `Zone              : ${meter.zone} (PIN ${meter.pinCode})`,
      `Meter Type        : ${meter.meterType}`,
      `Sanctioned Load   : ${meter.sanctionedLoad}`,
      `Installation Date : ${meter.installationDate}`,
      `Last Reading      : ${meter.lastReading}`,
      '',
      '── CONSUMPTION ANALYSIS (24-HOUR) ──',
      `Avg Household     : ${avgConsumption} kWh`,
      `Avg Peer Baseline : ${avgBaseline} kWh`,
      `Deviation         : ${((1 - parseFloat(avgConsumption) / parseFloat(avgBaseline)) * 100).toFixed(1)}%`,
      '',
      ...(anomalyPoint ? [
        '── ANOMALY DETECTED ──',
        `Time              : ${anomalyPoint.hour}`,
        `Household Reading : ${anomalyPoint.householdConsumption} kWh`,
        `Peer Baseline     : ${anomalyPoint.peerBaseline} kWh`,
        `Drop Severity     : ${((1 - anomalyPoint.householdConsumption / anomalyPoint.peerBaseline) * 100).toFixed(0)}%`,
        '',
      ] : []),
      '── HOURLY CONSUMPTION DATA ──',
      'Hour       | Household (kWh) | Baseline (kWh) | Anomaly',
      '-'.repeat(60),
      ...meter.consumptionData.map(d =>
        `${d.hour.padEnd(11)}| ${d.householdConsumption.toFixed(2).padEnd(16)}| ${d.peerBaseline.toFixed(2).padEnd(15)}| ${d.anomaly ? '*** YES ***' : '-'}`
      ),
      '',
      '── ALERT HISTORY ──',
      ...meter.alertHistory.map(a =>
        `  ${a.date}  ${a.type.padEnd(25)} ${a.resolved ? '[RESOLVED]' : '[OPEN]'}`
      ),
      '',
      '═══════════════════════════════════════════════',
      '  End of Report — BESCOM Smart Meter Intelligence',
      '═══════════════════════════════════════════════',
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${meter.meterId}_${now.toISOString().slice(0, 10)}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    toast.success(`Investigation report for ${meter.meterId} downloaded.`);
  };

  // ── Mark as Reviewed ──
  // Toggles the reviewed state and shows confirmation
  const handleMarkReviewed = () => {
    const newState = !isReviewed;
    setIsReviewed(newState);
    if (newState) {
      toast.success(`Meter ${meter.meterId} marked as reviewed by SDO Office.`);
    } else {
      toast.info(`Review status for ${meter.meterId} has been cleared.`);
    }
  };

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
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center gap-3 flex-wrap">
          <button 
            onClick={handleInitiateInspection}
            disabled={inspectionDispatched}
            className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
              inspectionDispatched
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-gov-navy text-white hover:bg-gov-navy-light'
            }`}
          >
            {inspectionDispatched ? '✓ Inspection Dispatched' : 'Initiate Field Inspection'}
          </button>
          <button 
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors"
          >
            Download Report
          </button>
          <button 
            onClick={handleMarkReviewed}
            className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
              isReviewed
                ? 'bg-green-100 border border-green-300 text-green-700'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isReviewed ? '✓ Reviewed' : 'Mark as Reviewed'}
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
