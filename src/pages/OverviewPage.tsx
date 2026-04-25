import React, { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { KPICards } from '../components/KPICards';
import { DataTable } from '../components/DataTable';
import { ConsumptionChart } from '../components/ConsumptionChart';
import { MeterDetailPanel } from '../components/MeterDetailPanel';
import { kpiData, anomalyFeed, meterDetails } from '../data/syntheticData';

/**
 * OverviewPage — Main dashboard view with KPIs, anomaly feed, and investigation panel
 * Uses react-resizable-panels for adjustable column widths
 */

export const OverviewPage: React.FC = () => {
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const selectedMeter = selectedMeterId ? meterDetails[selectedMeterId] : null;

  return (
    <div className="p-6" id="overview-page">
      {/* KPI Banner */}
      <KPICards
        totalActiveMeters={kpiData.totalActiveMeters}
        gridLoadRisk={kpiData.gridLoadRisk}
        pendingAlerts={kpiData.pendingAlerts}
      />

      {/* Main Content — Resizable Two Column Layout */}
      {selectedMeter ? (
        <Group direction="horizontal" className="min-h-[600px]">
          {/* Left: Anomaly Feed — resizable */}
          <Panel defaultSize={40} minSize={25} maxSize={65}>
            <div className="h-full pr-0">
              <DataTable
                data={anomalyFeed}
                selectedMeterId={selectedMeterId}
                onSelectMeter={setSelectedMeterId}
              />
            </div>
          </Panel>

          {/* Drag Handle */}
          <Separator className="resize-handle-vertical" />

          {/* Right: Investigation View — resizable */}
          <Panel defaultSize={60} minSize={35} maxSize={75}>
            <div className="h-full pl-0 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)]">
              <ConsumptionChart meter={selectedMeter} />
              <MeterDetailPanel
                meter={selectedMeter}
                onClose={() => setSelectedMeterId(null)}
              />
            </div>
          </Panel>
        </Group>
      ) : (
        /* Full width table when no meter selected */
        <div>
          <DataTable
            data={anomalyFeed}
            selectedMeterId={selectedMeterId}
            onSelectMeter={setSelectedMeterId}
          />

          {/* Empty state prompt */}
          <div className="mt-5 panel">
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-slate-600 mb-1">
                Select a Meter to Investigate
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Click on any flagged meter in the Anomaly Feed table above to view the
                detailed consumption analysis chart and investigation details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
