import { useCallback, useEffect, useRef, useState } from 'react';
import type { Snapshot } from './engine';

export interface Envelope {
  mean: number;
  variance: number;
  std: number;
  upper: number;
  lower: number;
}

export interface CalibrationStats {
  vib: Envelope;
  temp: Envelope;
  cur: Envelope;
}

const DEFAULT_ENV: Envelope = {
  mean: 1.2,
  variance: 0.04,
  std: 0.2,
  upper: 1.8,
  lower: 0.6,
};

/**
 * 7-Day Unsupervised Baseline Calibration Hook (AXON MSME).
 * Fast-forwards 7 days in 10 s, computing mean and variance to define dynamic normal envelopes.
 */
export function useCalibration(snap: Snapshot) {
  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(true); // Default calibrated for immediate interactivity
  const [progress, setProgress] = useState(100);
  const [day, setDay] = useState(7);
  const [kMultiplier, setK] = useState(3.0); // k-sigma envelope threshold

  const samples = useRef<{ vib: number[]; temp: number[]; cur: number[] }>({
    vib: [],
    temp: [],
    cur: [],
  });

  const [stats, setStats] = useState<CalibrationStats>({
    vib: { mean: 1.2, variance: 0.04, std: 0.2, upper: 1.8, lower: 0.6 },
    temp: { mean: 48, variance: 2.25, std: 1.5, upper: 52.5, lower: 43.5 },
    cur: { mean: 4.2, variance: 0.09, std: 0.3, upper: 5.1, lower: 3.3 },
  });

  const calcEnvelope = useCallback((arr: number[], k: number): Envelope => {
    if (!arr.length) return DEFAULT_ENV;
    const n = arr.length;
    const mean = arr.reduce((acc, v) => acc + v, 0) / n;
    const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / Math.max(1, n - 1);
    const std = Math.sqrt(variance);
    return {
      mean,
      variance,
      std,
      upper: mean + k * std,
      lower: Math.max(0, mean - k * std),
    };
  }, []);

  const calibrate = useCallback(() => {
    setCalibrating(true);
    setCalibrated(false);
    setProgress(0);
    setDay(1);
    samples.current = { vib: [], temp: [], cur: [] };
  }, []);

  // Collect samples during the 10-second (7-day simulated) calibration run
  useEffect(() => {
    if (!calibrating) return;

    // Collect sensor values at 10 Hz
    const timer = setInterval(() => {
      samples.current.vib.push(snap.vib);
      samples.current.temp.push(snap.temp);
      samples.current.cur.push(snap.current);

      const total = samples.current.vib.length;
      // 100 samples = 10 seconds total
      const pct = Math.min(100, Math.round((total / 100) * 100));
      const curDay = Math.min(7, Math.max(1, Math.ceil((total / 100) * 7)));
      setProgress(pct);
      setDay(curDay);

      if (total >= 100) {
        clearInterval(timer);
        setCalibrating(false);
        setCalibrated(true);

        const vEnv = calcEnvelope(samples.current.vib, kMultiplier);
        const tEnv = calcEnvelope(samples.current.temp, kMultiplier);
        const cEnv = calcEnvelope(samples.current.cur, kMultiplier);

        setStats({ vib: vEnv, temp: tEnv, cur: cEnv });
      }
    }, 100);

    return () => clearInterval(timer);
  }, [calibrating, snap.vib, snap.temp, snap.current, calcEnvelope, kMultiplier]);

  // Widen envelope on false alarm ("No" clicked by user)
  const widenEnvelope = useCallback(() => {
    setK((prevK) => {
      const nextK = prevK + 0.6;
      setStats((prev) => ({
        vib: { ...prev.vib, upper: prev.vib.mean + nextK * prev.vib.std },
        temp: { ...prev.temp, upper: prev.temp.mean + nextK * prev.temp.std },
        cur: { ...prev.cur, upper: prev.cur.mean + nextK * prev.cur.std },
      }));
      return nextK;
    });
  }, []);

  // Check if live telemetry exceeds the dynamic baseline envelope
  const isDynamicAnomaly = useCallback(
    (s: Snapshot): { anomaly: boolean; reason: string } => {
      if (!calibrated) return { anomaly: false, reason: '' };
      if (s.vib > stats.vib.upper) {
        return {
          anomaly: true,
          reason: `Vibration ${s.vib.toFixed(2)} mm/s exceeds dynamic upper limit ${stats.vib.upper.toFixed(2)} mm/s (+${kMultiplier}s)`,
        };
      }
      if (s.temp > stats.temp.upper) {
        return {
          anomaly: true,
          reason: `Head temperature ${s.temp.toFixed(1)} C exceeds baseline envelope ${stats.temp.upper.toFixed(1)} C`,
        };
      }
      if (s.current > stats.cur.upper) {
        return {
          anomaly: true,
          reason: `Motor current ${s.current.toFixed(2)} A exceeds dynamic baseline limit ${stats.cur.upper.toFixed(2)} A`,
        };
      }
      return { anomaly: false, reason: '' };
    },
    [calibrated, stats, kMultiplier]
  );

  return {
    calibrating,
    calibrated,
    progress,
    day,
    kMultiplier,
    stats,
    calibrate,
    widenEnvelope,
    isDynamicAnomaly,
  };
}
