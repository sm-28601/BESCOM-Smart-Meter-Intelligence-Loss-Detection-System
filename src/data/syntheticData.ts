// Synthetic data for the BESCOM Smart Meter Intelligence Dashboard

export interface AnomalyRecord {
  id: string;
  meterId: string;
  zone: string;
  pinCode: string;
  alertType: string;
  confidenceScore: number;
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'pending' | 'investigating' | 'resolved';
}

export interface ConsumptionDataPoint {
  hour: string;
  householdConsumption: number;
  peerBaseline: number;
  anomaly?: boolean;
}

export interface MeterDetail {
  meterId: string;
  consumerName: string;
  address: string;
  zone: string;
  pinCode: string;
  meterType: string;
  installationDate: string;
  lastReading: string;
  accountNumber: string;
  sanctionedLoad: string;
  consumptionData: ConsumptionDataPoint[];
  alertHistory: {
    date: string;
    type: string;
    resolved: boolean;
  }[];
}

// ── KPI Summary Data ──
export const kpiData = {
  totalActiveMeters: 2_47_832,
  gridLoadRisk: 'Normal' as 'Normal' | 'High' | 'Critical',
  pendingAlerts: 43,
};

// ── Anomaly Feed Data ──
export const anomalyFeed: AnomalyRecord[] = [
  {
    id: 'ANM-001',
    meterId: 'BLR-SM-045892',
    zone: 'Jayanagar',
    pinCode: '560041',
    alertType: 'Phase Current Drop',
    confidenceScore: 94.2,
    timestamp: '2026-04-25T17:42:00',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'ANM-002',
    meterId: 'BLR-SM-031476',
    zone: 'Koramangala',
    pinCode: '560034',
    alertType: 'Bypass Suspected',
    confidenceScore: 91.8,
    timestamp: '2026-04-25T17:38:00',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'ANM-003',
    meterId: 'BLR-SM-078234',
    zone: 'Whitefield',
    pinCode: '560066',
    alertType: 'Neutral Disturbance',
    confidenceScore: 87.5,
    timestamp: '2026-04-25T17:31:00',
    severity: 'warning',
    status: 'pending',
  },
  {
    id: 'ANM-004',
    meterId: 'BLR-SM-012965',
    zone: 'Indiranagar',
    pinCode: '560038',
    alertType: 'Load Mismatch',
    confidenceScore: 85.1,
    timestamp: '2026-04-25T17:25:00',
    severity: 'warning',
    status: 'investigating',
  },
  {
    id: 'ANM-005',
    meterId: 'BLR-SM-056341',
    zone: 'Rajajinagar',
    pinCode: '560010',
    alertType: 'Phase Current Drop',
    confidenceScore: 82.7,
    timestamp: '2026-04-25T17:18:00',
    severity: 'warning',
    status: 'pending',
  },
  {
    id: 'ANM-006',
    meterId: 'BLR-SM-089127',
    zone: 'Malleswaram',
    pinCode: '560003',
    alertType: 'Bypass Suspected',
    confidenceScore: 79.3,
    timestamp: '2026-04-25T17:12:00',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'ANM-007',
    meterId: 'BLR-SM-034518',
    zone: 'Basavanagudi',
    pinCode: '560004',
    alertType: 'CT Ratio Anomaly',
    confidenceScore: 76.9,
    timestamp: '2026-04-25T17:05:00',
    severity: 'warning',
    status: 'pending',
  },
  {
    id: 'ANM-008',
    meterId: 'BLR-SM-067892',
    zone: 'HSR Layout',
    pinCode: '560102',
    alertType: 'Load Mismatch',
    confidenceScore: 74.1,
    timestamp: '2026-04-25T16:58:00',
    severity: 'warning',
    status: 'investigating',
  },
  {
    id: 'ANM-009',
    meterId: 'BLR-SM-023456',
    zone: 'Electronic City',
    pinCode: '560100',
    alertType: 'Phase Current Drop',
    confidenceScore: 71.6,
    timestamp: '2026-04-25T16:50:00',
    severity: 'warning',
    status: 'pending',
  },
  {
    id: 'ANM-010',
    meterId: 'BLR-SM-091234',
    zone: 'BTM Layout',
    pinCode: '560076',
    alertType: 'Neutral Disturbance',
    confidenceScore: 68.4,
    timestamp: '2026-04-25T16:42:00',
    severity: 'info',
    status: 'pending',
  },
  {
    id: 'ANM-011',
    meterId: 'BLR-SM-045123',
    zone: 'Banashankari',
    pinCode: '560070',
    alertType: 'Bypass Suspected',
    confidenceScore: 92.3,
    timestamp: '2026-04-25T16:35:00',
    severity: 'critical',
    status: 'pending',
  },
  {
    id: 'ANM-012',
    meterId: 'BLR-SM-078901',
    zone: 'Yelahanka',
    pinCode: '560064',
    alertType: 'CT Ratio Anomaly',
    confidenceScore: 65.8,
    timestamp: '2026-04-25T16:28:00',
    severity: 'info',
    status: 'resolved',
  },
];

