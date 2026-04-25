"""
Edge-Optimized Meta-Ensemble Anomaly Detector
Synthetic Smart Meter Data Generator

Generates deterministically scrambled, highly realistic synthetic smart meter
data simulating normal daily load profiles and anomalous events (reverse power
flow, bypass tampering, meter cover interference, phase dropout).

No real utility data or PII is used. All traces are physically plausible
compositions of appliance-level Markov-modulated Poisson processes.

Author: AI Architect
Date: 2026-04-25
"""

import numpy as np
import pandas as pd
from typing import Tuple, Dict, List, Optional
from dataclasses import dataclass
from enum import Enum, auto
import json
import hashlib
import uuid
from datetime import datetime, timedelta


class TamperType(Enum):
    """Enumeration of implemented tampering modalities."""
    NONE = auto()
    CURRENT_BYPASS = auto()      # Parallel shunt diverts measured current
    REVERSE_POWER = auto()       # PV backfeed masquerades as reduced consumption
    METER_COVER_TAMPER = auto()  # Optical interference creates metering gaps
    PHASE_DROPOUT = auto()       # Single-phase disconnection in 3-phase install


@dataclass
class ApplianceProfile:
    """Physical signature of a household appliance class."""
    name: str
    mean_power_w: float          # Average active power draw
    duty_cycle: float            # Fraction of time appliance is ON
    harmonic_signature: np.ndarray  # THD ratios for H3-H15 (relative to fundamental)
    pf_range: Tuple[float, float]   # Power factor min/max
    inrush_ratio: float          # Inrush current / steady current
    switch_transient_ms: float   # Duration of switching transient


# Appliance library derived from published NILMTK load signatures
APPLIANCE_LIBRARY = {
    'hvac_resistive': ApplianceProfile(
        name='HVAC Resistive',
        mean_power_w=2500,
        duty_cycle=0.35,
        harmonic_signature=np.array([0.02, 0.01, 0.01, 0.005, 0.003, 0.002, 0.001]),
        pf_range=(0.99, 1.00),
        inrush_ratio=1.1,
        switch_transient_ms=200
    ),
    'hvac_motor': ApplianceProfile(
        name='HVAC Motor',
        mean_power_w=1800,
        duty_cycle=0.40,
        harmonic_signature=np.array([0.08, 0.04, 0.03, 0.02, 0.015, 0.01, 0.008]),
        pf_range=(0.75, 0.88),
        inrush_ratio=5.0,
        switch_transient_ms=800
    ),
    'refrigerator': ApplianceProfile(
        name='Refrigerator',
        mean_power_w=150,
        duty_cycle=0.30,
        harmonic_signature=np.array([0.05, 0.03, 0.02, 0.01, 0.008, 0.005, 0.003]),
        pf_range=(0.60, 0.75),
        inrush_ratio=3.0,
        switch_transient_ms=500
    ),
    'lighting_led': ApplianceProfile(
        name='LED Lighting',
        mean_power_w=60,
        duty_cycle=0.25,
        harmonic_signature=np.array([0.25, 0.15, 0.10, 0.08, 0.05, 0.03, 0.02]),
        pf_range=(0.85, 0.95),
        inrush_ratio=1.0,
        switch_transient_ms=50
    ),
    'water_heater': ApplianceProfile(
        name='Water Heater',
        mean_power_w=3500,
        duty_cycle=0.15,
        harmonic_signature=np.array([0.01, 0.005, 0.003, 0.002, 0.001, 0.001, 0.001]),
        pf_range=(0.98, 1.00),
        inrush_ratio=1.2,
        switch_transient_ms=300
    ),
    'washer_dryer': ApplianceProfile(
        name='Washer/Dryer',
        mean_power_w=2200,
        duty_cycle=0.05,
        harmonic_signature=np.array([0.06, 0.03, 0.02, 0.015, 0.01, 0.008, 0.005]),
        pf_range=(0.70, 0.90),
        inrush_ratio=2.5,
        switch_transient_ms=600
    ),
    'electronics_smps': ApplianceProfile(
        name='SMPS Electronics',
        mean_power_w=300,
        duty_cycle=0.60,
        harmonic_signature=np.array([0.30, 0.20, 0.12, 0.08, 0.05, 0.03, 0.02]),
        pf_range=(0.55, 0.70),
        inrush_ratio=1.5,
        switch_transient_ms=100
    ),
    'ev_charger': ApplianceProfile(
        name='EV Charger',
        mean_power_w=7200,
        duty_cycle=0.08,
        harmonic_signature=np.array([0.03, 0.02, 0.015, 0.01, 0.008, 0.005, 0.003]),
        pf_range=(0.95, 0.99),
        inrush_ratio=1.05,
        switch_transient_ms=150
    ),
}


