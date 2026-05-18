interface Shade {
  name: string;
  hex: string;
}

// ~12 shades per brand, spanning very fair → very deep with approximate hex values
const SHADE_DATA: Record<string, Shade[]> = {
  Fenty: [
    { name: '100N',  hex: '#F3E2CE' },
    { name: '120N',  hex: '#EDD0B4' },
    { name: '140N',  hex: '#E4BE9C' },
    { name: '160N',  hex: '#D9AC86' },
    { name: '185N',  hex: '#CC9870' },
    { name: '210N',  hex: '#BE845A' },
    { name: '240N',  hex: '#AC7044' },
    { name: '270N',  hex: '#985C30' },
    { name: '300N',  hex: '#84481E' },
    { name: '330N',  hex: '#703810' },
    { name: '370N',  hex: '#5C2A08' },
    { name: '420N',  hex: '#481C04' },
  ],
  MAC: [
    { name: 'NC10',  hex: '#F4E6D2' },
    { name: 'NC15',  hex: '#EDD4B8' },
    { name: 'NC20',  hex: '#E2C09E' },
    { name: 'NC25',  hex: '#D6AC86' },
    { name: 'NC30',  hex: '#C89870' },
    { name: 'NC35',  hex: '#BC845A' },
    { name: 'NC40',  hex: '#AE7044' },
    { name: 'NC42',  hex: '#9E5E30' },
    { name: 'NC44',  hex: '#8C4C1E' },
    { name: 'NC46',  hex: '#7A3C10' },
    { name: 'NC50',  hex: '#662C06' },
    { name: 'NC55',  hex: '#501E02' },
  ],
  Maybelline: [
    { name: '100',   hex: '#F5EADE' },
    { name: '110',   hex: '#EDD6C2' },
    { name: '120',   hex: '#E2C2A4' },
    { name: '125',   hex: '#D6AC8A' },
    { name: '128',   hex: '#CA9870' },
    { name: '220',   hex: '#BC845A' },
    { name: '230',   hex: '#AC7044' },
    { name: '310',   hex: '#9C5C2E' },
    { name: '320',   hex: '#8A4C1C' },
    { name: '330',   hex: '#783A0E' },
    { name: '340',   hex: '#642C06' },
    { name: '355',   hex: '#4E1E02' },
  ],
  'L\'Oréal': [
    { name: 'W1',    hex: '#F4E6D0' },
    { name: 'W2',    hex: '#EDD4B6' },
    { name: 'W3',    hex: '#E2C09C' },
    { name: 'W4',    hex: '#D6AC84' },
    { name: 'W5',    hex: '#C8986C' },
    { name: 'W6',    hex: '#BA8458' },
    { name: 'W7',    hex: '#AC7044' },
    { name: 'C6',    hex: '#A06030' },
    { name: 'W8',    hex: '#8E4E1C' },
    { name: 'W9',    hex: '#7A3C0C' },
    { name: 'W10',   hex: '#642C04' },
    { name: 'D8',    hex: '#4C1C02' },
  ],
  NARS: [
    { name: 'Deauville',  hex: '#F2E0CC' },
    { name: 'Syracuse',   hex: '#EACCB0' },
    { name: 'Ceylan',     hex: '#DEBA98' },
    { name: 'Barcelona',  hex: '#D0A880' },
    { name: 'Cadiz',      hex: '#C09468' },
    { name: 'Valencia',   hex: '#B08050' },
    { name: 'Stromboli',  hex: '#9E6C3A' },
    { name: 'Santa Fe',   hex: '#8C5824' },
    { name: 'Macao',      hex: '#784610' },
    { name: 'Marquises',  hex: '#643406' },
    { name: 'Polynesia',  hex: '#502402' },
    { name: 'Syracuse II',hex: '#3C1600' },
  ],
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function closestShade(targetHex: string, shades: Shade[]): string {
  const target = hexToRgb(targetHex);
  let best = shades[0];
  let minDist = Infinity;
  for (const shade of shades) {
    const dist = rgbDistance(target, hexToRgb(shade.hex));
    if (dist < minDist) { minDist = dist; best = shade; }
  }
  return best.name;
}

export interface ShadeMatches {
  Fenty: string;
  MAC: string;
  Maybelline: string;
  "L'Oréal": string;
  NARS: string;
}

export function findShades(skinHex: string): ShadeMatches {
  return {
    Fenty:      closestShade(skinHex, SHADE_DATA['Fenty']),
    MAC:        closestShade(skinHex, SHADE_DATA['MAC']),
    Maybelline: closestShade(skinHex, SHADE_DATA['Maybelline']),
    "L'Oréal":  closestShade(skinHex, SHADE_DATA["L'Oréal"]),
    NARS:       closestShade(skinHex, SHADE_DATA['NARS']),
  };
}
