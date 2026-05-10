import Svg, { Path } from 'react-native-svg';

// Flash — hollow lightning bolt (stroke only, 1:1 HTML)
export function FlashIcon({ active, size = 20 }: { active?: boolean; size?: number }) {
  const color = active ? '#FFD866' : 'rgba(255,255,255,0.45)';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}