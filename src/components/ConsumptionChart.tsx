import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { MeterDetail, ConsumptionDataPoint } from '../data/syntheticData';

/**
 * ConsumptionChart — Interactive line chart showing household consumption vs peer baseline
 */

interface ConsumptionChartProps {
  meter: MeterDetail;
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isAnomaly = payload[0]?.payload?.anomaly;
    return (
      <div className={`bg-white border shadow-lg rounded-md p-3 text-xs ${isAnomaly ? 'border-alert-red' : 'border-slate-200'}`}>
        <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-mono font-semibold text-slate-700">
              {entry.value} kWh
            </span>
          </div>
        ))}
        {isAnomaly && (
          <div className="mt-2 pt-2 border-t border-alert-red border-opacity-20">
            <p className="text-alert-red font-semibold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Anomaly Detected
            </p>
            <p className="text-slate-500 mt-0.5">
              Sudden consumption drop — possible tamper/bypass event
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ meter }) => {
  // Find the anomaly point
  const anomalyPoint = meter.consumptionData.find((d) => d.anomaly);

  return (
    <div className="panel" id="consumption-chart">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Consumption Analysis — {meter.meterId}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              24-hour consumption vs. peer baseline (zone average)
            </p>
          </div>
          <span className="badge badge-critical">Anomaly Detected</span>
        </div>
      </div>

      {/* Chart */}
      <div className="panel-body">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={meter.consumptionData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: '#6c757d' }}
              tickLine={{ stroke: '#dee2e6' }}
              axisLine={{ stroke: '#dee2e6' }}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6c757d' }}
              tickLine={{ stroke: '#dee2e6' }}
              axisLine={{ stroke: '#dee2e6' }}
              label={{
                value: 'kWh',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 11, fill: '#6c757d' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="line"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />

            {/* Peer Baseline — gray dashed */}
            <Line
              type="monotone"
              dataKey="peerBaseline"
              name="Peer Baseline Average"
              stroke="#adb5bd"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 4, fill: '#adb5bd' }}
            />

            {/* Household Consumption — red */}
            <Line
              type="monotone"
              dataKey="householdConsumption"
              name="Household Consumption"
              stroke="#c71f16"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: '#c71f16' }}
            />

            {/* Anomaly marker */}
            {anomalyPoint && (
              <ReferenceDot
                x={anomalyPoint.hour}
                y={anomalyPoint.householdConsumption}
                r={8}
                fill="#c71f16"
                stroke="#fff"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Anomaly callout */}
        {anomalyPoint && (
          <div className="mt-4 bg-alert-red-light border border-alert-red border-opacity-20 rounded-md p-3 flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c71f16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-alert-red">
                Sudden Drop at {anomalyPoint.hour}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Consumption dropped to <strong>{anomalyPoint.householdConsumption} kWh</strong> while
                the peer baseline was <strong>{anomalyPoint.peerBaseline} kWh</strong>.
                This {((1 - anomalyPoint.householdConsumption / anomalyPoint.peerBaseline) * 100).toFixed(0)}% deviation
                triggered the anomaly alert. Recommend field inspection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
