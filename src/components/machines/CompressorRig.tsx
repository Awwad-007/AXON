import { memo, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import type { Simulator } from '../../sim/engine';
import { Box, Cyl } from '../hardware/primitives';
import { useHeatMaterial, useMachineMotion } from './common';
import { AcousticSensor } from '../hardware/AcousticSensor';
import { PressureSensor } from '../hardware/PressureSensor';
import { VibrationPuck } from '../hardware/VibrationPuck';

// Procedural MSME Reciprocating Air Compressor Rig (AXON).
// Horizontal air receiver tank, top-mounted twin-cylinder compressor pump,
// industrial induction motor, belt drive with vented safety guard,
// and mounted AXON acoustic + pressure + vibration telemetry sensors.

export const COMPRESSOR_TAP = {
  acoustic: [0.35, 1.42, 0.12] as [number, number, number],
  pressure: [-0.65, 0.68, 0.28] as [number, number, number],
  vibration: [0.15, 1.38, -0.08] as [number, number, number],
  temp: [0.18, 1.15, 0.22] as [number, number, number],
};

export const CompressorRig = memo(function CompressorRig({
  sim,
  slowMo,
  hostRef,
}: {
  sim: Simulator;
  slowMo: number;
  hostRef: RefObject<THREE.Group>;
}) {
  const rot = useRef<THREE.Group>(null);
  const { mach } = useMachineMotion(sim, slowMo, [{ ref: rot, ratio: 1.0 }]);
  const headMat = useHeatMaterial(sim, '#334155');

  // Cooling fins for the twin cylinders
  const finDiscs = useMemo(() => [-0.08, -0.04, 0, 0.04, 0.08], []);

  const puckMount = useMemo(
    () => ({
      pos: COMPRESSOR_TAP.vibration,
      normal: [0, 1, 0] as [number, number, number],
      axis: [1, 0, 0] as [number, number, number],
    }),
    []
  );

  return (
    <group ref={hostRef}>
      {/* Vibrating compressor assembly */}
      <group ref={mach}>
        {/* Horizontal Air Receiver Tank */}
        <Cyl r={0.38} len={2.3} pos={[0, 0.42, 0]} axis="x" color="#1e293b" metal={0.7} rough={0.4} seg={32} />
        {/* Tank dished end-caps */}
        <mesh position={[-1.15, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[1.15, 0.42, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <sphereGeometry args={[0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Tank saddle legs & rubber isolators */}
        {[-0.65, 0.65].map((x, i) => (
          <group key={i}>
            <Box size={[0.12, 0.36, 0.64]} pos={[x, 0.18, 0]} color="#334155" metal={0.6} rough={0.5} />
            <Cyl r={0.06} len={0.04} pos={[x, 0.02, 0.28]} color="#0f172a" metal={0.1} rough={0.9} />
            <Cyl r={0.06} len={0.04} pos={[x, 0.02, -0.28]} color="#0f172a" metal={0.1} rough={0.9} />
          </group>
        ))}

        {/* Tank Top Deck Plate */}
        <Box size={[1.5, 0.04, 0.58]} pos={[-0.05, 0.82, 0]} color="#475569" metal={0.75} rough={0.3} />

        {/* --- Electric Drive Motor --- */}
        <group position={[-0.45, 1.05, 0]}>
          {/* Motor main casing */}
          <Cyl r={0.18} len={0.52} pos={[0, 0, 0]} axis="x" color="#334155" metal={0.65} rough={0.4} seg={28} />
          {/* Motor cooling ribs */}
          {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
            <Cyl key={i} r={0.195} len={0.02} pos={[x, 0, 0]} axis="x" color="#1e293b" metal={0.7} rough={0.3} seg={24} />
          ))}
          {/* Motor end bells */}
          <Cyl r={0.175} len={0.06} pos={[-0.28, 0, 0]} axis="x" color="#475569" metal={0.6} rough={0.4} seg={24} />
          <Cyl r={0.175} len={0.06} pos={[0.28, 0, 0]} axis="x" color="#475569" metal={0.6} rough={0.4} seg={24} />
          {/* Motor terminal junction box */}
          <Box size={[0.14, 0.1, 0.12]} pos={[0, 0.19, 0.08]} color="#1e293b" metal={0.5} rough={0.5} />
        </group>

        {/* --- Twin-Cylinder Compressor Pump Head --- */}
        <group position={[0.28, 0.98, 0]}>
          {/* Crankcase housing */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.38, 0.28, 0.36]} />
            <primitive object={headMat} attach="material" />
          </mesh>
          {/* Oil level sight glass */}
          <Cyl r={0.026} len={0.015} pos={[0.195, 0.05, 0]} axis="x" color="#cbd5e1" metal={0.9} rough={0.1} />

          {/* Left Cylinder + Fin Stack */}
          <group position={[-0.09, 0.32, 0]}>
            <Cyl r={0.095} len={0.24} pos={[0, 0, 0]} color="#475569" metal={0.8} rough={0.3} seg={24} />
            {finDiscs.map((y, i) => (
              <Cyl key={i} r={0.13} len={0.012} pos={[0, y, 0]} color="#334155" metal={0.75} rough={0.35} seg={24} />
            ))}
            {/* Cylinder head plate */}
            <mesh position={[0, 0.13, 0]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.22]} />
              <primitive object={headMat} attach="material" />
            </mesh>
            {/* Intake air filter canister */}
            <Cyl r={0.055} len={0.09} pos={[0, 0.2, 0.08]} color="#0f172a" metal={0.2} rough={0.8} seg={16} />
          </group>

          {/* Right Cylinder + Fin Stack */}
          <group position={[0.09, 0.32, 0]}>
            <Cyl r={0.095} len={0.24} pos={[0, 0, 0]} color="#475569" metal={0.8} rough={0.3} seg={24} />
            {finDiscs.map((y, i) => (
              <Cyl key={i} r={0.13} len={0.012} pos={[0, y, 0]} color="#334155" metal={0.75} rough={0.35} seg={24} />
            ))}
            {/* Cylinder head plate */}
            <mesh position={[0, 0.13, 0]} castShadow>
              <boxGeometry args={[0.22, 0.04, 0.22]} />
              <primitive object={headMat} attach="material" />
            </mesh>
            {/* Intake air filter canister */}
            <Cyl r={0.055} len={0.09} pos={[0, 0.2, 0.08]} color="#0f172a" metal={0.2} rough={0.8} seg={16} />
          </group>

          {/* Copper Discharge Bridge Tube */}
          <Cyl r={0.024} len={0.24} pos={[0, 0.46, -0.04]} axis="x" color="#b45309" metal={0.85} rough={0.25} />
          {/* Manifold downpipe to tank */}
          <Cyl r={0.024} len={0.32} pos={[0.12, 0.3, -0.16]} color="#b45309" metal={0.85} rough={0.25} />
        </group>

        {/* --- Belt Guard & Pulleys (Rotating flywheel) --- */}
        <group position={[0, 1.05, -0.32]}>
          {/* Vented Sheetmetal Belt Guard */}
          <Box size={[1.05, 0.52, 0.06]} pos={[-0.08, 0, 0]} color="#1e293b" metal={0.6} rough={0.5} />
          {/* Perimeter frame wire */}
          <Box size={[1.08, 0.03, 0.08]} pos={[-0.08, 0.25, 0]} color="#475569" metal={0.7} rough={0.4} />
          <Box size={[1.08, 0.03, 0.08]} pos={[-0.08, -0.25, 0]} color="#475569" metal={0.7} rough={0.4} />

          {/* Rotating Motor Pulley & Compressor Flywheel */}
          <group ref={rot}>
            {/* Motor small drive pulley */}
            <Cyl r={0.09} len={0.08} pos={[-0.45, 0, 0.02]} axis="z" color="#64748b" metal={0.8} rough={0.3} seg={24} />
            {/* Compressor large bladed flywheel */}
            <Cyl r={0.24} len={0.08} pos={[0.28, 0.03, 0.02]} axis="z" color="#475569" metal={0.75} rough={0.35} seg={32} />
            {/* Flywheel fan spokes */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const ang = (i * Math.PI) / 3;
              return (
                <Box
                  key={i}
                  size={[0.2, 0.025, 0.06]}
                  pos={[0.28 + Math.cos(ang) * 0.1, 0.03 + Math.sin(ang) * 0.1, 0.02]}
                  color="#334155"
                  metal={0.7}
                  rough={0.4}
                />
              );
            })}
          </group>
        </group>

        {/* --- Analog Pressure Gauge on Tank Top --- */}
        <group position={[-0.65, 0.88, 0.22]}>
          <Cyl r={0.08} len={0.03} pos={[0, 0, 0]} axis="z" color="#0f172a" metal={0.8} rough={0.3} seg={24} />
          <Cyl r={0.072} len={0.005} pos={[0, 0, 0.018]} axis="z" color="#f8fafc" metal={0.1} rough={0.2} seg={24} />
          {/* Gauge stem */}
          <Cyl r={0.018} len={0.08} pos={[0, -0.05, 0]} color="#b45309" metal={0.8} rough={0.3} />
        </group>

        {/* --- Mounted AXON MSME Sensors --- */}
        {/* Acoustic sensor on discharge bridge */}
        <AcousticSensor pos={COMPRESSOR_TAP.acoustic} rot={[0, 0, 0]} active={sim.live.vibMeas > 1.8} />

        {/* Piezoresistive pressure sensor on tank manifold */}
        <PressureSensor pos={COMPRESSOR_TAP.pressure} rot={[0, 0, 0]} />

        {/* Industrial Vibration Puck on compressor head */}
        <VibrationPuck mount={puckMount} />
      </group>
    </group>
  );
});
