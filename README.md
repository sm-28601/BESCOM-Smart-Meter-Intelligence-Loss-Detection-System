# BESCOM Smart Meter Intelligence & Loss Detection System

![BESCOM Smart Meter Dashboard Feature Image](https://github.com/sm-28601/BESCOM-Smart-Meter-Intelligence-Loss-Detection-System/raw/main/public/demo-assets/screenshot.png) *(Note: Please add screenshot to public/demo-assets/screenshot.png)*

A comprehensive web-based intelligence dashboard developed for the Bangalore Electricity Supply Company (BESCOM). The platform is designed to monitor smart meter data in real-time to detect anomalies, identify potential power theft or meter tampering, and track grid load risks. 

It features an edge-optimized live anomaly feed, an interactive investigation view that compares household consumption against peer baselines, an audit logging system, and a robust demand forecasting module equipped with predictive load curves and zone-wise distributions.

## Core Features

- **Live Anomaly Feed**: Edge-optimized paginated feed with confidence scores and alert severities.
- **Interactive Consumption Analysis**: Click-to-investigate workflow providing an in-depth Recharts line chart comparing household consumption to peer baseline (zone average) over 24 hours. The exact point of anomaly is explicitly highlighted.
- **Resizable Panels**: Adjustable dual-column interface dividing the data feed and investigation view using `react-resizable-panels`.
- **Demand Forecasting**: Hourly and weekly load predictions leveraging STLF (Short Term Load Forecast) utilizing Synthetic ML/Deep Learning outputs. Features peak and average visualization alongside model accuracy (MAPE, RMSE).
- **UX4G Government Compliance**: Sober "government navy" UI, minimalistic animations, scalable typographies (Inter + Roboto Mono), and accessible layout standards without gamified interfaces.
- **Audit Logging**: Robust tracking of system operations, alerts resolved, and field inspections initiated.

## Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS (Custom extended UI palette including BESCOM navy, neutral grays, and alert colors)
- **Charts & Vis**: Recharts
- **Components**: `react-resizable-panels` for responsive investigation views 

## Quick Start (Local Development)

### Prerequisites

- Node.js `^20.0.0` or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sm-28601/BESCOM-Smart-Meter-Intelligence-Loss-Detection-System.git
   cd BESCOM-Smart-Meter-Intelligence-Loss-Detection-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The application will be available at `http://localhost:5173/`

### Production Build

To compile the application for production deployment:

```bash
npm run build
npm run preview
```

## Synthetic Data

The current iteration of the system is pre-loaded with synthetic operational data representing a selection of BESCOM jurisdictions (Jayanagar, Koramangala, Whitefield, etc.). The simulated data files can be accessed at `src/data/syntheticData.ts`. It securely models edge alerts such as _"Phase Current Drop"_, _"Bypass Suspected"_, and _"Neutral Disturbance"_. 

## License

This project is tailored for governmental digital infrastructure demonstrations. Standard copyright restrictions may apply depending on usage and integration protocols.
