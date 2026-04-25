export interface SiteConfig {
  language: string
  siteTitle: string
  siteDescription: string
}

export interface NavLink {
  label: string
  targetId: string
}

export interface NavigationConfig {
  brandMark: string
  links: NavLink[]
}

export interface HeroConfig {
  wordmarkText: string
  eyebrow: string
  titleLine1: string
  titleLine2: string
  descriptionLine1: string
  descriptionLine2: string
  ctaText: string
  ctaTargetId: string
}

export interface PhilosophyConfig {
  eyebrow: string
  title: string
  body: string
  rollingWords: string[]
}

export interface ProjectMeta {
  label: string
  value: string
}

export interface ProjectData {
  id: string
  title: string
  location: string
  year: string
  image: string
  subtitle: string
  meta: ProjectMeta[]
  paragraphs: string[]
}

export interface GalleryConfig {
  sectionLabel: string
  title: string
  projects: ProjectData[]
}

export interface MediumItem {
  cn: string
  en: string
  description: string
}

export interface MediumsConfig {
  sectionLabel: string
  items: MediumItem[]
}

export interface FooterEntry {
  text: string
  href?: string
}

export interface FooterColumn {
  heading: string
  entries: FooterEntry[]
}

export interface FooterConfig {
  visionText: string
  brandName: string
  columns: FooterColumn[]
  copyright: string
  videoPath: string
}

export interface ProjectDetailConfig {
  backLabel: string
}

export const siteConfig: SiteConfig = {
  language: "en",
  siteTitle: "Edge Meta-Ensemble Detector",
  siteDescription: "Edge-Optimized Meta-Ensemble Anomaly Detector for smart grid intelligence - detecting electricity theft, meter tampering, and demand spikes using high-frequency smart meter data.",
}

export const navigationConfig: NavigationConfig = {
  brandMark: "EM",
  links: [
    { label: "Architecture", targetId: "hero-section" },
    { label: "Pipeline", targetId: "philosophy" },
    { label: "Components", targetId: "gallery" },
    { label: "Specs", targetId: "mediums" },
    { label: "Dashboard", targetId: "dashboard" },
  ],
}

export const heroConfig: HeroConfig = {
  wordmarkText: "EDGE META-ENSEMBLE",
  eyebrow: "SMART GRID INTELLIGENCE",
  titleLine1: "Anomaly Detection",
  titleLine2: "at the Edge",
  descriptionLine1: "A decision-support layer that identifies electricity theft, meter tampering, and localized demand spikes using high-frequency smart meter data — without modifying existing utility source systems.",
  descriptionLine2: "PCA-KMeans compression, OCSVM-GMM meta-ensemble, and real-time XAI dashboard.",
  ctaText: "EXPLORE SYSTEM",
  ctaTargetId: "philosophy",
}

export const philosophyConfig: PhilosophyConfig = {
  eyebrow: "CORE CAPABILITIES",
  title: "Edge AI Pipeline",
  body: "The system captures real-time voltage and current traces at the meter level, compresses data by 92% using PCA-KMeans prototypes, then fuses OCSVM and GMM outputs through a meta-ensemble layer to detect zero-day tampering attacks.",
  rollingWords: ["COMPRESSION", "ENSEMBLE", "ANOMALY", "EDGE", "DETECT", "FUSION"],
}

