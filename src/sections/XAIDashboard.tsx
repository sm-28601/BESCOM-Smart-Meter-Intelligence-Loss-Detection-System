import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { useState, useEffect, useMemo } from 'react';

// Generate synthetic demo data for the XAI Dashboard
function generateDemoData() {
  const data = [];
  const hours = 24;
  const samplesPerHour = 4;
  const totalSamples = hours * samplesPerHour;

  // Baseline peer pattern (smoothed diurnal curve)
  const baseline: number[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const hour = i / samplesPerHour;
    const base = 1.2
      + 2.5 * Math.exp(-Math.pow((hour - 8) / 2, 2))
      + 1.8 * Math.exp(-Math.pow((hour - 19) / 2.5, 2))
      + 0.5 * Math.sin(hour * Math.PI / 12);
    baseline.push(base + Math.random() * 0.15);
  }

  // Flagged household with tamper events
  const flagged = baseline.map((b, i) => {
    const hour = i / samplesPerHour;
    let v = b + (Math.random() - 0.5) * 0.3;

    // Tamper 1: Current bypass 08:00 - 14:00 (sudden drop)
    if (hour >= 8 && hour <= 14) {
      v *= 0.25; // 75% drop
    }

    // Tamper 2: Phase dropout 16:00 - 19:00 (asymmetric sag)
    if (hour >= 16 && hour <= 19) {
      v *= 0.55;
      v += (Math.random() - 0.5) * 0.4; // more jitter
    }

    // Normal evening peak restored
    if (hour >= 19.5 && hour <= 21) {
      v = baseline[i] * 1.1; // slightly above normal
    }

    return Math.max(0.1, v);
  });

  // Anomaly scores from meta-ensemble
  const anomalyScores = [];
  const ocsvmScores = [];
  const gmmScores = [];

  for (let i = 0; i < totalSamples; i++) {
    const hour = i / samplesPerHour;
    let score = 0.1 + Math.random() * 0.05;
    let ocsvm = 0.2 + Math.random() * 0.1;
    let gmm = 0.15 + Math.random() * 0.08;

    if (hour >= 8 && hour <= 14) {
      score = 0.75 + Math.random() * 0.18;
      ocsvm = 0.65 + Math.random() * 0.2;
      gmm = 0.7 + Math.random() * 0.15;
    }
    if (hour >= 16 && hour <= 19) {
      score = 0.82 + Math.random() * 0.12;
      ocsvm = 0.78 + Math.random() * 0.15;
      gmm = 0.85 + Math.random() * 0.1;
    }

    anomalyScores.push(score);
    ocsvmScores.push(ocsvm);
    gmmScores.push(gmm);
  }

  // Technical parameters
  for (let i = 0; i < totalSamples; i++) {
    const hour = i / samplesPerHour;
    const timeStr = `${String(Math.floor(hour)).padStart(2, '0')}:${String((i % samplesPerHour) * 15).padStart(2, '0')}`;

    data.push({
      time: timeStr,
      hour: hour,
      baseline: Math.round(baseline[i] * 100) / 100,
      flagged: Math.round(flagged[i] * 100) / 100,
      deviation: Math.round((flagged[i] - baseline[i]) * 100) / 100,
      anomalyScore: Math.round(anomalyScores[i] * 1000) / 1000,
      ocsvmScore: Math.round(ocsvmScores[i] * 1000) / 1000,
      gmmScore: Math.round(gmmScores[i] * 1000) / 1000,
      isAnomaly: anomalyScores[i] > 0.6,
      rmsI1: hour >= 8 && hour <= 14 ? 0.8 : hour >= 16 && hour <= 19 ? 1.2 : 3.5,
      rmsV1: hour >= 16 && hour <= 19 ? 198 : 230,
      powerFactor: hour >= 8 && hour <= 14 ? 0.42 : 0.95,
      thd3: hour >= 8 && hour <= 14 ? 28 : 5,
      crestFactor: hour >= 8 && hour <= 14 ? 2.8 : 1.4,
      zcJitter: hour >= 16 && hour <= 19 ? 45 : 8,
    });
  }

  return data;
}

