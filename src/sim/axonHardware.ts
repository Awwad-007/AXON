import type { Simulator } from './engine';

export type HardwareTag = 'CORE' | 'AXON';

export interface AxonHardwareDef {
  id: string;
  code: string;
  tag: HardwareTag;
  name: string;
  location: string;
  measures: string;
  whyItMatters: string;
  color: string;
  cableColor: string;
  pos: [number, number, number];
  pillOffset: [number, number, number];
  shotPos: [number, number, number];
  shotTarget: [number, number, number];
  getReading: (sim: Simulator) => string;
}

export const AXON_HARDWARE_LIST: AxonHardwareDef[] = [
  {
    id: 'vb01',
    code: 'VB-01',
    tag: 'CORE',
    name: 'Vibration Pod',
    location: 'Drive Motor Bearing',
    measures: 'Triaxial velocity RMS (mm/s) & high-frequency impact acceleration.',
    whyItMatters: 'Detects mechanical unbalance, shaft angular misalignment, and bearing raceway spalling before catastrophic seizure.',
    color: '#38bdf8',
    cableColor: '#38bdf8',
    pos: [-0.72, 1.08, 0],
    pillOffset: [0, 0.28, 0],
    shotPos: [-0.3, 1.6, 1.4],
    shotTarget: [-0.72, 1.08, 0],
    getReading: (sim) => `${sim.live.vibMeas.toFixed(2)} mm/s RMS (1X: ${(sim.live.rpm / 60).toFixed(1)} Hz)`,
  },
  {
    id: 'ct01',
    code: 'CT-01',
    tag: 'CORE',
    name: 'Current Clamp',
    location: 'Motor Power Conduit',
    measures: 'AC phase current (Amperes) & real motor electrical loading.',
    whyItMatters: 'Corroborates mechanical drag vs. electrical stall; rejects false transient mechanical knocks.',
    color: '#f59e0b',
    cableColor: '#f59e0b',
    pos: [-0.45, 1.28, 0.14],
    pillOffset: [0, 0.24, 0],
    shotPos: [0.0, 1.7, 1.4],
    shotTarget: [-0.45, 1.28, 0.14],
    getReading: (sim) => `${sim.live.current.toFixed(1)} A (${(sim.live.current * 230).toFixed(0)} W)`,
  },
  {
    id: 'tp01',
    code: 'TP-01',
    tag: 'CORE',
    name: 'Temp Sensor',
    location: 'Cylinder Head Casting',
    measures: 'Thermodynamic heat rise & casing thermal equilibrium (°C).',
    whyItMatters: 'Monitors friction heat buildup, valve leakage heating, and prevents oil lubrication viscosity breakdown.',
    color: '#f43f5e',
    cableColor: '#f43f5e',
    pos: [0.18, 1.18, 0.2],
    pillOffset: [0, 0.22, 0],
    shotPos: [0.6, 1.6, 1.3],
    shotTarget: [0.18, 1.18, 0.2],
    getReading: (sim) => `${sim.live.temp.toFixed(1)} °C`,
  },
  {
    id: 'ae01',
    code: 'AE-01',
    tag: 'AXON',
    name: 'Acoustic Sensor',
    location: 'Discharge Valve Bridge',
    measures: 'High-frequency ultrasonic acoustic emissions (20–48 kHz).',
    whyItMatters: 'Captures micro-acoustic emissions from reed valve flutter, blow-by, and cylinder head gasket micro-leaks.',
    color: '#10b981',
    cableColor: '#10b981',
    pos: [0.35, 1.42, 0.12],
    pillOffset: [0.18, 0.24, 0.08],
    shotPos: [0.85, 1.85, 1.2],
    shotTarget: [0.35, 1.42, 0.12],
    getReading: (sim) => `${(sim.live.vibMeas * 0.42 + 0.12).toFixed(2)} rel dB (28.4 kHz)`,
  },
  {
    id: 'pt01',
    code: 'PT-01',
    tag: 'AXON',
    name: 'Pressure Transducer',
    location: 'Receiver Manifold',
    measures: 'Piezoresistive gauge air pressure (0–16 bar).',
    whyItMatters: 'Tracks compression cycle stability, tank hold-pressure decay, and delivery valve seal efficiency.',
    color: '#a78bfa',
    cableColor: '#a78bfa',
    pos: [-0.65, 0.68, 0.28],
    pillOffset: [-0.18, 0.24, 0],
    shotPos: [-0.2, 1.1, 1.4],
    shotTarget: [-0.65, 0.68, 0.28],
    getReading: (sim) => `${(8.2 - (sim.live.state === 'CRITICAL' ? 3.8 : 0)).toFixed(1)} bar gauge`,
  },
  {
    id: 'jb01',
    code: 'JB-01',
    tag: 'AXON',
    name: 'Junction Box',
    location: 'Compressor Bedplate Deck',
    measures: 'Local cable consolidation & mechanical strain relief.',
    whyItMatters: 'Consolidates all 4 sensor wires into a single braided industrial trunk to eliminate factory EMI and wire snagging.',
    color: '#94a3b8',
    cableColor: '#475569',
    pos: [-0.08, 0.88, 0.22],
    pillOffset: [0, 0.2, 0],
    shotPos: [0.4, 1.3, 1.3],
    shotTarget: [-0.08, 0.88, 0.22],
    getReading: () => '4/4 Sensor Channels Terminated',
  },
  {
    id: 'node01',
    code: 'NODE-01',
    tag: 'CORE',
    name: 'ESP32 Edge Node',
    location: 'Enclosure Base Plate',
    measures: 'Online Welford baseline math & ESP-NOW mesh packet generation.',
    whyItMatters: 'Runs 10 Hz statistical baseline algorithms on-chip to detect anomalies locally without cloud roundtrips.',
    color: '#38bdf8',
    cableColor: '#38bdf8',
    pos: [0.2, -0.11, 2.35],
    pillOffset: [0, 0.32, 0],
    shotPos: [0.9, 0.65, 3.2],
    shotTarget: [0.2, -0.11, 2.35],
    getReading: () => 'Dynamic 3σ Baseline · Loop 50ms',
  },
  {
    id: 'gw01',
    code: 'GW-01',
    tag: 'AXON',
    name: 'Gateway Hub',
    location: 'Factory Wall Mount',
    measures: 'ESP-NOW mesh packet reception & Cloud agent dispatch.',
    whyItMatters: 'Bridges offline shopfloor mesh to cloud Swarm. Dispatches automated WhatsApp workflows upon 3σ anomaly triggers.',
    color: '#10b981',
    cableColor: '#10b981',
    pos: [-1.85, 1.35, -1.9],
    pillOffset: [0, 0.42, 0],
    shotPos: [-0.8, 1.9, -0.6],
    shotTarget: [-1.85, 1.35, -1.9],
    getReading: () => 'ESP-NOW Mesh Sync · -52 dBm RSSI',
  },
];
