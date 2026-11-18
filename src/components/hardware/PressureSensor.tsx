import { memo } from 'react';
import type { V3 } from '../../sim/shots';
import { Cyl } from './primitives';

/**
 * IP65 Piezoresistive Pressure Sensor Transducer (AXON MSME).
 * Measures receiver tank & discharge manifold air pressure (0-16 bar).
 */
export const PressureSensor = memo(function PressureSensor({
  pos = [0, 0, 0] as V3,
  rot = [0, 0, 0] as V3,
  onClick,
}: {
  pos?: V3;
  rot?: V3;
  onClick?: () => void;
}) {
  const [x, y, z] = pos;
  return (
    <group position={[x, y, z]} rotation={[rot[0], rot[1], rot[2]]} onClick={onClick}>
      {/* Threaded 1/4" NPT fitting */}
      <Cyl r={0.03} len={0.05} pos={[0, 0.025, 0]} color="#b45309" metal={0.8} rough={0.3} seg={16} />
      {/* Hexagonal wrench flat nut */}
      <Cyl r={0.065} len={0.04} pos={[0, 0.065, 0]} color="#6b7280" metal={0.8} rough={0.3} seg={6} />
      {/* Cylindrical sensor housing */}
      <Cyl r={0.055} len={0.12} pos={[0, 0.14, 0]} color="#9ca3af" metal={0.75} rough={0.3} seg={24} />
      {/* Black M12 industrial connector cap */}
      <Cyl r={0.045} len={0.04} pos={[0, 0.21, 0]} color="#111827" metal={0.1} rough={0.8} seg={16} />
      {/* Cable gland output */}
      <Cyl r={0.022} len={0.035} pos={[0, 0.24, 0]} color="#1f2937" metal={0.1} rough={0.9} seg={12} />
    </group>
  );
});
