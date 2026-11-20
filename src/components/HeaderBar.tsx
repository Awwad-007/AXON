import { Play, RotateCcw, ScanEye, Square } from 'lucide-react';
import type { HealthState } from '../sim/engine';
import type { ShotName } from '../sim/shots';
import type { SensorKit } from '../sim/mounts';
import { ViewMenu } from './ViewMenu';

export const NODE_ID = 'AXON-EDGE-01';

/** Official GitHub Octocat silhouette mark */
function GithubIcon({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const DOT: Record<HealthState, string> = { NORMAL: 'bg-ok', EARLY: 'bg-warn', CRITICAL: 'bg-crit' };
const STATE_WORD: Record<HealthState, string> = { NORMAL: 'Normal', EARLY: 'Advisory', CRITICAL: 'Critical' };

/** hardware camera presets shown in the header; ids map to shots in src/sim/shots.ts */
export function cameraPresets(kit: SensorKit): { id: ShotName; label: string }[] {
  return [
    { id: 'rig', label: 'Full Rig' },
    { id: 'nodeMacro', label: 'Edge Node' },
    { id: 'puck', label: 'Vibration Pod' },
    // the bench kit has no clamp: the same shot frames the in-line Hall module
    { id: 'clamp', label: kit === 'industrial' ? 'Current Clamp' : 'Current Sensor' },
  ];
}

export type AppMode = 'scada' | 'axon-sim' | 'axon-live';

interface HeaderBarProps {
  state: HealthState;
  activeShot: ShotName | null;
  onFocus: (name: ShotName) => void;
  onReset: () => void;
  walkActive: boolean;
  onStartWalk: () => void;
  onStopWalk: () => void;
  kit: SensorKit;
  xray: boolean;
  onXray: () => void;
  mode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
  isAxon?: boolean;
  onToggleAxon?: () => void;
}

const ghost = 'flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-line px-2.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100';

export function HeaderBar({ state, activeShot, onFocus, onReset, walkActive, onStartWalk, onStopWalk, kit, xray, onXray, mode = 'axon-sim', onModeChange, isAxon, onToggleAxon }: HeaderBarProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-canvas px-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold tracking-tight text-zinc-100">AXON</span>
        <span className="font-mono text-[11px] text-zinc-500">v1.0</span>
      </div>

      {(onModeChange || onToggleAxon) && (
        <div className="flex h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-line" role="group" aria-label="System View">
          <button
            onClick={() => onModeChange ? onModeChange('scada') : onToggleAxon?.()}
            aria-pressed={mode === 'scada'}
            className={`px-2.5 text-xs font-medium transition-colors ${mode === 'scada' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
          >
            SCADA
          </button>
          <button
            onClick={() => onModeChange ? onModeChange('axon-sim') : onToggleAxon?.()}
            aria-pressed={mode === 'axon-sim'}
            className={`border-l border-line px-2.5 text-xs font-medium transition-colors ${mode === 'axon-sim' ? 'bg-zinc-800 text-acc' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
          >
            AXON SIM
          </button>
          <button
            onClick={() => onModeChange ? onModeChange('axon-live') : onToggleAxon?.()}
            aria-pressed={mode === 'axon-live'}
            className={`border-l border-line px-2.5 text-xs font-medium transition-colors ${mode === 'axon-live' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
          >
            AXON LIVE MIC
          </button>
        </div>
      )}

      <div
        className="flex h-7 items-center gap-2 rounded-md border border-line px-2.5"
        title="Simulated node. No hardware connected."
        role="status"
        aria-label={`Simulated node ${NODE_ID}: ${STATE_WORD[state]}`}
      >
        <span className={`h-2 w-2 rounded-full ${DOT[state]}`} />
        <span className="font-mono text-[11px] text-zinc-400">Node: {NODE_ID}</span>
        <span className="hidden font-mono text-[11px] text-zinc-500 2xl:inline">· {STATE_WORD[state]}</span>
      </div>

      <div className="mx-auto flex items-center">
        <a
          href="https://github.com/Awwad-007/AXON"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 shrink-0 items-center gap-2 whitespace-nowrap rounded-[4px] bg-[#10b981] px-3.5 py-1.5 text-xs font-bold tracking-wider text-[#09090b] transition-colors hover:bg-[#34d399]"
        >
          <GithubIcon size={14} className="shrink-0" />
          <span>CLICK HERE TO VIEW GITHUB REPO</span>
          <GithubIcon size={14} className="shrink-0" />
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* below 1500 px the presets + X-ray collapse into one View menu so no label is ever truncated */}
        <div className="min-[1500px]:hidden">
          <ViewMenu presets={cameraPresets(kit)} activeShot={activeShot} onFocus={onFocus} xray={xray} onXray={onXray} />
        </div>
        <div className="hidden h-7 shrink-0 items-stretch overflow-hidden rounded-md border border-line min-[1500px]:flex" role="group" aria-label="Camera presets">
          {cameraPresets(kit).map((p, i) => (
            <button
              key={p.id}
              onClick={() => onFocus(p.id)}
              aria-pressed={activeShot === p.id}
              className={`whitespace-nowrap px-2.5 text-xs transition-colors ${i > 0 ? 'border-l border-line' : ''} ${activeShot === p.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          className={`${ghost} hidden min-[1500px]:flex ${xray ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : ''}`}
          onClick={onXray}
          aria-pressed={xray}
          title="X-ray / open enclosure: host machine at 25% wireframe, node lid slides open"
        >
          <ScanEye size={12} />X-Ray
        </button>

        {walkActive ? (
          <button className={ghost} onClick={onStopWalk} aria-label="Stop walkthrough"><Square size={12} />Stop<span className="hidden xl:inline"> walkthrough</span></button>
        ) : (
          <button className={ghost} onClick={onStartWalk} title="Evaluator walkthrough" aria-label="Evaluator walkthrough"><Play size={12} />Walkthrough</button>
        )}
        <button className={ghost} onClick={onReset} title="Restore the boot state: setpoints, interlock, logs and capture" aria-label="Reset Simulation">
          <RotateCcw size={12} />Reset<span className="hidden xl:inline"> Simulation</span>
        </button>
      </div>
    </header>
  );
}
