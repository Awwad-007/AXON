import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { V3 } from '../sim/shots';
import { Box, Cyl } from './hardware/primitives';

export const GATEWAY_POS: V3 = [-2.3, 1.35, -1.8];

/**
 * 3D Animated Mesh Packet Ping.
 * Animates a telemetry packet traveling from machine tap points to the Gateway.
 */
export const MeshPing = memo(function MeshPing({
  from,
  to = GATEWAY_POS,
  color = '#38bdf8',
  speed = 1.2,
  active = true,
}: {
  from: V3;
  to?: V3;
  color?: string;
  speed?: number;
  active?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const cur = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!groupRef.current || !active) return;
    const progress = (state.clock.elapsedTime * speed) % 1;
    // Smooth parabolic arc above the machinery
    cur.lerpVectors(start, end, progress);
    cur.y += Math.sin(progress * Math.PI) * 0.75;
    groupRef.current.position.copy(cur);
    const s = Math.sin(progress * Math.PI) * 0.08 + 0.035;
    groupRef.current.scale.set(s, s, s);
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {/* Inner Bright Core */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Colored Outer Glow Shell */}
      <mesh scale={[1.7, 1.7, 1.7]}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} />
      </mesh>
      {/* Wider Ambient Pulse Halo */}
      <mesh scale={[2.6, 2.6, 2.6]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
});

/**
 * Offline Factory Gateway Hub (AXON ESP-NOW / Sub-GHz Mesh Receiver).
 * Wall-mounted industrial IP67 enclosure with textured dual antennas,
 * internal ENIG PCB, OLED readout, physical emissive micro-LEDs, and floating 3D label.
 */