class SyntheticHousehold:
    """
    Generates physically plausible power traces for a single household.
    Deterministic seeding ensures reproducibility while scrambling real NILMTK
    signatures beyond recognition.
    """
    
    def __init__(self, household_seed: int, 
                 voltage_v: float = 230.0,
                 n_phases: int = 3,
                 temperature_c: float = 22.0):
        self.seed = household_seed
        self.rng = np.random.RandomState(household_seed)
        self.voltage = voltage_v
        self.n_phases = n_phases
        self.temperature = temperature_c
        
        # Deterministic UUID from seed
        self.household_id = str(uuid.UUID(bytes=hashlib.md5(
            str(household_seed).encode()).digest()))
        
        # Select appliance mix (deterministic)
        self.appliances = self._select_appliance_mix()
        
        # Seasonal HVAC correlation factor
        self.hvac_factor = 1.0 + 0.05 * (temperature_c - 20.0)
        
    def _select_appliance_mix(self) -> Dict[str, int]:
        """Select which appliances and how many of each."""
        appliance_names = list(APPLIANCE_LIBRARY.keys())
        n_types = self.rng.randint(4, 8)
        selected = self.rng.choice(appliance_names, size=n_types, replace=False)
        return {name: int(self.rng.randint(1, 3)) for name in selected}
    
    def _generate_appliance_trace(self, app_name: str, n_samples: int,
                                   timestamp_index: pd.DatetimeIndex) -> np.ndarray:
        """Generate Markov-modulated Poisson trace for one appliance."""
        app = APPLIANCE_LIBRARY[app_name]
        
        # Markov chain for ON/OFF state
        states = np.zeros(n_samples, dtype=bool)
        states[0] = self.rng.rand() < app.duty_cycle
        
        # Transition probabilities depend on time of day
        hour = timestamp_index.hour
        p_on_morning = 0.3 + 0.4 * ((hour >= 6) & (hour <= 9))
        p_on_evening = 0.3 + 0.5 * ((hour >= 17) & (hour <= 22))
        p_on_night = 0.1 * ((hour >= 23) | (hour <= 5))
        p_on_base = app.duty_cycle
        
        p_on = np.clip(p_on_morning + p_on_evening + p_on_night + p_on_base, 0.05, 0.95)
        
        for t in range(1, n_samples):
            p_transition = p_on[t] if not states[t-1] else (1 - p_on[t])
            states[t] = states[t-1] if self.rng.rand() > 0.15 else (self.rng.rand() < p_on[t])
        
        # Power draw with Gaussian noise
        power = np.where(states, 
                        self.rng.normal(app.mean_power_w, app.mean_power_w * 0.05, n_samples),
                        0)
        
        # HVAC scaling by temperature
        if 'hvac' in app_name:
            power *= self.hvac_factor
        
        return power
    
    def generate_day(self, date: datetime, sample_rate_hz: float = 1.0/60) -> pd.DataFrame:
        """
        Generate one day of synthetic meter data.
        
        Returns DataFrame with columns matching real smart meter telemetry:
        timestamp, rms_i1/2/3, rms_v1/2/3, active_power, reactive_power,
        power_factor, thd3-thd15, crest_factor, zero_crossing_jitter
        """
        n_samples = int(24 * 3600 * sample_rate_hz)  # 1440 samples at 1/min
        timestamps = pd.date_range(start=date, periods=n_samples, 
                                   freq=f'{int(1/sample_rate_hz)}s')
        
        # Aggregate appliance traces
        total_power = np.zeros(n_samples)
        reactive_power = np.zeros(n_samples)
        
        for app_name, count in self.appliances.items():
            for _ in range(count):
                p = self._generate_appliance_trace(app_name, n_samples, timestamps)
                total_power += p
                
                app = APPLIANCE_LIBRARY[app_name]
                pf = self.rng.uniform(*app.pf_range)
                reactive_power += p * np.tan(np.arccos(pf))
        
        # Add stochastic noise (-40 dB SNR)
        noise_power = np.std(total_power[total_power > 0]) * 0.01 if np.any(total_power > 0) else 1.0
        total_power += self.rng.normal(0, noise_power, n_samples)
        total_power = np.maximum(total_power, 0)
        
        # Compute electrical quantities
        # Assume roughly balanced across phases with some asymmetry
        phase_share = self.rng.dirichlet([1.0, 1.0, 1.0]) * self.n_phases
        
        current_per_phase = np.zeros((n_samples, 3))
        voltage_per_phase = np.zeros((n_samples, 3))
        
        for ph in range(3):
            current_per_phase[:, ph] = (total_power / self.voltage) * phase_share[ph]
            # Voltage with small sags
            voltage_per_phase[:, ph] = self.voltage * self.rng.normal(1.0, 0.01, n_samples)
        
        # Harmonic content (synthesized from appliance mix)
        thd = np.zeros((n_samples, 7))  # THD3, 5, 7, 9, 11, 13, 15
        for i in range(n_samples):
            # Weighted mix of appliance harmonic signatures
            thd[i] = np.mean([APPLIANCE_LIBRARY[n].harmonic_signature 
                             for n in self.appliances.keys()], axis=0)
            thd[i] += self.rng.normal(0, 0.01, 7)
            thd[i] = np.maximum(thd[i], 0)
        
        # Power factor
        apparent_power = np.sqrt(total_power**2 + reactive_power**2)
        pf = np.where(apparent_power > 0, total_power / apparent_power, 1.0)
        pf = np.clip(pf, 0.3, 1.0)
        
        # Crest factor (synthesized)
        crest_factor = self.rng.normal(1.4, 0.1, n_samples)
        
        # Zero-crossing jitter (microseconds)
        zc_jitter = self.rng.exponential(5.0, n_samples)
        
        df = pd.DataFrame({
            'timestamp': timestamps,
            'household_id': self.household_id,
            'rms_i1': current_per_phase[:, 0],
            'rms_i2': current_per_phase[:, 1],
            'rms_i3': current_per_phase[:, 2],
            'rms_v1': voltage_per_phase[:, 0],
            'rms_v2': voltage_per_phase[:, 1],
            'rms_v3': voltage_per_phase[:, 2],
            'active_power_kw': total_power / 1000.0,
            'reactive_power_kvar': reactive_power / 1000.0,
            'power_factor': pf,
            'thd3': thd[:, 0],
            'thd5': thd[:, 1],
            'thd7': thd[:, 2],
            'thd9': thd[:, 3],
            'thd11': thd[:, 4],
            'thd13': thd[:, 5],
            'thd15': thd[:, 6],
            'crest_factor': crest_factor,
            'zc_jitter_us': zc_jitter,
        })
        
        return df


