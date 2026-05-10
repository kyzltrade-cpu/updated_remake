export const tokens = {
  colors: {
    text: '#3D3532',
    white: '#FFF9F7',
    ivory: '#FFF5F2',
    cream: '#FDF0EC',
    beige: '#FBE8E3',
    blush: '#FCE4EC',
    pink: '#F8D7DA',
    pinkMid: '#F0B8C0',
    pinkDeep: '#E8A0AA',
    pinkRich: '#D98A96',
    gold: '#D4AF37',
    goldSoft: '#E6C88A',
    border: '#F5DDE3',
    gray: '#9A8E8A',
    grayLight: '#B8ADA9',
    darkBg: '#1A1715',
    darkBgLight: '#2A2522',
  },
  fonts: {
    regular: 'Inter',
    serif: 'Playfair Display',
  },
} as const;

export type TokenColor = keyof typeof tokens.colors;