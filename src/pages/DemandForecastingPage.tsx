import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * DemandForecastingPage — Zone-wise demand forecasting with load curves
 */

// ── Synthetic Forecasting Data ──

// 24-hour load forecast (today + next day predicted)
const hourlyForecast = Array.from({ length: 24 }, (_, h) => {
  const hour = `${h.toString().padStart(2, '0')}:00`;
  let actual: number;
  let predicted: number;

  // Typical Bangalore load pattern (MW)
  if (h >= 0 && h < 5) {
    actual = 2800 + Math.random() * 200;
    predicted = 2850 + Math.random() * 100;
  } else if (h >= 5 && h < 8) {
    actual = 3200 + (h - 5) * 400 + Math.random() * 150;
    predicted = 3300 + (h - 5) * 380 + Math.random() * 100;
  } else if (h >= 8 && h < 12) {
    actual = 4200 + Math.random() * 300;
    predicted = 4300 + Math.random() * 200;
  } else if (h >= 12 && h < 14) {
    actual = 4600 + Math.random() * 200;
    predicted = 4550 + Math.random() * 150;
  } else if (h >= 14 && h < 18) {
    actual = 4100 + Math.random() * 300;
    predicted = 4200 + Math.random() * 200;
  } else if (h >= 18 && h < 22) {
    actual = 4800 + Math.random() * 350;
    predicted = 4700 + Math.random() * 250;
  } else {
    actual = 3400 + Math.random() * 200;
    predicted = 3500 + Math.random() * 150;
  }

  return {
    hour,
    actual: Math.round(actual),
    predicted: Math.round(predicted),
    lowerBound: Math.round(predicted - 200 - Math.random() * 100),
    upperBound: Math.round(predicted + 200 + Math.random() * 100),
  };
});

// Zone-wise load distribution
const zoneLoadData = [
  { zone: 'Jayanagar', current: 342, peak: 410, capacity: 500 },
  { zone: 'Koramangala', current: 285, peak: 360, capacity: 450 },
  { zone: 'Whitefield', current: 410, peak: 480, capacity: 550 },
  { zone: 'Indiranagar', current: 298, peak: 375, capacity: 420 },
  { zone: 'Rajajinagar', current: 225, peak: 310, capacity: 400 },
  { zone: 'Malleswaram', current: 268, peak: 340, capacity: 380 },
  { zone: 'HSR Layout', current: 312, peak: 395, capacity: 470 },
  { zone: 'Electronic City', current: 520, peak: 610, capacity: 700 },
];

// Weekly trend data
const weeklyTrend = [
  { day: 'Mon', demand: 4520, forecast: 4480 },
  { day: 'Tue', demand: 4380, forecast: 4420 },
  { day: 'Wed', demand: 4610, forecast: 4550 },
  { day: 'Thu', demand: 4490, forecast: 4510 },
  { day: 'Fri', demand: 4350, forecast: 4400 },
  { day: 'Sat', demand: 3980, forecast: 4050 },
  { day: 'Sun', demand: 3720, forecast: 3800 },
];