class TamperInjector:
    """Injects realistic tampering events into normal load traces."""
    
    @staticmethod
    def inject_current_bypass(df: pd.DataFrame, start_hour: float = 8.0,
                               duration_hours: float = 6.0,
                               bypass_ratio: float = 0.3) -> pd.DataFrame:
        """
        Simulate parallel low-resistance shunt.
        Measured current drops while actual load continues.
        """
        df = df.copy()
        mask = (df['timestamp'].dt.hour >= start_hour) & \
               (df['timestamp'].dt.hour < start_hour + duration_hours)
        
        # Current drops on all phases
        df.loc[mask, 'rms_i1'] *= bypass_ratio
        df.loc[mask, 'rms_i2'] *= bypass_ratio
        df.loc[mask, 'rms_i3'] *= bypass_ratio
        
        # Power factor degrades due to distorted waveform
        df.loc[mask, 'power_factor'] *= 0.85
        df.loc[mask, 'crest_factor'] *= 1.3  # spiky residual waveform
        
        # Mark tamper
        df['tamper_type'] = 'NONE'
        df.loc[mask, 'tamper_type'] = 'CURRENT_BYPASS'
        
        return df
    
    @staticmethod
    def inject_reverse_power(df: pd.DataFrame, start_hour: float = 10.0,
                              duration_hours: float = 4.0,
                              pv_capacity_kw: float = 3.0) -> pd.DataFrame:
        """
        Simulate PV backfeed masquerading as consumption reduction.
        Active power drops, reactive power may increase.
        """
        df = df.copy()
        mask = (df['timestamp'].dt.hour >= start_hour) & \
               (df['timestamp'].dt.hour < start_hour + duration_hours)
        
        # Active power reduced by PV injection
        original_power = df.loc[mask, 'active_power_kw'].values
        df.loc[mask, 'active_power_kw'] = np.maximum(original_power - pv_capacity_kw, 0.1)
        
        # Current inverts phase on L1 (simplified)
        df.loc[mask, 'rms_i1'] *= 0.2
        df.loc[mask, 'power_factor'] = 0.4  # leading PF from inverter
        
        df['tamper_type'] = 'NONE'
        df.loc[mask, 'tamper_type'] = 'REVERSE_POWER'
        
        return df
    
    @staticmethod
    def inject_meter_cover_tamper(df: pd.DataFrame, gap_interval_min: int = 15,
                                   gap_duration_min: int = 2) -> pd.DataFrame:
        """
        Simulate optical sensor interference causing periodic metering gaps.
        Data flatlines at last reading during gap periods.
        """
        df = df.copy()
        n_samples = len(df)
        
        gap_starts = range(0, n_samples, gap_interval_min)
        for start in gap_starts:
            end = min(start + gap_duration_min, n_samples)
            if start > 0:
                # Flatline at last known value
                last_val = df.iloc[start - 1].copy()
                for col in ['rms_i1', 'rms_i2', 'rms_i3', 'active_power_kw']:
                    df.loc[df.index[start:end], col] = last_val[col]
        
        df['tamper_type'] = 'NONE'
        df.loc[df.index.isin([i for start in gap_starts 
                              for i in range(start, min(start + gap_duration_min, n_samples))]), 
               'tamper_type'] = 'METER_COVER_TAMPER'
        
        return df
    
    @staticmethod
    def inject_phase_dropout(df: pd.DataFrame, phase: int = 1,
                              start_hour: float = 14.0,
                              duration_hours: float = 3.0) -> pd.DataFrame:
        """
        Simulate single-phase disconnection in 3-phase installation.
        Creates asymmetric voltage sag and current imbalance.
        """
        df = df.copy()
        mask = (df['timestamp'].dt.hour >= start_hour) & \
               (df['timestamp'].dt.hour < start_hour + duration_hours)
        
        phase_col = f'rms_i{phase}'
        v_col = f'rms_v{phase}'
        
        df.loc[mask, phase_col] *= 0.05  # near-zero current on dropped phase
        df.loc[mask, v_col] *= 0.7  # voltage sag
        
        # Imbalance: other phases compensate
        other_phases = [p for p in [1, 2, 3] if p != phase]
        for op in other_phases:
            df.loc[mask, f'rms_i{op}'] *= 1.4
        
        df['tamper_type'] = 'NONE'
        df.loc[mask, 'tamper_type'] = 'PHASE_DROPOUT'
        
        return df


