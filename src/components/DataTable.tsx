import React, { useState } from 'react';
import type { AnomalyRecord } from '../data/syntheticData';

/**
 * DataTable — Paginated anomaly feed table
 */

interface DataTableProps {
  data: AnomalyRecord[];
  selectedMeterId: string | null;
  onSelectMeter: (meterId: string) => void;
}

const ROWS_PER_PAGE = 6;

export const DataTable: React.FC<DataTableProps> = ({
  data,
  selectedMeterId,
  onSelectMeter,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIdx = (currentPage - 1) * ROWS_PER_PAGE;
  const visibleData = data.slice(startIdx, startIdx + ROWS_PER_PAGE);

  const getSeverityBadge = (severity: AnomalyRecord['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="badge badge-critical">Critical</span>;
      case 'warning':
        return <span className="badge badge-warning">Warning</span>;
      default:
        return <span className="badge badge-normal">Info</span>;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-alert-red';
    if (score >= 75) return 'bg-alert-amber';
    return 'bg-slate-400';
  };

  const formatTime = (timestamp: string) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="panel" id="anomaly-data-table">
      {/* Panel Header */}
      <div className="panel-header flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Live Anomaly Feed
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Meters flagged by Meta-Ensemble Edge Model — Click to investigate
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-red"></span>
          </span>
          <span className="text-xs text-slate-500 font-medium">{data.length} flagged</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Meter ID</th>
              <th>Zone / Pin Code</th>
              <th>Alert Type</th>
              <th>Severity</th>
              <th>Confidence</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {visibleData.map((record) => (
              <tr
                key={record.id}
                id={`row-${record.id}`}
                onClick={() => onSelectMeter(record.meterId)}
                className={`cursor-pointer ${
                  selectedMeterId === record.meterId
                    ? 'selected'
                    : ''
                }`}
              >
                <td>
                  <span className="font-mono text-xs font-medium text-gov-navy">
                    {record.meterId}
                  </span>
                </td>
                <td>
                  <div>
                    <span className="text-slate-700">{record.zone}</span>
                    <span className="text-slate-400 text-xs ml-1.5">({record.pinCode})</span>
                  </div>
                </td>
                <td>
                  <span className="text-slate-700 font-medium text-xs">
                    {record.alertType}
                  </span>
                </td>
                <td>{getSeverityBadge(record.severity)}</td>
                <td>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="confidence-bar flex-1">
                      <div
                        className={`confidence-fill ${getConfidenceColor(record.confidenceScore)}`}
                        style={{ width: `${record.confidenceScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-600 w-10 text-right">
                      {record.confidenceScore}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className="text-xs font-mono text-slate-500">
                    {formatTime(record.timestamp)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Showing {startIdx + 1}–{Math.min(startIdx + ROWS_PER_PAGE, data.length)} of {data.length} results
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-7 h-7 text-xs font-medium rounded transition-colors ${
                currentPage === page
                  ? 'bg-gov-navy text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