export const galleryConfig: GalleryConfig = {
  sectionLabel: "SYSTEM COMPONENTS / 004",
  title: "Core Modules",
  projects: [
    {
      id: "EDGE-001",
      title: "Edge Device",
      location: "ESP32",
      year: "C++",
      image: "images/project-1.jpg",
      subtitle: "Real-time current & voltage acquisition firmware for ESP32 with SCT-013/ACS712 sensors.",
      meta: [
        { label: "SENSOR", value: "SCT-013 / ACS712" },
        { label: "MCU", value: "ESP32-D0WD" },
        { label: "RATE", value: "1 kHz Sampling" },
        { label: "OUTPUT", value: "MQTT / JSON" },
      ],
      paragraphs: [
        "The ESP32 edge firmware implements a dual-channel ADC acquisition loop using the ESP32's 12-bit SAR ADC with DMA-backed free-running mode. SCT-013 non-invasive current clamps capture phase current on L1/L2/L3, while a resistive divider network monitors line voltage via ADC channels 6 and 7.",
        "Raw samples undergo a cascaded filtering stage: first, a 50/60 Hz notch filter removes mains interference; second, a 3-pole median filter suppresses impulse noise from switching transients. RMS values are computed over 20ms windows (one full mains cycle) and emitted as JSON payloads every second via MQTT over Wi-Fi.",
        "The firmware includes a tamper-evidence counter: if the SCT-013 clamp is physically removed (detected via sudden open-circuit bias shift), the device latches a TAMPER flag into persistent RTC memory and transmits an alert to the ingestion broker before entering deep-sleep lockdown.",
        "Power budget is optimized for pole-mounted deployment: the ESP32 runs at 80 MHz with Wi-Fi modem-sleep cycling, achieving ~45 mA average draw. A 5 W solar panel + 18650 LiFePO4 pack provides indefinite autonomy in tropical climates.",
      ],
    },
    {
      id: "COMP-002",
      title: "Compression",
      location: "Python",
      year: "Pipeline",
      image: "images/project-2.jpg",
      subtitle: "PCA + K-Means prototype extraction achieving 92% dataset reduction while preserving anomaly signatures.",
      meta: [
        { label: "METHOD", value: "PCA + K-Means" },
        { label: "REDUCTION", value: "92% Size" },
        { label: "DIMS", value: "8 Principal" },
        { label: "PROTOS", value: "64 Centroids" },
      ],
      paragraphs: [
        "The compression pipeline receives raw 24-dimensional feature vectors (RMS current, voltage, power factor, harmonic ratios THD3-THD15, crest factor, zero-crossing jitter, and phase angle per phase) at 1 Hz from each edge device.",
        "Stage one applies incremental PCA with a forget factor of 0.995 to adapt to seasonal load drift. The top-8 principal components capture 97.4% of variance, reducing dimensionality from 24 to 8. The covariance matrix is updated via Welford's online algorithm to avoid storing the full history.",
        "Stage two feeds the projected 8-D streams into an online K-Means variant with 64 centroids. Mini-batch updates of 100 samples keep centroid drift bounded. Each incoming vector is replaced by its nearest centroid index plus a residual magnitude, yielding a symbolic time-series that requires only 6 bits per sample plus an occasional centroid table refresh.",
        "Crucially, the residual magnitude field preserves outlier energy: anomalous vectors that map poorly to any centroid retain high residual values, ensuring that downstream anomaly detectors still receive the information needed to flag tampering events even after aggressive compression.",
      ],
    },
    {
      id: "ML-003",
      title: "Meta-Ensemble",
      location: "Python",
      year: "OCSVM + GMM",
      image: "images/project-3.jpg",
      subtitle: "Unsupervised one-class classifiers fused through a meta-OCSVM layer for zero-day tampering detection.",
      meta: [
        { label: "BASE", value: "OCSVM + GMM" },
        { label: "META", value: "OCSVM Fusion" },
        { label: "TRAIN", value: "Unsupervised" },
        { label: "F1", value: "0.94 Anomaly" },
      ],
      paragraphs: [
        "The meta-ensemble architecture treats anomaly detection as a stacked one-class problem. Base-level classifiers are trained exclusively on compressed normal prototypes — no labeled theft data is ever required. This eliminates the data-imbalance problem endemic to fraud detection, where positive examples are rare and legally sensitive.",
        "Base layer one is an OCSVM with RBF kernel (nu=0.05, gamma=scale) trained on the 8-D PCA projections. It learns the tight decision boundary around normative consumption manifolds. Base layer two is a Bayesian Gaussian Mixture with 12 full-covariance components, modeling the multi-modal nature of daily load curves (morning peak, afternoon base, evening peak, night trough).",
        "Both base models output calibrated anomaly scores per sample. The scores are normalized via Platt scaling using held-out validation prototypes, then concatenated into a 2-D meta-feature vector. A second-level OCSVM (nu=0.02, linear kernel) operates on this normalized score space. The meta-learner is specifically regularized to flag samples only when both base detectors disagree in a suspicious direction — a pattern characteristic of zero-day tampering that neither base model has seen.",
        "Ablation studies on synthetic data show the meta-layer improves detection of reverse-power-flow bypass attacks by 18 percentage points F1 versus the best single classifier, while maintaining sub-2% false-positive rate on normal seasonal variations.",
      ],
    },
    {
      id: "SYN-004",
      title: "Synthetic Data",
      location: "Python",
      year: "Generator",
      image: "images/project-4.jpg",
      subtitle: "Deterministically scrambled, highly realistic smart meter traces simulating normal and tampered load profiles.",
      meta: [
        { label: "SEED", value: "Deterministic" },
        { label: "NORMAL", value: "Diurnal Curves" },
        { label: "ATTACKS", value: "4 Tamper Types" },
        { label: "PII", value: "Zero Exposure" },
      ],
      paragraphs: [
        "The synthetic generator creates physically plausible power traces by modeling household appliances as Markov-modulated Poisson processes. Each appliance type (resistive heating, inductive motor, SMPS electronics) has a distinct harmonic signature and switching transient profile derived from published NILMTK datasets, scrambled by a seeded PRNG to eliminate any traceability to real households.",
        "Normal daily profiles are generated by composing 8 appliance classes across a 24-hour diurnal template. Seasonal variation is injected via sinusoidal temperature-correlation on HVAC loads. Stochastic Gaussian noise at -40 dB SNR mimics ADC quantization and line impedance jitter.",
        "Four tampering modalities are implemented: (1) Current Bypass — a parallel low-resistance shunt diverts measured current while actual load continues; (2) Reverse Power Flow — photovoltaic backfeed masquerades as consumption reduction; (3) Meter Cover Tamper — optical sensor interference causes periodic metering gaps; (4) Phase Dropout — single-phase disconnection in a 3-phase installation creates asymmetric voltage sag.",
        "Each synthetic household receives a deterministic UUID derived from the generation seed. Datasets are exported in IEEE C37.118 synchrophasor format compatible with utility SCADA ingestion, enabling end-to-end pipeline testing without any exposure of real customer PII or proprietary feeder topology.",
      ],
    },
  ],
}

