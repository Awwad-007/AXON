import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSimulator } from './sim/useSimulator';
import { useWalkthrough } from './sim/walkthrough';
import { makeShot } from './sim/shots';
import type { CameraShot, ShotName } from './sim/shots';
import { Viewport } from './components/Scene';
import { DashboardPane } from './components/Dashboard';
import { HeaderBar } from './components/HeaderBar';
import type { AppMode } from './components/HeaderBar';
import { InspectorDrawer } from './components/InspectorDrawer';
import { CONFIG } from './sim/config';
import type { SensorKit } from './sim/mounts';
import type { HardwareId } from './sim/hardwareSpecs';
import { ASSETS } from './sim/assets';
import type { AssetId } from './sim/assets';
import { useAnomaly } from './sim/useAnomaly';
import { useCalibration } from './sim/useCalibration';
import { useAgentFlow } from './sim/agentFlow';
import { MockPhoneUI } from './components/MockPhoneUI';
import { Tier1MicMode } from './components/Tier1MicMode';
import { AxonHardwareBar } from './components/AxonHardwareBar';
import { AXON_HARDWARE_LIST } from './sim/axonHardware';

/** Honesty banner. Always visible; tests/design-rules.test.ts asserts it is present. */
export const BANNER_TEXT = 'AXON · MSME PREDICTIVE MAINTENANCE · SYNTHETIC TELEMETRY · NO HARDWARE CONNECTED';

