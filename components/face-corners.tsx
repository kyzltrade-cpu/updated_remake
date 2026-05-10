import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/theme';

export function FaceCorners({ size = 180 }: { size?: number }) {
  const corner = 28;
  const borderWidth = 1.5;
  const radius = 16;

  return (
    <View style={[styles.container, { width: size, height: size * (240 / 180) }]}>
      {/* Top-left */}
      <View
        style={[
          styles.corner,
          styles.topLeft,
          {
            width: corner,
            height: corner,
            borderWidth,
            borderColor: 'rgba(232, 160, 170, 0.25)',
            borderTopLeftRadius: radius,
            borderRightWidth: 0,
            borderBottomWidth: 0,
          },
        ]}
      />
      {/* Top-right */}
      <View
        style={[
          styles.corner,
          styles.topRight,
          {
            width: corner,
            height: corner,
            borderWidth,
            borderColor: 'rgba(232, 160, 170, 0.25)',
            borderTopRightRadius: radius,
            borderLeftWidth: 0,
            borderBottomWidth: 0,
          },
        ]}
      />
      {/* Bottom-left */}
      <View
        style={[
          styles.corner,
          styles.bottomLeft,
          {
            width: corner,
            height: corner,
            borderWidth,
            borderColor: 'rgba(232, 160, 170, 0.25)',
            borderBottomLeftRadius: 14,
            borderTopWidth: 0,
            borderRightWidth: 0,
          },
        ]}
      />
      {/* Bottom-right */}
      <View
        style={[
          styles.corner,
          styles.bottomRight,
          {
            width: corner,
            height: corner,
            borderWidth,
            borderColor: 'rgba(232, 160, 170, 0.25)',
            borderBottomRightRadius: 14,
            borderTopWidth: 0,
            borderLeftWidth: 0,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  corner: {
    position: 'absolute',
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
});