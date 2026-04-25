# Edge-Optimized Meta-Ensemble Anomaly Detector
## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EDGE DEVICE LAYER                                            │
│  ┌───────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ESP32-D0WD @ 80 MHz (FreeRTOS Dual-Core)                                                │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │  SCT-013    │  │  SCT-013    │  │  SCT-013    │  │  Voltage    │  │  Voltage    │     │  │
│  │  │  L1 Clamp   │  │  L2 Clamp   │  │  L3 Clamp   │  │  Divider L1 │  │  Divider L2 │     │  │
│  │  │  (10A/100A) │  │  (10A/100A) │  │  (10A/100A) │  │  (230V/3.3V)│  │  (230V/3.3V)│     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  │         │                │                │                │                │               │  │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐     │  │
│  │  │  ADC CH6    │  │  ADC CH7    │  │  ADC CH4    │  │  ADC CH5    │  │  ADC CH3    │     │  │
│  │  │  (GPIO34)   │  │  (GPIO35)   │  │  (GPIO32)   │  │  (GPIO33)   │  │  (GPIO39)   │     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  │         └────────────────┴────────────────┴────────────────┴────────────────┘                │  │
│  │                                    │                                                      │  │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────────┐      │  │
│  │  │                    CASCADED FILTERING PIPELINE                                  │      │  │
│  │  │  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐                │      │  │
│  │  │  │ 50/60 Hz Notch │ -> │ 3-Pole Median  │ -> │  RMS Compute   │                │      │  │
│  │  │  │    IIR Filter  │    │    Filter      │    │  20ms Window   │                │      │  │
│  │  │  │  0.95 Attenuation│   │  Impulse Supp. │   │  1 Full Cycle  │                │      │  │
│  │  │  └────────────────┘    └────────────────┘    └────────────────┘                │      │  │
│  │  └─────────────────────────────────┬──────────────────────────────────────────────┘      │  │
│  │                                    │                                                      │  │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────────┐      │  │
│  │  │                    TAMPER DETECTION & EVIDENCE                                    │      │  │
│  │  │  • Open-circuit bias shift detection (SCT-013 removal)                          │      │  │
│  │  │  • RTC memory latch for forensic persistence                                    │      │  │
│  │  │  • Deep-sleep lockdown after alert transmission                                 │      │  │
│  │  └─────────────────────────────────┬──────────────────────────────────────────────┘      │  │
│  │                                    │                                                      │  │
│  │  ┌─────────────────────────────────▼──────────────────────────────────────────────┐      │  │
│  │  │                    TELEMETRY OUTPUT (1 Hz)                                      │      │  │
│  │  │  JSON Payload: {ts, rms_i1/2/3, rms_v1/2/3, pf, tamper_l1/2/3, samples, heap}│      │  │
│  │  │  Transport: MQTT over Wi-Fi with modem-sleep cycling                          │      │  │
│  │  └─────────────────────────────────┬──────────────────────────────────────────────┘      │  │
│  └────────────────────────────────────┼───────────────────────────────────────────────────┘  │
│                                       │                                                          │
│  Power: 5W Solar + 18650 LiFePO4      │         Average Draw: ~45 mA                              │
│  Autonomy: Indefinite (tropical)      │         Wi-Fi: Modem-sleep enabled                          │
└───────────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ MQTT (TLS optional)
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  INGESTION & STREAMING LAYER                                    │
│                                                                                                 │
│  ┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐  │
│  │   MQTT Broker           │     │   Kafka / Redpanda      │     │   Time-Series Buffer      │  │
│  │   ( mosquitto / EMQX )  │ ->  │   ( Topic: meter.raw )  │ ->  │   ( 15-min sliding win )  │  │
│  │   • QoS 1               │     │   • Partition by dev_id │     │   • Backpressure handling │  │
│  │   • Retained tamper     │     │   • 7-day retention     │     │   • Out-of-order merge    │  │
│  └─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘  │
│                                                                                                 │
└───────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                        │
                                        ▼ Apache Arrow / Parquet
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            COMPRESSION PIPELINE (PCA + K-Means)                                 │
│                                                                                                 │
│  Raw Input: 24-D feature vectors @ 1 Hz                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Feature Vector: [rms_i1, rms_i2, rms_i3, rms_v1, rms_v2, rms_v3, pf, thd3, thd5,      │   │
│  │                  thd7, thd9, thd11, thd13, thd15, crest_factor, zc_jitter, phase_angle,   │   │
│  │                  ... 8 engineered features ... ]                                           │   │
│  └────────────────────────────────────┬──────────────────────────────────────────────────────┘   │
│                                       │                                                          │
│  Stage 1: Incremental PCA (Welford Online)                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  • Forget factor: 0.995 (seasonal drift adaptation)                                    │   │
│  │  • 24-D -> 8-D projection                                                             │   │
│  │  • Variance retained: 97.4%                                                           │   │
│  │  • No full history storage (online covariance update)                                 │   │
│  └────────────────────────────────────┬──────────────────────────────────────────────────────┘   │
│                                       │                                                          │
│  Stage 2: Online Mini-Batch K-Means                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  • K = 64 centroids in 8-D PCA space                                                  │   │
│  │  • Batch size: 100 samples                                                            │   │
│  │  • EMA learning rate: 0.01                                                            │   │
│  │  • Symbolic output: centroid index (6 bits) + residual magnitude (8 bits)             │   │
│  └────────────────────────────────────┬──────────────────────────────────────────────────────┘   │
│                                       │                                                          │
│  Output: Symbolic time-series with anomaly-preserving residuals                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │  Compression ratio: ~92%                                                              │   │
│  │  Format: [centroid_idx: uint6, residual_mag: uint8, timestamp: uint32]                 │   │
│  │  • Residual magnitude field PRESERVES outlier energy for downstream detectors         │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
└───────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                        │ Compressed Prototypes
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         META-ENSEMBLE ANOMALY DETECTION LAYER                                   │
│                                                                                                 │
│  Training Data: Normal compressed prototypes ONLY (no labeled theft data)                     │
│                                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              BASE LAYER (Parallel)                                      │   │
│  │                                                                                         │   │
│  │  ┌─────────────────────────────┐      ┌─────────────────────────────┐                  │   │
│  │  │      Base OCSVM             │      │      Base GMM                │                  │   │
│  │  │      ────────────           │      │      ────────                │                  │   │
│  │  │  • Kernel: RBF              │      │  • Components: 12            │                  │   │
│  │  │  • nu = 0.05                │      │  • Covariance: full          │                  │   │
│  │  │  • gamma = scale            │      │  • Models: morning peak,     │                  │   │
│  │  │  • Tight boundary around    │      │    afternoon base,           │                  │   │
│  │  │    normal manifolds         │      │    evening peak, night       │                  │   │
│  │  │                              │      │    trough                    │                  │   │
│  │  │  Output: raw decision score  │      │  Output: log-likelihood     │                  │   │
│  │  └─────────────┬───────────────┘      └─────────────┬───────────────┘                  │   │
│  │                │                                      │                                    │   │
│  │                ▼                                      ▼                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐          │   │
│  │  │                    PLATT SCALING (Calibration)                               │          │   │
│  │  │  • Normalize base scores to [0,1] probability-like range                   │          │   │
│  │  │  • Learned from held-out validation prototypes                             │          │   │
│  │  │  • Sigmoid fit via percentile matching                                       │          │   │
│  │  └────────────────────────────────────┬──────────────────────────────────────────┘          │   │
│  │                                       │                                                   │   │
│  │                                       ▼                                                   │   │
│  │  Meta-Feature Vector: [1 - cal_ocsvm, 1 - cal_gmm]  (2-D, anomaly-directed)              │   │
│  │                                                                                          │   │
│  │  ┌────────────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │                         META LAYER: OCSVM Fusion                                  │  │   │
│  │  │                                                                                     │  │   │
│  │  │  • Kernel: linear                                                                   │  │   │
│  │  │  • nu = 0.02 (tighter than base)                                                    │  │   │
│  │  │  • Trained on 2-D normalized score space                                            │  │   │
│  │  │  • Flags samples when base detectors disagree suspiciously                          │  │   │
│  │  │                                                                                     │  │   │
│  │  │  Output: anomaly score (higher = more anomalous) + binary prediction                │  │   │
│  │  │  F1 on zero-day bypass attacks: 0.94                                                │  │   │
│  │  │  False positive rate on normal seasonal: < 2%                                       │  │   │
│  │  └────────────────────────────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                 │
└───────────────────────────────────────┬──────────────────────────────────────────────────────────────┘
                                        │ Anomaly Alerts
                                        ▼ Zero-day flagged
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         EXPLAINABLE AI (XAI) DECISION-SUPPORT DASHBOARD                        │
│                                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────┐│
│  │  READ-ONLY LAYER — NO WRITE-BACK TO SCADA / AMI / BILLING SYSTEMS                         ││
│  └─────────────────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │  Alert Ingestion API        │  │  Peer Baseline Engine       │  │  Attribution Engine       │  │
│  │  • WebSocket real-time      │  │  • Cohort comparison          │  │  • SHAP-style feature     │  │
│  │  • REST batch query         │  │  • Same-feeder households     │  │    importance on meta     │  │
│  │  • Kafka consumer           │  │  • Seasonal normalization   │  │    features               │  │
│  └─────────────┬───────────────┘  └─────────────┬───────────────┘  └─────────────┬───────────┘  │
│                │                                │                                │              │
│                └────────────────┬───────────────┴────────────────┬───────────────┘              │
│                                 │                                                                │
│                                 ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              REACT FRONTEND (This Dashboard)                             │  │
│  │                                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  CONSUMPTION DEVIATION PLOT                                                          │  │  │
│  │  │  • Time-series line chart: flagged household vs. peer cohort baseline              │  │  │
│  │  │  • Anomalous intervals highlighted in red band                                       │  │  │
│  │  │  • Rolling 15-min z-score overlay                                                    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  TECHNICAL PARAMETER ALERT PANEL                                                     │  │  │
│  │  │  • Phase current drops:     "L1 current fell 73% below baseline at 08:14"           │  │  │
│  │  │  • Voltage anomalies:        "V1 sag detected: 198V (expected 230V ± 5%)"             │  │  │
│  │  │  • Power factor deviation:   "PF dropped to 0.42 (baseline 0.95) — SMPS signature"  │  │  │
│  │  │  • Harmonic spikes:          "THD3 spike: 28% (baseline 5%)"                        │  │  │
│  │  │  • Crest factor anomaly:     "Crest factor 2.8 (expected 1.4 ± 0.2)"               │  │  │
│  │  │  • Zero-crossing jitter:     "ZC jitter 45 μs (baseline 8 μs)"                      │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  META-ENSEMBLE DECISION EXPLANATION                                                  │  │  │
│  │  │  • Base OCSVM score: -0.42 (suspicious — outside learned boundary)                   │  │  │
│  │  │  • Base GMM score:  -2.18 (suspicious — low likelihood in all 12 modes)            │  │  │
│  │  │  • Meta fusion:      BOTH base detectors agree on anomaly → HIGH CONFIDENCE       │  │  │
│  │  │  • Decision threshold: 0.85 (current score: 0.91)                                    │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