// Model performance metrics
const modelMetrics = [
  { metric: 'MAPE', value: '2.34%', status: 'good' },
  { metric: 'RMSE', value: '142 MW', status: 'good' },
  { metric: 'R² Score', value: '0.967', status: 'good' },
  { metric: 'Forecast Horizon', value: '48 hrs', status: 'info' },
  { metric: 'Last Trained', value: '25 Apr 2026, 06:00', status: 'info' },
  { metric: 'Data Points', value: '1,04,832', status: 'info' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-md p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center gap-2 mb-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-mono font-semibold text-slate-700">
              {typeof entry.value === 'number' ? `${entry.value.toLocaleString('en-IN')} MW` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const DemandForecastingPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'hourly' | 'weekly'>('hourly');

  const peakDemand = Math.max(...hourlyForecast.map((d) => d.actual));
  const avgDemand = Math.round(
    hourlyForecast.reduce((s, d) => s + d.actual, 0) / hourlyForecast.length
  );

  return (
    <div className="p-6 space-y-5" id="demand-forecasting-page">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Current System Load
          </p>
          <p className="text-2xl font-bold text-gov-navy font-mono">
            {hourlyForecast[new Date().getHours()]?.actual.toLocaleString('en-IN')} MW
          </p>
          <p className="text-xs text-slate-400 mt-1">Real-time demand</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Peak Demand (Today)
          </p>
          <p className="text-2xl font-bold text-alert-amber font-mono">
            {peakDemand.toLocaleString('en-IN')} MW
          </p>
          <p className="text-xs text-slate-400 mt-1">Forecasted peak at 20:00</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Average Load (Today)
          </p>
          <p className="text-2xl font-bold text-slate-700 font-mono">
            {avgDemand.toLocaleString('en-IN')} MW
          </p>
          <p className="text-xs text-slate-400 mt-1">24-hour average</p>
        </div>
        <div className="kpi-card">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Forecast Accuracy (MAPE)
          </p>
          <p className="text-2xl font-bold text-alert-green font-mono">2.34%</p>
          <p className="text-xs text-slate-400 mt-1">Below 3% threshold ✓</p>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="panel">
        <div className="panel-header flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Demand Forecast — Short Term Load Forecast (STLF)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual demand vs. ML predicted demand with confidence interval
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5">
            <button
              onClick={() => setSelectedView('hourly')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedView === 'hourly'
                  ? 'bg-gov-navy text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Hourly (24h)
            </button>
            <button
              onClick={() => setSelectedView('weekly')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                selectedView === 'weekly'
                  ? 'bg-gov-navy text-white'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
        <div className="panel-body">
          {selectedView === 'hourly' ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={hourlyForecast} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
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
                    value: 'MW',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#6c757d' },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="line" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

                {/* Confidence band */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#0a2e5c"
                  fillOpacity={0.06}
                  name="Upper Bound"
                  legendType="none"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Lower Bound"
                  legendType="none"
                />

                {/* Predicted line */}
                <Line
                  type="monotone"
                  dataKey="predicted"
                  name="STLF Predicted"
                  stroke="#0a2e5c"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  activeDot={{ r: 4, fill: '#0a2e5c' }}
                />

                {/* Actual line */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Demand"
                  stroke="#c71f16"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#c71f16' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  tickLine={{ stroke: '#dee2e6' }}
                  axisLine={{ stroke: '#dee2e6' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6c757d' }}
                  tickLine={{ stroke: '#dee2e6' }}
                  axisLine={{ stroke: '#dee2e6' }}
                  label={{
                    value: 'MW',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#6c757d' },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="demand" name="Actual Demand" fill="#0a2e5c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="forecast" name="Forecast" fill="#adb5bd" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row: Zone Load + Model Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Zone-wise Load Distribution */}
        <div className="lg:col-span-2 panel">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-800">Zone-wise Load Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current load vs. peak demand vs. installed capacity (MW)
            </p>
          </div>
          <div className="panel-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={zoneLoadData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#6c757d' }}
                  tickLine={{ stroke: '#dee2e6' }}
                  axisLine={{ stroke: '#dee2e6' }}
                />
                <YAxis
                  type="category"
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: '#495057' }}
                  tickLine={false}
                  axisLine={{ stroke: '#dee2e6' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="current" name="Current Load" fill="#1a5276" radius={[0, 3, 3, 0]} barSize={10} />
                <Bar dataKey="peak" name="Peak Demand" fill="#d4a017" radius={[0, 3, 3, 0]} barSize={10} />
                <Bar dataKey="capacity" name="Capacity" fill="#dee2e6" radius={[0, 3, 3, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Model Performance Metrics */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-semibold text-slate-800">Model Performance</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              STLF model accuracy metrics
            </p>
          </div>
          <div className="panel-body space-y-3">
            {modelMetrics.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded bg-slate-50"
              >
                <span className="text-xs font-medium text-slate-600">{m.metric}</span>
                <span
                  className={`text-xs font-mono font-semibold ${
                    m.status === 'good'
                      ? 'text-alert-green'
                      : 'text-gov-navy'
                  }`}
                >
                  {m.value}
                </span>
              </div>
            ))}

            {/* Last update */}
            <div className="border-t border-slate-100 pt-3 mt-3">
              <p className="text-[10px] text-slate-400 text-center">
                Model: XGBoost + LSTM Hybrid Ensemble<br />
                Training data: April 2024 – April 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
