import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const meshRef = useRef<THREE.Mesh>(null);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const cur = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!meshRef.current || !active) return;
    const progress = (state.clock.elapsedTime * speed) % 1;
    // Parabolic arc above the machinery
    cur.lerpVectors(start, end, progress);
    cur.y += Math.sin(progress * Math.PI) * 0.45;
    meshRef.current.position.copy(cur);
    const s = Math.sin(progress * Math.PI) * 0.045 + 0.015;
    meshRef.current.scale.set(s, s, s);
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
});

/**
 * Offline Factory Gateway Hub (AXON ESP-NOW / Sub-GHz Mesh Receiver).
 * Wall-mounted industrial IP67 enclosure with external antenna, OLED readout, and status LEDs.
 */
export const GatewayNode = memo(function GatewayNode({
  pos = GATEWAY_POS,
  rxActive = true,
  anomaly = false,
}: {
  pos?: V3;
  rxActive?: boolean;
  anomaly?: boolean;
}) {
  const [x, y, z] = pos;
  const pwrMat = useRef<THREE.MeshStandardMaterial>(null);
  const rxMat = useRef<THREE.MeshStandardMaterial>(null);
  const lteMat = useRef<THREE.MeshStandardMaterial>(null);
  const almMat = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (pwrMat.current) pwrMat.current.color.set('#10b981');
    if (rxMat.current) {
      const rxBlink = rxActive && Math.sin(t * 8) > 0.1;
      rxMat.current.color.set(rxBlink ? '#38bdf8' : '#0e3b52');
    }
    if (lteMat.current) {
      const lteBlink = Math.sin(t * 2) > -0.2;
      lteMat.current.color.set(lteBlink ? '#10b981' : '#064e3b');
    }
    if (almMat.current) {
      const almBlink = anomaly && Math.sin(t * 10) > 0;
      almMat.current.color.set(almBlink ? '#ef4444' : '#27272a');
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Wall mounting plate */}
      <Box size={[0.54, 0.62, 0.015]} pos={[0, 0, -0.06]} color="#27272a" metal={0.6} rough={0.4} />

      {/* Mounting flange screws */}
      {[
        [-0.23, 0.27],
        [0.23, 0.27],
        [-0.23, -0.27],
        [0.23, -0.27],
      ].map(([sx, sy], i) => (
        <Cyl key={i} r={0.014} len={0.02} pos={[sx, sy, -0.05]} axis="z" color="#d4d4d8" metal={0.9} rough={0.2} seg={6} />
      ))}

      {/* Main IP67 enclosure body */}
      <Box size={[0.44, 0.52, 0.12]} pos={[0, 0, 0]} color="#18181b" metal={0.4} rough={0.6} />

      {/* Gasket seal line */}
      <Box size={[0.42, 0.5, 0.008]} pos={[0, 0, 0.058]} color="#09090b" metal={0.1} rough={0.9} />

      {/* Front panel lid */}
      <Box size={[0.4, 0.48, 0.02]} pos={[0, 0, 0.068]} color="#27272a" metal={0.5} rough={0.5} />

      {/* OLED status display window */}
      <Box size={[0.26, 0.12, 0.01]} pos={[0, 0.12, 0.08]} color="#09090b" metal={0.2} rough={0.2} />

      {/* OLED text simulation bar */}
      <Box size={[0.22, 0.018, 0.005]} pos={[0, 0.14, 0.086]} color="#38bdf8" metal={0.1} rough={0.5} />
      <Box size={[0.18, 0.012, 0.005]} pos={[-0.02, 0.105, 0.086]} color="#a1a1aa" metal={0.1} rough={0.5} />

      {/* 4 Status LEDs */}
      <group position={[0, -0.04, 0.08]}>
        {/* PWR */}
        <mesh position={[-0.12, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
          <meshStandardMaterial ref={pwrMat} color="#10b981" />
        </mesh>
        {/* MESH RX */}
        <mesh position={[-0.04, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
          <meshStandardMaterial ref={rxMat} color="#38bdf8" />
        </mesh>
        {/* CLOUD LTE */}
        <mesh position={[0.04, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
          <meshStandardMaterial ref={lteMat} color="#10b981" />
        </mesh>
        {/* ALM */}
        <mesh position={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 12]} />
          <meshStandardMaterial ref={almMat} color="#27272a" />
        </mesh>
      </group>

      {/* Ethernet RJ45 / Power gland underneath */}
      <Cyl r={0.035} len={0.08} pos={[-0.1, -0.28, 0]} color="#111827" metal={0.2} rough={0.7} seg={16} />
      <Cyl r={0.035} len={0.08} pos={[0.1, -0.28, 0]} color="#111827" metal={0.2} rough={0.7} seg={16} />

      {/* External 2.4 GHz whip antenna */}
      <group position={[0.16, 0.28, 0]}>
        {/* Knurled brass SMA connector */}
        <Cyl r={0.022} len={0.04} pos={[0, 0, 0]} color="#b45309" metal={0.8} rough={0.3} seg={12} />
        {/* Polyurethane antenna sheath */}
        <Cyl r={0.016} len={0.42} pos={[0, 0.22, 0]} color="#09090b" metal={0.1} rough={0.8} seg={16} />
        {/* Antenna dome tip */}
        <Cyl r={0.018} len={0.02} pos={[0, 0.43, 0]} color="#18181b" metal={0.2} rough={0.7} seg={12} />
      </group>
    </group>
  );
});
