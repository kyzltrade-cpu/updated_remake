import Svg, { Rect, Circle } from 'react-native-svg';

// Gallery — outer square hollow + inner circle hollow (1:1 HTML)
export function GalleryIcon({ size = 20 }: { size?: number }) {
  const outer = size;
  const inner = Math.round(size * 0.36);
  return (
    <Svg width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`}>
      <Rect
        x={1.5} y={1.5}
        width={outer - 3} height={outer - 3}
        rx={2}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={1.5}
        fill="none"
      />
      <Circle
        cx={outer / 2} cy={outer / 2}
        r={inner / 2}
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={1.5}
        fill="none"
      />
    </Svg>
  );
}