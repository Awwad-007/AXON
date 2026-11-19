import { memo, useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { V3 } from '../../sim/shots';
import { Box, Cyl } from './primitives';

/**
 * IP65 High-Frequency Acoustic Emission Sensor Puck (AXON MSME).
 * Detects ultrasonic valve flutter and acoustic friction (20 kHz - 100 kHz).
 */
export const AcousticSensor = memo(function AcousticSensor({
  pos = [0, 0, 0] as V3,
  rot = [0, 0, 0] as V3,
  active = false,
  showLabel = true,
  onClick,
}: {
  pos?: V3;
  rot?: V3;
  active?: boolean;
  showLabel?: boolean;
  onClick?: () => void;
}) {
  const [x, y, z] = pos;
  const ridges = useMemo(() => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2), []);

  return (
    <group position={[x, y, z]} rotation={[rot[0], rot[1], rot[2]]} onClick={onClick}>
      {/* Threaded 1/4" mounting stud */}
      <Cyl r={0.032} len={0.045} pos={[0, 0.02, 0]} color="#b45309" metal={0.85} rough={0.25} seg={16} />
      {/* Heavy hex mounting base collar */}
      <Cyl r={0.078} len={0.038} pos={[0, 0.055, 0]} color="#374151" metal={0.9} rough={0.2} seg={6} />
      {/* Main machined stainless steel acoustic resonance chamber */}
      <Cyl r={0.072} len={0.095} pos={[0, 0.115, 0]} color="#4b5563" metal={0.8} rough={0.3} seg={32} />

      {/* Knurled circumferential gripping ridges */}
      {ridges.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.073, 0.115, Math.sin(a) * 0.073]}
          rotation={[0, -a, 0]}
        >
          <boxGeometry args={[0.006, 0.07, 0.008]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Gold PZT acoustic transducer diaphragm */}
      <Cyl r={0.052} len={0.006} pos={[0, 0.165, 0]} color="#d97706" metal={0.92} rough={0.15} seg={32} />

      {/* Industrial M12 threaded connector base */}
      <Cyl r={0.042} len={0.035} pos={[0, 0.185, 0]} color="#1f2937" metal={0.8} rough={0.3} seg={16} />
      {/* Knurled connector coupling ring */}
      <Cyl r={0.046} len={0.02} pos={[0, 0.185, 0]} color="#374151" metal={0.85} rough={0.25} seg={6} />

      {/* Ribbed rubber strain relief boot */}
      <Cyl r={0.028} len={0.055} pos={[0, 0.22, 0]} color="#111827" metal={0.05} rough={0.9} seg={16} />
      {[0.205, 0.22, 0.235].map((ry, i) => (
        <Cyl key={i} r={0.032} len={0.008} pos={[0, ry, 0]} color="#09090b" metal={0.05} rough={0.95} seg={16} />
      ))}

      {/* Emissive micro-LED activity indicator */}
      <mesh position={[0.048, 0.125, 0]}>
        <boxGeometry args={[0.012, 0.008, 0.012]} />
        <meshStandardMaterial
          color={active ? '#38bdf8' : '#047857'}
          emissive={active ? '#38bdf8' : '#047857'}
          emissiveIntensity={active ? 2.5 : 0.8}
        />
      </mesh>

      {/* Floating 3D HTML Label */}
      {showLabel && (
        <Html position={[0, 0.38, 0]} center distanceFactor={14} className="pointer-events-none select-none">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 rounded-sm border border-line bg-panel px-2 py-1 font-mono text-[10px] whitespace-nowrap">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-sm ${active ? 'bg-warn' : 'bg-ok'}`} />
              <div className="flex flex-col">
                <span className="font-semibold text-zinc-200">AE-01 · ACOUSTIC SENSOR</span>
                <span className="text-[9px] text-zinc-400">Ultrasonic Flutter: 28.4 kHz</span>
              </div>
            </div>
            <div className="h-3.5 w-px bg-zinc-600/70" />
            <div className="h-1 w-1 rounded-sm bg-zinc-400" />
          </div>
        </Html>
      )}
    </group>
  );
});
