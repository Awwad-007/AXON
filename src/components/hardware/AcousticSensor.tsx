import { memo } from 'react';
import type { V3 } from '../../sim/shots';
import { Box, Cyl } from './primitives';

/**
 * IP65 High-Frequency Acoustic Emission Sensor Puck (AXON MSME).
 * Detects ultrasonic valve flutter and high-frequency acoustic friction (20 kHz - 100 kHz).
 */
export const AcousticSensor = memo(function AcousticSensor({
  pos = [0, 0, 0] as V3,
  rot = [0, 0, 0] as V3,
  active = false,
  onClick,
}: {
  pos?: V3;
  rot?: V3;
  active?: boolean;
  onClick?: () => void;
}) {
  const [x, y, z] = pos;
  return (
    <group position={[x, y, z]} rotation={[rot[0], rot[1], rot[2]]} onClick={onClick}>
      {/* Threaded mounting stud */}
      <Cyl r={0.035} len={0.04} pos={[0, 0.02, 0]} color="#b45309" metal={0.8} rough={0.3} seg={16} />
      {/* Hex base collar */}
      <Cyl r={0.075} len={0.035} pos={[0, 0.055, 0]} color="#4b5563" metal={0.85} rough={0.25} seg={6} />
      {/* Main stainless steel acoustic chamber */}
      <Cyl r={0.07} len={0.08} pos={[0, 0.11, 0]} color="#374151" metal={0.7} rough={0.35} seg={24} />
      {/* Gold acoustic pickup diaphragm */}
      <Cyl r={0.05} len={0.005} pos={[0, 0.152, 0]} color="#d97706" metal={0.9} rough={0.2} seg={24} />
      {/* Knurled grip band */}
      <Cyl r={0.072} len={0.025} pos={[0, 0.105, 0]} color="#1f2937" metal={0.4} rough={0.8} seg={24} />
      {/* Strain relief cable boot */}
      <Cyl r={0.028} len={0.04} pos={[0, 0.17, 0]} color="#111827" metal={0.1} rough={0.9} seg={16} />
      {/* Micro LED activity indicator */}
      <Box
        size={[0.015, 0.008, 0.015]}
        pos={[0.045, 0.13, 0]}
        color={active ? '#38bdf8' : '#065f46'}
        metal={0.2}
        rough={0.5}
      />
    </group>
  );
});
