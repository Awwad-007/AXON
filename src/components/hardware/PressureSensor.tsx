import { memo } from 'react';
import { Html } from '@react-three/drei';
import type { V3 } from '../../sim/shots';
import { Box, Cyl } from './primitives';

/**
 * IP65 Piezoresistive Pressure Sensor Transducer (AXON MSME).
 * Measures receiver tank & discharge manifold air pressure (0-16 bar).
 */
export const PressureSensor = memo(function PressureSensor({
  pos = [0, 0, 0] as V3,
  rot = [0, 0, 0] as V3,
  showLabel = true,
  onClick,
}: {
  pos?: V3;
  rot?: V3;
  showLabel?: boolean;
  onClick?: () => void;
}) {
  const [x, y, z] = pos;
  return (
    <group position={[x, y, z]} rotation={[rot[0], rot[1], rot[2]]} onClick={onClick}>
      {/* Threaded 1/4" NPT stainless steel fitting */}
      <Cyl r={0.032} len={0.05} pos={[0, 0.025, 0]} color="#b45309" metal={0.85} rough={0.25} seg={16} />
      {/* Heavy hexagonal spanner flats collar */}
      <Cyl r={0.068} len={0.045} pos={[0, 0.068, 0]} color="#4b5563" metal={0.85} rough={0.25} seg={6} />
      {/* Sensor body transition ring */}
      <Cyl r={0.058} len={0.015} pos={[0, 0.098, 0]} color="#374151" metal={0.8} rough={0.3} seg={32} />
      {/* Main AISI 316L stainless steel cylindrical transducer housing */}
      <Cyl r={0.055} len={0.13} pos={[0, 0.165, 0]} color="#9ca3af" metal={0.85} rough={0.25} seg={32} />

      {/* Laser-etched specification band */}
      <Cyl r={0.056} len={0.035} pos={[0, 0.17, 0]} color="#1f2937" metal={0.6} rough={0.5} seg={32} />

      {/* Industrial M12 4-pin round connector body */}
      <Cyl r={0.044} len={0.045} pos={[0, 0.245, 0]} color="#111827" metal={0.7} rough={0.35} seg={20} />
      {/* Knurled connector locking ring */}
      <Cyl r={0.048} len={0.02} pos={[0, 0.24, 0]} color="#4b5563" metal={0.85} rough={0.25} seg={8} />

      {/* Cable gland output with strain-relief boot */}
      <Cyl r={0.024} len={0.045} pos={[0, 0.28, 0]} color="#18181b" metal={0.1} rough={0.9} seg={16} />

      {/* Floating 3D HTML Label */}
      {showLabel && (
        <Html position={[-0.22, 0.25, 0]} center distanceFactor={14} className="pointer-events-none select-none">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 rounded-sm border border-line bg-panel/95 px-1.5 py-0.5 font-mono text-[9px] whitespace-nowrap">
              <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-acc" />
              <span className="font-semibold text-zinc-200">PT-01 · PRESSURE</span>
            </div>
            <div className="h-2 w-px bg-zinc-600/70" />
          </div>
        </Html>
      )}
    </group>
  );
});
