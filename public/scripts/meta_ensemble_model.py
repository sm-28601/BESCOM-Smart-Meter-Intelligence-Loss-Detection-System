"""
Edge-Optimized Meta-Ensemble Anomaly Detector
Meta-Ensemble Machine Learning Model

Implements a two-level ensemble architecture:
  Base Layer: One-Class SVM (OCSVM) + Gaussian Mixture Model (GMM)
  Meta Layer: OCSVM fusion on normalized base-classifier scores

Trained exclusively on normal compressed prototypes — no labeled theft data.
Detects zero-day tampering attacks and abnormal consumption drops.

Author: AI Architect
Date: 2026-04-25
"""

import numpy as np
import pandas as pd
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from sklearn.svm import OneClassSVM
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import precision_recall_fscore_support, roc_auc_score
import pickle
import warnings
warnings.filterwarnings('ignore')


@dataclass
class DetectionResult:
    """Container for anomaly detection results."""
    anomaly_scores: np.ndarray        # Continuous anomaly score per sample
    predictions: np.ndarray           # Binary: 1=normal, -1=anomaly
    base_ocsvm_scores: np.ndarray
    base_gmm_scores: np.ndarray
    meta_features: np.ndarray         # 2D normalized score space
    threshold: float


class BaseOCSVMDetector:
    """
    Base-level One-Class SVM with RBF kernel.
    Learns tight boundary around normal consumption manifolds.
    """
    
    def __init__(self, kernel: str = 'rbf', nu: float = 0.05,
                 gamma: str = 'scale'):
        self.model = OneClassSVM(
            kernel=kernel,
            nu=nu,
            gamma=gamma,
            shrinking=True,
            tol=1e-4,
            cache_size=200
        )
        self.scaler = StandardScaler()
        self.fitted = False
        
    def fit(self, X: np.ndarray):
        """Train on normal data only."""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.fitted = True
        return self
    
    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """Return raw decision scores (higher = more normal)."""
        X_scaled = self.scaler.transform(X)
        return self.model.decision_function(X_scaled)
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Return binary predictions: 1=normal, -1=anomaly."""
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)


class BaseGMMDetector:
    """
    Base-level Bayesian Gaussian Mixture Model.
    Models multi-modal daily load curves (morning peak, afternoon base,
    evening peak, night trough) with full covariance.
    """
    
    def __init__(self, n_components: int = 12, covariance_type: str = 'full',
                 random_state: int = 42):
        self.model = GaussianMixture(
            n_components=n_components,
            covariance_type=covariance_type,
            random_state=random_state,
            max_iter=200,
            n_init=3,
            init_params='k-means++'
        )
        self.scaler = StandardScaler()
        self.fitted = False
        
    def fit(self, X: np.ndarray):
        """Train on normal data only."""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        self.fitted = True
        return self
    
    def score_samples(self, X: np.ndarray) -> np.ndarray:
        """Return log-likelihood scores (higher = more normal)."""
        X_scaled = self.scaler.transform(X)
        return self.model.score_samples(X_scaled)
    
    def predict(self, X: np.ndarray, threshold_percentile: float = 5.0) -> np.ndarray:
        """Predict using likelihood threshold."""
        scores = self.score_samples(X)
        # Threshold based on training score distribution
        thresh = np.percentile(self.train_scores, threshold_percentile)
        return np.where(scores >= thresh, 1, -1)
    
    def fit_with_scores(self, X: np.ndarray):
        """Fit and store training scores for threshold calibration."""
        self.fit(X)
        self.train_scores = self.score_samples(X)
        return self


class MetaEnsembleDetector:
    """
    Meta-ensemble layer fusing OCSVM and GMM outputs.
    
    Architecture:
      1. Base OCSVM outputs raw decision scores
      2. Base GMM outputs log-likelihood scores  
      3. Both scores are normalized via Platt scaling
      4. Concatenated 2-D meta-features fed to meta-OCSVM
      5. Meta-OCSVM (linear, tighter nu) flags suspicious score patterns
    """
    
    def __init__(self, 
                 base_ocsvm_nu: float = 0.05,
                 base_ocsvm_gamma: str = 'scale',
                 base_gmm_components: int = 12,
                 meta_ocsvm_nu: float = 0.02,
                 meta_ocsvm_kernel: str = 'linear',
                 random_state: int = 42):
        
        self.base_ocsvm = BaseOCSVMDetector(
            kernel='rbf', nu=base_ocsvm_nu, gamma=base_ocsvm_gamma
        )
        self.base_gmm = BaseGMMDetector(
            n_components=base_gmm_components, random_state=random_state
        )
        self.meta_ocsvm = OneClassSVM(
            kernel=meta_ocsvm_kernel,
            nu=meta_ocsvm_nu,
            gamma='scale',
            shrinking=True
        )
        
        # Platt scaling parameters (learned during fit)
        self.platt_A_ocsvm = 1.0
        self.platt_B_ocsvm = 0.0
        self.platt_A_gmm = 1.0
        self.platt_B_gmm = 0.0
        
        self.meta_scaler = StandardScaler()
        self.threshold = 0.0
        self.random_state = random_state
        self.is_fitted = False
        
    def _platt_scale(self, scores: np.ndarray, A: float, B: float) -> np.ndarray:
        """Sigmoid calibration to [0, 1] probability-like scores."""
        return 1.0 / (1.0 + np.exp(A * scores + B))
    
    def _fit_platt(self, scores: np.ndarray) -> Tuple[float, float]:
        """
        Learn Platt scaling parameters using validation scores.
        Maps raw scores to [0, 1] range where 0.5 = decision boundary.
        """
        # Use sigmoid fitting via percentile matching
        p10 = np.percentile(scores, 10)
        p90 = np.percentile(scores, 90)
        
        # Map p10 -> 0.9 (likely normal), p90 -> 0.1 (likely anomaly)
        # Solve: 1/(1+exp(A*p10+B)) = 0.9, 1/(1+exp(A*p90+B)) = 0.1
        # => A*p10 + B = -ln(9), A*p90 + B = ln(9)
        target_low = -np.log(9)   # -2.197
        target_high = np.log(9)    # 2.197
        
        A = (target_low - target_high) / (p10 - p90 + 1e-9)
        B = target_low - A * p10
        
        return A, B
    
    def fit(self, X_normal: np.ndarray, validation_split: float = 0.2) -> 'MetaEnsembleDetector':
        """
        Train meta-ensemble on normal compressed prototypes only.
        
        Args:
            X_normal: Normal training samples (already PCA-compressed prototypes)
            validation_split: Fraction for Platt scaling calibration
        """
        print("[MetaEnsemble] Training base classifiers on normal data...")
        np.random.seed(self.random_state)
        
        n_val = int(len(X_normal) * validation_split)
        indices = np.random.permutation(len(X_normal))
        val_idx = indices[:n_val]
        train_idx = indices[n_val:]
        
        X_train = X_normal[train_idx]
        X_val = X_normal[val_idx]
        
        # Fit base classifiers
        print("[MetaEnsemble] Fitting Base OCSVM (RBF)...")
        self.base_ocsvm.fit(X_train)
        
        print("[MetaEnsemble] Fitting Base GMM (12 components, full cov)...")
        self.base_gmm.fit_with_scores(X_train)
        
        # Get validation scores for Platt scaling
        ocsvm_val_scores = self.base_ocsvm.decision_function(X_val)
        gmm_val_scores = self.base_gmm.score_samples(X_val)
        
        # Fit Platt parameters
        self.platt_A_ocsvm, self.platt_B_ocsvm = self._fit_platt(ocsvm_val_scores)
        self.platt_A_gmm, self.platt_B_gmm = self._fit_platt(gmm_val_scores)
        
        print(f"[MetaEnsemble] Platt params - OCSVM: A={self.platt_A_ocsvm:.4f}, B={self.platt_B_ocsvm:.4f}")
        print(f"[MetaEnsemble] Platt params - GMM: A={self.platt_A_gmm:.4f}, B={self.platt_B_gmm:.4f}")
        
        # Build meta-features from training data (recombine train+val)
        ocsvm_scores = self.base_ocsvm.decision_function(X_normal)
        gmm_scores = self.base_gmm.score_samples(X_normal)
        
        ocsvm_cal = self._platt_scale(ocsvm_scores, self.platt_A_ocsvm, self.platt_B_ocsvm)
        gmm_cal = self._platt_scale(gmm_scores, self.platt_A_gmm, self.platt_B_gmm)
        
        # Meta-feature: [1 - calibrated_OCSVM, 1 - calibrated_GMM]
        # (1 - p) so higher = more anomalous)
        meta_features = np.column_stack([
            1.0 - ocsvm_cal,
            1.0 - gmm_cal
        ])
        
        # Fit meta-OCSVM on normalized meta-features
        print("[MetaEnsemble] Fitting Meta-OCSVM (linear, tighter nu)...")
        meta_features_scaled = self.meta_scaler.fit_transform(meta_features)
        self.meta_ocsvm.fit(meta_features_scaled)
        
        self.is_fitted = True
        print("[MetaEnsemble] Training complete.")
        return self
    
    def predict(self, X: np.ndarray, return_scores: bool = True) -> DetectionResult:
        """
        Predict anomaly scores and binary labels for new samples.
        
        Returns continuous anomaly scores (higher = more anomalous)
        and binary predictions (1=normal, -1=anomaly).
        """
        if not self.is_fitted:
            raise RuntimeError("Detector must be fitted first. Call .fit()")
        
        # Base layer predictions
        ocsvm_raw = self.base_ocsvm.decision_function(X)
        gmm_raw = self.base_gmm.score_samples(X)
        
        # Platt calibration
        ocsvm_cal = self._platt_scale(ocsvm_raw, self.platt_A_ocsvm, self.platt_B_ocsvm)
        gmm_cal = self._platt_scale(gmm_raw, self.platt_A_gmm, self.platt_B_gmm)
        
        # Meta-features (anomaly-directed: 1 - probability)
        meta_features = np.column_stack([
            1.0 - ocsvm_cal,
            1.0 - gmm_cal
        ])
        
        # Meta-OCSVM decision
        meta_scaled = self.meta_scaler.transform(meta_features)
        meta_scores = self.meta_ocsvm.decision_function(meta_scaled)
        meta_labels = self.meta_ocsvm.predict(meta_scaled)
        
        # Final anomaly score: inverted meta decision (higher = more anomaly)
        anomaly_scores = -meta_scores
        
        # Auto-threshold at 95th percentile of training assumption
        threshold = np.percentile(anomaly_scores, 95)
        
        return DetectionResult(
            anomaly_scores=anomaly_scores,
            predictions=meta_labels,  # 1=normal, -1=anomaly from meta-OCSVM
            base_ocsvm_scores=ocsvm_raw,
            base_gmm_scores=gmm_raw,
            meta_features=meta_features,
            threshold=threshold
        )
    
    def evaluate(self, X_test: np.ndarray, y_true: np.ndarray,
                 verbose: bool = True) -> Dict:
        """
        Evaluate on labeled test set.
        y_true: 1=normal, -1=anomaly
        """
        result = self.predict(X_test)
        
        # Convert to binary labels for metrics
        y_pred = result.predictions
        
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average='binary', pos_label=-1
        )
        
        # ROC-AUC using continuous scores
        y_true_binary = np.where(y_true == -1, 1, 0)
        try:
            auc = roc_auc_score(y_true_binary, result.anomaly_scores)
        except:
            auc = 0.5
        
        metrics = {
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': auc,
            'n_anomalies_detected': int(np.sum(y_pred == -1)),
            'n_true_anomalies': int(np.sum(y_true == -1))
        }
        
        if verbose:
            print("\n[Evaluation] Meta-Ensemble Performance:")
            print(f"  Precision: {precision:.4f}")
            print(f"  Recall:    {recall:.4f}")
            print(f"  F1-Score:  {f1:.4f}")
            print(f"  ROC-AUC:   {auc:.4f}")
            print(f"  Detected:  {metrics['n_anomalies_detected']} / {metrics['n_true_anomalies']} true anomalies")
        
        return metrics
    
    def save(self, path: str):
        """Serialize ensemble to disk."""
        with open(path, 'wb') as f:
            pickle.dump({
                'base_ocsvm': self.base_ocsvm,
                'base_gmm': self.base_gmm,
                'meta_ocsvm': self.meta_ocsvm,
                'meta_scaler': self.meta_scaler,
                'platt_params': {
                    'ocsvm': (self.platt_A_ocsvm, self.platt_B_ocsvm),
                    'gmm': (self.platt_A_gmm, self.platt_B_gmm)
                },
                'is_fitted': self.is_fitted,
                'threshold': self.threshold
            }, f)
        print(f"[MetaEnsemble] Saved to {path}")
    
    @classmethod
    def load(cls, path: str) -> 'MetaEnsembleDetector':
        """Load ensemble from disk."""
        with open(path, 'rb') as f:
            data = pickle.load(f)
        
        detector = cls.__new__(cls)
        detector.base_ocsvm = data['base_ocsvm']
        detector.base_gmm = data['base_gmm']
        detector.meta_ocsvm = data['meta_ocsvm']
        detector.meta_scaler = data['meta_scaler']
        
        p = data['platt_params']
        detector.platt_A_ocsvm, detector.platt_B_ocsvm = p['ocsvm']
        detector.platt_A_gmm, detector.platt_B_gmm = p['gmm']
        
        detector.is_fitted = data['is_fitted']
        detector.threshold = data.get('threshold', 0.0)
        
        print(f"[MetaEnsemble] Loaded from {path}")
        return detector


def demo_meta_ensemble():
    """Demonstrate meta-ensemble on synthetic data."""
    print("=" * 60)
    print("Meta-Ensemble Anomaly Detection Demo")
    print("=" * 60)
    
    np.random.seed(42)
    
    # Generate synthetic normal data (8-D, simulating PCA-compressed features)
    n_normal = 3000
    
    # Multi-modal normal patterns (morning peak, afternoon base, evening peak, night)
    modes = [
        (np.array([8.0, 2.0, 1.0, 0.5, 0.3, 0.2, 0.1, 0.1]), 1.5),  # morning
        (np.array([3.0, 1.0, 0.8, 0.4, 0.2, 0.1, 0.1, 0.1]), 0.8),   # afternoon
        (np.array([9.0, 2.5, 1.5, 0.6, 0.4, 0.3, 0.2, 0.1]), 1.2),   # evening
        (np.array([1.0, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1]), 0.5),   # night
    ]
    
    X_normal = []
    for i in range(n_normal):
        mode_idx = i % 4
        mean, std = modes[mode_idx]
        X_normal.append(np.random.normal(mean, std))
    X_normal = np.array(X_normal)
    
    # Generate anomalies (different patterns)
    n_anomaly = 150
    
    # Type 1: Sudden drop (bypass tampering)
    anomaly_drop = np.random.normal(np.array([1.0, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1]), 0.3, (50, 8))
    
    # Type 2: Reverse power flow (negative-ish features)
    anomaly_reverse = np.random.normal(np.array([-2.0, -0.5, -0.3, -0.1, 0.0, 0.0, 0.0, 0.0]), 0.5, (50, 8))
    
    # Type 3: Phase dropout (asymmetric)
    anomaly_phase = np.random.normal(np.array([5.0, 0.1, 0.1, 5.0, 0.1, 0.1, 5.0, 0.1]), 0.4, (50, 8))
    
    X_anomaly = np.vstack([anomaly_drop, anomaly_reverse, anomaly_phase])
    
    # Test set
    X_test = np.vstack([X_normal[-500:], X_anomaly])
    y_test = np.array([1]*500 + [-1]*150)  # 1=normal, -1=anomaly
    
    # Train on first 2500 normal samples
    X_train = X_normal[:2500]
    
    # Initialize and train meta-ensemble
    detector = MetaEnsembleDetector(
        base_ocsvm_nu=0.05,
        base_gmm_components=12,
        meta_ocsvm_nu=0.02,
        meta_ocsvm_kernel='linear'
    )
    
    detector.fit(X_train, validation_split=0.2)
    
    # Evaluate
    metrics = detector.evaluate(X_test, y_test, verbose=True)
    
    # Show per-attack-type breakdown
    print("\n[Evaluation] Per-Attack-Type Detection:")
    attack_types = ['Current Bypass', 'Reverse Power', 'Phase Dropout']
    for i, attack in enumerate(attack_types):
        start = 500 + i * 50
        end = start + 50
        scores = detector.predict(X_test[start:end]).anomaly_scores
        print(f"  {attack}: mean anomaly score = {np.mean(scores):.4f}")
    
    # Save model
    detector.save("meta_ensemble_model.pkl")
    
    return detector, metrics


if __name__ == "__main__":
    demo_meta_ensemble()