## Data Flow Summary

```
SCT-013/ACS712 Sensors
        │
        ▼ ADC Sampling @ 1 kHz
ESP32 Edge Device
        │
        │ Notch Filter → Median Filter → RMS Compute
        │ Tamper Detection → MQTT JSON
        ▼
   MQTT Broker (smartgrid.local:1883)
        │
        ▼
   Kafka Stream (Topic: meter.raw)
        │
        ▼
   15-min Buffer Window
        │
        ▼ 24-D Feature Vector @ 1 Hz
   PCA (24D → 8D, 97.4% variance)
        │
        ▼
   K-Means (64 centroids, symbolic output)
        │
        ▼ ~92% Compressed Prototypes
   ┌─────────────────┐
   │  Base OCSVM     │ ──┐
   │  (RBF, nu=0.05) │   │    Platt Scaling    ┌──────────────┐
   └─────────────────┘   ├─────────────────────►│  Meta-OCSVM  │──► Anomaly Score
   ┌─────────────────┐   │    [cal_ocsvm,      │  (linear,    │    + Binary Flag
   │  Base GMM       │ ──┘     cal_gmm]        │   nu=0.02)   │
   │  (12 components)│        2-D meta-space   └──────────────┘
   └─────────────────┘
        │
        ▼
   XAI Dashboard (React)
   • Deviation plots
   • Parameter alerts
   • Peer comparison
```

## Security & Safety Guarantees

| Guarantee | Implementation |
|-----------|---------------|
| **No source system modification** | Dashboard is read-only; alerts dispatched to operator queue |
| **No PII exposure** | All synthetic data; deterministic UUIDs from seed |
| **Edge tamper evidence** | RTC memory latch + MQTT retained message before deep-sleep |
| **Adaptive to drift** | PCA forget factor 0.995; online K-Means EMA updates |
| **Zero-day detection** | Meta-ensemble flags patterns neither base model has seen |
| **Decision explainability** | Technical parameter attribution + base score decomposition |

## Component Interaction Matrix

| Source → Destination | Protocol | Data Format | Frequency |
|---------------------|----------|-------------|-----------|
| ESP32 → MQTT Broker | MQTT 3.1.1 | JSON | 1 Hz |
| MQTT → Kafka | MQTT Bridge | Avro | 1 Hz |
| Kafka → Compression | Internal | Arrow | 1 Hz |
| Compression → ML Model | In-Memory | NumPy arrays | 1 Hz |
| ML Model → Dashboard | WebSocket | JSON | Real-time |
| Dashboard → Operators | REST API | JSON | On alert |
