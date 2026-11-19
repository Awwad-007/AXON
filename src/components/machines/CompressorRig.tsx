import { memo, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Simulator } from '../../sim/engine';
import { Box, Cable, Cyl, useBraidTexture } from '../hardware/primitives';
import { useHeatMaterial, useMachineMotion } from './common';
import { AcousticSensor } from '../hardware/AcousticSensor';
import { PressureSensor } from '../hardware/PressureSensor';
import { VibrationPuck } from '../hardware/VibrationPuck';

// High-Fidelity MSME Reciprocating Air Compressor Rig (AXON).
// Features: Dual-cylinder finned cast-iron pump block, induction drive motor,
// ribbed vented belt guard with spoked flywheel, weld-seamed receiver vessel with inspection port,
// ASME safety valve, analog pressure gauge, local junction box, and procedural wiring.

export const COMPRESSOR_TAP = {
  acoustic: [0.35, 1.42, 0.12] as [number, number, number],
  pressure: [-0.65, 0.68, 0.28] as [number, number, number],
  vibration: [0.15, 1.38, -0.08] as [number, number, number],
  temp: [0.18, 1.15, 0.22] as [number, number, number],
};

function HexBolt({
  pos,
  r = 0.014,
  len = 0.02,
  axis = 'y',
  color = '#cbd5e1',
}: {
  pos: [number, number, number];
  r?: number;
  len?: number;
  axis?: 'x' | 'y' | 'z';
  color?: string;
}) {
  return <Cyl r={r} len={len} pos={pos} axis={axis} color={color} metal={0.88} rough={0.25} seg={6} cast={false} />;
}

