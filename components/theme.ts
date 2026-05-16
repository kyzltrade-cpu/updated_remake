export const tokens = {
  colors: {
    // Base neutrals — warm, not cold
    text: '#3D3532',
    white: '#FFF9F7',
    ivory: '#FFF5F2',
    cream: '#FDF0EC',
    beige: '#FBE8E3',

    // Pink scale — vibrant and feminine
    pinkLight: '#FFF0F7',
    blush: '#FFD6EF',
    pink: '#FFAAD9',
    pinkMid: '#F57FBF',        // candy pink (was washed #F0B8C0)
    pinkDeep: '#E8399A',       // vibrant hot pink (was dusty #E8A0AA)
    pinkRich: '#C2187A',       // deep raspberry (was muted #D98A96)

    // Accent — replaces navy for CTAs and selected states
    accent: '#D63384',         // bold magenta

    // Gold
    gold: '#D4AF37',
    goldSoft: '#E6C88A',

    // Borders
    border: '#FAD0E8',         // pink-tinted border (was neutral #F5DDE3)

    // Grays
    gray: '#9A8E8A',
    grayLight: '#B8ADA9',

    // Dark backgrounds (DNA reveal, paywall)
    darkBg: '#1A1715',
    darkBgLight: '#2A2522',
  },
  fonts: {
    regular: 'Inter',
    serif: 'Playfair Display',
  },
} as const;

export type TokenColor = keyof typeof tokens.colors;