// ── Generate 24h Consumption Data for a meter ──
function generateConsumptionData(anomalyHour: number): ConsumptionDataPoint[] {
  const data: ConsumptionDataPoint[] = [];
  for (let h = 0; h < 24; h++) {
    const hourStr = `${h.toString().padStart(2, '0')}:00`;
    // Peer baseline follows a typical residential pattern
    let baseline: number;
    if (h >= 0 && h < 6) baseline = 0.8 + Math.random() * 0.3;
    else if (h >= 6 && h < 9) baseline = 1.8 + Math.random() * 0.5;
    else if (h >= 9 && h < 17) baseline = 1.2 + Math.random() * 0.4;
    else if (h >= 17 && h < 22) baseline = 2.2 + Math.random() * 0.6;
    else baseline = 1.0 + Math.random() * 0.3;

    let consumption: number;
    if (h === anomalyHour) {
      // Sudden drop — anomaly point
      consumption = baseline * 0.15 + Math.random() * 0.1;
    } else if (h === anomalyHour + 1) {
      consumption = baseline * 0.3 + Math.random() * 0.15;
    } else {
      consumption = baseline + (Math.random() - 0.5) * 0.4;
    }

    data.push({
      hour: hourStr,
      householdConsumption: Math.round(consumption * 100) / 100,
      peerBaseline: Math.round(baseline * 100) / 100,
      anomaly: h === anomalyHour,
    });
  }
  return data;
}

