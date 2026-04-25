import React from 'react';

/**
 * AuditLogsPage — Placeholder for audit logs view
 */

export const AuditLogsPage: React.FC = () => {
  const logs = [
    { id: 'LOG-0047', timestamp: '2026-04-25 17:38:12', user: 'SDO_SouthDiv', action: 'Reviewed anomaly BLR-SM-031476', status: 'Completed' },
    { id: 'LOG-0046', timestamp: '2026-04-25 17:15:04', user: 'AE_Jayanagar', action: 'Field inspection dispatched for BLR-SM-045892', status: 'In Progress' },
    { id: 'LOG-0045', timestamp: '2026-04-25 16:48:30', user: 'SDO_SouthDiv', action: 'Marked BLR-SM-078901 alert as resolved', status: 'Completed' },
    { id: 'LOG-0044', timestamp: '2026-04-25 15:22:18', user: 'EE_South', action: 'Generated zone-wise loss report for April 2026', status: 'Completed' },
    { id: 'LOG-0043', timestamp: '2026-04-25 14:10:55', user: 'AE_Koramangala', action: 'Escalated BLR-SM-031476 — repeat offender flag', status: 'Pending Review' },
    { id: 'LOG-0042', timestamp: '2026-04-25 12:30:00', user: 'System', action: 'Meta-Ensemble model retrained on latest batch', status: 'Completed' },
  ];

  return (
    <div className="p-6" id="audit-logs-page">
      <div className="panel">
        <div className="panel-header flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Audit Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              System and user activity trail — All actions are logged for compliance
            </p>
          </div>
          <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>User / Role</th>
                <th>Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td><span className="font-mono text-xs text-gov-navy">{log.id}</span></td>
                  <td><span className="font-mono text-xs text-slate-500">{log.timestamp}</span></td>
                  <td><span className="text-slate-700 text-xs font-medium">{log.user}</span></td>
                  <td><span className="text-slate-600 text-xs">{log.action}</span></td>
                  <td>
                    <span className={`badge ${
                      log.status === 'Completed'
                        ? 'badge-normal'
                        : log.status === 'In Progress'
                        ? 'badge-warning'
                        : 'badge-critical'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