export const CompressorRig = memo(function CompressorRig({
  sim,
  slowMo,
  hostRef,
  showLabels = false,
  selectedId = null,
  onSelectId,
}: {
  sim: Simulator;
  slowMo: number;
  hostRef: RefObject<THREE.Group>;
  showLabels?: boolean;
  selectedId?: string | null;
  onSelectId?: (id: string | null) => void;
}) {
  const rot = useRef<THREE.Group>(null);
  const { mach } = useMachineMotion(sim, slowMo, [{ ref: rot, ratio: 1.0 }]);
  const headMat = useHeatMaterial(sim, '#334155');
  const braid = useBraidTexture();

  // Cooling fins for the twin cylinders (stacked discs)
  const finDiscs = useMemo(() => [-0.1, -0.06, -0.02, 0.02, 0.06, 0.1], []);

  // VB-01 Vibration pod mount on drive motor bearing housing
  const puckMount = useMemo(
    () => ({
      pos: [-0.72, 1.08, 0] as [number, number, number],
      normal: [-1, 0, 0] as [number, number, number],
      axis: [0, 1, 0] as [number, number, number],
    }),
    []
  );

  // Local junction box position on deck plate
  const jBoxPos: [number, number, number] = [-0.08, 0.88, 0.22];

  // 1. VB-01 (Vibration Pod) Cable: Cyan (#38bdf8) -> JB-01
  const vbCablePoints = useMemo<[number, number, number][]>(
    () => [
      [-0.72, 1.08, 0],
      [-0.72, 1.2, 0.1],
      [-0.5, 1.15, 0.18],
      [-0.28, 0.98, 0.22],
      [jBoxPos[0] - 0.09, jBoxPos[1] + 0.04, jBoxPos[2]],
    ],
    [jBoxPos]
  );

  // 2. CT-01 (Current Clamp) Cable: Amber (#f59e0b) -> JB-01
  const ctCablePoints = useMemo<[number, number, number][]>(
    () => [
      [-0.45, 1.28, 0.14],
      [-0.38, 1.12, 0.2],
      [-0.22, 0.96, 0.22],
      [jBoxPos[0] - 0.06, jBoxPos[1] + 0.04, jBoxPos[2]],
    ],
    [jBoxPos]
  );

  // 3. TP-01 (Temperature Probe) Cable: Rose (#f43f5e) -> JB-01
  const tpCablePoints = useMemo<[number, number, number][]>(
    () => [
      [0.18, 1.18, 0.2],
      [0.12, 1.04, 0.24],
      [0.02, 0.94, 0.23],
      [jBoxPos[0] + 0.04, jBoxPos[1] + 0.04, jBoxPos[2]],
    ],
    [jBoxPos]
  );

  // 4. AE-01 (Acoustic Sensor) Cable: Emerald (#10b981) -> JB-01
  const aeCablePoints = useMemo<[number, number, number][]>(
    () => [
      [COMPRESSOR_TAP.acoustic[0], COMPRESSOR_TAP.acoustic[1] + 0.15, COMPRESSOR_TAP.acoustic[2]],
      [COMPRESSOR_TAP.acoustic[0], COMPRESSOR_TAP.acoustic[1] + 0.28, COMPRESSOR_TAP.acoustic[2] + 0.06],
      [0.22, 1.35, 0.24],
      [0.08, 1.1, 0.25],
      [jBoxPos[0] + 0.09, jBoxPos[1] + 0.04, jBoxPos[2]],
    ],
    [jBoxPos]
  );

  // 5. PT-01 (Pressure Transducer) Cable: Violet (#a78bfa) -> JB-01
  const ptCablePoints = useMemo<[number, number, number][]>(
    () => [
      [COMPRESSOR_TAP.pressure[0], COMPRESSOR_TAP.pressure[1] + 0.28, COMPRESSOR_TAP.pressure[2]],
      [COMPRESSOR_TAP.pressure[0] + 0.08, COMPRESSOR_TAP.pressure[1] + 0.35, COMPRESSOR_TAP.pressure[2]],
      [-0.42, 0.94, 0.26],
      [-0.22, 0.9, 0.23],
      [jBoxPos[0] - 0.09, jBoxPos[1] - 0.02, jBoxPos[2]],
    ],
    [jBoxPos]
  );

  // 6. JB-01 to NODE-01 Thick Braided Trunk Conduit
  const trunkConduitPoints = useMemo<[number, number, number][]>(
    () => [
      [jBoxPos[0], jBoxPos[1] - 0.07, jBoxPos[2]],
      [jBoxPos[0], 0.65, jBoxPos[2] + 0.1],
      [-0.06, 0.38, 0.45],
      [0.02, 0.15, 0.85],
      [0.1, 0.05, 1.35],
      [0.2, -0.05, 1.78],
    ],
    [jBoxPos]
  );

  return (
    <group ref={hostRef}>
      {/* Vibrating compressor assembly */}
      <group ref={mach}>
        {/* --- Horizontal Air Receiver Tank (Heavy Pressure Vessel) --- */}
        <Cyl r={0.38} len={2.3} pos={[0, 0.42, 0]} axis="x" color="#1e293b" metal={0.72} rough={0.38} seg={36} />

        {/* Tank circumferential weld seams */}
        <mesh position={[-1.14, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.382, 0.012, 16, 36]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[1.14, 0.42, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.382, 0.012, 16, 36]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Tank dished ellipsoidal end-caps */}
        <mesh position={[-1.15, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.38} />
        </mesh>
        <mesh position={[1.15, 0.42, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.72} roughness={0.38} />
        </mesh>

        {/* Tank Inspection Port / Handhole Cover on front */}
        <group position={[0, 0.42, 0.38]}>
          <Cyl r={0.09} len={0.02} pos={[0, 0, 0.005]} axis="z" color="#334155" metal={0.75} rough={0.35} seg={24} />
          {/* 6 perimeter hex bolts */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i * Math.PI) / 3;
            return (
              <HexBolt
                key={i}
                pos={[Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0.018]}
                axis="z"
                r={0.008}
                len={0.014}
              />
            );
          })}
        </group>

        {/* Bottom brass condensate drain petcock */}
        <group position={[0, 0.035, 0]}>
          <Cyl r={0.018} len={0.04} pos={[0, 0, 0]} color="#b45309" metal={0.85} rough={0.25} />
          <Box size={[0.04, 0.01, 0.014]} pos={[0, -0.025, 0]} color="#b45309" metal={0.85} rough={0.25} />
        </group>

        {/* Top ASME Safety Relief Valve with brass pull-ring */}
        <group position={[0.55, 0.86, -0.05]}>
          <Cyl r={0.024} len={0.08} pos={[0, 0, 0]} color="#b45309" metal={0.85} rough={0.25} seg={16} />
          <Cyl r={0.014} len={0.03} pos={[0, 0.05, 0]} color="#b45309" metal={0.85} rough={0.25} seg={12} />
          {/* Brass ring */}
          <mesh position={[0, 0.075, 0]}>
            <torusGeometry args={[0.018, 0.004, 12, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Heavy Tank saddle legs with reinforcing gusset plates */}
        {[-0.65, 0.65].map((x, i) => (
          <group key={i}>
            <Box size={[0.14, 0.36, 0.68]} pos={[x, 0.18, 0]} color="#334155" metal={0.65} rough={0.45} />
            {/* Saddle reinforcing side gussets */}
            <Box size={[0.02, 0.28, 0.64]} pos={[x - 0.065, 0.16, 0]} color="#1e293b" metal={0.7} rough={0.4} />
            <Box size={[0.02, 0.28, 0.64]} pos={[x + 0.065, 0.16, 0]} color="#1e293b" metal={0.7} rough={0.4} />
            {/* Rubber vibration dampers */}
            <Cyl r={0.065} len={0.04} pos={[x, 0.02, 0.3]} color="#0a0a0c" metal={0.05} rough={0.95} />
            <Cyl r={0.065} len={0.04} pos={[x, 0.02, -0.3]} color="#0a0a0c" metal={0.05} rough={0.95} />
            {/* Hold-down anchor bolts */}
            <HexBolt pos={[x, 0.045, 0.3]} r={0.016} len={0.02} />
            <HexBolt pos={[x, 0.045, -0.3]} r={0.016} len={0.02} />
          </group>
        ))}

        {/* Machined Tank Top Channel Deck Bedplate */}
        <Box size={[1.56, 0.05, 0.62]} pos={[-0.05, 0.825, 0]} color="#475569" metal={0.78} rough={0.28} />
        {/* Hold-down hex bolts on deck plate */}
        {[
          [-0.75, 0.28],
          [0.65, 0.28],
          [-0.75, -0.28],
          [0.65, -0.28],
        ].map(([hx, hz], i) => (
          <HexBolt key={i} pos={[hx, 0.855, hz]} r={0.014} len={0.018} />
        ))}

        {/* --- Electric Drive Motor --- */}
        <group position={[-0.45, 1.06, 0]}>
          {/* Motor main casing */}
          <Cyl r={0.185} len={0.54} pos={[0, 0, 0]} axis="x" color="#334155" metal={0.68} rough={0.38} seg={32} />
          {/* Longitudinal deep cooling ribs */}
          {[-0.18, -0.1, -0.02, 0.06, 0.14].map((x, i) => (
            <Cyl key={i} r={0.205} len={0.025} pos={[x, 0, 0]} axis="x" color="#1e293b" metal={0.72} rough={0.32} seg={32} />
          ))}
          {/* Motor end bells & bearing hubs */}
          <Cyl r={0.178} len={0.06} pos={[-0.29, 0, 0]} axis="x" color="#475569" metal={0.65} rough={0.35} seg={28} />
          <Cyl r={0.178} len={0.06} pos={[0.29, 0, 0]} axis="x" color="#475569" metal={0.65} rough={0.35} seg={28} />
          {/* Motor top lifting eye bolt */}
          <mesh position={[0, 0.22, 0]}>
            <torusGeometry args={[0.024, 0.005, 12, 24]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Motor terminal junction box with embossed lid */}
          <Box size={[0.15, 0.11, 0.13]} pos={[0, 0.2, 0.08]} color="#1e293b" metal={0.55} rough={0.45} />
          <Box size={[0.13, 0.015, 0.11]} pos={[0, 0.26, 0.08]} color="#334155" metal={0.65} rough={0.35} />
        </group>

        {/* --- Twin-Cylinder Compressor Pump Head --- */}
        <group position={[0.28, 0.98, 0]}>
          {/* Cast-iron crankcase housing */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.42, 0.3, 0.38]} />
            <primitive object={headMat} attach="material" />
          </mesh>
          {/* Crankcase oil level sight glass with brass bezel */}
          <Cyl r={0.032} len={0.015} pos={[0.215, 0.06, 0]} axis="x" color="#b45309" metal={0.85} rough={0.25} />
          <Cyl r={0.024} len={0.005} pos={[0.222, 0.06, 0]} axis="x" color="#cbd5e1" metal={0.9} rough={0.1} />

          {/* Left Cylinder Barrel + Stacked Fin Plates */}
          <group position={[-0.095, 0.34, 0]}>
            <Cyl r={0.098} len={0.26} pos={[0, 0, 0]} color="#475569" metal={0.8} rough={0.28} seg={28} />
            {finDiscs.map((y, i) => (
              <Cyl key={i} r={0.138} len={0.014} pos={[0, y, 0]} color="#334155" metal={0.78} rough={0.32} seg={28} />
            ))}
            {/* Cylinder head plate */}
            <mesh position={[0, 0.14, 0]} castShadow>
              <boxGeometry args={[0.23, 0.045, 0.23]} />
              <primitive object={headMat} attach="material" />
            </mesh>
            {/* 8 hex bolts on cylinder head */}
            {[
              [-0.09, -0.09], [0, -0.09], [0.09, -0.09],
              [-0.09, 0], [0.09, 0],
              [-0.09, 0.09], [0, 0.09], [0.09, 0.09],
            ].map(([bx, bz], i) => (
              <HexBolt key={i} pos={[bx, 0.165, bz]} r={0.009} len={0.014} />
            ))}
            {/* Heavy-duty Intake air filter canister */}
            <Cyl r={0.058} len={0.11} pos={[0, 0.22, 0.08]} color="#0f172a" metal={0.3} rough={0.7} seg={20} />
            {/* Filter retaining wingnut */}
            <Cyl r={0.012} len={0.02} pos={[0, 0.28, 0.08]} color="#cbd5e1" metal={0.85} rough={0.25} />
          </group>

          {/* Right Cylinder Barrel + Stacked Fin Plates */}
          <group position={[0.095, 0.34, 0]}>
            <Cyl r={0.098} len={0.26} pos={[0, 0, 0]} color="#475569" metal={0.8} rough={0.28} seg={28} />
            {finDiscs.map((y, i) => (
              <Cyl key={i} r={0.138} len={0.014} pos={[0, y, 0]} color="#334155" metal={0.78} rough={0.32} seg={28} />
            ))}
            {/* Cylinder head plate */}
            <mesh position={[0, 0.14, 0]} castShadow>
              <boxGeometry args={[0.23, 0.045, 0.23]} />
              <primitive object={headMat} attach="material" />
            </mesh>
            {/* 8 hex bolts on cylinder head */}
            {[
              [-0.09, -0.09], [0, -0.09], [0.09, -0.09],
              [-0.09, 0], [0.09, 0],
              [-0.09, 0.09], [0, 0.09], [0.09, 0.09],
            ].map(([bx, bz], i) => (
              <HexBolt key={i} pos={[bx, 0.165, bz]} r={0.009} len={0.014} />
            ))}
            {/* Heavy-duty Intake air filter canister */}
            <Cyl r={0.058} len={0.11} pos={[0, 0.22, 0.08]} color="#0f172a" metal={0.3} rough={0.7} seg={20} />
            {/* Filter retaining wingnut */}
            <Cyl r={0.012} len={0.02} pos={[0, 0.28, 0.08]} color="#cbd5e1" metal={0.85} rough={0.25} />
          </group>

          {/* High-Pressure Copper Discharge Bridge Pipe */}
          <Cyl r={0.026} len={0.26} pos={[0, 0.48, -0.04]} axis="x" color="#b45309" metal={0.88} rough={0.22} />
          {/* Manifold brass unions and downpipe */}
          <Cyl r={0.034} len={0.04} pos={[-0.1, 0.48, -0.04]} axis="x" color="#d97706" metal={0.85} rough={0.25} seg={6} />
          <Cyl r={0.034} len={0.04} pos={[0.1, 0.48, -0.04]} axis="x" color="#d97706" metal={0.85} rough={0.25} seg={6} />
          <Cyl r={0.026} len={0.34} pos={[0.12, 0.32, -0.16]} color="#b45309" metal={0.88} rough={0.22} />
        </group>

        {/* --- Vented Belt Guard & Rotating Flywheel --- */}
        <group position={[0, 1.05, -0.32]}>
          {/* Heavy Sheetmetal Guard Body with Louver Ribs */}
          <Box size={[1.12, 0.54, 0.06]} pos={[-0.08, 0, 0]} color="#1e293b" metal={0.65} rough={0.45} />
          {/* Perimeter wire frame */}
          <Box size={[1.14, 0.03, 0.08]} pos={[-0.08, 0.26, 0]} color="#475569" metal={0.75} rough={0.35} />
          <Box size={[1.14, 0.03, 0.08]} pos={[-0.08, -0.26, 0]} color="#475569" metal={0.75} rough={0.35} />

          {/* Front Ventilation Screen Texture / Mesh Bars */}
          {[-0.4, -0.25, -0.1, 0.05, 0.2, 0.35].map((vx, i) => (
            <Box key={i} size={[0.015, 0.46, 0.01]} pos={[vx, 0, 0.032]} color="#334155" metal={0.7} rough={0.4} />
          ))}

          {/* Rotating Motor Pulley & Compressor Flywheel */}
          <group ref={rot}>
            {/* Motor small drive pulley */}
            <Cyl r={0.095} len={0.09} pos={[-0.45, 0, 0.02]} axis="z" color="#64748b" metal={0.85} rough={0.25} seg={28} />
            {/* Compressor large bladed flywheel */}
            <Cyl r={0.25} len={0.09} pos={[0.28, 0.03, 0.02]} axis="z" color="#475569" metal={0.78} rough={0.32} seg={36} />
            {/* Flywheel fan cooling spokes */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i * Math.PI) / 3;
              return (
                <Box
                  key={i}
                  size={[0.21, 0.028, 0.07]}
                  pos={[0.28 + Math.cos(ang) * 0.11, 0.03 + Math.sin(ang) * 0.11, 0.02]}
                  color="#334155"
                  metal={0.75}
                  rough={0.35}
                />
              );
            })}
          </group>
        </group>

        {/* --- Analog Pressure Gauge on Tank Top --- */}
        <group position={[-0.65, 0.88, 0.22]}>
          {/* Brass mounting stem */}
          <Cyl r={0.02} len={0.08} pos={[0, -0.04, 0]} color="#b45309" metal={0.85} rough={0.25} />
          {/* Black stainless bezel */}
          <Cyl r={0.085} len={0.035} pos={[0, 0.02, 0]} axis="z" color="#0f172a" metal={0.8} rough={0.3} seg={28} />
          {/* White dial face with tick marks */}
          <Cyl r={0.076} len={0.006} pos={[0, 0.02, 0.02]} axis="z" color="#f8fafc" metal={0.1} rough={0.2} seg={28} />
          {/* Needle pointer */}
          <Box size={[0.008, 0.05, 0.004]} pos={[0.015, 0.035, 0.025]} color="#ef4444" metal={0.5} rough={0.5} />
        </group>

        {/* --- Local Die-Cast Aluminum Junction Box (JB-01) --- */}
        <group position={jBoxPos}>
          <Box
            size={[0.22, 0.14, 0.14]}
            pos={[0, 0, 0]}
            color={selectedId === 'jb01' ? '#38bdf8' : '#27272a'}
            metal={0.7}
            rough={0.3}
          />
          {/* Incoming glands for all 5 sensor cables */}
          <Cyl r={0.014} len={0.025} pos={[-0.11, 0.04, 0.03]} axis="x" color="#38bdf8" metal={0.4} rough={0.6} />
          <Cyl r={0.014} len={0.025} pos={[-0.11, 0.04, -0.03]} axis="x" color="#f59e0b" metal={0.4} rough={0.6} />
          <Cyl r={0.014} len={0.025} pos={[0.11, 0.04, 0.03]} axis="x" color="#10b981" metal={0.4} rough={0.6} />
          <Cyl r={0.014} len={0.025} pos={[0.11, 0.04, -0.03]} axis="x" color="#f43f5e" metal={0.4} rough={0.6} />
          <Cyl r={0.014} len={0.025} pos={[-0.11, -0.03, 0]} axis="x" color="#a78bfa" metal={0.4} rough={0.6} />
          {/* Main heavy braided trunk gland at bottom */}
          <Cyl r={0.028} len={0.035} pos={[0, -0.07, 0]} color="#111827" metal={0.5} rough={0.5} />
        </group>

        {/* --- CT-01 Current Clamp on Motor Power Conduit --- */}
        <group position={[-0.45, 1.28, 0.14]} rotation={[0, 0, Math.PI / 4]}>
          <mesh castShadow>
            <torusGeometry args={[0.045, 0.018, 12, 28]} />
            <meshStandardMaterial
              color={selectedId === 'ct01' ? '#f59e0b' : '#1e3a8a'}
              metalness={0.25}
              roughness={0.5}
            />
          </mesh>
          <Box size={[0.025, 0.04, 0.02]} pos={[0.045, 0, 0]} color="#d97706" metal={0.8} rough={0.3} />
        </group>

        {/* --- TP-01 Temperature Sensor Probe on Cylinder Casting --- */}
        <group position={[0.18, 1.18, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <Cyl
            r={0.014}
            len={0.12}
            pos={[0, 0, 0]}
            color={selectedId === 'tp01' ? '#f43f5e' : '#cbd5e1'}
            metal={0.9}
            rough={0.25}
          />
          <Cyl r={0.018} len={0.025} pos={[0, 0.05, 0]} color="#9ca3af" metal={0.8} rough={0.3} />
        </group>

        {/* --- Procedural Wiring Cables connecting Sensors to Junction Box --- */}
        {/* VB-01 Vibration cable: Cyan */}
        <Cable points={vbCablePoints} radius={selectedId === 'vb01' ? 0.016 : 0.011} color="#38bdf8" metal={0.3} rough={0.6} />
        {/* CT-01 Current clamp cable: Amber */}
        <Cable points={ctCablePoints} radius={selectedId === 'ct01' ? 0.016 : 0.011} color="#f59e0b" metal={0.3} rough={0.6} />
        {/* TP-01 Temperature probe cable: Rose */}
        <Cable points={tpCablePoints} radius={selectedId === 'tp01' ? 0.016 : 0.010} color="#f43f5e" metal={0.3} rough={0.6} />
        {/* AE-01 Acoustic sensor cable: Emerald */}
        <Cable points={aeCablePoints} radius={selectedId === 'ae01' ? 0.016 : 0.011} color="#10b981" metal={0.3} rough={0.6} />
        {/* PT-01 Pressure transducer cable: Violet */}
        <Cable points={ptCablePoints} radius={selectedId === 'pt01' ? 0.016 : 0.011} color="#a78bfa" metal={0.3} rough={0.6} />
        {/* Thick Braided Trunk Conduit directly from JB-01 into NODE-01 */}
        <Cable points={trunkConduitPoints} radius={selectedId === 'jb01' ? 0.026 : 0.02} texture={braid} color="#e2e8f0" metal={0.7} rough={0.35} />

        {/* --- Mounted AXON MSME Sensors --- */}
        {/* Acoustic sensor on discharge bridge */}
        <AcousticSensor pos={COMPRESSOR_TAP.acoustic} rot={[0, 0, 0]} active={sim.live.vibMeas > 1.8} showLabel={false} />

        {/* Piezoresistive pressure sensor on tank manifold */}
        <PressureSensor pos={COMPRESSOR_TAP.pressure} rot={[0, 0, 0]} showLabel={false} />

        {/* VB-01 Industrial Vibration Puck on drive motor bearing housing */}
        <VibrationPuck mount={puckMount} />

        {/* 3D ID Pills for Mounted Components */}
        {showLabels && [
          { id: 'vb01', code: 'VB-01', color: '#38bdf8', pos: [-0.72, 1.36, 0] as [number, number, number] },
          { id: 'ct01', code: 'CT-01', color: '#f59e0b', pos: [-0.45, 1.52, 0.14] as [number, number, number] },
          { id: 'tp01', code: 'TP-01', color: '#f43f5e', pos: [0.18, 1.4, 0.2] as [number, number, number] },
          { id: 'ae01', code: 'AE-01', color: '#10b981', pos: [0.35, 1.66, 0.12] as [number, number, number] },
          { id: 'pt01', code: 'PT-01', color: '#a78bfa', pos: [-0.65, 0.92, 0.28] as [number, number, number] },
          { id: 'jb01', code: 'JB-01', color: '#94a3b8', pos: [-0.08, 1.08, 0.22] as [number, number, number] },
        ].map((pill) => (
          <Html
            key={pill.id}
            position={pill.pos}
            center
            distanceFactor={13}
            className="pointer-events-auto select-none cursor-pointer"
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectId?.(selectedId === pill.id ? null : pill.id);
              }}
              className="flex flex-col items-center group"
            >
              <div
                className={`flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[9px] font-semibold whitespace-nowrap transition-transform duration-150 hover:scale-105 ${
                  selectedId === pill.id
                    ? 'border-white bg-[#18181b] text-white ring-1 ring-white/50'
                    : 'border-line bg-[#111317]/95 text-zinc-300 hover:border-zinc-500'
                }`}
                style={{ borderColor: selectedId === pill.id ? pill.color : undefined }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ backgroundColor: pill.color }} />
                <span>{pill.code}</span>
              </div>
              <div className="h-2 w-px bg-zinc-600/70" />
            </div>
          </Html>
        ))}
      </group>
    </group>
  );
});