export const GatewayNode = memo(function GatewayNode({
  pos = GATEWAY_POS,
  rxActive = true,
  anomaly = false,
  showLabel = true,
}: {
  pos?: V3;
  rxActive?: boolean;
  anomaly?: boolean;
  showLabel?: boolean;
}) {
  const [x, y, z] = pos;
  const pwrMat = useRef<THREE.MeshStandardMaterial>(null);
  const rxMat = useRef<THREE.MeshStandardMaterial>(null);
  const lteMat = useRef<THREE.MeshStandardMaterial>(null);
  const almMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Physical emissive light behaviors
    if (pwrMat.current) {
      pwrMat.current.color.set('#10b981');
      pwrMat.current.emissive.set('#10b981');
      pwrMat.current.emissiveIntensity = 2.0;
    }

    if (rxMat.current) {
      // Flashes bright cyan/sky on packet arrival; shifts to amber/red on anomaly
      const rxPulse = rxActive ? (Math.sin(t * 8) > 0 ? 3.5 : 0.6) : 0.2;
      const rxCol = anomaly ? '#f59e0b' : '#38bdf8';
      rxMat.current.color.set(rxCol);
      rxMat.current.emissive.set(rxCol);
      rxMat.current.emissiveIntensity = rxPulse;
    }

    if (lteMat.current) {
      const ltePulse = Math.sin(t * 2.5) > -0.2 ? 2.2 : 0.4;
      lteMat.current.color.set('#10b981');
      lteMat.current.emissive.set('#10b981');
      lteMat.current.emissiveIntensity = ltePulse;
    }

    if (almMat.current) {
      const almPulse = anomaly && Math.sin(t * 10) > 0 ? 4.0 : 0.1;
      const almCol = anomaly ? '#ef4444' : '#27272a';
      almMat.current.color.set(almCol);
      almMat.current.emissive.set(almCol);
      almMat.current.emissiveIntensity = almPulse;
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Heavy zinc-plated wall mounting plate */}
      <Box size={[0.58, 0.66, 0.015]} pos={[0, 0, -0.06]} color="#27272a" metal={0.7} rough={0.35} />

      {/* Mounting flange stainless hex screws */}
      {[
        [-0.25, 0.29],
        [0.25, 0.29],
        [-0.25, -0.29],
        [0.25, -0.29],
      ].map(([sx, sy], i) => (
        <Cyl key={i} r={0.016} len={0.025} pos={[sx, sy, -0.048]} axis="z" color="#d4d4d8" metal={0.9} rough={0.2} seg={6} />
      ))}

      {/* Main IP67 die-cast aluminum enclosure body with corner reinforcing ribs */}
      <Box size={[0.48, 0.54, 0.14]} pos={[0, 0, 0]} color="#18181b" metal={0.5} rough={0.55} />

      {/* Lateral aluminum heatsink cooling fins on left & right sides */}
      {[-0.18, -0.1, -0.02, 0.06, 0.14, 0.22].map((fy, i) => (
        <group key={i}>
          <Box size={[0.025, 0.02, 0.1]} pos={[-0.25, fy, 0]} color="#27272a" metal={0.6} rough={0.4} />
          <Box size={[0.025, 0.02, 0.1]} pos={[0.25, fy, 0]} color="#27272a" metal={0.6} rough={0.4} />
        </group>
      ))}

      {/* Silicone environmental perimeter gasket seal */}
      <Box size={[0.45, 0.51, 0.008]} pos={[0, 0, 0.071]} color="#09090b" metal={0.1} rough={0.95} />

      {/* Front bezel lid with hex fasteners */}
      <Box size={[0.44, 0.5, 0.02]} pos={[0, 0, 0.082]} color="#27272a" metal={0.6} rough={0.4} />
      {[
        [-0.2, 0.23],
        [0.2, 0.23],
        [-0.2, -0.23],
        [0.2, -0.23],
      ].map(([bx, by], i) => (
        <Cyl key={i} r={0.01} len={0.012} pos={[bx, by, 0.093]} axis="z" color="#cbd5e1" metal={0.9} rough={0.25} seg={6} />
      ))}

      {/* Smoked acrylic display & status window */}
      <Box size={[0.28, 0.15, 0.01]} pos={[0, 0.12, 0.095]} color="#09090b" metal={0.3} rough={0.15} />

      {/* Internal OLED status readout graphic simulation */}
      <Box size={[0.24, 0.022, 0.005]} pos={[0, 0.15, 0.102]} color="#38bdf8" metal={0.1} rough={0.4} />
      <Box size={[0.2, 0.014, 0.005]} pos={[-0.02, 0.115, 0.102]} color="#a1a1aa" metal={0.1} rough={0.4} />
      <Box size={[0.16, 0.012, 0.005]} pos={[-0.04, 0.085, 0.102]} color="#10b981" metal={0.1} rough={0.4} />

      {/* 4 Physical Emissive Micro-LEDs (PWR, MESH RX, CLOUD LTE, ALARM) */}
      <group position={[0, -0.05, 0.095]}>
        {/* PWR */}
        <mesh position={[-0.13, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
          <meshStandardMaterial ref={pwrMat} color="#10b981" />
        </mesh>
        {/* MESH RX */}
        <mesh position={[-0.04, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
          <meshStandardMaterial ref={rxMat} color="#38bdf8" />
        </mesh>
        {/* CLOUD LTE */}
        <mesh position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
          <meshStandardMaterial ref={lteMat} color="#10b981" />
        </mesh>
        {/* ALM */}
        <mesh position={[0.14, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 16]} />
          <meshStandardMaterial ref={almMat} color="#27272a" />
        </mesh>
      </group>

      {/* Dual Heavy PG-11 Waterproof Nylon Cable Glands underneath */}
      {[-0.11, 0.11].map((gx, i) => (
        <group key={i} position={[gx, -0.27, 0]}>
          <Cyl r={0.042} len={0.03} pos={[0, -0.015, 0]} color="#111827" metal={0.2} rough={0.65} seg={6} />
          <Cyl r={0.032} len={0.05} pos={[0, -0.055, 0]} color="#1f2937" metal={0.2} rough={0.7} seg={20} />
          <Cyl r={0.018} len={0.08} pos={[0, -0.11, 0]} color="#09090b" metal={0.1} rough={0.9} seg={16} />
        </group>
      ))}

      {/* Dual Articulated High-Gain Whip Antennas on Top */}
      {/* Antenna 1: 2.4 GHz ESP-NOW Mesh Antenna */}
      <group position={[-0.14, 0.28, 0]}>
        {/* Knurled brass gold SMA connector */}
        <Cyl r={0.024} len={0.04} pos={[0, 0.02, 0]} color="#b45309" metal={0.88} rough={0.25} seg={16} />
        {/* Swivel knuckle joint */}
        <Cyl r={0.022} len={0.03} pos={[0, 0.055, 0]} axis="z" color="#18181b" metal={0.3} rough={0.6} seg={16} />
        {/* Textured whip sheath */}
        <Cyl r={0.018} len={0.46} pos={[0, 0.29, 0]} color="#09090b" metal={0.1} rough={0.85} seg={16} />
        {/* Tip cap */}
        <Cyl r={0.02} len={0.025} pos={[0, 0.52, 0]} color="#1c1917" metal={0.2} rough={0.7} seg={12} />
      </group>

      {/* Antenna 2: Sub-GHz / Cellular Fallback Antenna */}
      <group position={[0.14, 0.28, 0]}>
        {/* Knurled brass gold SMA connector */}
        <Cyl r={0.024} len={0.04} pos={[0, 0.02, 0]} color="#b45309" metal={0.88} rough={0.25} seg={16} />
        {/* Swivel knuckle joint */}
        <Cyl r={0.022} len={0.03} pos={[0, 0.055, 0]} axis="z" color="#18181b" metal={0.3} rough={0.6} seg={16} />
        {/* Textured whip sheath */}
        <Cyl r={0.018} len={0.38} pos={[0, 0.25, 0]} color="#09090b" metal={0.1} rough={0.85} seg={16} />
        {/* Tip cap */}
        <Cyl r={0.02} len={0.025} pos={[0, 0.44, 0]} color="#1c1917" metal={0.2} rough={0.7} seg={12} />
      </group>

      {/* Floating 3D HTML Label */}
      {showLabel && (
        <Html position={[0, 0.45, 0]} center distanceFactor={14} className="pointer-events-none select-none">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 rounded-sm border border-line bg-panel/95 px-1.5 py-0.5 font-mono text-[9px] whitespace-nowrap">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-sm ${anomaly ? 'bg-crit' : 'bg-ok'}`} />
              <span className="font-semibold text-zinc-200">GW-01 · GATEWAY</span>
            </div>
            <div className="h-2 w-px bg-zinc-600/70" />
          </div>
        </Html>
      )}
    </group>
  );
});
