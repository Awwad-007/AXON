import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioDSP } from './audioDSP';
import type { AcousticFeatures } from './audioDSP';

export interface LiveEnvelope {
  mean: number;
  variance: number;
  std: number;
  upper: number;
}

export interface LiveCalibrationStats {
  energy: LiveEnvelope;
  low: LiveEnvelope;
  high: LiveEnvelope;
}

const DEFAULT_LIVE_ENV: LiveEnvelope = {
  mean: 0.12,
  variance: 0.0016,
  std: 0.04,
  upper: 0.24,
};

/**
 * Live Audio Calibration Hook (Tier 1 Zero-Hardware).
 * Samples real-time microphone FFT features at 10 Hz, recording a 10 s baseline
 * to compute statistical mean and variance for dynamic envelope anomaly detection.
 */
export function useLiveCalibration() {
  const dspRef = useRef<AudioDSP | null>(null);
  if (!dspRef.current) dspRef.current = new AudioDSP();
  const dsp = dspRef.current;

  const [listening, setListening] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [progress, setProgress] = useState(0);
  const [kMultiplier, setK] = useState(3.0);
  const [anomaly, setAnomaly] = useState(false);
  const [anomalyReason, setReason] = useState('');

  const [features, setFeatures] = useState<AcousticFeatures>({
    rawFft: new Uint8Array(1024),
    lowBand: 0,
    speechBand: 0,
    highBand: 0,
    filteredEnergy: 0,
    peakHz: 0,
    rms: 0,
  });

  const [stats, setStats] = useState<LiveCalibrationStats>({
    energy: DEFAULT_LIVE_ENV,
    low: { mean: 0.08, variance: 0.0009, std: 0.03, upper: 0.17 },
    high: { mean: 0.05, variance: 0.0004, std: 0.02, upper: 0.11 },
  });

  const samples = useRef<{ energy: number[]; low: number[]; high: number[] }>({
    energy: [],
    low: [],
    high: [],
  });

  const calcEnv = useCallback((arr: number[], k: number): LiveEnvelope => {
    if (!arr.length) return DEFAULT_LIVE_ENV;
    const n = arr.length;
    const mean = arr.reduce((acc, v) => acc + v, 0) / n;
    const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(1, n - 1);
    const std = Math.sqrt(variance);
    return {
      mean,
      variance,
      std,
      upper: mean + k * Math.max(std, 0.02), // minimum noise floor guard
    };
  }, []);

  const toggleListening = useCallback(async () => {
    if (listening) {
      dsp.stop();
      setListening(false);
      setCalibrating(false);
      setAnomaly(false);
    } else {
      const ok = await dsp.start();
      if (ok) setListening(true);
    }
  }, [listening, dsp]);

  const startLiveCalibration = useCallback(() => {
    if (!listening) return;
    setCalibrating(true);
    setCalibrated(false);
    setProgress(0);
    setAnomaly(false);
    samples.current = { energy: [], low: [], high: [] };
  }, [listening]);

  const widenEnvelope = useCallback(() => {
    setK((prevK) => {
      const nextK = prevK + 0.6;
      setStats((prev) => ({
        energy: { ...prev.energy, upper: prev.energy.mean + nextK * prev.energy.std },
        low: { ...prev.low, upper: prev.low.mean + nextK * prev.low.std },
        high: { ...prev.high, upper: prev.high.mean + nextK * prev.high.std },
      }));
      return nextK;
    });
    setAnomaly(false);
  }, []);

  const resetAnomaly = useCallback(() => {
    setAnomaly(false);
    setReason('');
  }, []);

  // 10 Hz sampling and dynamic anomaly evaluation
  useEffect(() => {
    if (!listening) return;

    let persistCount = 0;
    const timer = setInterval(() => {
      const feat = dsp.getAcousticFeatures();
      setFeatures(feat);

      if (calibrating) {
        samples.current.energy.push(feat.filteredEnergy);
        samples.current.low.push(feat.lowBand);
        samples.current.high.push(feat.highBand);

        const total = samples.current.energy.length;
        const pct = Math.min(100, Math.round((total / 100) * 100));
        setProgress(pct);

        if (total >= 100) {
          setCalibrating(false);
          setCalibrated(true);

          const energyEnv = calcEnv(samples.current.energy, kMultiplier);
          const lowEnv = calcEnv(samples.current.low, kMultiplier);
          const highEnv = calcEnv(samples.current.high, kMultiplier);

          setStats({ energy: energyEnv, low: lowEnv, high: highEnv });
        }
      } else if (calibrated) {
        // Evaluate dynamic envelope breach
        const breach = feat.filteredEnergy > stats.energy.upper;
        if (breach) {
          persistCount++;
          if (persistCount >= 2) {
            setAnomaly(true);
            setReason(
              `Live acoustic energy ${(feat.filteredEnergy * 100).toFixed(1)}% exceeded +${kMultiplier.toFixed(1)}s baseline threshold (${(stats.energy.upper * 100).toFixed(1)}%) at ${feat.peakHz} Hz`
            );
          }
        } else {
          persistCount = 0;
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [listening, calibrating, calibrated, dsp, kMultiplier, stats, calcEnv]);

  return {
    dsp,
    listening,
    calibrating,
    calibrated,
    progress,
    kMultiplier,
    features,
    stats,
    anomaly,
    anomalyReason,
    toggleListening,
    startLiveCalibration,
    widenEnvelope,
    resetAnomaly,
  };
}
