import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { DnaResult } from '@/lib/api/dna';

export const CARD_W = 360;
export const CARD_H = 560;

const SEASON_COLOR: Record<string, string> = {
  Spring: '#F4A261',
  Summer: '#A8C4D5',
  Autumn: '#C8956A',
  Winter: '#7A8FBF',
};

interface Props {
  dna: DnaResult;
}

export function DnaShareCard({ dna }: Props) {
  const seasonBase = dna.colorSeason.split(' ').pop()!;
  const seasonColor = SEASON_COLOR[seasonBase] ?? '#C8956A';

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#0A0807', dna.skinToneHex + '28', '#120B09']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top wordmark */}
      <View style={styles.header}>
        <Text style={styles.brand}>REMAKE</Text>
        <View style={[styles.brandLine, { backgroundColor: 'rgba(200,168,130,0.25)' }]} />
        <Text style={styles.eyebrow}>BEAUTY DNA</Text>
      </View>

      {/* Skin tone swatch — visual anchor */}
      <View style={[styles.toneSwatch, { backgroundColor: dna.skinToneHex, shadowColor: dna.skinToneHex }]} />

      {/* Archetype hero */}
      <View style={styles.archetypeBlock}>
        <Text style={styles.youAre}>you are</Text>
        <Text style={styles.archetypeName}>{dna.archetype}</Text>
      </View>

      {/* Season row */}
      <View style={styles.seasonRow}>
        <View style={[styles.seasonDot, { backgroundColor: seasonColor, shadowColor: seasonColor }]} />
        <Text style={styles.seasonName}>{dna.colorSeason}</Text>
      </View>

      {/* Pills */}
      <View style={styles.pillsRow}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Face</Text>
          <Text style={styles.pillValue}>{dna.faceShape}</Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Energy</Text>
          <Text style={styles.pillValue}>{dna.energy}</Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>Tone</Text>
          <Text style={styles.pillValue}>{dna.skinToneHex.toUpperCase()}</Text>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>remake.app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0A0807',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 32,
    overflow: 'hidden',
  },

  header: { alignItems: 'center', gap: 10 },
  brand: {
    fontFamily: 'Playfair Display',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 6,
    color: '#FFF9F7',
  },
  brandLine: { width: 32, height: 1 },
  eyebrow: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 4,
    color: 'rgba(200,168,130,0.5)',
    textTransform: 'uppercase',
  },

  toneSwatch: {
    width: 96,
    height: 96,
    borderRadius: 48,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
  },

  archetypeBlock: { alignItems: 'center', gap: 6 },
  youAre: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 3,
    color: 'rgba(255,249,247,0.35)',
    textTransform: 'uppercase',
  },
  archetypeName: {
    fontFamily: 'Playfair Display',
    fontSize: 40,
    fontStyle: 'italic',
    color: '#C8A882',
    textAlign: 'center',
    lineHeight: 48,
  },

  seasonRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seasonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  seasonName: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,249,247,0.7)',
    letterSpacing: 0.3,
  },

  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(200,168,130,0.15)',
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  pill: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  pillLabel: {
    fontFamily: 'Inter',
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: 'rgba(200,168,130,0.45)',
    textTransform: 'uppercase',
  },
  pillValue: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF9F7',
  },
  pillDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(200,168,130,0.12)',
  },

  footer: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255,249,247,0.2)',
    letterSpacing: 1.5,
  },
});