class SyntheticDatasetGenerator:
    """Orchestrates generation of full datasets with labeled tamper events."""
    
    def __init__(self, master_seed: int = 42, n_households: int = 100):
        self.master_seed = master_seed
        self.n_households = n_households
        self.rng = np.random.RandomState(master_seed)
        
    def generate(self, n_days: int = 7, tamper_ratio: float = 0.15,
                 sample_rate_hz: float = 1.0/60) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Generate complete labeled dataset.
        
        Returns:
            (normal_df, tampered_df) - both with 'tamper_type' and 'is_anomaly' columns
        """
        all_normal = []
        all_tampered = []
        
        start_date = datetime(2026, 1, 1)
        
        for h in range(self.n_households):
            household_seed = self.master_seed + h * 997  # deterministic scramble
            temperature = self.rng.normal(22, 5)
            
            household = SyntheticHousehold(
                household_seed=household_seed,
                voltage_v=230.0,
                n_phases=3,
                temperature_c=temperature
            )
            
            for d in range(n_days):
                date = start_date + timedelta(days=d)
                df_day = household.generate_day(date, sample_rate_hz)
                
                # Decide if this day gets tampered
                is_tampered = self.rng.rand() < tamper_ratio
                
                if is_tampered:
                    tamper_type = self.rng.choice(list(TamperType))
                    tamper_type = tamper_type if tamper_type != TamperType.NONE else TamperType.CURRENT_BYPASS
                    
                    if tamper_type == TamperType.CURRENT_BYPASS:
                        df_day = TamperInjector.inject_current_bypass(df_day)
                    elif tamper_type == TamperType.REVERSE_POWER:
                        df_day = TamperInjector.inject_reverse_power(df_day)
                    elif tamper_type == TamperType.METER_COVER_TAMPER:
                        df_day = TamperInjector.inject_meter_cover_tamper(df_day)
                    elif tamper_type == TamperType.PHASE_DROPOUT:
                        df_day = TamperInjector.inject_phase_dropout(df_day)
                    
                    df_day['is_anomaly'] = 1
                    all_tampered.append(df_day)
                else:
                    df_day['tamper_type'] = 'NONE'
                    df_day['is_anomaly'] = 0
                    all_normal.append(df_day)
        
        normal_df = pd.concat(all_normal, ignore_index=True) if all_normal else pd.DataFrame()
        tampered_df = pd.concat(all_tampered, ignore_index=True) if all_tampered else pd.DataFrame()
        
        return normal_df, tampered_df
    
    def export_c37_118(self, df: pd.DataFrame, output_path: str):
        """Export in IEEE C37.118 synchrophasor format."""
        # Simplified C37.118-like JSON export
        records = []
        for _, row in df.iterrows():
            records.append({
                'SOC': int(row['timestamp'].timestamp()),
                'FRACSEC': 0,
                'PMU_ID': row['household_id'][:8],
                'PHASORS': {
                    'I1': {'mag': row['rms_i1'], 'ang': 0.0},
                    'I2': {'mag': row['rms_i2'], 'ang': -120.0},
                    'I3': {'mag': row['rms_i3'], 'ang': 120.0},
                    'V1': {'mag': row['rms_v1'], 'ang': 0.0},
                },
                'ANALOG': {
                    'P': row['active_power_kw'],
                    'Q': row['reactive_power_kvar'],
                    'PF': row['power_factor'],
                },
                'DIGITAL': {
                    'TAMPER': 1 if row.get('tamper_type', 'NONE') != 'NONE' else 0
                }
            })
        
        with open(output_path, 'w') as f:
            json.dump(records, f, indent=2)
        
        print(f"[Export] Written {len(records)} C37.118 records to {output_path}")


def demo_synthetic_generation():
    """Demonstrate full synthetic dataset generation."""
    print("=" * 60)
    print("Synthetic Smart Meter Data Generator Demo")
    print("=" * 60)
    
    # Generate dataset
    generator = SyntheticDatasetGenerator(master_seed=42, n_households=10)
    normal_df, tampered_df = generator.generate(n_days=2, tamper_ratio=0.20)
    
    print(f"\nDataset Summary:")
    print(f"  Normal samples: {len(normal_df):,}")
    print(f"  Tampered samples: {len(tampered_df):,}")
    
    if len(tampered_df) > 0:
        print(f"\nTamper type distribution:")
        print(tampered_df['tamper_type'].value_counts())
        
        print(f"\nSample tampered trace (first household):")
        h1_tamper = tampered_df[tampered_df['household_id'] == tampered_df['household_id'].iloc[0]]
        print(h1_tamper[['timestamp', 'active_power_kw', 'rms_i1', 'power_factor', 'tamper_type']].head(20))
    
    # Export
    generator.export_c37_118(
        pd.concat([normal_df, tampered_df]) if len(tampered_df) > 0 else normal_df,
        "synthetic_meter_data_c37_118.json"
    )
    
    # Save to parquet
    combined = pd.concat([normal_df, tampered_df]) if len(tampered_df) > 0 else normal_df
    combined.to_parquet("synthetic_meter_data.parquet", index=False)
    print(f"[Export] Saved combined dataset to synthetic_meter_data.parquet")
    
    return normal_df, tampered_df


if __name__ == "__main__":
    demo_synthetic_generation()
