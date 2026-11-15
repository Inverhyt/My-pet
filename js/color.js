/* My Pet — wool, face, eye, and costume recolor. Free runtime tint; no extra assets. */
(function (root) {
  const HUT = {
    cream:   { mid: [239, 224, 192], shadow: [200, 180, 138], light: [255, 246, 224], hex: "#EFE0C0" },
    moss:    { mid: [90, 138, 94],   shadow: [62, 100, 68],   light: [138, 176, 138], hex: "#5A8A5E" },
    rust:    { mid: [198, 90, 40],   shadow: [138, 52, 16],   light: [224, 138, 74],  hex: "#C65A28" },
    mustard: { mid: [212, 160, 40],  shadow: [160, 120, 24],  light: [232, 196, 90],  hex: "#D4A028" },
    berry:   { mid: [180, 72, 104],  shadow: [122, 40, 68],   light: [212, 120, 148], hex: "#B44868" },
    sky:     { mid: [122, 164, 184], shadow: [78, 116, 136],  light: [176, 205, 224], hex: "#7AA4B8" },
  };
  const HUT_ORDER = ["default", "cream", "moss", "rust", "mustard", "berry", "sky"];
  const HUT_NAMES = { default: "Now", cream: "Cream", moss: "Moss", rust: "Rust", mustard: "Mustard", berry: "Berry", sky: "Sky" };
  const DEFAULT_SWATCH = { hat: "#50825A", witch: "#CC5500", bow: "#E45A78", crown: "#F496B4", collar: "#121012" };

  const WOOL = {
    white:  { hex: "#FDF6E6", pal: null },
    cream:  { hex: "#F0D4A8", pal: { mid: [240, 212, 168], shadow: [210, 172, 118], light: [255, 240, 214] } },
    peach:  { hex: "#EFC2A8", pal: { mid: [239, 194, 168], shadow: [210, 150, 126], light: [248, 220, 200] } },
    butter: { hex: "#E8D48C", pal: { mid: [232, 212, 140], shadow: [200, 172, 88],  light: [246, 232, 184] } },
    mist:   { hex: "#D5D8CC", pal: { mid: [213, 216, 204], shadow: [168, 176, 164], light: [236, 238, 230] } },
    blush:  { hex: "#E8B8B8", pal: { mid: [232, 184, 184], shadow: [196, 140, 148], light: [248, 216, 216] } },
    sky:    { hex: "#B8D0E0", pal: { mid: [184, 208, 224], shadow: [140, 168, 188], light: [220, 232, 240] } },
    moss:   { hex: "#A8C4A0", pal: { mid: [168, 196, 160], shadow: [120, 148, 116], light: [208, 224, 200] } },
    rust:   { hex: "#C48460", pal: { mid: [196, 132, 96],  shadow: [148, 88, 60],   light: [224, 172, 140] } },
    berry:  { hex: "#C4849A", pal: { mid: [196, 132, 154], shadow: [148, 88, 110],  light: [224, 176, 192] } },
    cocoa:  { hex: "#A87858", pal: { mid: [168, 120, 88],  shadow: [120, 80, 56],   light: [200, 160, 128] } },
    lilac:  { hex: "#C8B8D8", pal: { mid: [200, 184, 216], shadow: [156, 140, 176], light: [228, 216, 236] } },
  };
  const FACE = {
    black: { hex: "#3A3A3A", pal: null },
    brown: { hex: "#6B3E24", pal: { mid: [107, 62, 36], shadow: [58, 32, 18], light: [140, 88, 62] } },
    cream: { hex: "#C4A07A", pal: { mid: [188, 148, 108], shadow: [130, 96, 64], light: [216, 184, 148] } },
  };
  const EYES = {
    white: { hex: "#FFF8F0", rgb: null },
    honey: { hex: "#E8C36A", rgb: [232, 195, 106] },
    sky:   { hex: "#7BA3C4", rgb: [123, 163, 196] },
    moss:  { hex: "#7A9A68", rgb: [122, 154, 104] },
    berry: { hex: "#A85A6A", rgb: [168, 90, 106] },
  };
  const WOOL_ORDER = ["white", "cream", "peach", "butter", "mist", "blush", "sky", "moss", "rust", "berry", "cocoa", "lilac"];
  const FACE_ORDER = ["black", "brown", "cream"];
  const EYE_ORDER  = ["white", "honey", "sky", "moss", "berry"];
  const WOOL_NAMES = { white: "White", cream: "Cream", peach: "Peach", butter: "Butter", mist: "Mist", blush: "Blush", sky: "Sky", moss: "Moss", rust: "Rust", berry: "Berry", cocoa: "Cocoa", lilac: "Lilac" };
  const FACE_NAMES = { black: "Black", brown: "Brown", cream: "Cream" };
  const EYE_NAMES  = { white: "White", honey: "Honey", sky: "Sky", moss: "Moss", berry: "Berry" };


  function pal(hex, hue, sat, lit, mode, ident) {
    const o = { hex: hex, hue: hue || 0, sat: (sat == null ? 1 : sat), lit: (lit == null ? 1 : lit) };
    if (mode) o.mode = mode;
    if (ident) o.identity = true;
    return o;
  }
  const FOX_FUR = {
    orange:   pal("#EC8C3A", 0, 1, 1, null, true),
    rust:     pal("#C65A28", -10, 1.08, 0.92),
    cream:    pal("#F0D4A8", 12, 0.45, 1.18),
    cocoa:    pal("#8B5A3C", -8, 0.75, 0.72),
    berry:    pal("#B44868", -40, 0.95, 0.95),
    snow:     pal("#E8E4DC", 0, 0.18, 1.22),
    apricot:  pal("#F0A060", 6, 1, 1.06),
    sage:     pal("#8AAA70", 70, 0.55, 0.95),
    charcoal: pal("#5A504C", -8, 0.2, 0.62),
    honey:    pal("#E0A848", 8, 1, 1.04),
    lavender: pal("#C0A0C8", -50, 0.55, 1.02),
    peach:    pal("#F0B898", -4, 0.7, 1.12),
  };
  const CAPY_FUR = {
    sand:    pal("#BA8C60", 0, 1, 1, null, true),
    tan:     pal("#C9A06A", 8, 0.9, 1.08),
    caramel: pal("#C48A4A", -6, 1.05, 0.95),
    cocoa:   pal("#8B5A3C", -4, 0.85, 0.8),
    mocha:   pal("#7A5A48", 12, 0.7, 0.75),
    cream:   pal("#E8D4B0", 10, 0.4, 1.2),
    honey:   pal("#D4A05A", 6, 1, 1.04),
    rust:    pal("#C46A38", -16, 1.08, 0.95),
    gray:    pal("#B0A498", 0, 0.18, 0.95),
    olive:   pal("#8A8A58", 32, 0.55, 0.88),
    peach:   pal("#E8B898", 8, 0.55, 1.12),
    ink:     pal("#5A4A40", -4, 0.35, 0.62),
  };
  const ROCK_STONE = {
    pebble:   pal("#8A8E92", 0, 1, 1, "tint", true),
    slate:    pal("#6A7A8C", 220, 0.22, 0.95, "tint"),
    blush:    pal("#C49A9A", 8, 0.28, 1.05, "tint"),
    sand:     pal("#C4B08A", 38, 0.25, 1.06, "tint"),
    mossy:    pal("#7A9A78", 128, 0.25, 0.98, "tint"),
    coal:     pal("#4A4A4E", 240, 0.08, 0.7, "tint"),
    rose:     pal("#C48A8A", 8, 0.3, 1.02, "tint"),
    sky:      pal("#8AA4B8", 200, 0.22, 1.02, "tint"),
    lavender: pal("#A898B8", 260, 0.22, 1.0, "tint"),
    clay:     pal("#B88868", 20, 0.28, 1.0, "tint"),
    sage:     pal("#8AAA90", 140, 0.2, 1.02, "tint"),
    ivory:    pal("#E0D8C8", 40, 0.1, 1.2, "tint"),
  };
  const DRAGON_BODY = {
    mint:     pal("#8ED3BF", 0, 1, 1, null, true),
    sky:      pal("#8EC8D8", 28, 1, 1.02),
    pink:     pal("#E8A0B4", 185, 1.05, 1.02),
    butter:   pal("#E8D48C", -110, 1.05, 1.08),
    lavender: pal("#C0B0E0", 110, 0.95, 1),
    cocoa:    pal("#A07858", -100, 0.85, 0.82),
    peach:    pal("#F0C0A8", -100, 0.9, 1.08),
    sage:     pal("#8CB898", 50, 0.7, 0.95),
    berry:    pal("#C07090", 170, 1, 0.95),
    snow:     pal("#E8E8E0", 0, 0.2, 1.2),
    navy:     pal("#5A7A98", 40, 0.85, 0.78),
    honey:    pal("#E0C060", -90, 1, 1.05),
  };
  const DRAGON_WINGS = {
    lavender: pal("#B8A0D8", 0, 1, 1, null, true),
    mint:     pal("#8ED3BF", -110, 1, 1.05),
    pink:     pal("#E8A0C0", -80, 1, 1.05),
    peach:    pal("#F0C0A8", -110, 0.9, 1.08),
    sky:      pal("#98C8E8", 50, 1, 1.05),
    grape:    pal("#8A6AB0", 15, 1.15, 0.9),
    butter:   pal("#E8D48C", -110, 1, 1.08),
    cocoa:    pal("#A07858", -100, 0.85, 0.85),
    navy:     pal("#5A6A98", 40, 1, 0.85),
    rose:     pal("#D08090", -70, 1, 0.95),
    sage:     pal("#88B898", -130, 0.7, 1),
    snow:     pal("#E8E4E0", 0, 0.2, 1.22),
  };
  const KIWI_FEATHER = {
    brown: pal("#8A5A38", 0, 1, 1, null, true),
    tan:   pal("#C49A68", 8, 0.85, 1.12),
    cocoa: pal("#6B3E24", -4, 0.95, 0.82),
    olive: pal("#6E7A48", 35, 0.8, 0.9),
    rust:  pal("#C45A28", -15, 1.1, 1),
    cream: pal("#E0C8A0", 12, 0.4, 1.22),
    honey: pal("#D4A04A", 6, 1, 1.04),
    gray:  pal("#B0A498", 0, 0.15, 0.95),
    peach: pal("#E8B898", 6, 0.55, 1.12),
    moss:  pal("#6A8A50", 40, 0.75, 0.9),
    berry: pal("#B06060", -30, 0.7, 0.95),
    sand:  pal("#D4BC8A", 10, 0.55, 1.1),
  };
  const CAT_FUR = {
    orange: pal("#E8A050", 0, 1, 1, null, true),
    rust:   pal("#C45A28", -12, 1.08, 0.92),
    cream:  pal("#F0D8B0", 10, 0.4, 1.2),
    gray:   pal("#B0A8A0", 0, 0.12, 0.95),
    cocoa:  pal("#8B5A3C", -8, 0.75, 0.75),
    peach:  pal("#F0B898", -6, 0.7, 1.1),
    honey:  pal("#E0A848", 6, 1, 1.04),
    ink:    pal("#4A4444", 0, 0.15, 0.55),
    lilac:  pal("#C0A8C8", -40, 0.45, 1.02),
    sand:   pal("#E0C8A0", 8, 0.45, 1.12),
    mint:   pal("#A8C8B0", 80, 0.4, 1.05),
    white:  pal("#F0ECE6", 0, 0.15, 1.22),
  };
  const DOG_FUR = {
    caramel: pal("#C48A50", 0, 1, 1, null, true),
    cream:   pal("#E8D4B0", 10, 0.4, 1.2),
    cocoa:   pal("#8B5A3C", -6, 0.85, 0.8),
    rust:    pal("#C45A28", -14, 1.08, 0.95),
    gray:    pal("#B0A8A0", 0, 0.12, 0.95),
    peach:   pal("#E8B090", -8, 0.7, 1.08),
    honey:   pal("#E0A848", 8, 1, 1.04),
    ink:     pal("#4A4440", 0, 0.15, 0.55),
    sand:    pal("#E0C8A0", 10, 0.45, 1.12),
    white:   pal("#F0ECE6", 0, 0.15, 1.22),
    sage:    pal("#98B090", 60, 0.4, 0.95),
    berry:   pal("#B07070", -30, 0.55, 0.95),
  };
  const DUCK_FEATHER = {
    yellow: pal("#F5D04A", 0, 1, 1, null, true),
    peach:  pal("#F0B878", -18, 0.9, 1.05),
    white:  pal("#F4F0E4", 0, 0.12, 1.18),
    mint:   pal("#A8E0B8", 90, 0.7, 1.05),
    orange: pal("#F08C28", -28, 1.05, 1),
    butter: pal("#F0E08C", 8, 0.85, 1.08),
    sky:    pal("#A8D0E8", 50, 0.65, 1.08),
    cocoa:  pal("#A07048", -30, 0.7, 0.82),
    sage:   pal("#98C890", 90, 0.55, 1),
    berry:  pal("#E090A0", -80, 0.7, 1),
    gray:   pal("#C8C4B8", 0, 0.12, 0.98),
    honey:  pal("#E8C050", 4, 1, 1.02),
  };
  const CROW_FEATHER = {
    ink:    pal("#3A3A40", 0, 1, 1, "tint", true),
    navy:   pal("#3A4A6A", 220, 0.28, 1.2, "tint"),
    plum:   pal("#5A3A58", 290, 0.28, 1.18, "tint"),
    cocoa:  pal("#5A3E30", 25, 0.28, 1.22, "tint"),
    sage:   pal("#3E5648", 140, 0.22, 1.18, "tint"),
    snow:   pal("#D8D4CE", 0, 0.06, 2.1, "tint"),
    rose:   pal("#6A4A58", 330, 0.28, 1.18, "tint"),
    forest: pal("#3A4A3E", 140, 0.22, 1.15, "tint"),
    steel:  pal("#6A7078", 220, 0.1, 1.4, "tint"),
    slate:  pal("#5A6470", 210, 0.15, 1.3, "tint"),
    wine:   pal("#5A3038", 0, 0.3, 1.15, "tint"),
    sand:   pal("#C4B090", 40, 0.2, 1.8, "tint"),
  };
  const RAT_FUR = {
    gray:     pal("#A8A4A8", 0, 1, 1, null, true),
    white:    pal("#F0ECE6", 0, 0.25, 1.28),
    cocoa:    pal("#8B5A3C", 25, 0.55, 0.92),
    pink:     pal("#E0B0B8", -20, 0.4, 1.08),
    charcoal: pal("#5A585C", 0, 0.9, 0.68),
    peach:    pal("#E8C0A8", 20, 0.4, 1.1),
    sand:     pal("#D4BC8A", 22, 0.45, 1.08),
    lilac:    pal("#C0A8C8", -20, 0.4, 1.02),
    ink:      pal("#4A4448", 0, 0.4, 0.55),
    honey:    pal("#D4A060", 28, 0.55, 1.04),
    sage:     pal("#98B090", 50, 0.35, 0.95),
    berry:    pal("#C08088", -15, 0.45, 0.95),
  };
  const FOX_FUR_ORDER = ["orange", "rust", "cream", "cocoa", "berry", "snow", "apricot", "sage", "charcoal", "honey", "lavender", "peach"];
  const CAPY_FUR_ORDER = ["sand", "tan", "caramel", "cocoa", "mocha", "cream", "honey", "rust", "gray", "olive", "peach", "ink"];
  const ROCK_STONE_ORDER = ["pebble", "slate", "blush", "sand", "mossy", "coal", "rose", "sky", "lavender", "clay", "sage", "ivory"];
  const DRAGON_BODY_ORDER = ["mint", "sky", "pink", "butter", "lavender", "cocoa", "peach", "sage", "berry", "snow", "navy", "honey"];
  const DRAGON_WINGS_ORDER = ["lavender", "mint", "pink", "peach", "sky", "grape", "butter", "cocoa", "navy", "rose", "sage", "snow"];
  const KIWI_FEATHER_ORDER = ["brown", "tan", "cocoa", "olive", "rust", "cream", "honey", "gray", "peach", "moss", "berry", "sand"];
  const CAT_FUR_ORDER = ["orange", "rust", "cream", "gray", "cocoa", "peach", "honey", "ink", "lilac", "sand", "mint", "white"];
  const DOG_FUR_ORDER = ["caramel", "cream", "cocoa", "rust", "gray", "peach", "honey", "ink", "sand", "white", "sage", "berry"];
  const DUCK_FEATHER_ORDER = ["yellow", "peach", "white", "mint", "orange", "butter", "sky", "cocoa", "sage", "berry", "gray", "honey"];
  const CROW_FEATHER_ORDER = ["ink", "navy", "plum", "cocoa", "sage", "snow", "rose", "forest", "steel", "slate", "wine", "sand"];
  const RAT_FUR_ORDER = ["gray", "white", "cocoa", "pink", "charcoal", "peach", "sand", "lilac", "ink", "honey", "sage", "berry"];
  const FOX_FUR_NAMES = { orange: "Orange", rust: "Rust", cream: "Cream", cocoa: "Cocoa", berry: "Berry", snow: "Snow", apricot: "Apricot", sage: "Sage", charcoal: "Charcoal", honey: "Honey", lavender: "Lilac", peach: "Peach" };
  const CAPY_FUR_NAMES = { sand: "Sand", tan: "Tan", caramel: "Caramel", cocoa: "Cocoa", mocha: "Mocha", cream: "Cream", honey: "Honey", rust: "Rust", gray: "Gray", olive: "Olive", peach: "Peach", ink: "Ink" };
  const ROCK_STONE_NAMES = { pebble: "Pebble", slate: "Slate", blush: "Blush", sand: "Sand", mossy: "Mossy", coal: "Coal", rose: "Rose", sky: "Sky", lavender: "Lilac", clay: "Clay", sage: "Sage", ivory: "Ivory" };
  const DRAGON_BODY_NAMES = { mint: "Mint", sky: "Sky", pink: "Pink", butter: "Butter", lavender: "Lilac", cocoa: "Cocoa", peach: "Peach", sage: "Sage", berry: "Berry", snow: "Snow", navy: "Navy", honey: "Honey" };
  const DRAGON_WINGS_NAMES = { lavender: "Lavender", mint: "Mint", pink: "Pink", peach: "Peach", sky: "Sky", grape: "Grape", butter: "Butter", cocoa: "Cocoa", navy: "Navy", rose: "Rose", sage: "Sage", snow: "Snow" };
  const KIWI_FEATHER_NAMES = { brown: "Brown", tan: "Tan", cocoa: "Cocoa", olive: "Olive", rust: "Rust", cream: "Cream", honey: "Honey", gray: "Gray", peach: "Peach", moss: "Moss", berry: "Berry", sand: "Sand" };
  const CAT_FUR_NAMES = { orange: "Orange", rust: "Rust", cream: "Cream", gray: "Gray", cocoa: "Cocoa", peach: "Peach", honey: "Honey", ink: "Ink", lilac: "Lilac", sand: "Sand", mint: "Mint", white: "White" };
  const DOG_FUR_NAMES = { caramel: "Caramel", cream: "Cream", cocoa: "Cocoa", rust: "Rust", gray: "Gray", peach: "Peach", honey: "Honey", ink: "Ink", sand: "Sand", white: "White", sage: "Sage", berry: "Berry" };
  const DUCK_FEATHER_NAMES = { yellow: "Yellow", peach: "Peach", white: "White", mint: "Mint", orange: "Orange", butter: "Butter", sky: "Sky", cocoa: "Cocoa", sage: "Sage", berry: "Berry", gray: "Gray", honey: "Honey" };
  const CROW_FEATHER_NAMES = { ink: "Ink", navy: "Navy", plum: "Plum", cocoa: "Cocoa", sage: "Sage", snow: "Snow", rose: "Rose", forest: "Forest", steel: "Steel", slate: "Slate", wine: "Wine", sand: "Sand" };
  const RAT_FUR_NAMES = { gray: "Gray", white: "White", cocoa: "Cocoa", pink: "Pink", charcoal: "Charcoal", peach: "Peach", sand: "Sand", lilac: "Lilac", ink: "Ink", honey: "Honey", sage: "Sage", berry: "Berry" };

  const PALS = {
    WOOL: { map: WOOL, order: WOOL_ORDER, names: WOOL_NAMES, fallback: "white" },
    FACE: { map: FACE, order: FACE_ORDER, names: FACE_NAMES, fallback: "black" },
    EYES: { map: EYES, order: EYE_ORDER,  names: EYE_NAMES,  fallback: "white" },
    FOX_FUR: { map: FOX_FUR, order: FOX_FUR_ORDER, names: FOX_FUR_NAMES, fallback: "orange" },
    CAPY_FUR: { map: CAPY_FUR, order: CAPY_FUR_ORDER, names: CAPY_FUR_NAMES, fallback: "sand" },
    ROCK_STONE: { map: ROCK_STONE, order: ROCK_STONE_ORDER, names: ROCK_STONE_NAMES, fallback: "pebble" },
    DRAGON_BODY: { map: DRAGON_BODY, order: DRAGON_BODY_ORDER, names: DRAGON_BODY_NAMES, fallback: "mint" },
    DRAGON_WINGS: { map: DRAGON_WINGS, order: DRAGON_WINGS_ORDER, names: DRAGON_WINGS_NAMES, fallback: "lavender" },
    KIWI_FEATHER: { map: KIWI_FEATHER, order: KIWI_FEATHER_ORDER, names: KIWI_FEATHER_NAMES, fallback: "brown" },
    CAT_FUR: { map: CAT_FUR, order: CAT_FUR_ORDER, names: CAT_FUR_NAMES, fallback: "orange" },
    DOG_FUR: { map: DOG_FUR, order: DOG_FUR_ORDER, names: DOG_FUR_NAMES, fallback: "caramel" },
    DUCK_FEATHER: { map: DUCK_FEATHER, order: DUCK_FEATHER_ORDER, names: DUCK_FEATHER_NAMES, fallback: "yellow" },
    CROW_FEATHER: { map: CROW_FEATHER, order: CROW_FEATHER_ORDER, names: CROW_FEATHER_NAMES, fallback: "ink" },
    RAT_FUR: { map: RAT_FUR, order: RAT_FUR_ORDER, names: RAT_FUR_NAMES, fallback: "gray" },
  };

  const HAT_DYE = ["80,130,90", "60,100,70"];
  const WITCH_GOLD = ["242,194,48", "184,134,11", "255,242,180"];
  const BOW_DYE = ["228,90,120", "246,150,168", "200,60,90"];
  const CROWN_DYE = ["244,150,180", "200,150,220", "255,245,250", "255,200,90", "255,250,200"];
  const COLLAR_DYE = ["8,6,8", "18,16,18", "36,32,38"];

  function lum(r, g, b) { return 0.3 * r + 0.59 * g + 0.11 * b; }
  function lerp(a, b, t) { return (a + (b - a) * t + 0.5) | 0; }
  function keyRGB(r, g, b) { return r + "," + g + "," + b; }
  function mapTone(r, g, b, pal, baseMid, baseLo, baseHi) {
    const L = lum(r, g, b);
    if (L <= baseMid) {
      const t = baseMid === baseLo ? 0 : Math.max(0, Math.min(1, (L - baseLo) / (baseMid - baseLo)));
      return [lerp(pal.shadow[0], pal.mid[0], t), lerp(pal.shadow[1], pal.mid[1], t), lerp(pal.shadow[2], pal.mid[2], t)];
    }
    const t = baseHi === baseMid ? 0 : Math.max(0, Math.min(1, (L - baseMid) / (baseHi - baseMid)));
    return [lerp(pal.mid[0], pal.light[0], t), lerp(pal.mid[1], pal.light[1], t), lerp(pal.mid[2], pal.light[2], t)];
  }

  function imageToCanvas(img) {
    const c = document.createElement("canvas");
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return c;
  }

  function largestFace(data, w, h) {
    const dark = [];
    const seen = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const a = data[i + 3], r = data[i], g = data[i + 1], b = data[i + 2];
        const L = lum(r, g, b);
        if (a > 200 && L >= 18 && L < 85) dark.push(y * w + x);
      }
    }
    let best = [];
    const dirs = [1, -1, w, -w, w + 1, w - 1, -w + 1, -w - 1];
    for (let n = 0; n < dark.length; n++) {
      const start = dark[n];
      if (seen[start]) continue;
      const comp = [];
      const q = [start];
      seen[start] = 1;
      while (q.length) {
        const p = q.pop();
        comp.push(p);
        const px = p % w, py = (p / w) | 0;
        for (let d = 0; d < 8; d++) {
          const np = p + dirs[d];
          const nx = np % w, ny = (np / w) | 0;
          if (np < 0 || np >= w * h) continue;
          if (Math.abs(nx - px) > 1 || Math.abs(ny - py) > 1) continue;
          if (seen[np]) continue;
          const i = np * 4, a = data[i + 3];
          if (a <= 200) continue;
          const L = lum(data[i], data[i + 1], data[i + 2]);
          if (L < 18 || L >= 85) continue;
          seen[np] = 1;
          q.push(np);
        }
      }
      if (comp.length > best.length) best = comp;
    }
    const set = new Uint8Array(w * h);
    for (let i = 0; i < best.length; i++) set[best[i]] = 1;
    return set;
  }

  function findEyes(data, w, h) {
    const head = largestFace(data, w, h);
    const blocked = new Uint8Array(w * h);
    blocked.set(head);
    const around = [1, -1, w, -w, w + 1, w - 1, -w + 1, -w - 1];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (data[i + 3] > 200 && lum(data[i], data[i + 1], data[i + 2]) < 18) {
          let near = false;
          for (let d = 0; d < 8; d++) {
            const np = y * w + x + around[d];
            const nx = np % w, ny = (np / w) | 0;
            if (np < 0 || np >= w * h) continue;
            if (Math.abs(nx - x) > 1 || Math.abs(ny - y) > 1) continue;
            if (head[np]) { near = true; break; }
          }
          if (near) blocked[y * w + x] = 1;
        }
      }
    }
    const reach = new Uint8Array(w * h);
    const q = [];
    const tryadd = (p) => {
      if (p < 0 || p >= w * h || reach[p] || blocked[p]) return;
      reach[p] = 1; q.push(p);
    };
    for (let x = 0; x < w; x++) { tryadd(x); tryadd((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { tryadd(y * w); tryadd(y * w + (w - 1)); }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] < 20) tryadd(y * w + x);
      }
    }
    const dirs4 = [1, -1, w, -w];
    while (q.length) {
      const p = q.pop();
      const px = p % w, py = (p / w) | 0;
      for (let d = 0; d < 4; d++) {
        const np = p + dirs4[d];
        const nx = np % w, ny = (np / w) | 0;
        if (np < 0 || np >= w * h) continue;
        if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
        tryadd(np);
      }
    }
    const eyes = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) {
      if (reach[p] || blocked[p]) continue;
      const i = p * 4;
      if (data[i + 3] >= 200 && lum(data[i], data[i + 1], data[i + 2]) > 120) eyes[p] = 1;
    }
    const extra = [];
    for (let p = 0; p < w * h; p++) {
      if (!eyes[p]) continue;
      const px = p % w, py = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx, ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (eyes[np] || blocked[np]) continue;
          const i = np * 4;
          if (data[i + 3] >= 200 && lum(data[i], data[i + 1], data[i + 2]) > 110) extra.push(np);
        }
      }
    }
    for (let i = 0; i < extra.length; i++) eyes[extra[i]] = 1;
    return eyes;
  }

  function recolorSheepImage(img, colors) {
    const src = imageToCanvas(img);
    const ctx = src.getContext("2d", { willReadFrequently: true });
    const w = src.width, h = src.height;
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const wool = (colors && colors.wool) || "white";
    const face = (colors && colors.face) || "black";
    const eyesId = (colors && colors.eyes) || "white";
    const woolPal = WOOL[wool] && WOOL[wool].pal;
    const facePal = FACE[face] && FACE[face].pal;
    const eyeRgb = EYES[eyesId] && EYES[eyesId].rgb;
    const woolDye = resolveDye(colors, "wool", WOOL, "white");
    const faceDye = resolveDye(colors, "face", FACE, "black");
    const eyeDye = resolveDye(colors, "eyes", EYES, "white");
    const eyeMask = (eyeRgb || eyeDye || woolPal || woolDye || facePal || faceDye) ? findEyes(data, w, h) : null;
    if (!woolPal && !facePal && !eyeRgb && !woolDye && !faceDye && !eyeDye) return src;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4, a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const L = lum(r, g, b);
      if (eyeMask && eyeMask[p]) {
        if (eyeDye) {
          const n = applyDye(r, g, b, eyeDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else if (eyeRgb) {
          const er = eyeRgb[0], eg = eyeRgb[1], eb = eyeRgb[2];
          if (L > 245) {
            data[i] = Math.min(255, er + 45); data[i + 1] = Math.min(255, eg + 40); data[i + 2] = Math.min(255, eb + 40);
          } else {
            const tt = Math.max(0, Math.min(1, (L - 180) / 70));
            data[i] = lerp((er * 0.72) | 0, er, tt);
            data[i + 1] = lerp((eg * 0.72) | 0, eg, tt);
            data[i + 2] = lerp((eb * 0.72) | 0, eb, tt);
          }
        }
        continue;
      }
      if (L < 18) continue;
      const isWool = L > 140 && r > 150 && g > 140;
      const isFace = L >= 18 && L < 90 && !isWool;
      if (isWool) {
        if (woolDye) {
          const n = applyDye(r, g, b, woolDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else if (woolPal) {
          const n = mapTone(r, g, b, woolPal, 247, 165, 255);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      } else if (isFace) {
        if (faceDye) {
          const n = applyDye(r, g, b, faceDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else if (facePal) {
          const n = mapTone(r, g, b, facePal, 58, 18, 110);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      } else if ((woolDye || woolPal) && r > 130 && g > 120 && L >= 90) {
        if (woolDye) {
          const n = applyDye(r, g, b, woolDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else {
          const n = mapTone(r, g, b, woolPal, 247, 165, 255);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      } else if ((faceDye || facePal) && L < 140) {
        if (faceDye) {
          const n = applyDye(r, g, b, faceDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else {
          const n = mapTone(r, g, b, facePal, 58, 18, 110);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    return src;
  }

  function dyeSetFor(kind, data, w, h) {
    if (kind === "hat") return HAT_DYE;
    if (kind === "bow") return BOW_DYE;
    if (kind === "crown") return CROWN_DYE;
    if (kind === "collar") return COLLAR_DYE;
    if (kind === "witch") {
      const gold = {};
      for (let i = 0; i < WITCH_GOLD.length; i++) gold[WITCH_GOLD[i]] = 1;
      const set = {};
      for (let p = 0; p < w * h; p++) {
        const i = p * 4;
        if (data[i + 3] === 0) continue;
        const k = keyRGB(data[i], data[i + 1], data[i + 2]);
        if (!gold[k]) set[k] = 1;
      }
      return Object.keys(set);
    }
    return [];
  }

  function recolorCostumeImage(img, kind, colorId) {
    const src = imageToCanvas(img);
    if (!colorId || colorId === "default" || !HUT[colorId]) return src;
    const ctx = src.getContext("2d", { willReadFrequently: true });
    const w = src.width, h = src.height;
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const pal = HUT[colorId];
    const dyes = dyeSetFor(kind, data, w, h);
    const ranked = dyes.slice().sort((a, b) => {
      const A = a.split(",").map(Number), B = b.split(",").map(Number);
      return lum(A[0], A[1], A[2]) - lum(B[0], B[1], B[2]);
    });
    const map = {};
    const n = ranked.length;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      let rgb;
      if (t <= 0.5) {
        const tt = t / 0.5;
        rgb = [lerp(pal.shadow[0], pal.mid[0], tt), lerp(pal.shadow[1], pal.mid[1], tt), lerp(pal.shadow[2], pal.mid[2], tt)];
      } else {
        const tt = (t - 0.5) / 0.5;
        rgb = [lerp(pal.mid[0], pal.light[0], tt), lerp(pal.mid[1], pal.light[1], tt), lerp(pal.mid[2], pal.light[2], tt)];
      }
      map[ranked[i]] = rgb;
    }
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (data[i + 3] === 0) continue;
      const k = keyRGB(data[i], data[i + 1], data[i + 2]);
      const nrgb = map[k];
      if (nrgb) { data[i] = nrgb[0]; data[i + 1] = nrgb[1]; data[i + 2] = nrgb[2]; }
    }
    ctx.putImageData(image, 0, 0);
    return src;
  }



  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return [h * 60, s, l];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs(hp % 2 - 1));
    let r = 0, g = 0, b = 0;
    if (hp < 1) { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; }
    else if (hp < 5) { r = x; b = c; }
    else { r = c; b = x; }
    const m = l - c / 2;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function isDye(v) {
    return !!(v && typeof v === "object" && typeof v.h === "number" && typeof v.s === "number" && typeof v.l === "number");
  }
  function parseHex(hex) {
    if (!hex || typeof hex !== "string") return null;
    let h = hex.trim().replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (!isFinite(n)) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function dyeFromHex(hex) {
    const rgb = parseHex(hex);
    if (!rgb) return { h: 0, s: 0, l: 0.5 };
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return { h: hsl[0], s: hsl[1], l: hsl[2] };
  }
  function dyeFromPreset(entry) {
    if (!entry) return { h: 0, s: 0, l: 0.5 };
    if (entry.hex) return dyeFromHex(entry.hex);
    if (entry.rgb) {
      const hsl = rgbToHsl(entry.rgb[0], entry.rgb[1], entry.rgb[2]);
      return { h: hsl[0], s: hsl[1], l: hsl[2] };
    }
    if (entry.mid) {
      const hsl = rgbToHsl(entry.mid[0], entry.mid[1], entry.mid[2]);
      return { h: hsl[0], s: hsl[1], l: hsl[2] };
    }
    return { h: 0, s: 0, l: 0.5 };
  }
  function isIdentityEntry(entry) {
    if (!entry) return true;
    if (entry.identity) return true;
    if (entry.pal === null && entry.rgb == null && !entry.mode && entry.hue == null) return true;
    return false;
  }
  function shouldApplyDye(colors, key, map) {
    if (!colors) return false;
    if (colors[key] === "custom") return true;
    if (colors.dye && isDye(colors.dye[key]) && colors.dye[key].custom) return true;
    const entry = map && map[colors[key]];
    return !!(entry && !isIdentityEntry(entry));
  }
  function resolveDye(colors, key, map, fallback) {
    if (!shouldApplyDye(colors, key, map)) return null;
    if (colors && colors.dye && isDye(colors.dye[key])) return colors.dye[key];
    const entry = map && ((colors && map[colors[key]]) || map[fallback]);
    return entry ? dyeFromPreset(entry) : null;
  }
  function mapLumaToRange(lSrc, targetL) {
    const t = clamp01((lSrc - 0.18) / 0.70);
    let down, up;
    if (targetL <= 0.22) {
      down = Math.max(0.03, Math.min(targetL - 0.04, 0.08));
      up = 0.10 + Math.max(0, 0.22 - targetL) * 0.2;
    } else if (targetL >= 0.82) {
      down = 0.14 + (targetL - 0.82) * 0.25;
      up = Math.min(0.97 - targetL, 0.08);
    } else {
      down = 0.18;
      up = 0.18;
    }
    down = Math.max(0.025, Math.min(down, Math.max(0.02, targetL - 0.035)));
    up = Math.max(0.03, Math.min(up, Math.max(0.02, 0.975 - targetL)));
    return clamp01(targetL - down + t * (down + up));
  }
  function applyDye(r, g, b, dye) {
    if (!dye) return [r, g, b];
    const lPix = lum(r, g, b) / 255;
    const lNew = mapLumaToRange(lPix, clamp01(dye.l));
    const sBase = clamp01(dye.s);
    const sAdj = sBase * (0.78 + 0.22 * (1 - Math.abs(lNew - 0.5) * 1.4));
    return hslToRgb(dye.h || 0, clamp01(sAdj), lNew);
  }
  function ensureDye(model, speciesId) {
    if (!model) return model;
    const sp = window.MyPetSpecies && MyPetSpecies.of(speciesId || model.species || model);
    const slots = (sp && sp.colorSlots) || [
      { key: "wool", pal: "WOOL" },
      { key: "face", pal: "FACE" },
      { key: "eyes", pal: "EYES" },
    ];
    if (!model.dye || typeof model.dye !== "object") model.dye = {};
    slots.forEach((slot) => {
      if (isDye(model.dye[slot.key])) return;
      const pal = PALS[slot.pal];
      const map = pal ? pal.map : null;
      const fallback = pal ? pal.fallback : null;
      const id = model[slot.key] || fallback;
      const entry = map && (map[id] || map[fallback]);
      model.dye[slot.key] = dyeFromPreset(entry);
    });
    return model;
  }

    function inRange(v, a, b) { return v >= a && v <= b; }
  function inHue(h, a, b) {
    if (a <= b) return h >= a && h <= b;
    return h >= a || h <= b; // wrap
  }
  function isBlushHsl(h, s, l, r, g, b) {
    if (!(h <= 22 || h >= 338)) return false;
    return s >= 0.2 && l >= 0.45 && l <= 0.9 && r >= g + 15 && r >= b + 15;
  }
  function isCreamHsl(h, s, l) {
    if (l > 0.93) return true; // eye highlights / white
    if (l > 0.82 && s < 0.48) return true;
    if (l > 0.75 && s < 0.28) return true;
    return false;
  }
  function inBand(h, s, l, band) {
    if (!band) return false;
    if (band.h && !inHue(h, band.h[0], band.h[1])) return false;
    if (band.s && !inRange(s, band.s[0], band.s[1])) return false;
    if (band.l && !inRange(l, band.l[0], band.l[1])) return false;
    if (band.maxS != null && s > band.maxS) return false;
    return true;
  }

  const HUE_SPEC = {
    fox:      { body: { h: [8, 46], s: [0.35, 1], l: [0.18, 0.82] } },
    capybara: { body: { h: [12, 45], s: [0.25, 1], l: [0.18, 0.78] } },
    rock:     { body: { s: [0, 0.18], l: [0.18, 0.8] }, keep: { h: [70, 160], s: [0.2, 1] } }, // moss stays
    dragon:   { body: { h: [135, 180], s: [0.15, 1], l: [0.28, 0.88] }, secondary: { h: [240, 320], s: [0.12, 1], l: [0.25, 0.88] } },
    kiwi:     { body: { h: [10, 42], s: [0.25, 1], l: [0.16, 0.62] }, keep: { h: [22, 55], s: [0.25, 1], l: [0.48, 0.8] } }, // beak/feet
    cat:      { body: { h: [8, 46], s: [0.3, 1], l: [0.18, 0.82] } },
    dog:      { body: { h: [8, 45], s: [0.25, 1], l: [0.18, 0.8] } },
    duck:     { body: { h: [38, 70], s: [0.35, 1], l: [0.35, 0.92] }, keep: { h: [10, 36], s: [0.4, 1] } }, // beak/feet
    crow:     { body: { s: [0, 0.22], l: [0.08, 0.72] } },
    rat:      { body: { h: [200, 320], s: [0, 0.25], l: [0.2, 0.8] }, body2: { s: [0, 0.18], l: [0.2, 0.8] } }, // gray may have any weak hue
  };

  function applyPreset(r, g, b, preset) {
    if (!preset || preset.identity) return [r, g, b];
    let [h, s, l] = rgbToHsl(r, g, b);
    if (preset.mode === "tint") {
      h = preset.hue;
      const t = preset.sat || 0.2;
      s = Math.min(1, s * 0.35 + t);
      l = Math.max(0.03, Math.min(0.97, l * (preset.lit == null ? 1 : preset.lit)));
    } else {
      h = h + (preset.hue || 0);
      s = Math.max(0, Math.min(1, s * (preset.sat == null ? 1 : preset.sat)));
      l = Math.max(0.03, Math.min(0.97, l * (preset.lit == null ? 1 : preset.lit)));
    }
    return hslToRgb(h, s, l);
  }

  function slotOfPixel(h, s, l, spec) {
    if (spec.keep && inBand(h, s, l, spec.keep)) return null;
    if (spec.secondary && inBand(h, s, l, spec.secondary)) return "face";
    if (spec.body && inBand(h, s, l, spec.body)) return "wool";
    if (spec.body2 && inBand(h, s, l, spec.body2)) return "wool";
    return null;
  }

  function recolorHueImage(img, colors, speciesId) {
    const src = imageToCanvas(img);
    const spec = HUE_SPEC[speciesId];
    if (!spec) return src;
    const ctx = src.getContext("2d", { willReadFrequently: true });
    const w = src.width, h = src.height;
    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    const sp = window.MyPetSpecies && MyPetSpecies.of(speciesId);
    const slots = (sp && sp.colorSlots) || [];
    const presets = { wool: null, face: null };
    const dyes = { wool: null, face: null, eyes: null };
    slots.forEach((slot) => {
      const pal = PALS[slot.pal];
      if (!pal) return;
      const id = (colors && colors[slot.key]) || (sp && sp.defaults && sp.defaults[slot.key]) || pal.fallback;
      const entry = pal.map[id];
      if (entry && !entry.identity && (entry.hue || entry.sat !== 1 || entry.lit !== 1 || entry.mode)) {
        presets[slot.key] = entry;
      }
      const d = resolveDye(colors, slot.key, pal.map, pal.fallback);
      if (d) dyes[slot.key] = d;
    });
    const eyesId = (colors && colors.eyes) || "white";
    const eyeRgb = EYES[eyesId] && EYES[eyesId].rgb;
    const eyeDye = dyes.eyes;
    const need = dyes.wool || dyes.face || presets.wool || presets.face || eyeRgb || eyeDye;
    if (!need) return src;
    const eyeMask = (eyeRgb || eyeDye) ? findEyes(data, w, h) : null;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4, a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const [hh, ss, ll] = rgbToHsl(r, g, b);
      if (ll < 0.12) continue; // outline / pupils
      if (eyeMask && eyeMask[p]) {
        if (eyeDye) {
          const n = applyDye(r, g, b, eyeDye);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        } else if (eyeRgb) {
          const er = eyeRgb[0], eg = eyeRgb[1], eb = eyeRgb[2];
          const L = lum(r, g, b);
          if (L > 245) {
            data[i] = Math.min(255, er + 45); data[i + 1] = Math.min(255, eg + 40); data[i + 2] = Math.min(255, eb + 40);
          } else {
            const tt = Math.max(0, Math.min(1, (L - 180) / 70));
            data[i] = lerp((er * 0.72) | 0, er, tt);
            data[i + 1] = lerp((eg * 0.72) | 0, eg, tt);
            data[i + 2] = lerp((eb * 0.72) | 0, eb, tt);
          }
        }
        continue;
      }
      if (isBlushHsl(hh, ss, ll, r, g, b)) continue;
      if (isCreamHsl(hh, ss, ll)) {
        if (eyeRgb && ll > 0.9 && ss < 0.2) {
          const x = p % w, y = (p / w) | 0;
          let nearDark = false;
          for (let dy = -2; dy <= 2 && !nearDark; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const j = (ny * w + nx) * 4;
              if (data[j + 3] < 128) continue;
              const L = lum(data[j], data[j + 1], data[j + 2]);
              if (L < 50) { nearDark = true; break; }
            }
          }
          if (nearDark) {
            data[i] = Math.min(255, eyeRgb[0] + 45);
            data[i + 1] = Math.min(255, eyeRgb[1] + 40);
            data[i + 2] = Math.min(255, eyeRgb[2] + 40);
          }
        }
        continue;
      }
      const slot = slotOfPixel(hh, ss, ll, spec);
      const dye = slot && dyes[slot];
      if (dye) {
        const n = applyDye(r, g, b, dye);
        data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
      } else {
        const pres = slot && presets[slot];
        if (pres) {
          const n = applyPreset(r, g, b, pres);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    return src;
  }

  function recolorPetImage(img, colors, species) {
    const id = (species && typeof species === "object") ? species.species || species.id : species;
    if (!id || id === "sheep_valais") return recolorSheepImage(img, colors);
    return recolorHueImage(img, colors, id);
  }

  function palettesFor(pet) {
    const sp = window.MyPetSpecies && MyPetSpecies.of(pet);
    if (sp && sp.colorSlots && sp.colorSlots.length) {
      const out = { dWool: sp.defaults && sp.defaults.wool, dFace: sp.defaults && sp.defaults.face, dEyes: (sp.defaults && sp.defaults.eyes) || "white" };
      sp.colorSlots.forEach((slot) => {
        const pal = PALS[slot.pal];
        if (!pal) return;
        if (slot.key === "wool") out.wool = pal.map;
        if (slot.key === "face") out.face = pal.map;
        if (slot.key === "eyes") out.eyes = pal.map;
      });
      if (!out.wool) out.wool = WOOL;
      if (!out.face) out.face = FACE;
      if (!out.eyes) out.eyes = EYES;
      return out;
    }
    return { wool: WOOL, face: FACE, eyes: EYES, dWool: "white", dFace: "black", dEyes: "white" };
  }

  function knownId(map, id) {
    if (id === "custom" || isDye(id)) return true;
    return !!(map && id && map[id]);
  }
  function migratePet(pet) {
    if (!pet) return pet;
    const pal = palettesFor(pet);
    if (!knownId(pal.wool, pet.wool)) pet.wool = pal.dWool;
    if (pet.face && pal.face && !knownId(pal.face, pet.face)) pet.face = pal.dFace;
    if (!knownId(pal.eyes, pet.eyes)) pet.eyes = pal.dEyes;
    if (!pet.costumeColors || typeof pet.costumeColors !== "object") pet.costumeColors = {};
    ensureDye(pet);
    return pet;
  }

  function swatchHex(kind, colorId) {
    if (colorId === "default") return DEFAULT_SWATCH[kind] || "#C8B49A";
    return (HUT[colorId] && HUT[colorId].hex) || "#C8B49A";
  }

  root.MyPetColor = {
    HUT, HUT_ORDER, HUT_NAMES, DEFAULT_SWATCH,
    WOOL, FACE, EYES, PALS,
    WOOL_ORDER, FACE_ORDER, EYE_ORDER,
    WOOL_NAMES, FACE_NAMES, EYE_NAMES,
    FOX_FUR, CAPY_FUR, ROCK_STONE, DRAGON_BODY, DRAGON_WINGS,
    KIWI_FEATHER, CAT_FUR, DOG_FUR, DUCK_FEATHER, CROW_FEATHER, RAT_FUR,
    migratePet, recolorSheepImage, recolorHueImage, recolorPetImage, recolorCostumeImage, imageToCanvas, swatchHex, palettesFor,
    isDye, ensureDye, dyeFromPreset, dyeFromHex, applyDye, resolveDye, shouldApplyDye, isIdentityEntry,
    rgbToHsl, hslToRgb,
  };
})(typeof window !== "undefined" ? window : this);

