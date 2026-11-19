import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { Simulator } from '../sim/engine';
import { AXON_HARDWARE_LIST } from '../sim/axonHardware';
import type { AxonHardwareDef } from '../sim/axonHardware';

interface AxonHardwareBarProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  sim: Simulator;
  onResetFocus: () => void;
}

export const AxonHardwareBar = memo(function AxonHardwareBar({
  selectedId,
  onSelect,
  sim,
  onResetFocus,
}: AxonHardwareBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeDef: AxonHardwareDef | undefined = AXON_HARDWARE_LIST.find((h) => h.id === selectedId);

  return (
    <div className="pointer-events-auto w-full rounded-md border border-line bg-panel font-mono text-[11px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5">
        <div className="flex flex-col">
          <span className="font-semibold tracking-wider text-zinc-200">HARDWARE SUITE (8)</span>
          <span className="text-[9px] text-zinc-500">Click to inspect &amp; focus</span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-sm p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title={collapsed ? 'Expand Hardware Suite' : 'Collapse Hardware Suite'}
        >
          {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* List of 8 Components */}
          <div className="divide-y divide-line/60 max-h-[220px] overflow-y-auto scroll-thin">
            {AXON_HARDWARE_LIST.map((comp) => {
              const isSelected = selectedId === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => onSelect(isSelected ? null : comp.id)}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/90 border-l-2 text-zinc-100'
                      : 'hover:bg-zinc-900/70 text-zinc-300'
                  }`}
                  style={{ borderLeftColor: isSelected ? comp.color : 'transparent' }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: comp.color }}
                    />
                    <span className="font-bold text-[10px] tracking-wide text-zinc-200">{comp.code}</span>
                    <span className="truncate text-[10px] text-zinc-400">{comp.name}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-sm px-1 py-px text-[8px] font-semibold ${
                      comp.tag === 'AXON'
                        ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                        : 'border border-zinc-700 bg-zinc-800/80 text-zinc-400'
                    }`}
                  >
                    {comp.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Component Details Inspector */}
          {activeDef ? (
            <div className="border-t border-line bg-canvas p-2.5 text-[10px] leading-relaxed">
              <div className="mb-1.5 flex items-start justify-between gap-1 border-b border-line/60 pb-1">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-100">{activeDef.code}</span>
                    <span className="text-zinc-400">· {activeDef.name}</span>
                  </div>
                  <div className="text-[9px] text-zinc-500">{activeDef.location}</div>
                </div>
                <button
                  onClick={onResetFocus}
                  className="flex items-center gap-1 rounded-sm border border-line px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors shrink-0"
                  title="Reset 3D Camera"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              </div>

              {/* Live Reading */}
              <div className="mb-2 flex items-center justify-between rounded-sm border border-line/80 bg-panel px-1.5 py-1">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500">Live Telemetry</span>
                <span className="font-semibold text-emerald-400 text-[10px]">
                  {activeDef.getReading(sim)}
                </span>
              </div>

              {/* What it measures */}
              <div className="mb-1">
                <span className="font-semibold text-zinc-300">Measures: </span>
                <span className="text-zinc-400">{activeDef.measures}</span>
              </div>

              {/* Why it matters */}
              <div>
                <span className="font-semibold text-zinc-300">Why it matters: </span>
                <span className="text-zinc-400">{activeDef.whyItMatters}</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-line/60 px-2.5 py-1.5 text-center text-[9px] text-zinc-500">
              Select any component above to inspect &amp; focus
            </div>
          )}
        </>
      )}
    </div>
  );
});