const alertConfig = [
  { key: 'rmsI1', label: 'L1 Current (A)', baseline: 3.5, unit: 'A', threshold: 'drop', severity: (v: number) => v < 1.5 ? 'critical' : 'normal' },
  { key: 'rmsV1', label: 'V1 Voltage (V)', baseline: 230, unit: 'V', threshold: 'sag', severity: (v: number) => v < 210 ? 'critical' : 'normal' },
  { key: 'powerFactor', label: 'Power Factor', baseline: 0.95, unit: '', threshold: 'drop', severity: (v: number) => v < 0.6 ? 'critical' : 'normal' },
  { key: 'thd3', label: 'THD3 (%)', baseline: 5, unit: '%', threshold: 'spike', severity: (v: number) => v > 15 ? 'critical' : 'normal' },
  { key: 'crestFactor', label: 'Crest Factor', baseline: 1.4, unit: '', threshold: 'spike', severity: (v: number) => v > 2.0 ? 'critical' : 'normal' },
  { key: 'zcJitter', label: 'ZC Jitter (μs)', baseline: 8, unit: 'μs', threshold: 'spike', severity: (v: number) => v > 30 ? 'critical' : 'normal' },
];

const COLORS = {
  baseline: '#30B0D0',
  flagged: '#E8554E',
  anomaly: '#FF6B6B',
  normal: '#4ECDC4',
  ocsvm: '#45B7D1',
  gmm: '#96CEB4',
  meta: '#FFEAA7',
  grid: 'rgba(255,255,255,0.1)',
  text: 'rgba(255,255,255,0.75)',
};