export const mediumsConfig: MediumsConfig = {
  sectionLabel: "TECHNICAL SPECS",
  items: [
    {
      cn: "Edge",
      en: "HARDWARE",
      description: "ESP32-D0WD @ 80MHz with dual-core FreeRTOS. SCT-013 clamp sensors with 10A/100A scales. Wi-Fi + MQTT telemetry. 5W solar + LiFePO4 autonomous power. 45mA average draw with modem-sleep cycling.",
    },
    {
      cn: "Compress",
      en: "PIPELINE",
      description: "Incremental PCA with Welford online covariance. 24D to 8D projection preserving 97.4% variance. Online mini-batch K-Means with 64 centroids. 92% dataset reduction with outlier-residual preservation.",
    },
    {
      cn: "Detect",
      en: "ENSEMBLE",
      description: "Base OCSVM (RBF, nu=0.05) + Bayesian GMM (12 components). Platt-scaled score normalization. Meta-OCSVM (linear, nu=0.02) on 2D score space. Zero-day tampering detection at 0.94 F1.",
    },
    {
      cn: "Explain",
      en: "XAI DASH",
      description: "React-based decision-support UI with recharts visualization. Peer-pattern baseline comparison. Real-time deviation plots with technical parameter highlighting. No source-system modification.",
    },
  ],
}

export const footerConfig: FooterConfig = {
  visionText: "This system is designed as a read-only decision-support layer. It never writes back to utility SCADA, AMI head-end, or billing systems. All anomaly alerts are dispatched to operator dashboards for human verification before any field action is initiated.",
  brandName: "EdgeDetect",
  columns: [
    {
      heading: "DOCS",
      entries: [
        { text: "Architecture Overview", href: "#" },
        { text: "API Reference", href: "#" },
        { text: "Deployment Guide", href: "#" },
      ],
    },
    {
      heading: "CODE",
      entries: [
        { text: "ESP32 Firmware", href: "#" },
        { text: "Python Pipeline", href: "#" },
        { text: "Synthetic Generator", href: "#" },
      ],
    },
    {
      heading: "CONTACT",
      entries: [
        { text: "GridOps Team\nAnomaly Division\nsmartgrid@edgedetect.io" },
      ],
    },
  ],
  copyright: "Edge-Optimized Meta-Ensemble Anomaly Detector. All synthetic data. No real PII.",
  videoPath: "",
}

export const projectDetailConfig: ProjectDetailConfig = {
  backLabel: "← Back",
}

export function getProjectById(id: string): ProjectData | undefined {
  return galleryConfig.projects.find((p) => p.id === id)
}