export default function App() {
  const { sim, snap, logs, paused, setPaused, muted, setMuted, alarms, setAlarms, unlock, resetSimulation, setAsset, appendLogs } = useSimulator();
  const [shot, setShot] = useState<CameraShot | null>(null);
  const [slowMo, setSlowMo] = useState(0.08);
  const [kit, setKit] = useState<SensorKit>(CONFIG.sensorKitDefault);
  const [xray, setXray] = useState(false);
  const [inspect, setInspect] = useState<HardwareId | null>(null);
  const closeInspector = useCallback(() => setInspect(null), []);
  // camera shots follow the active machine's tap points
  const assetRef = useRef<AssetId>(snap.asset);
  assetRef.current = snap.asset;
  const focus = useCallback((name: ShotName) => setShot(makeShot(name, assetRef.current)), []);
  // concept machines always carry the industrial kit; the bench rig can preview it from the inspector
  const effectiveKit: SensorKit = ASSETS[snap.asset].sensorKit === 'bench' ? kit : 'industrial';
  const ml = useAnomaly(sim, snap, appendLogs);
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const { walk, startWalkthrough, stopWalkthrough } = useWalkthrough(sim, focus, scrollTo, unlock, setXray);

  const [selectedHardwareId, setSelectedHardwareId] = useState<string | null>(null);

  const handleSelectHardware = useCallback(
    (id: string | null) => {
      setSelectedHardwareId(id);
      if (!id) {
        focus('home');
        return;
      }
      const def = AXON_HARDWARE_LIST.find((h) => h.id === id);
      if (def) {
        setShot({
          id: Date.now(),
          name: 'home',
          pos: def.shotPos,
          target: def.shotTarget,
        });
      }
    },
    [focus],
  );

  const resetAll = useCallback(() => {
    if (walk.active) stopWalkthrough();
    setSelectedHardwareId(null);
    resetSimulation();
    focus('home');
  }, [walk.active, stopWalkthrough, resetSimulation, focus]);

  const switchAsset = useCallback((id: AssetId) => {
    if (walk.active) stopWalkthrough();
    setSelectedHardwareId(null);
    setAsset(id);
    assetRef.current = id;
    setShot(makeShot('rig', id));
  }, [walk.active, stopWalkthrough, setAsset]);

  const [mode, setMode] = useState<AppMode>('axon-sim');
  const [showDemoGuide, setShowDemoGuide] = useState(true);

  useEffect(() => {
    if (mode === 'axon-sim') {
      setAsset('compressor');
    }
  }, []);

  const handleModeChange = useCallback((next: AppMode) => {
    setMode(next);
    setSelectedHardwareId(null);
    if (next === 'axon-sim') {
      setAsset('compressor');
      focus('home');
    } else if (next === 'scada') {
      setAsset('bench-dc');
      focus('home');
    }
  }, [setAsset, focus]);

  const calib = useCalibration(snap);
  const isAxonSim = mode === 'axon-sim';
  const dyn = isAxonSim ? calib.isDynamicAnomaly(snap) : { anomaly: false, reason: '' };

  // Human-readable machine names for the WhatsApp agent alerts
  const MACHINE_LABEL: Record<string, string> = {
    'compressor': 'MSME Compressor C-01',
    'bench-dc': 'Bench Rig B-01',
    'induction-05hp': 'Induction Motor M-01',
    'slurry-pump': 'Centrifugal Pump P-01',
    'helical-gearbox': 'Industrial Gearbox G-01',
  };
  const machineName = MACHINE_LABEL[snap.asset] ?? 'Machine';

  const agent = useAgentFlow({
    anomaly: isAxonSim ? dyn.anomaly : snap.state !== 'NORMAL',
    reason: isAxonSim ? dyn.reason : snap.stateLabel,
    machineName,
    onApprove: useCallback(() => {
      sim.setTarget('severity', 0);
      sim.resetRelay();
    }, [sim]),
    onReject: useCallback(() => {
      calib.widenEnvelope();
    }, [calib]),
  });

  const triggerTestAnomaly = useCallback(() => {
    unlock();
    sim.setTarget('severity', 0.85);
  }, [unlock, sim]);

  const resetAgentSession = useCallback(() => {
    agent.clearChat();
    resetAll();
  }, [agent, resetAll]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-canvas">
      <div className="flex h-[22px] shrink-0 items-center justify-center border-b border-line bg-canvas px-3" role="note">
        <span className="font-mono truncate text-[10px] tracking-[0.14em] text-amber-500/80">
          {BANNER_TEXT}
        </span>
      </div>
      <HeaderBar
        state={snap.state}
        activeShot={shot?.name ?? null}
        onFocus={focus}
        onReset={resetAll}
        walkActive={walk.active}
        onStartWalk={startWalkthrough}
        onStopWalk={stopWalkthrough}
        kit={effectiveKit}
        xray={xray}
        onXray={() => setXray((v) => !v)}
        mode={mode}
        onModeChange={handleModeChange}
      />
      {mode === 'axon-live' ? (
        <main className="relative min-h-0 flex-1 lg:h-[calc(100dvh-66px)]">
          <Tier1MicMode />
        </main>
      ) : mode === 'axon-sim' ? (
        <main className="relative min-h-0 flex-1 lg:h-[calc(100dvh-66px)]">
          <div className="relative h-full w-full">
            <Viewport
              sim={sim}
              snap={snap}
              paused={paused}
              onTogglePause={() => setPaused(!paused)}
              muted={muted}
              onToggleMute={() => setMuted(!muted)}
              alarms={alarms}
              onToggleAlarms={() => setAlarms(!alarms)}
              onUserGesture={unlock}
              shot={shot}
              onFocus={focus}
              walk={walk}
              onStopWalk={stopWalkthrough}
              slowMo={slowMo}
              kit={effectiveKit}
              xray={xray}
              selected={inspect}
              onSelect={setInspect}
              onAsset={switchAsset}
              isAxon={true}
              selectedComponentId={selectedHardwareId}
              onSelectComponent={handleSelectHardware}
            />
            {!walk.active && (
              <div className="pointer-events-none absolute left-3 top-14 z-30 w-[195px]">
                <AxonHardwareBar
                  selectedId={selectedHardwareId}
                  onSelect={handleSelectHardware}
                  sim={sim}
                  onResetFocus={() => handleSelectHardware(null)}
                />
              </div>
            )}
            {showDemoGuide && !walk.active && (
              <div className="pointer-events-auto absolute bottom-14 left-1/2 z-30 -translate-x-1/2 flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[10px] whitespace-nowrap">
                <span className="text-zinc-500 font-semibold tracking-wider uppercase">DEMO:</span>
                <span className="text-acc font-semibold">1.</span>
                <span className="text-zinc-300">Click <b className="text-zinc-100">Calibrate 7-Day</b></span>
                <span className="text-zinc-600">→</span>
                <span className="text-amber-400 font-semibold">2.</span>
                <span className="text-zinc-300">Click <b className="text-zinc-100">Test Anomaly</b></span>
                <span className="text-zinc-600">→</span>
                <span className="text-emerald-400 font-semibold">3.</span>
                <span className="text-zinc-300">Reply <b className="text-zinc-100">Yes</b> / <b className="text-zinc-100">No</b> on Phone</span>
                <button
                  onClick={() => setShowDemoGuide(false)}
                  className="ml-1 rounded-sm p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  aria-label="Dismiss demo guide"
                >
                  <X size={11} />
                </button>
              </div>
            )}
            <MockPhoneUI
              msgs={agent.msgs}
              typing={agent.typing}
              step={agent.step}
              calibrating={calib.calibrating}
              calibrated={calib.calibrated}
              calibProgress={calib.progress}
              calibDay={calib.day}
              stats={calib.stats}
              kMultiplier={calib.kMultiplier}
              onApprove={agent.handleApprove}
              onReject={agent.handleReject}
              onCalibrate={calib.calibrate}
              onTriggerAnomaly={triggerTestAnomaly}
              onReset={resetAgentSession}
            />
          </div>
        </main>
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[55%_45%] lg:h-[calc(100dvh-66px)] lg:grid-cols-[60%_40%] lg:grid-rows-1">
          <div className="relative min-h-0 border-b border-line lg:border-b-0 lg:border-r">
            <Viewport
              sim={sim}
              snap={snap}
              paused={paused}
              onTogglePause={() => setPaused(!paused)}
              muted={muted}
              onToggleMute={() => setMuted(!muted)}
              alarms={alarms}
              onToggleAlarms={() => setAlarms(!alarms)}
              onUserGesture={unlock}
              shot={shot}
              onFocus={focus}
              walk={walk}
              onStopWalk={stopWalkthrough}
              slowMo={slowMo}
              kit={effectiveKit}
              xray={xray}
              selected={inspect}
              onSelect={setInspect}
              onAsset={switchAsset}
              isAxon={false}
            />
          </div>
          <div className="relative min-h-0">
            <div className="scroll-thin h-full overflow-y-auto bg-canvas">
              <DashboardPane sim={sim} snap={snap} logs={logs} onUserGesture={unlock} slowMo={slowMo} onSlowMo={setSlowMo} kit={effectiveKit} onInspect={setInspect} ml={ml} walkScene={walk.active ? walk.scene : 0} />
            </div>
            <InspectorDrawer id={inspect} kit={effectiveKit} onKit={setKit} kitLocked={ASSETS[snap.asset].sensorKit !== 'bench'} snap={snap} onClose={closeInspector} />
          </div>
        </main>
      )}
    </div>
  );
}