export default function XAIDashboard() {
  const [activeTab, setActiveTab] = useState<'consumption' | 'ensemble' | 'parameters'>('consumption');
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);

  const data = useMemo(() => generateDemoData(), []);

  // Find the most anomalous point for default selection
  useEffect(() => {
    let maxIdx = 0;
    let maxScore = 0;
    data.forEach((d, i) => {
      if (d.anomalyScore > maxScore) {
        maxScore = d.anomalyScore;
        maxIdx = i;
      }
    });
    if (selectedPoint === null) {
      setSelectedPoint(maxIdx);
    }
  }, [data, selectedPoint]);

  const selectedData = selectedPoint !== null ? data[selectedPoint] : data[0];

  const textShadow = '0 2px 24px rgba(0,0,0,0.45)';

  return (
    <section
      id="dashboard"
      style={{
        position: 'relative',
        zIndex: 50,
        background: '#050A0F',
        paddingTop: '12vh',
        paddingBottom: '12vh',
        minHeight: '100vh',
      }}
    >
      {/* Section header */}
      <div style={{ padding: '0 4vw', marginBottom: '6vh' }}>
        <div
          className="font-sans-body"
          style={{
            fontSize: 10,
            letterSpacing: '0.25em',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            marginBottom: 16,
            textShadow,
          }}
        >
          XAI DECISION SUPPORT / DASHBOARD
        </div>
        <h2
          className="font-serif-display"
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 200,
            color: '#ffffff',
            letterSpacing: '0.05em',
            lineHeight: 1.2,
            margin: 0,
            marginBottom: 16,
            textShadow,
          }}
        >
          Anomaly Detection Dashboard
        </h2>
        <p
          className="font-sans-body"
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 300,
            maxWidth: 600,
            textShadow,
          }}
        >
          Real-time visualization of flagged household consumption against peer baselines,
          with meta-ensemble decision decomposition and technical parameter attribution.
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 4vw',
          marginBottom: 40,
        }}
      >
        {[
          { id: 'consumption', label: 'Consumption Deviation' },
          { id: 'ensemble', label: 'Meta-Ensemble Scores' },
          { id: 'parameters', label: 'Technical Parameters' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="font-sans-body"
            style={{
              background: activeTab === tab.id ? 'rgba(48, 176, 208, 0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${activeTab === tab.id ? 'rgba(48, 176, 208, 0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 20,
              padding: '8px 20px',
              color: activeTab === tab.id ? '#30B0D0' : 'rgba(255,255,255,0.6)',
              fontSize: 11,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Chart Area */}
      <div style={{ padding: '0 4vw' }}>
        {activeTab === 'consumption' && (
          <div>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
              }}
            >
              <div
                className="font-sans-body"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Flagged Household vs. Peer Baseline — 24-Hour Window
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.baseline} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={COLORS.baseline} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.flagged} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.flagged} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis
                    dataKey="time"
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 10 }}
                    interval={7}
                  />
                  <YAxis
                    stroke={COLORS.text}
                    tick={{ fill: COLORS.text, fontSize: 10 }}
                    label={{ value: 'kW', angle: -90, position: 'insideLeft', fill: COLORS.text, fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1520',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: COLORS.text }}
                  />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    stroke={COLORS.baseline}
                    fillOpacity={1}
                    fill="url(#colorBaseline)"
                    strokeWidth={2}
                    name="Peer Baseline"
                  />
                  <Area
                    type="monotone"
                    dataKey="flagged"
                    stroke={COLORS.flagged}
                    fillOpacity={1}
                    fill="url(#colorFlagged)"
                    strokeWidth={2}
                    name="Flagged Household"
                  />
                  {/* Anomaly highlight regions */}
                  <ReferenceLine x="08:00" stroke="rgba(255,107,107,0.3)" strokeDasharray="3 3" />
                  <ReferenceLine x="14:00" stroke="rgba(255,107,107,0.3)" strokeDasharray="3 3" />
                  <ReferenceLine x="16:00" stroke="rgba(255,107,107,0.3)" strokeDasharray="3 3" />
                  <ReferenceLine x="19:00" stroke="rgba(255,107,107,0.3)" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Anomaly bands legend */}
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  marginTop: 16,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: 'rgba(232,85,78,0.3)', borderRadius: 2 }} />
                  <span className="font-sans-body">Current Bypass Detected (08:00–14:00)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: 'rgba(232,85,78,0.3)', borderRadius: 2 }} />
                  <span className="font-sans-body">Phase Dropout (16:00–19:00)</span>
                </div>
              </div>
            </div>

            {/* Deviation bar chart */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div
                className="font-sans-body"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Deviation from Peer Baseline (Z-Score)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.filter((_, i) => i % 4 === 0)} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="time" stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} />
                  <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1520',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="deviation" name="Deviation (kW)">
                    {data.filter((_, i) => i % 4 === 0).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isAnomaly ? COLORS.flagged : COLORS.baseline}
                        fillOpacity={entry.isAnomaly ? 0.8 : 0.4}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'ensemble' && (
          <div>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
              }}
            >
              <div
                className="font-sans-body"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Meta-Ensemble Decision Decomposition
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="time" stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} interval={7} />
                  <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} domain={[0, 1]} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1520',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="ocsvmScore" stroke={COLORS.ocsvm} strokeWidth={2} dot={false} name="Base OCSVM" />
                  <Line type="monotone" dataKey="gmmScore" stroke={COLORS.gmm} strokeWidth={2} dot={false} name="Base GMM" />
                  <Line type="monotone" dataKey="anomalyScore" stroke={COLORS.meta} strokeWidth={3} dot={false} name="Meta-Ensemble (Final)" />
                  <ReferenceLine y={0.6} stroke="#E8554E" strokeDasharray="5 5" label={{ value: 'Alert Threshold', fill: '#E8554E', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Decision explanation panel */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
              }}
            >
              {[
                {
                  title: 'Base OCSVM',
                  value: selectedData?.ocsvmScore?.toFixed(3) || '0.000',
                  status: (selectedData?.ocsvmScore || 0) > 0.6 ? 'SUSPICIOUS' : 'NORMAL',
                  desc: 'Tight RBF boundary around normal consumption manifolds.',
                  color: COLORS.ocsvm,
                },
                {
                  title: 'Base GMM',
                  value: selectedData?.gmmScore?.toFixed(3) || '0.000',
                  status: (selectedData?.gmmScore || 0) > 0.6 ? 'SUSPICIOUS' : 'NORMAL',
                  desc: '12-component mixture modeling diurnal load modes.',
                  color: COLORS.gmm,
                },
                {
                  title: 'Meta-OCSVM Fusion',
                  value: selectedData?.anomalyScore?.toFixed(3) || '0.000',
                  status: (selectedData?.anomalyScore || 0) > 0.6 ? 'ANOMALY' : 'NORMAL',
                  desc: 'Linear fusion layer flags suspicious score-space disagreement.',
                  color: COLORS.meta,
                },
              ].map((card) => (
                <div
                  key={card.title}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${card.status === 'ANOMALY' || card.status === 'SUSPICIOUS' ? 'rgba(232,85,78,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div
                    className="font-sans-body"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      marginBottom: 8,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 300,
                      color: card.status === 'ANOMALY' ? '#E8554E' : card.status === 'SUSPICIOUS' ? '#FFB347' : '#4ECDC4',
                      marginBottom: 4,
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    className="font-sans-body"
                    style={{
                      fontSize: 10,
                      color: card.status === 'ANOMALY' ? '#E8554E' : card.status === 'SUSPICIOUS' ? '#FFB347' : '#4ECDC4',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    {card.status}
                  </div>
                  <p
                    className="font-sans-body"
                    style={{
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: 'rgba(255,255,255,0.55)',
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'parameters' && (
          <div>
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 32,
              }}
            >
              <div
                className="font-sans-body"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                Technical Parameter Timeline
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                  <XAxis dataKey="time" stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} interval={7} />
                  <YAxis stroke={COLORS.text} tick={{ fill: COLORS.text, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0a1520',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="stepAfter" dataKey="rmsI1" stroke="#45B7D1" strokeWidth={2} dot={false} name="L1 Current (A)" />
                  <Line type="stepAfter" dataKey="powerFactor" stroke="#96CEB4" strokeWidth={2} dot={false} name="Power Factor" />
                  <Line type="stepAfter" dataKey="thd3" stroke="#FFEAA7" strokeWidth={2} dot={false} name="THD3 (%)" />
                  <Line type="stepAfter" dataKey="crestFactor" stroke="#DDA0DD" strokeWidth={2} dot={false} name="Crest Factor" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Parameter Alert Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 16,
              }}
            >
              {alertConfig.map((alert) => {
                const currentVal = selectedData[alert.key as keyof typeof selectedData] as number;
                const isCritical = alert.severity(currentVal) === 'critical';
                const deviation = alert.threshold === 'drop'
                  ? ((alert.baseline - currentVal) / alert.baseline * 100)
                  : ((currentVal - alert.baseline) / alert.baseline * 100);

                return (
                  <div
                    key={alert.key}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isCritical ? 'rgba(232,85,78,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 12,
                      padding: 20,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <span
                        className="font-sans-body"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.2em',
                          color: 'rgba(255,255,255,0.5)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {alert.label}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: isCritical ? 'rgba(232,85,78,0.2)' : 'rgba(78,205,196,0.15)',
                          color: isCritical ? '#E8554E' : '#4ECDC4',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {isCritical ? 'ALERT' : 'NORMAL'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 32,
                          fontWeight: 300,
                          color: isCritical ? '#E8554E' : '#ffffff',
                        }}
                      >
                        {currentVal?.toFixed(2)}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {alert.unit}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>Baseline: {alert.baseline}{alert.unit}</span>
                      <span style={{ color: isCritical ? '#E8554E' : '#4ECDC4' }}>
                        {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
                      </span>
                    </div>

                    {isCritical && (
                      <div
                        className="font-sans-body"
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid rgba(232,85,78,0.2)',
                          fontSize: 11,
                          lineHeight: 1.6,
                          color: '#E8554E',
                        }}
                      >
                        {alert.key === 'rmsI1' && 'L1 current dropped 73% below baseline — consistent with bypass shunt installation.'}
                        {alert.key === 'rmsV1' && 'V1 sag detected at 198V (expected 230V ± 5%) — phase dropout signature.'}
                        {alert.key === 'powerFactor' && 'PF degraded to 0.42 (baseline 0.95) — SMPS load or inverter backfeed.'}
                        {alert.key === 'thd3' && 'THD3 spike to 28% (baseline 5%) — nonlinear shunt or rectifier injection.'}
                        {alert.key === 'crestFactor' && 'Crest factor 2.8 (expected 1.4 ± 0.2) — impulsive tamper waveform.'}
                        {alert.key === 'zcJitter' && 'Zero-crossing jitter 45 μs (baseline 8 μs) — phase instability detected.'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected timestamp info */}
            <div
              style={{
                marginTop: 24,
                padding: 16,
                background: 'rgba(48, 176, 208, 0.08)',
                border: '1px solid rgba(48, 176, 208, 0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              <span className="font-sans-body" style={{ letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: 10, color: '#30B0D0' }}>
                Dashboard Note
              </span>
              <p className="font-sans-body" style={{ margin: '8px 0 0', lineHeight: 1.6 }}>
                This dashboard operates as a <strong>read-only decision-support layer</strong>. All anomaly alerts are dispatched to the operator queue for human verification before any field action. No write-back to SCADA, AMI head-end, or billing systems occurs.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
