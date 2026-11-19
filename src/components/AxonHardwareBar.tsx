import { memo, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, X } from 'lucide-react';
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
    // The outer wrapper is `relative` so the inspector popover can be positioned absolutely to the right.
    <div className="pointer-events-auto relative w-full">
      {/* ── Main Panel ─────────────────────────────────────────────── */}
      <div className="rounded-md border border-line bg-panel font-mono text-[10px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-2 py-1">
          <span className="font-semibold tracking-wider text-zinc-200">HARDWARE SUITE (8)</span>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-sm p-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>

        {/* Component list — fixed height, never grows into Severity zone */}
        {!collapsed && (
          <div className="divide-y divide-line/40">
            {AXON_HARDWARE_LIST.map((comp) => {
              const isSelected = selectedId === comp.id;
              return (
                <button
                  key={comp.id}
                  onClick={() => onSelect(isSelected ? null : comp.id)}
                  className={`flex w-full items-center justify-between px-2 py-1 text-left transition-colors ${
                    isSelected
                      ? 'bg-zinc-800/90 border-l-2 text-zinc-100'
                      : 'hover:bg-zinc-900/70 text-zinc-300'
                  }`}
                  style={{ borderLeftColor: isSelected ? comp.color : 'transparent' }}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: comp.color }}
                    />
                    <span className="font-bold text-[10px] tracking-wide text-zinc-200 shrink-0">{comp.code}</span>
                    <span className="truncate text-[9px] text-zinc-500">{comp.name}</span>
                  </div>
                  <span
                    className={`ml-1 shrink-0 rounded-sm px-1 py-px text-[7px] font-semibold ${
                      comp.tag === 'AXON'
                        ? 'border border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                        : 'border border-zinc-700 bg-zinc-800/80 text-zinc-500'
                    }`}
                  >
                    {comp.tag}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Inspector Popover — floats to the RIGHT, never stacks below ── */}
      {!collapsed && activeDef && (
        <div
          className="absolute top-0 left-[calc(100%+8px)] w-[210px] rounded-md border border-line bg-panel font-mono text-[9px] leading-relaxed z-10"
          style={{ borderLeftColor: activeDef.color, borderLeftWidth: 2 }}
        >
          {/* Popover header */}
          <div className="flex items-start justify-between border-b border-line/60 px-2 py-1.5">
            <div>
              <div className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: activeDef.color }}
                />
                <span className="font-bold text-[10px] text-zinc-100">{activeDef.code}</span>
                <span className="text-zinc-500">· {activeDef.name}</span>
              </div>
              <div className="mt-0.5 text-[8px] text-zinc-600">{activeDef.location}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onResetFocus}
                className="flex items-center gap-0.5 rounded-sm border border-line px-1 py-0.5 text-[8px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Reset 3D Camera"
              >
                <RotateCcw size={9} />
                <span>Reset</span>
              </button>
              <button
                onClick={() => onSelect(null)}
                className="rounded-sm p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                title="Close inspector"
              >
                <X size={10} />
              </button>
            </div>
          </div>

          {/* Live telemetry */}
          <div className="mx-2 mt-1.5 flex items-center justify-between rounded-sm border border-line/60 bg-canvas px-1.5 py-1">
            <span className="text-[8px] uppercase tracking-wider text-zinc-600">Live</span>
            <span className="font-semibold text-emerald-400 text-[9px] tabular-nums">
              {activeDef.getReading(sim)}
            </span>
          </div>

          {/* Measures */}
          <div className="px-2 pt-1.5 pb-0.5">
            <span className="font-semibold text-zinc-400">Measures: </span>
            <span className="text-zinc-500">{activeDef.measures}</span>
          </div>

          {/* Why it matters */}
          <div className="px-2 pb-2">
            <span className="font-semibold text-zinc-400">Why: </span>
            <span className="text-zinc-500">{activeDef.whyItMatters}</span>
          </div>
        </div>
      )}
    </div>
  );
});
