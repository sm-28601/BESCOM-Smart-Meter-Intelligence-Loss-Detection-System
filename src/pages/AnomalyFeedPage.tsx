import React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { DataTable } from '../components/DataTable';
import { ConsumptionChart } from '../components/ConsumptionChart';
import { MeterDetailPanel } from '../components/MeterDetailPanel';
import { anomalyFeed, meterDetails } from '../data/syntheticData';

/**
 * AnomalyFeedPage — Full dedicated view for the Live Anomaly Feed
 * Uses react-resizable-panels for adjustable column widths
 */

interface AnomalyFeedPageProps {
  selectedMeterId: string | null;
  onSelectMeter: (id: string) => void;
  onClose: () => void;
}

export const AnomalyFeedPage: React.FC<AnomalyFeedPageProps> = ({
  selectedMeterId,
  onSelectMeter,
  onClose,
}) => {
  const selectedMeter = selectedMeterId ? meterDetails[selectedMeterId] : null;

  return (
    <div className="p-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col" id="anomaly-feed-page">
      {selectedMeter ? (
        <Group direction="horizontal" className="flex-1 w-full overflow-hidden">
          {/* Left: Full Feed — resizable */}
          <Panel defaultSize={40} minSize={25} maxSize={65}>
            <div className="h-full pr-2 overflow-hidden flex flex-col">
              <DataTable
                data={anomalyFeed}
                selectedMeterId={selectedMeterId}
                onSelectMeter={onSelectMeter}
              />
            </div>
          </Panel>

          {/* Drag Handle */}
          <Separator className="resize-handle-vertical cursor-col-resize" />

          {/* Right: Investigation — resizable */}
          <Panel defaultSize={60} minSize={35} maxSize={75}>
            <div className="h-full pl-2 space-y-5 overflow-y-auto">
              <ConsumptionChart meter={selectedMeter} />
              <MeterDetailPanel meter={selectedMeter} onClose={onClose} />
            </div>
          </Panel>
        </Group>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <DataTable
            data={anomalyFeed}
            selectedMeterId={selectedMeterId}
            onSelectMeter={onSelectMeter}
          />
        </div>
      )}
    </div>
  );
};
