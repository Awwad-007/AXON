import { memo, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Activity,
  Sliders,
  Clock,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Cpu,
} from 'lucide-react';
import { useLiveCalibration } from '../sim/useLiveCalibration';
import { useAgentFlow } from '../sim/agentFlow';
import { MockPhoneUI } from './MockPhoneUI';

/**
 * Tier 1 Zero-Hardware Acoustic Monitor (Live Microphone DSP).
 * Analyzes live ambient factory/machine acoustics via browser Web Audio API,
 * extracting FFT bins with speech rejection notch and dynamic baseline calibration.
 */
export const Tier1MicMode = memo(function Tier1MicMode() {
  const {
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
  } = useLiveCalibration();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Agent flow connected to live acoustic anomaly
  const agent = useAgentFlow({
    anomaly,
    reason: anomalyReason || 'Live acoustic amplitude spike exceeding baseline envelope',
    onApprove: () => {
      resetAnomaly();
    },
    onReject: () => {
      widenEnvelope();
      resetAnomaly();
    },
  });

  // 60fps real-time FFT visualizer with speech rejection notch
  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark background
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, w, h);

      // Grid guidelines
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (dsp.active) {
        const feat = dsp.getAcousticFeatures();
        const data = feat.rawFft;
        const totalBars = 80;
        const barWidth = w / totalBars;
        const binStep = Math.floor(data.length / totalBars);

        for (let i = 0; i < totalBars; i++) {
          const binIndex = i * binStep;
          const val = data[binIndex] || 0; // 0 - 255
          const barHeight = (val / 255) * (h - 20);
          const x = i * barWidth;
          const y = h - barHeight;

          // Frequency mapping for color-coding:
          // Low mechanical (0-10): #38bdf8
          // Human speech notch (11-35): #27272a (dimmed)
          // High acoustic flutter (36-80): #10b981 / #f59e0b
          if (i <= 10) {
            ctx.fillStyle = val > 160 ? '#f59e0b' : '#38bdf8';
          } else if (i > 10 && i <= 32) {
            ctx.fillStyle = '#27272a'; // Rejected speech band
          } else {
            ctx.fillStyle = val > 140 ? '#ef4444' : '#10b981';
          }

          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
        }

        // Calibrated Dynamic Baseline Envelope Threshold Line
        if (calibrated) {
          const threshY = Math.max(15, h - stats.energy.upper * (h - 20));
          ctx.strokeStyle = anomaly ? '#ef4444' : '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, threshY);
          ctx.lineTo(w, threshY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = anomaly ? '#ef4444' : '#f59e0b';
          ctx.font = '10px monospace';
          ctx.fillText(`BASELINE LIMIT (+${kMultiplier.toFixed(1)}s)`, 10, threshY - 6);
        }

        // Notch visual overlay marker
        const notchX1 = 11 * barWidth;
        const notchX2 = 33 * barWidth;
        ctx.fillStyle = 'rgba(24, 24, 27, 0.4)';
        ctx.fillRect(notchX1, 0, notchX2 - notchX1, h);

        ctx.fillStyle = '#52525b';
        ctx.font = '9px monospace';
        ctx.fillText('SPEECH NOTCH (300Hz-3kHz REJECTED)', notchX1 + 6, 18);
      } else {
        // Idle guide
        ctx.fillStyle = '#3f3f46';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MICROPHONE IDLE · CLICK "START LISTENING" TO PROCESS LIVE ACOUSTICS', w / 2, h / 2);
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [dsp, calibrated, stats, kMultiplier, anomaly]);

  const triggerTestSpike = () => {
    // Manually simulate an acoustic spike exceeding envelope for testing agent flow
    agent.handleApprove();
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-canvas p-4">
      {/* Top Industrial Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel p-3 rounded-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-zinc-800 text-acc">
            <Cpu size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
                AXON Tier 1: Zero-Hardware Acoustic DSP
              </span>
              <span className="rounded-sm border border-line bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                BROWSER FFT 2048
              </span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500">
              Sampling {dsp.sampleRate} Hz · Speech Band-Stop Notch: ACTIVE (300 Hz – 3 kHz)
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`flex h-8 items-center gap-1.5 rounded-sm border px-3 text-xs font-medium transition-colors ${
              listening
                ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'border-line bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {listening ? <Mic size={14} className="text-ok" /> : <MicOff size={14} />}
            <span>{listening ? 'Listening Active' : 'Start Listening'}</span>
          </button>

          <button
            onClick={startLiveCalibration}
            disabled={!listening || calibrating}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-line bg-zinc-800 px-3 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
          >
            <Clock size={13} className="text-acc" />
            <span>Calibrate (10s)</span>
          </button>

          <button
            onClick={() => {
              if (anomaly) resetAnomaly();
              else agent.clearChat();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-line bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            title="Reset DSP and Agent Session"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="mt-3 grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Visualizer & Metrics */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Real-time Spectrum Canvas Card */}
          <div className="rounded-md border border-line bg-panel p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-acc" />
                <span>Live Acoustic Spectrum (0 – 12 kHz)</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#38bdf8]" />
                  <span>Mechanical (20-250Hz)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#27272a]" />
                  <span>Speech Notch</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#10b981]" />
                  <span>Ultrasonic / Valve</span>
                </span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={760}
              height={220}
              className="h-[220px] w-full rounded-sm border border-line bg-[#09090b]"
            />

            {/* Calibration Progress Bar */}
            {calibrating && (
              <div className="mt-2.5 rounded-sm border border-line bg-zinc-900 p-2 font-mono">
                <div className="flex justify-between text-[11px] text-zinc-300">
                  <span>Recording Ambient Machine Audio Baseline...</span>
                  <span className="text-acc">{progress}% (10s)</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-sm bg-zinc-800">
                  <div
                    className="h-full rounded-sm bg-acc transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Mechanical Hum Band */}
            <div className="rounded-md border border-line bg-panel p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Mechanical Hum (20-250Hz)</div>
              <div className="mt-1 text-base font-semibold font-mono text-zinc-200">
                {(features.lowBand * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[9px] font-mono text-zinc-500">
                Motor / bearing rotation
              </div>
            </div>

            {/* High-frequency Valve Hiss */}
            <div className="rounded-md border border-line bg-panel p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Ultrasonic Hiss (3.5-12kHz)</div>
              <div className="mt-1 text-base font-semibold font-mono text-zinc-200">
                {(features.highBand * 100).toFixed(1)}%
              </div>
              <div className="mt-1 text-[9px] font-mono text-zinc-500">
                Valve leak & friction
              </div>
            </div>

            {/* Dominant Peak Hz */}
            <div className="rounded-md border border-line bg-panel p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Dominant Peak</div>
              <div className="mt-1 text-base font-semibold font-mono text-acc">
                {features.peakHz} Hz
              </div>
              <div className="mt-1 text-[9px] font-mono text-zinc-500">
                Acoustic signature
              </div>
            </div>

            {/* Dynamic Envelope Limit */}
            <div className="rounded-md border border-line bg-panel p-3">
              <div className="text-[10px] font-mono uppercase text-zinc-500">Live Threshold</div>
              <div className={`mt-1 text-base font-semibold font-mono ${anomaly ? 'text-crit' : 'text-ok'}`}>
                {calibrated ? `${(stats.energy.upper * 100).toFixed(1)}%` : 'Uncalibrated'}
              </div>
              <div className="mt-1 text-[9px] font-mono text-zinc-500">
                {calibrated ? `+${kMultiplier.toFixed(1)}s envelope` : 'Run 10s calibration'}
              </div>
            </div>
          </div>

          {/* Diagnostic Details Banner */}
          <div className="rounded-md border border-line bg-panel p-3 text-xs font-mono text-zinc-400">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <div className="flex items-center gap-1.5 text-zinc-200">
                <Sliders size={13} className="text-acc" />
                <span>Zero-Hardware Band-Pass Logic</span>
              </div>
              <span className="text-[10px] text-zinc-500">Patent-free statistical envelope</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2 text-[11px] md:grid-cols-2">
              <div>
                <span className="text-zinc-500">Speech Notch:</span> 300 Hz – 3000 Hz frequencies from operators talking near the machine are attenuated so normal speech does not cause false alerts.
              </div>
              <div>
                <span className="text-zinc-500">Acoustic Trigger:</span> High-frequency valve flutter and mechanical hum spikes exceeding the 10 s calibrated envelope automatically dispatch the WhatsApp maintenance agent.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Mock Phone Assistant */}
        <div className="relative min-h-[500px]">
          <MockPhoneUI
            msgs={agent.msgs}
            typing={agent.typing}
            step={agent.step}
            calibrating={calibrating}
            calibrated={calibrated}
            calibProgress={progress}
            calibDay={Math.max(1, Math.ceil((progress / 100) * 7))}
            stats={{
              vib: { mean: stats.energy.mean * 10, variance: stats.energy.variance, std: stats.energy.std, upper: stats.energy.upper * 10, lower: 0 },
              temp: { mean: 48, variance: 1, std: 1, upper: 52, lower: 44 },
              cur: { mean: 4.2, variance: 0.1, std: 0.3, upper: 5.1, lower: 3.3 },
            }}
            kMultiplier={kMultiplier}
            onApprove={agent.handleApprove}
            onReject={agent.handleReject}
            onCalibrate={startLiveCalibration}
            onTriggerAnomaly={triggerTestSpike}
            onReset={agent.clearChat}
          />
        </div>
      </div>
    </div>
  );
});