// ── Meter Detail Map ──
export const meterDetails: Record<string, MeterDetail> = {
  'BLR-SM-045892': {
    meterId: 'BLR-SM-045892',
    consumerName: 'Rajesh Kumar Sharma',
    address: '42, 4th Cross, 9th Main, Jayanagar 4th Block, Bangalore',
    zone: 'Jayanagar',
    pinCode: '560041',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2024-08-15',
    lastReading: '2026-04-25T17:30:00',
    accountNumber: 'BESCOM-JN-2024-045892',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(14),
    alertHistory: [
      { date: '2026-04-25', type: 'Phase Current Drop', resolved: false },
      { date: '2026-04-18', type: 'Load Mismatch', resolved: true },
    ],
  },
  'BLR-SM-031476': {
    meterId: 'BLR-SM-031476',
    consumerName: 'Priya Venkatesh',
    address: '15, 1st Floor, 80 Feet Road, Koramangala 6th Block, Bangalore',
    zone: 'Koramangala',
    pinCode: '560034',
    meterType: 'Three Phase – Smart (RF)',
    installationDate: '2024-06-20',
    lastReading: '2026-04-25T17:28:00',
    accountNumber: 'BESCOM-KR-2024-031476',
    sanctionedLoad: '5 kW',
    consumptionData: generateConsumptionData(11),
    alertHistory: [
      { date: '2026-04-25', type: 'Bypass Suspected', resolved: false },
      { date: '2026-04-10', type: 'Bypass Suspected', resolved: true },
      { date: '2026-03-22', type: 'CT Ratio Anomaly', resolved: true },
    ],
  },
  'BLR-SM-078234': {
    meterId: 'BLR-SM-078234',
    consumerName: 'Mohammed Farhan',
    address: '203, Palm Grove Apartments, ITPL Road, Whitefield, Bangalore',
    zone: 'Whitefield',
    pinCode: '560066',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2025-01-10',
    lastReading: '2026-04-25T17:22:00',
    accountNumber: 'BESCOM-WF-2025-078234',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(16),
    alertHistory: [
      { date: '2026-04-25', type: 'Neutral Disturbance', resolved: false },
    ],
  },
  'BLR-SM-012965': {
    meterId: 'BLR-SM-012965',
    consumerName: 'Anitha Deshpande',
    address: '78, Defence Colony, 12th Main, Indiranagar, Bangalore',
    zone: 'Indiranagar',
    pinCode: '560038',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2024-11-05',
    lastReading: '2026-04-25T17:15:00',
    accountNumber: 'BESCOM-IN-2024-012965',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(9),
    alertHistory: [
      { date: '2026-04-25', type: 'Load Mismatch', resolved: false },
      { date: '2026-04-02', type: 'Phase Current Drop', resolved: true },
    ],
  },
  'BLR-SM-056341': {
    meterId: 'BLR-SM-056341',
    consumerName: 'Suresh Babu',
    address: '12, Navrang Theatre Road, Rajajinagar 2nd Block, Bangalore',
    zone: 'Rajajinagar',
    pinCode: '560010',
    meterType: 'Three Phase – Smart (RF)',
    installationDate: '2024-09-18',
    lastReading: '2026-04-25T17:10:00',
    accountNumber: 'BESCOM-RJ-2024-056341',
    sanctionedLoad: '5 kW',
    consumptionData: generateConsumptionData(13),
    alertHistory: [
      { date: '2026-04-25', type: 'Phase Current Drop', resolved: false },
    ],
  },
  'BLR-SM-089127': {
    meterId: 'BLR-SM-089127',
    consumerName: 'Lakshmi Narayan',
    address: '55, 15th Cross, Sampige Road, Malleswaram, Bangalore',
    zone: 'Malleswaram',
    pinCode: '560003',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2024-07-22',
    lastReading: '2026-04-25T17:05:00',
    accountNumber: 'BESCOM-ML-2024-089127',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(10),
    alertHistory: [
      { date: '2026-04-25', type: 'Bypass Suspected', resolved: false },
      { date: '2026-03-15', type: 'Phase Current Drop', resolved: true },
    ],
  },
  'BLR-SM-034518': {
    meterId: 'BLR-SM-034518',
    consumerName: 'Ganesh Iyengar',
    address: '31, Bull Temple Road, Basavanagudi, Bangalore',
    zone: 'Basavanagudi',
    pinCode: '560004',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2025-02-14',
    lastReading: '2026-04-25T16:58:00',
    accountNumber: 'BESCOM-BG-2025-034518',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(15),
    alertHistory: [
      { date: '2026-04-25', type: 'CT Ratio Anomaly', resolved: false },
    ],
  },
  'BLR-SM-067892': {
    meterId: 'BLR-SM-067892',
    consumerName: 'Deepa Srinivasan',
    address: '402, Mantri Elegance, 27th Main, HSR Layout, Bangalore',
    zone: 'HSR Layout',
    pinCode: '560102',
    meterType: 'Three Phase – Smart (RF)',
    installationDate: '2024-12-01',
    lastReading: '2026-04-25T16:50:00',
    accountNumber: 'BESCOM-HSR-2024-067892',
    sanctionedLoad: '5 kW',
    consumptionData: generateConsumptionData(12),
    alertHistory: [
      { date: '2026-04-25', type: 'Load Mismatch', resolved: false },
    ],
  },
  'BLR-SM-023456': {
    meterId: 'BLR-SM-023456',
    consumerName: 'Vikram Hegde',
    address: '18, Phase 1, Electronic City, Bangalore',
    zone: 'Electronic City',
    pinCode: '560100',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2025-03-20',
    lastReading: '2026-04-25T16:42:00',
    accountNumber: 'BESCOM-EC-2025-023456',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(17),
    alertHistory: [
      { date: '2026-04-25', type: 'Phase Current Drop', resolved: false },
    ],
  },
  'BLR-SM-091234': {
    meterId: 'BLR-SM-091234',
    consumerName: 'Fatima Begum',
    address: '67, 16th Main, BTM Layout 2nd Stage, Bangalore',
    zone: 'BTM Layout',
    pinCode: '560076',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2024-10-30',
    lastReading: '2026-04-25T16:35:00',
    accountNumber: 'BESCOM-BTM-2024-091234',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(18),
    alertHistory: [
      { date: '2026-04-25', type: 'Neutral Disturbance', resolved: false },
    ],
  },
  'BLR-SM-045123': {
    meterId: 'BLR-SM-045123',
    consumerName: 'Karthik Rajan',
    address: '29, Ideal Homes Colony, Banashankari 3rd Stage, Bangalore',
    zone: 'Banashankari',
    pinCode: '560070',
    meterType: 'Three Phase – Smart (RF)',
    installationDate: '2024-05-11',
    lastReading: '2026-04-25T16:28:00',
    accountNumber: 'BESCOM-BN-2024-045123',
    sanctionedLoad: '5 kW',
    consumptionData: generateConsumptionData(8),
    alertHistory: [
      { date: '2026-04-25', type: 'Bypass Suspected', resolved: false },
      { date: '2026-03-30', type: 'Load Mismatch', resolved: true },
      { date: '2026-03-10', type: 'Bypass Suspected', resolved: true },
    ],
  },
  'BLR-SM-078901': {
    meterId: 'BLR-SM-078901',
    consumerName: 'Nagamma Devaiah',
    address: '14, Attur Layout, Yelahanka New Town, Bangalore',
    zone: 'Yelahanka',
    pinCode: '560064',
    meterType: 'Single Phase – Smart (RF)',
    installationDate: '2025-04-02',
    lastReading: '2026-04-25T16:20:00',
    accountNumber: 'BESCOM-YK-2025-078901',
    sanctionedLoad: '3 kW',
    consumptionData: generateConsumptionData(19),
    alertHistory: [
      { date: '2026-04-25', type: 'CT Ratio Anomaly', resolved: true },
    ],
  },
};

// Navigation items
export const navItems = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'anomaly-feed', label: 'Live Anomaly Feed', icon: 'alert-triangle' },
  { id: 'demand-forecasting', label: 'Demand Forecasting', icon: 'trending-up' },
  { id: 'audit-logs', label: 'Audit Logs', icon: 'file-text' },
] as const;

export type NavId = (typeof navItems)[number]['id'];
