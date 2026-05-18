export interface ProductRec {
  category: string;
  brand: string;
  product: string;
  why: string;
  price: '$' | '$$' | '$$$';
}

export const ARCHETYPE_RECS: Record<string, ProductRec[]> = {
  'The Glazed Canvas': [
    { category: 'Base',      brand: 'NARS',              product: 'Natural Radiant Longwear',    why: 'Skin-like luminosity that reads as your skin, amplified.',      price: '$$$' },
    { category: 'Glow',      brand: 'Charlotte Tilbury', product: 'Hollywood Flawless Filter',   why: 'The glass-skin layer that sits over everything.',                price: '$$$' },
    { category: 'Blush',     brand: 'Rare Beauty',       product: 'Soft Pinch Liquid Blush',     why: 'Sheer flush that looks lit from within.',                        price: '$$'  },
    { category: 'Lip',       brand: 'Dior',              product: 'Lip Glow Oil',                why: 'Glassy finish that enhances your natural lip tone.',             price: '$$$' },
  ],
  'The Soft Romantic': [
    { category: 'Base',      brand: 'Armani',            product: 'Luminous Silk Foundation',    why: 'Velvet-soft luminosity — the original romantic base.',           price: '$$$' },
    { category: 'Blush',     brand: 'Tower28',           product: 'BeachPlease Tinted Balm',     why: 'Peachy warmth that melts seamlessly into skin.',                 price: '$$'  },
    { category: 'Eye',       brand: 'Charlotte Tilbury', product: 'Pillow Talk Eyeshadow',       why: 'Rose-taupe softness made exactly for your aesthetic.',           price: '$$$' },
    { category: 'Lip',       brand: 'NARS',              product: 'Afterglow Lip Balm',          why: 'Sheer pink with a candlelit, blurred finish.',                   price: '$$'  },
  ],
  'The Editorial Eye': [
    { category: 'Eye',       brand: 'Pat McGrath',       product: 'Mothership Palette',          why: 'The palette built for graphic, high-fashion looks.',             price: '$$$' },
    { category: 'Liner',     brand: 'Charlotte Tilbury', product: 'Eye Cheat Liner',             why: 'Precision in one stroke for sharp, graphic definition.',         price: '$$'  },
    { category: 'Base',      brand: 'Make Up For Ever',  product: 'Ultra HD Foundation',         why: 'Camera-ready base that lets your eye work dominate.',            price: '$$$' },
    { category: 'Lip',       brand: 'MAC',               product: 'Retro Matte Lipstick',        why: 'Flat matte that keeps the eye as the sole statement.',           price: '$$'  },
  ],
  'The Power Contour': [
    { category: 'Contour',   brand: 'Charlotte Tilbury', product: 'Contour Wand',                why: 'Precision sculpting built for your face structure.',              price: '$$$' },
    { category: 'Base',      brand: 'Fenty Beauty',      product: 'Pro Filt\'r Foundation',      why: 'Full-coverage base that holds contour all day.',                 price: '$$'  },
    { category: 'Highlight', brand: 'NARS',              product: 'Laguna Bronzer',              why: 'Warmth and dimension for chiselled definition.',                 price: '$$'  },
    { category: 'Brow',      brand: 'Anastasia BH',      product: 'Dipbrow Pomade',              why: 'Defined brow anchors the entire sculpted look.',                 price: '$$'  },
  ],
  'The Dark Feminine': [
    { category: 'Eye',       brand: 'Urban Decay',       product: 'Naked Midnight Palette',      why: 'Deep smoky tones built for your signature depth.',               price: '$$$' },
    { category: 'Liner',     brand: 'Stila',             product: 'Stay All Day Liner',          why: 'Intense black for graphic, sultry definition.',                  price: '$$'  },
    { category: 'Base',      brand: 'Estée Lauder',      product: 'Double Wear Foundation',      why: '24-hour hold that keeps up with your intensity.',                price: '$$$' },
    { category: 'Lip',       brand: 'MAC',               product: 'Diva Lipstick',               why: 'Deep berry that defines the dark feminine palette.',             price: '$$'  },
  ],
  'The Radiant Minimalist': [
    { category: 'Base',      brand: 'ILIA',              product: 'True Skin Serum Foundation',  why: 'Skin-enhancing coverage — less is more, done right.',            price: '$$$' },
    { category: 'Blush',     brand: 'Glossier',          product: 'Cloud Paint',                 why: 'One product, effortless flush. Minimal perfection.',             price: '$$'  },
    { category: 'Lip',       brand: 'Rare Beauty',       product: 'Kind Words Matte Lip',        why: 'Your one statement piece in muted precision.',                   price: '$$'  },
    { category: 'Mascara',   brand: 'Benefit',           product: 'BADgal BANG Mascara',         why: 'Lashes as your single maximalist moment.',                       price: '$$'  },
  ],
  'The Color Curator': [
    { category: 'Eye',       brand: 'Charlotte Tilbury', product: 'Pillow Talk Universe',        why: 'Unexpected tones that make colour theory visual.',               price: '$$$' },
    { category: 'Base',      brand: 'Armani',            product: 'Luminous Silk Foundation',    why: 'Neutral base that lets your colour choices lead.',               price: '$$$' },
    { category: 'Lip',       brand: 'Fenty Beauty',      product: 'Stunna Lip Paint',            why: 'Saturated finish for unexpected colour blocking.',               price: '$$'  },
    { category: 'Blush',     brand: 'Rare Beauty',       product: 'Happy Face Blush',            why: 'Editorial pigment for colour-forward placement.',                price: '$$'  },
  ],
  'The Classic Glamour': [
    { category: 'Lip',       brand: 'Charlotte Tilbury', product: 'Matte Revolution Lipstick',   why: 'The classic formula — timeless, never trendy.',                  price: '$$$' },
    { category: 'Base',      brand: 'Estée Lauder',      product: 'Double Wear Foundation',      why: 'Flawless stay-put base for all-day glamour.',                    price: '$$$' },
    { category: 'Mascara',   brand: 'L\'Oréal',          product: 'Voluminous Lash Paradise',    why: 'Classic volume that completes the glamour formula.',             price: '$'   },
    { category: 'Brow',      brand: 'Anastasia BH',      product: 'Brow Wiz',                    why: 'Defined brow is non-negotiable in your aesthetic.',              price: '$$'  },
  ],
};

export function getRecsForDna(archetype: string): ProductRec[] {
  return ARCHETYPE_RECS[archetype] ?? ARCHETYPE_RECS['The Glazed Canvas'];
}
