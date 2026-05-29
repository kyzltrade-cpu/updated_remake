export interface ProductRec {
  category: string;
  brand: string;
  product: string;
  why: string;
  price: '$' | '$$' | '$$$';
}

export interface CategoryKit {
  category: string;
  subtitle: string;
  picks: ProductRec[];
}

// ── Per-archetype kits ─────────────────────────────────────────────────────

export const ARCHETYPE_KIT: Record<string, CategoryKit[]> = {
  'The Glazed Canvas': [
    {
      category: 'Foundation',
      subtitle: 'Glass-skin bases that amplify your skin',
      picks: [
        { category: 'Foundation', brand: 'NARS',              product: 'Natural Radiant Longwear',      why: 'Skin-like luminosity that reads as your skin, amplified.',           price: '$$$' },
        { category: 'Foundation', brand: 'Charlotte Tilbury', product: 'Airbrush Flawless Foundation',  why: 'Blurs pores while letting your natural glow come through.',            price: '$$$' },
        { category: 'Foundation', brand: 'Kosas',             product: 'Tinted Face Oil Foundation',    why: 'Dewy, skin-melting formula built for the glazed look.',               price: '$$'  },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Flushes that look lit from within',
      picks: [
        { category: 'Blush', brand: 'Rare Beauty',       product: 'Soft Pinch Liquid Blush',      why: 'Sheer flush that blooms and looks skin-native.',                     price: '$$'  },
        { category: 'Blush', brand: 'Tower28',           product: 'BeachPlease Tinted Balm',      why: 'Peachy warmth that melts seamlessly into skin.',                     price: '$$'  },
        { category: 'Blush', brand: 'NARS',              product: 'Orgasm Blush',                 why: 'Gold-flecked peach for the signature glazed flush.',                 price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Lashes that open the eye without weighing it',
      picks: [
        { category: 'Mascara', brand: 'Charlotte Tilbury', product: 'Pillow Talk Push Up Lashes', why: 'Lifted, separated lashes with a soft-focus effect.',                  price: '$$'  },
        { category: 'Mascara', brand: 'ILIA',              product: 'Limitless Lash Mascara',     why: 'Clean formula — buildable, fluttery, never clumpy.',                 price: '$$'  },
        { category: 'Mascara', brand: 'Benefit',           product: 'BADgal BANG Mascara',        why: 'Lightweight volume without any heaviness.',                          price: '$$'  },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Liner that defines without drama',
      picks: [
        { category: 'Eye', brand: 'Charlotte Tilbury', product: 'Eye Cheat Liner',             why: 'Tight-line for the illusion of fuller, defined lashes.',             price: '$$'  },
        { category: 'Eye', brand: 'Marc Jacobs',       product: 'Highliner Gel Eye Crayon',    why: 'Precise and long-wearing for a clean glazed liner moment.',          price: '$$'  },
        { category: 'Eye', brand: 'Stila',             product: 'Stay All Day Waterproof Liner', why: 'Clean line that holds all day without smudging.',                  price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'The glassy lip finish',
      picks: [
        { category: 'Lip', brand: 'Dior',              product: 'Lip Glow Oil',                why: 'Glassy finish that enhances your natural lip tone.',                 price: '$$$' },
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Collagen Lip Bath Gloss',     why: 'Plumping gloss with a skin-tint finish.',                           price: '$$$' },
        { category: 'Lip', brand: 'Summer Fridays',    product: 'Lip Butter Balm',             why: 'Glossy-satin finish that keeps lips hydrated and full.',             price: '$$'  },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'The prep that makes the glow',
      picks: [
        { category: 'Skincare', brand: 'Tatcha',         product: 'Luminous Dewy Skin Mist',  why: 'Sets makeup with an instant glass-skin finish.',                    price: '$$$' },
        { category: 'Skincare', brand: 'Glow Recipe',    product: 'Watermelon Glow Toner',    why: 'Hydrating, pore-refining prep for maximum dewy effect.',            price: '$$'  },
        { category: 'Skincare', brand: 'The Ordinary',   product: 'Hyaluronic Acid 2% + B5',  why: 'Affordable base hydration before every glazed look.',               price: '$'   },
      ],
    },
  ],

  'The Soft Romantic': [
    {
      category: 'Foundation',
      subtitle: 'Velvet-soft bases for a dreamy finish',
      picks: [
        { category: 'Foundation', brand: 'Armani',   product: 'Luminous Silk Foundation',         why: 'Velvet-soft luminosity — the original romantic base.',           price: '$$$' },
        { category: 'Foundation', brand: 'Chanel',   product: 'Les Beiges Water-Fresh Tint',       why: 'Sheer, fresh coverage with a naturally blurred skin look.',      price: '$$$' },
        { category: 'Foundation', brand: 'Benefit',  product: 'Hello Happy Soft Blur Foundation',  why: 'Soft-focus finish that gives a filtered, romantic feel.',        price: '$$'  },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Peachy warmth that blooms naturally',
      picks: [
        { category: 'Blush', brand: 'Charlotte Tilbury', product: 'Pillow Talk Blush',              why: 'The perfect peachy-pink — made for your aesthetic.',             price: '$$$' },
        { category: 'Blush', brand: 'Fenty Beauty',      product: 'Cheeks Out Freestyle Cream Blush', why: 'Soft, buildable cream that wears like skin.',                 price: '$$'  },
        { category: 'Blush', brand: 'Tower28',           product: 'BeachPlease Tinted Balm',         why: 'Peachy warmth that melts seamlessly into skin.',              price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Fluttery lashes for a soft gaze',
      picks: [
        { category: 'Mascara', brand: 'Benefit',   product: "They're Real Magnet Mascara",  why: 'Full, fanned lashes that keep the eye soft and open.',             price: '$$'  },
        { category: 'Mascara', brand: "L'Oréal",   product: 'Lash Paradise Mascara',        why: 'Feathery volume at a fraction of the cost.',                       price: '$'   },
        { category: 'Mascara', brand: 'Lancôme',   product: "Lash Idôle Mascara",           why: 'Long, curved lashes with a flutter that reads romantic.',          price: '$$$' },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Rose-taupes and warm shades for dreamy eyes',
      picks: [
        { category: 'Eye', brand: 'Charlotte Tilbury', product: 'Pillow Talk Eyeshadow Palette', why: 'Rose-taupe softness made exactly for your aesthetic.',         price: '$$$' },
        { category: 'Eye', brand: 'Too Faced',         product: 'Natural Eyes Palette',           why: 'Warm nudes and soft shimmers for a romantic eye.',             price: '$$'  },
        { category: 'Eye', brand: 'Bobbi Brown',       product: 'Long-Wear Eye Shadow in Stone',  why: 'Everyday neutral that warms the eye without drama.',           price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'Soft pinks and sheers for a pillowy pout',
      picks: [
        { category: 'Lip', brand: 'NARS',              product: 'Afterglow Lip Balm',           why: 'Sheer pink with a candlelit, blurred finish.',                   price: '$$'  },
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Pillow Talk Lip Cheat Liner',  why: 'Oversizes the lip naturally — the romantic must-have.',          price: '$$'  },
        { category: 'Lip', brand: 'Rare Beauty',       product: 'Soft Pinch Tinted Lip Oil',    why: 'Glossy, flushed lip that completes the soft romantic look.',     price: '$$'  },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Dewy prep for a petal-soft canvas',
      picks: [
        { category: 'Skincare', brand: 'Fresh',      product: 'Rose Deep Hydration Moisturizer', why: 'Rose-infused hydration that plumps and softens before makeup.', price: '$$$' },
        { category: 'Skincare', brand: 'Laneige',    product: 'Lip Sleeping Mask',               why: 'Overnight lip treatment for a pillowy pout.',                   price: '$$'  },
        { category: 'Skincare', brand: 'Glow Recipe', product: 'Watermelon Glow Sleeping Mask',  why: 'Wake up with glass skin — ideal for the romantic dewy look.',  price: '$$'  },
      ],
    },
  ],

  'The Editorial Eye': [
    {
      category: 'Foundation',
      subtitle: 'Flawless bases that let your eye work dominate',
      picks: [
        { category: 'Foundation', brand: 'Make Up For Ever', product: 'Ultra HD Invisible Cover Foundation', why: 'Camera-ready base that keeps your eye the star.',     price: '$$$' },
        { category: 'Foundation', brand: 'Armani',           product: 'Luminous Silk Foundation',            why: 'Versatile silk finish that disappears into skin.',    price: '$$$' },
        { category: 'Foundation', brand: 'Estée Lauder',     product: 'Double Wear Light',                   why: 'Lightweight but long-wearing — holds under bold eye looks.', price: '$$' },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Understated flush so the eye can speak',
      picks: [
        { category: 'Blush', brand: 'NARS',      product: 'Orgasm Blush',           why: 'A barely-there flush that balances a dramatic eye.',               price: '$$'  },
        { category: 'Blush', brand: 'Hourglass', product: 'Ambient Lighting Blush', why: 'Diffused radiance that reads natural alongside editorial eyes.',  price: '$$$' },
        { category: 'Blush', brand: 'MAC',       product: 'Powder Blush in Blush Baby', why: 'Soft neutral flush that never competes with your eye art.',   price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Statement lashes for the editorial moment',
      picks: [
        { category: 'Mascara', brand: "L'Oréal",   product: 'Telescopic Mascara',           why: 'Precise, separated lashes that sharpen the editorial eye.',       price: '$'   },
        { category: 'Mascara', brand: 'Lancôme',   product: 'Hypnôse Mascara',              why: 'Volumised and defined — makes graphic liner pop harder.',         price: '$$$' },
        { category: 'Mascara', brand: 'Pat McGrath', product: 'FetishEyes Mascara',         why: 'Saturated volume that anchors a high-fashion eye look.',          price: '$$$' },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Palettes and liners built for graphic looks',
      picks: [
        { category: 'Eye', brand: 'Pat McGrath', product: 'Mothership Palette',          why: 'The palette built for graphic, high-fashion looks.',               price: '$$$' },
        { category: 'Eye', brand: 'Stila',       product: 'Stay All Day Waterproof Liner', why: 'Precision in one stroke for sharp, graphic definition.',        price: '$$'  },
        { category: 'Eye', brand: 'Urban Decay', product: 'Heavy Metal Glitter Liner',   why: 'Adds the unexpected editorial detail no one else is doing.',       price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'Muted lips that keep the eye as the sole statement',
      picks: [
        { category: 'Lip', brand: 'MAC',              product: 'Retro Matte Lipstick',               why: 'Flat matte keeps the eye as the sole statement.',          price: '$$'  },
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Matte Revolution Lipstick',         why: 'Editorial matte in a range of statement-muting nudes.',    price: '$$$' },
        { category: 'Lip', brand: 'NYX',               product: 'Lip Lingerie XXL Matte Liquid Lip', why: 'Affordable, long-wearing matte for editorial pairings.',   price: '$'   },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Prep for a canvas that holds strong artistry',
      picks: [
        { category: 'Skincare', brand: 'The Ordinary',  product: 'Buffet Multi-Technology Peptide Serum', why: 'Multi-targeting serum for a smooth editorial canvas.',  price: '$'   },
        { category: 'Skincare', brand: 'Biossance',     product: 'Squalane + Vitamin C Rose Oil',         why: 'Brightens and primes skin for graphic, pigment-rich looks.', price: '$$$' },
        { category: 'Skincare', brand: 'Peter Thomas Roth', product: 'Instant FIRMx Serum',              why: 'Firming prep that gives skin structure before bold liner.', price: '$$$' },
      ],
    },
  ],

  'The Power Contour': [
    {
      category: 'Foundation',
      subtitle: 'Full-coverage bases that hold sculpted work all day',
      picks: [
        { category: 'Foundation', brand: 'Fenty Beauty',  product: "Pro Filt'r Soft Matte Foundation", why: 'Full-coverage, oil-controlling base that holds contour.',  price: '$$'  },
        { category: 'Foundation', brand: 'Estée Lauder',  product: 'Double Wear Foundation',           why: '24-hour coverage that stands up to structure.',           price: '$$$' },
        { category: 'Foundation', brand: 'Armani',        product: 'Luminous Silk Foundation',         why: 'Buildable to full coverage with a polished finish.',       price: '$$$' },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Warmth and dimension for chiselled definition',
      picks: [
        { category: 'Blush', brand: 'NARS',              product: 'Laguna Bronzer',              why: 'Warmth and dimension for chiselled definition.',               price: '$$'  },
        { category: 'Blush', brand: 'Charlotte Tilbury', product: 'Airbrush Bronzer',            why: 'Buildable warmth that reads sculpted, not muddy.',             price: '$$$' },
        { category: 'Blush', brand: 'Hourglass',         product: 'Ambient Lighting Powder',     why: 'Diffused light that makes the contour look skin-real.',         price: '$$$' },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Defined lashes that frame the sculpted look',
      picks: [
        { category: 'Mascara', brand: 'Lancôme',   product: 'Hypnôse Drama Mascara',        why: 'Bold, fanned volume that anchors the power contour.',             price: '$$$' },
        { category: 'Mascara', brand: 'Pat McGrath', product: 'FetishEyes Mascara',         why: 'Intense volume that holds up to a full sculpted face.',           price: '$$$' },
        { category: 'Mascara', brand: "L'Oréal",   product: 'Telescopic Carbon Black',      why: 'Precise elongation that sharpens the overall structure.',         price: '$'   },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Brows and definition that anchor the structure',
      picks: [
        { category: 'Eye', brand: 'Anastasia Beverly Hills', product: 'Dipbrow Pomade',         why: 'Defined brow anchors the entire sculpted look.',               price: '$$'  },
        { category: 'Eye', brand: 'Charlotte Tilbury',       product: 'Contour by Design Palette', why: 'Precision shadow sculpting for an editorial bone structure.', price: '$$$' },
        { category: 'Eye', brand: 'Urban Decay',             product: 'Naked Basics Palette',    why: 'Warm mattes for cut-crease definition that reads polished.',  price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'Bold statements that complete the power look',
      picks: [
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Matte Revolution Lipstick',  why: 'The classic power lip — architectural and long-wearing.',       price: '$$$' },
        { category: 'Lip', brand: 'MAC',               product: 'Russian Red Lipstick',        why: 'Iconic matte red built for bold, structured looks.',            price: '$$'  },
        { category: 'Lip', brand: 'Fenty Beauty',      product: 'Stunna Lip Paint Longwear',   why: 'Saturated, opaque finish for when the lip needs to compete.', price: '$$'  },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Prep that tightens and primes for structure',
      picks: [
        { category: 'Skincare', brand: 'Charlotte Tilbury', product: 'Magic Cream Moisturizer',  why: 'Priming moisturiser that smooths and firms before any sculpted look.', price: '$$$' },
        { category: 'Skincare', brand: 'Drunk Elephant',    product: 'C-Firma Fresh Day Serum',  why: 'Vitamin C that brightens and firms the canvas before contouring.',     price: '$$$' },
        { category: 'Skincare', brand: 'Sunday Riley',      product: 'Good Genes Lactic Acid',   why: 'Resurfacing treatment that keeps skin smooth for seamless blending.',  price: '$$$' },
      ],
    },
  ],

  'The Dark Feminine': [
    {
      category: 'Foundation',
      subtitle: 'Full-coverage bases that hold all-day intensity',
      picks: [
        { category: 'Foundation', brand: 'Estée Lauder', product: 'Double Wear Foundation',        why: '24-hour hold that keeps up with your intensity.',               price: '$$$' },
        { category: 'Foundation', brand: 'Armani',       product: 'Luminous Silk Foundation',      why: 'Rich, polished base that carries darkness beautifully.',        price: '$$$' },
        { category: 'Foundation', brand: 'Fenty Beauty', product: "Pro Filt'r Longwear Foundation", why: 'Full-coverage finish that anchors a deep, dramatic look.',    price: '$$'  },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Deep tones that add dimension, not colour',
      picks: [
        { category: 'Blush', brand: 'NARS',              product: 'Deep Throat Blush',              why: 'Muted mauve that adds depth without fighting your palette.',   price: '$$'  },
        { category: 'Blush', brand: 'Charlotte Tilbury', product: 'Pillow Talk Blush Intense',      why: 'A deeper version of the classic — more drama, same balance.', price: '$$$' },
        { category: 'Blush', brand: 'MAC',               product: 'Powder Blush in Coppertone',     why: 'Warm bronze flush that shadows the cheekbone naturally.',      price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Intense lashes that command the room',
      picks: [
        { category: 'Mascara', brand: 'Urban Decay',  product: 'Perversion Mascara',          why: 'Maximum volume, maximum black — the dark feminine mascara.',      price: '$$'  },
        { category: 'Mascara', brand: "L'Oréal",      product: 'Lash Paradise Blackest Black', why: 'Full, feathery volume in the deepest black available.',           price: '$'   },
        { category: 'Mascara', brand: 'Lancôme',      product: 'Hypnôse Drama Mascara',       why: 'Intense fan of volume that pairs with deep liner work.',          price: '$$$' },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Deep smoky palettes and intense liners',
      picks: [
        { category: 'Eye', brand: 'Urban Decay', product: 'Naked Midnight Palette',        why: 'Deep smoky tones built for your signature depth.',                 price: '$$$' },
        { category: 'Eye', brand: 'Stila',       product: 'Stay All Day Liner in Intense Onyx', why: 'Intense black for graphic, sultry definition.',             price: '$$'  },
        { category: 'Eye', brand: 'Pat McGrath', product: 'Mothership V Eye Palette',      why: 'The darkness palette — editorial, rich, and uncompromising.',    price: '$$$' },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'Deep, saturated lip finishes',
      picks: [
        { category: 'Lip', brand: 'MAC',              product: 'Diva Lipstick',                 why: 'Deep berry that defines the dark feminine palette.',            price: '$$'  },
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Matte Revolution in Walk of Shame', why: 'Deep rose-nude — moody yet sophisticated.',             price: '$$$' },
        { category: 'Lip', brand: 'NARS',             product: 'Audacious Lipstick in Annabella', why: 'Rich wine that commits to the dark aesthetic fully.',       price: '$$$' },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Deep-conditioning prep for a flawless dark look',
      picks: [
        { category: 'Skincare', brand: 'The Inkey List', product: 'Retinol Eye Cream',        why: 'Smooths the under-eye before any dark, smoky work.',             price: '$'   },
        { category: 'Skincare', brand: 'Tatcha',         product: 'The Dewy Skin Cream',       why: 'Rich moisturiser that stops dark foundation from looking dry.', price: '$$$' },
        { category: 'Skincare', brand: 'Sunday Riley',   product: 'U.F.O Ultra-Clarifying Oil', why: 'Clarifying oil that keeps skin refined for high-impact looks.',  price: '$$$' },
      ],
    },
  ],

  'The Radiant Minimalist': [
    {
      category: 'Foundation',
      subtitle: 'Skin-enhancing coverage — less is always more',
      picks: [
        { category: 'Foundation', brand: 'ILIA',          product: 'True Skin Serum Foundation',         why: 'Skin-enhancing coverage — less is more, done right.',         price: '$$$' },
        { category: 'Foundation', brand: 'Westman Atelier', product: 'Vital Skin-Fit Foundation Stick', why: 'Creamy, skin-true coverage with a natural radiance.',          price: '$$$' },
        { category: 'Foundation', brand: 'RMS Beauty',    product: '"Un" Cover-Up Cream Foundation',    why: 'Sheer, buildable coverage that feels like nothing on skin.',   price: '$$'  },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'One product, effortless flush',
      picks: [
        { category: 'Blush', brand: 'Glossier',   product: 'Cloud Paint Gel Blush',      why: 'One product, effortless flush. Minimal perfection.',                  price: '$$'  },
        { category: 'Blush', brand: 'Rare Beauty', product: 'Soft Pinch Liquid Blush',   why: "A single drop does everything — the minimalist's best friend.",       price: '$$'  },
        { category: 'Blush', brand: 'ILIA',        product: 'Multi-Stick Cream Blush',   why: 'One stick for cheeks, lips, and eyes — minimal kit, maximum look.',   price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Your single maximalist moment',
      picks: [
        { category: 'Mascara', brand: 'Benefit',    product: 'BADgal BANG Mascara',    why: 'Lashes as your single maximalist moment in a minimal face.',           price: '$$'  },
        { category: 'Mascara', brand: 'ILIA',       product: 'Limitless Lash Mascara', why: 'Clean, fluttery volume — pairs with your clean-beauty philosophy.',    price: '$$'  },
        { category: 'Mascara', brand: 'Milk Makeup', product: 'KUSH Mascara',          why: 'Hemp-oil conditioned volume that looks effortless.',                  price: '$$'  },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Simple, effective eye definition',
      picks: [
        { category: 'Eye', brand: 'ILIA',    product: 'Nightlite Bronzing Stick',      why: 'Warm bronze on the lid — one stick, full effect.',                    price: '$$'  },
        { category: 'Eye', brand: 'NYX',     product: 'Jumbo Eye Pencil in Yogurt',    why: 'A single swipe for a highlighted, wide-awake lid.',                   price: '$'   },
        { category: 'Eye', brand: 'Glossier', product: 'Skywash Liquid Eye Shadow',   why: "Sheer wash of colour — the minimalist's version of an eye look.",    price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'One statement piece, muted precision',
      picks: [
        { category: 'Lip', brand: 'Rare Beauty',  product: 'Kind Words Matte Lip Color', why: 'Your one statement piece in muted precision.',                      price: '$$'  },
        { category: 'Lip', brand: 'ILIA',         product: 'Balmy Gloss Tinted Lip Oil', why: 'The clean-beauty gloss that does everything in one step.',          price: '$$'  },
        { category: 'Lip', brand: 'NARS',         product: 'Afterglow Lip Balm',          why: 'Sheer, comfortable tint that requires zero effort.',               price: '$$'  },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Minimal routine, maximum results',
      picks: [
        { category: 'Skincare', brand: 'Glow Recipe',  product: 'Watermelon Glow BHA Pore Toner', why: 'Daily toner that keeps pores refined with zero effort.',      price: '$$'  },
        { category: 'Skincare', brand: 'The Ordinary', product: 'Niacinamide 10% + Zinc 1%',       why: 'Pore-refining, oil-balancing serum for minimalist skin prep.', price: '$'   },
        { category: 'Skincare', brand: 'Tatcha',       product: 'The Water Cream Moisturizer',     why: 'Weightless, oil-free moisturiser — minimal but high-impact.',  price: '$$$' },
      ],
    },
  ],

  'The Color Curator': [
    {
      category: 'Foundation',
      subtitle: 'Neutral bases that let your colour choices lead',
      picks: [
        { category: 'Foundation', brand: 'Armani',        product: 'Luminous Silk Foundation',         why: 'Neutral base that lets your colour choices lead.',            price: '$$$' },
        { category: 'Foundation', brand: 'NARS',          product: 'Natural Radiant Longwear',          why: 'Radiant base that stays clean behind saturated colour.',      price: '$$$' },
        { category: 'Foundation', brand: 'Charlotte Tilbury', product: 'Airbrush Flawless Foundation', why: 'Clean canvas with a satiny finish for colour layering.',     price: '$$$' },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Editorial pigment for colour-forward placement',
      picks: [
        { category: 'Blush', brand: 'Rare Beauty',       product: 'Happy Face Soft Pinch Blush',   why: 'Editorial pigment for colour-forward placement.',              price: '$$'  },
        { category: 'Blush', brand: 'Charlotte Tilbury', product: 'Pillow Talk Universe Blush',    why: 'Unexpected tones that make colour theory visual.',             price: '$$$' },
        { category: 'Blush', brand: 'NARS',              product: 'Blush in Exhibit A',            why: 'Warm sienna — unconventional flush with real artistic range.',  price: '$$'  },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Expressive lashes to frame your colour story',
      picks: [
        { category: 'Mascara', brand: 'Charlotte Tilbury', product: 'Pillow Talk Push Up Lashes', why: 'Lifted lashes frame without detracting from your colour story.', price: '$$'  },
        { category: 'Mascara', brand: 'Urban Decay',       product: 'Lash Freak Mascara',         why: 'Adds extreme length for a high-fashion colour editorial look.',  price: '$$'  },
        { category: 'Mascara', brand: "L'Oréal",           product: 'Lash Paradise Mascara',      why: 'Dense volume that stands up to bold, saturated eye looks.',      price: '$'   },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Unexpected palettes for colour theory moments',
      picks: [
        { category: 'Eye', brand: 'Charlotte Tilbury', product: 'Pillow Talk Universe Palette', why: 'Unexpected tones that make colour theory visual.',              price: '$$$' },
        { category: 'Eye', brand: 'Pat McGrath',       product: 'Mothership VI Midnight Sun',   why: 'Rich, unapologetic colour for collectors and curators.',         price: '$$$' },
        { category: 'Eye', brand: 'Urban Decay',       product: 'Electric Pressed Pigment Palette', why: 'Saturated, vivid shades — the art palette for your eye.',  price: '$$'  },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'Saturated finishes for unexpected colour blocking',
      picks: [
        { category: 'Lip', brand: 'Fenty Beauty',      product: 'Stunna Lip Paint in Uncensored', why: 'Universal red — the colour-blocking anchor.', price: '$$' },
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Matte Revolution Pillow Talk',   why: 'The unexpected rose-nude that pairs with anything.', price: '$$$' },
        { category: 'Lip', brand: 'NARS',              product: 'Audacious Lipstick in Rita',     why: 'Deep berry for when the lip needs to take the colour lead.', price: '$$$' },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'A primed canvas for saturated pigment',
      picks: [
        { category: 'Skincare', brand: 'Biossance',     product: 'Squalane + Phyto-Retinol Serum', why: 'Smoothed skin holds saturated colour without shifting.',       price: '$$$' },
        { category: 'Skincare', brand: 'Ole Henriksen', product: 'Power Peel Pads',                 why: 'Resurfacing that gives colour a clean, even-toned base.',       price: '$$'  },
        { category: 'Skincare', brand: 'Glow Recipe',   product: 'Plum Plump Hyaluronic Serum',    why: 'Plumping hydration before layering multiple colour products.',   price: '$$'  },
      ],
    },
  ],

  'The Classic Glamour': [
    {
      category: 'Foundation',
      subtitle: 'Timeless bases for flawless, all-day glamour',
      picks: [
        { category: 'Foundation', brand: 'Estée Lauder',     product: 'Double Wear Foundation',          why: 'Flawless stay-put base for all-day glamour.',                 price: '$$$' },
        { category: 'Foundation', brand: 'Armani',           product: 'Luminous Silk Foundation',        why: 'The original glamour base — polished, radiant, flawless.',    price: '$$$' },
        { category: 'Foundation', brand: 'Charlotte Tilbury', product: 'Airbrush Flawless Foundation',   why: 'The camera-ready formula that delivers editorial polish.',     price: '$$$' },
      ],
    },
    {
      category: 'Blush',
      subtitle: 'Polished warmth to complete the classic look',
      picks: [
        { category: 'Blush', brand: 'NARS',    product: 'Orgasm Blush',                     why: 'Gold-flecked peach — the definition of classic glamour blush.',  price: '$$'  },
        { category: 'Blush', brand: 'Chanel',  product: 'Joues Contraste Powder Blush',     why: 'French-girl flush that ages like luxury.',                       price: '$$$' },
        { category: 'Blush', brand: 'Charlotte Tilbury', product: 'Cheek to Chic Blush',    why: 'Sculpted warmth with a naturally polished glow.',               price: '$$$' },
      ],
    },
    {
      category: 'Mascara',
      subtitle: 'Classic volume that completes the glamour formula',
      picks: [
        { category: 'Mascara', brand: "L'Oréal", product: 'Voluminous Original Mascara',    why: 'Classic volume that completes the glamour formula.',              price: '$'   },
        { category: 'Mascara', brand: 'Lancôme', product: "Lash Idôle Mascara",             why: 'Long, curved lashes — the French approach to timeless lashes.',  price: '$$$' },
        { category: 'Mascara', brand: 'Charlotte Tilbury', product: 'Pillow Talk Push Up Lashes', why: 'Defined, lifted volume that pairs with any classic look.',  price: '$$'  },
      ],
    },
    {
      category: 'Eye',
      subtitle: 'Defined brows and polished liner',
      picks: [
        { category: 'Eye', brand: 'Anastasia Beverly Hills', product: 'Brow Wiz Micro-Stroke Pencil', why: 'Defined brow is non-negotiable in your aesthetic.',          price: '$$'  },
        { category: 'Eye', brand: 'Charlotte Tilbury',       product: 'Eye Cheat Liner',               why: 'Classic tight-line that opens and defines every time.',     price: '$$'  },
        { category: 'Eye', brand: 'Bobbi Brown',             product: 'Smokey Eye Palette',             why: 'The timeless smoky palette — never dated, always polished.', price: '$$$' },
      ],
    },
    {
      category: 'Lip',
      subtitle: 'The classic formula — timeless, never trendy',
      picks: [
        { category: 'Lip', brand: 'Charlotte Tilbury', product: 'Matte Revolution Lipstick',    why: 'The classic formula — timeless, never trendy.',                 price: '$$$' },
        { category: 'Lip', brand: 'MAC',               product: 'Ruby Woo Retro Matte Lipstick', why: 'The original statement lip — iconic, unforgettable.',          price: '$$'  },
        { category: 'Lip', brand: 'NARS',              product: 'Heat Wave Lipstick',             why: 'Classic coral-red for when you want glamour with warmth.',    price: '$$$' },
      ],
    },
    {
      category: 'Skincare',
      subtitle: 'Luxury prep for enduring glamour',
      picks: [
        { category: 'Skincare', brand: 'Clarins',        product: 'Double Serum Anti-Ageing',  why: 'Time-tested serum for a polished, luminous complexion.',          price: '$$$' },
        { category: 'Skincare', brand: 'Charlotte Tilbury', product: 'Magic Cream Moisturizer', why: 'The luxury priming moisturiser before any classic glamour look.', price: '$$$' },
        { category: 'Skincare', brand: 'La Mer',          product: 'The Moisturizing Cream',    why: 'The ultimate investment for a flawless, glamorous canvas.',       price: '$$$' },
      ],
    },
  ],
};

export function getKitForDna(archetype: string): CategoryKit[] {
  return ARCHETYPE_KIT[archetype] ?? ARCHETYPE_KIT['The Glazed Canvas'];
}

// ── Legacy flat list (for backward compatibility) ─────────────────────────

export const ARCHETYPE_RECS: Record<string, ProductRec[]> = Object.fromEntries(
  Object.entries(ARCHETYPE_KIT).map(([arch, kits]) => [
    arch,
    kits.flatMap(k => k.picks),
  ]),
);

export function getRecsForDna(archetype: string): ProductRec[] {
  return ARCHETYPE_RECS[archetype] ?? ARCHETYPE_RECS['The Glazed Canvas'];
}
