import { memo, useRef, useEffect, useState } from 'react';
import {
  Check,
  X,
  Wrench,
  Clock,
  Wifi,
  Battery,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ChatMsg } from '../sim/agentFlow';
import type { CalibrationStats } from '../sim/useCalibration';

export interface MockPhoneProps {
  msgs: ChatMsg[];
  typing: boolean;
  step: string;
  calibrating: boolean;
  calibrated: boolean;
  calibProgress: number;
  calibDay: number;
  stats: CalibrationStats;
  kMultiplier: number;
  onApprove: () => void;
  onReject: () => void;
  onCalibrate: () => void;
  onTriggerAnomaly: () => void;
  onReset: () => void;
}

export const MockPhoneUI = memo(function MockPhoneUI({
  msgs,
  typing,
  step,
  calibrating,
  calibrated,
  calibProgress,
  calibDay,
  stats,
  kMultiplier,
  onApprove,
  onReject,
  onCalibrate,
  onTriggerAnomaly,
  onReset,
}: MockPhoneProps) {
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs, typing]);

  const stepStatus =
    step === 'ANOMALY_DETECTED'
      ? 'Analyzing telemetry...'
      : step === 'SCHEDULING'
      ? 'Finding idle shift window...'
      : step === 'LOGISTICS'
      ? 'Searching local parts & tech...'
      : step === 'COMMS'
      ? 'Formatting alert dispatch...'
      : step === 'WAITING_USER_APPROVAL'
      ? 'Awaiting owner approval'
      : step === 'BOOKED'
      ? 'Work order confirmed'
      : 'Online · Factory Mesh';

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[350px] max-w-[calc(100vw-32px)]">
      {/* Phone Outer Chassis */}
      <div className="rounded-md border border-line bg-panel p-1.5">
        {/* Phone Top Bezel with Speaker & Camera */}
        <div className="flex h-5 items-center justify-between px-2 text-[10px] text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span>14:32</span>
          </div>
          {/* Speaker ear slit */}
          <div className="h-1 w-10 rounded-sm bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className="text-zinc-400" />
            <span className="font-mono text-[9px]">4G</span>
            <Battery size={11} className="text-zinc-400" />
          </div>
        </div>

        {/* WhatsApp App Header */}
        <div className="flex items-center justify-between border-b border-line bg-canvas px-3 py-2">
          <div className="flex items-center gap-2.5">
            {/* Contact Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-800 text-zinc-200">
              <Wrench size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-100">AXON Plant Agent</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-ok">[VERIFIED]</span>
              </div>
              <div className="truncate text-[10px] text-zinc-400 font-mono">
                {stepStatus}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded-sm border border-line p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            title={minimized ? 'Expand Phone' : 'Minimize Phone'}
          >
            {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Dynamic Baseline Envelope Ribbon */}
        <div className="flex items-center justify-between border-b border-line bg-zinc-900/60 px-3 py-1.5 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Sliders size={11} className="text-acc" />
            <span>
              Baseline: <span className="text-zinc-200">{calibrated ? `+${kMultiplier.toFixed(1)}s Envelope` : 'Uncalibrated'}</span>
            </span>
          </div>
          <div className="text-zinc-500">
            Vib lim: <span className="text-zinc-300">{stats.vib.upper.toFixed(2)} mm/s</span>
          </div>
        </div>

        {/* Collapsible Body */}
        {!minimized && (
          <>
            {/* Calibration Progress Bar (when running 7-day fast-forward) */}
            {calibrating && (
              <div className="border-b border-line bg-zinc-900 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
                  <span>7-Day Baseline Calibration</span>
                  <span className="text-acc">Day {calibDay} of 7 ({calibProgress}%)</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-sm bg-zinc-800">
                  <div
                    className="h-full rounded-sm bg-acc transition-all duration-150"
                    style={{ width: `${calibProgress}%` }}
                  />
                </div>
                <div className="mt-1 text-[9px] font-mono text-zinc-500">
                  Sampling factory acoustic, vibration & pressure envelope...
                </div>
              </div>
            )}

            {/* Chat Messages Body */}
            <div
              ref={scrollRef}
              className="scroll-thin h-[280px] space-y-2.5 overflow-y-auto bg-canvas p-2.5"
            >
              {msgs.map((m) => {
                if (m.sender === 'system') {
                  return (
                    <div key={m.id} className="my-1.5 text-center">
                      <span className="inline-block rounded-sm border border-line bg-zinc-900 px-2 py-0.5 font-mono text-[9px] text-zinc-500">
                        {m.text}
                      </span>
                    </div>
                  );
                }

                const isAgent = m.sender === 'agent';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-md border p-2 text-xs leading-relaxed ${
                        isAgent
                          ? 'border-zinc-800 bg-[#16191f] text-zinc-200'
                          : 'border-emerald-800 bg-[#063828] text-zinc-100'
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.text}</div>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[9px] font-mono text-zinc-500">
                        <span>{m.time}</span>
                        {!isAgent && <Check size={10} className="text-ok" />}
                      </div>
                    </div>

                    {/* Interactive Action Buttons attached to message */}
                    {m.actions && step === 'WAITING_USER_APPROVAL' && (
                      <div className="mt-2 flex w-full gap-2">
                        <button
                          onClick={onApprove}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-emerald-600 bg-emerald-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-100 hover:bg-emerald-700"
                        >
                          <Check size={13} />
                          <span>Yes (Approve)</span>
                        </button>
                        <button
                          onClick={onReject}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-line bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                        >
                          <X size={13} />
                          <span>No (False Alarm)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typing && (
                <div className="flex items-center gap-1 rounded-sm border border-zinc-800 bg-[#16191f] px-2.5 py-1.5 text-zinc-400">
                  <span className="font-mono text-[10px]">AXON Agent is typing</span>
                  <span className="animate-pulse font-mono text-xs">...</span>
                </div>
              )}
            </div>

            {/* Quick Actions Tray */}
            <div className="border-t border-line bg-panel p-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onCalibrate}
                  disabled={calibrating}
                  className="flex flex-1 items-center justify-center gap-1 rounded-sm border border-line bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                  title="Run 7-day fast-forward baseline calibration"
                >
                  <Clock size={12} />
                  <span>Calibrate 7-Day</span>
                </button>
                <button
                  onClick={onTriggerAnomaly}
                  className="flex flex-1 items-center justify-center gap-1 rounded-sm border border-amber-900/60 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-900/50"
                  title="Inject valve leakage anomaly to test agent workflow"
                >
                  <AlertTriangle size={12} />
                  <span>Test Anomaly</span>
                </button>
                <button
                  onClick={onReset}
                  className="flex items-center justify-center rounded-sm border border-line bg-zinc-800 p-1 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  title="Reset Agent Session"
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
