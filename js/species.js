/* My Pet species + item sets. Next pets should be a data and art drop-in. */
(() => {
  const POSES = ["idle", "walk1", "walk2", "walk3", "walk4", "eat", "drink", "happy", "sleep"];

  const SHEEP_HEAD = {
    idle:  { x: -16, y: -92 },
    walk:  { x: -16, y: -92 },
    walk1: { x: -16, y: -92 },
    walk2: { x: -16, y: -92 },
    walk3: { x: -16, y: -92 },
    walk4: { x: -16, y: -92 },
    eat:   { x: -16, y: -84 },
    drink: { x: -14, y: -82 },
    happy: { x: -16, y: -110 },
    sleep: { x: -20, y: -80 },
  };
  const SHEEP_NECK = {
    idle:  { x: -16, y: -28 },
    walk:  { x: -16, y: -28 },
    walk1: { x: -16, y: -28 },
    walk2: { x: -16, y: -28 },
    walk3: { x: -16, y: -28 },
    walk4: { x: -16, y: -28 },
    eat:   { x: -16, y: -20 },
    drink: { x: -14, y: -18 },
    happy: { x: -16, y: -37 },
    sleep: { x: -20, y: -35 },
  };
  const SHEEP_NOSE = {
    idle:  { x: -44, y: -66 },
    walk:  { x: -44, y: -66 },
    walk1: { x: -44, y: -66 },
    walk2: { x: -44, y: -66 },
    walk3: { x: -44, y: -66 },
    walk4: { x: -44, y: -66 },
    eat:   { x: -48, y: -58 },
    drink: { x: -46, y: -56 },
    happy: { x: -44, y: -80 },
    sleep: { x: -40, y: -58 },
  };

  const FOX_HEAD = {
    idle: { x: -14, y: -79 },
    walk1: { x: -12, y: -78 },
    walk2: { x: -14, y: -79 },
    walk3: { x: -12, y: -79 },
    walk4: { x: -14, y: -80 },
    eat: { x: 45, y: -85 },
    drink: { x: 6, y: -75 },
    happy: { x: -35, y: -81 },
    sleep: { x: -44, y: -72 },
    walk:  { x: -12, y: -78 },
  };
  const FOX_NECK = {
    idle: { x: -14, y: -40 },
    walk1: { x: -12, y: -39 },
    walk2: { x: -14, y: -40 },
    walk3: { x: -12, y: -40 },
    walk4: { x: -14, y: -41 },
    eat: { x: 45, y: -64 },
    drink: { x: 6, y: -39 },
    happy: { x: -35, y: -43 },
    sleep: { x: -44, y: -49 },
    walk:  { x: -12, y: -39 },
  };
  const FOX_NOSE = {
    idle: { x: -33, y: -61 },
    walk1: { x: -29, y: -60 },
    walk2: { x: -33, y: -61 },
    walk3: { x: -29, y: -61 },
    walk4: { x: -33, y: -62 },
    eat: { x: 31, y: -78 },
    drink: { x: -8, y: -53 },
    happy: { x: -59, y: -63 },
    sleep: { x: -64, y: -63 },
    walk:  { x: -29, y: -60 },
  };

  const CAPY_HEAD = {
    idle: { x: -24, y: -90 },
    walk1: { x: -21, y: -88 },
    walk2: { x: -24, y: -90 },
    walk3: { x: -21, y: -89 },
    walk4: { x: -24, y: -91 },
    eat: { x: 25, y: -77 },
    drink: { x: -15, y: -49 },
    happy: { x: -39, y: -93 },
    sleep: { x: -24, y: -51 },
    walk:  { x: -21, y: -88 },
    swim:  { x: -23, y: -67 },
    swim1: { x: -23, y: -67 },
    swim2: { x: -22, y: -68 },
    swim3: { x: -22, y: -68 },
    swim4: { x: -24, y: -65 },
  };
  const CAPY_NECK = {
    idle: { x: -24, y: -50 },
    walk1: { x: -21, y: -48 },
    walk2: { x: -24, y: -50 },
    walk3: { x: -21, y: -49 },
    walk4: { x: -24, y: -51 },
    eat: { x: 25, y: -59 },
    drink: { x: -15, y: -13 },
    happy: { x: -39, y: -55 },
    sleep: { x: -24, y: -13 },
    walk:  { x: -21, y: -48 },
    swim:  { x: -23, y: -31 },
    swim1: { x: -23, y: -31 },
    swim2: { x: -22, y: -32 },
    swim3: { x: -22, y: -32 },
    swim4: { x: -24, y: -29 },
  };
  const CAPY_NOSE = {
    idle: { x: -48, y: -71 },
    walk1: { x: -43, y: -69 },
    walk2: { x: -48, y: -71 },
    walk3: { x: -43, y: -70 },
    walk4: { x: -48, y: -72 },
    eat: { x: 5, y: -73 },
    drink: { x: -34, y: -27 },
    happy: { x: -69, y: -75 },
    sleep: { x: -52, y: -33 },
    walk:  { x: -43, y: -69 },
    swim:  { x: -35, y: -55 },
    swim1: { x: -36, y: -56 },
    swim2: { x: -36, y: -56 },
    swim3: { x: -33, y: -55 },
    swim4: { x: -35, y: -53 },
  };

  const ROCK_HEAD = {
    idle: { x: -22, y: -64 },
    walk1: { x: -22, y: -64 },
    walk2: { x: -22, y: -66 },
    walk3: { x: -22, y: -64 },
    walk4: { x: -22, y: -66 },
    eat: { x: -25, y: -67 },
    drink: { x: -24, y: -64 },
    happy: { x: 5, y: -84 },
    sleep: { x: -14, y: -72 },
    walk:  { x: -22, y: -64 },
  };
  const ROCK_NECK = {
    idle: { x: -22, y: -25 },
    walk1: { x: -22, y: -25 },
    walk2: { x: -22, y: -26 },
    walk3: { x: -22, y: -25 },
    walk4: { x: -22, y: -26 },
    eat: { x: -25, y: -27 },
    drink: { x: -24, y: -24 },
    happy: { x: 5, y: -46 },
    sleep: { x: -14, y: -54 },
    walk:  { x: -22, y: -25 },
  };
  const ROCK_NOSE = {
    idle: { x: -44, y: -46 },
    walk1: { x: -44, y: -46 },
    walk2: { x: -44, y: -47 },
    walk3: { x: -44, y: -46 },
    walk4: { x: -44, y: -47 },
    eat: { x: -46, y: -48 },
    drink: { x: -44, y: -45 },
    happy: { x: -24, y: -66 },
    sleep: { x: -25, y: -68 },
    walk:  { x: -44, y: -46 },
  };

  const DRAGON_HEAD = {
    idle: { x: -22, y: -78 },
    walk1: { x: -20, y: -76 },
    walk2: { x: -22, y: -78 },
    walk3: { x: -20, y: -77 },
    walk4: { x: -22, y: -78 },
    eat: { x: 29, y: -69 },
    drink: { x: -16, y: -71 },
    happy: { x: 21, y: -78 },
    sleep: { x: -26, y: -63 },
    walk:  { x: -20, y: -76 },
  };
  const DRAGON_NECK = {
    idle: { x: -22, y: -37 },
    walk1: { x: -20, y: -36 },
    walk2: { x: -22, y: -37 },
    walk3: { x: -20, y: -37 },
    walk4: { x: -22, y: -38 },
    eat: { x: 29, y: -39 },
    drink: { x: -16, y: -44 },
    happy: { x: 21, y: -44 },
    sleep: { x: -26, y: -40 },
    walk:  { x: -20, y: -36 },
  };
  const DRAGON_NOSE = {
    idle: { x: -41, y: -58 },
    walk1: { x: -38, y: -57 },
    walk2: { x: -41, y: -58 },
    walk3: { x: -38, y: -58 },
    walk4: { x: -41, y: -59 },
    eat: { x: 18, y: -55 },
    drink: { x: -26, y: -58 },
    happy: { x: 7, y: -62 },
    sleep: { x: -44, y: -54 },
    walk:  { x: -38, y: -57 },
  };

  const KIWI_HEAD = {
    idle: { x: -22, y: -96 },
    walk1: { x: -37, y: -86 },
    walk2: { x: -22, y: -96 },
    walk3: { x: -37, y: -86 },
    walk4: { x: -22, y: -97 },
    eat: { x: -42, y: -54 },
    drink: { x: -36, y: -81 },
    happy: { x: -33, y: -98 },
    sleep: { x: 7, y: -62 },
    walk:  { x: -37, y: -86 },
  };
  const KIWI_NECK = {
    idle: { x: -22, y: -59 },
    walk1: { x: -37, y: -48 },
    walk2: { x: -22, y: -59 },
    walk3: { x: -37, y: -49 },
    walk4: { x: -22, y: -60 },
    eat: { x: -42, y: -18 },
    drink: { x: -36, y: -44 },
    happy: { x: -33, y: -60 },
    sleep: { x: 7, y: -26 },
    walk:  { x: -37, y: -48 },
  };
  const KIWI_NOSE = {
    idle: { x: -39, y: -78 },
    walk1: { x: -53, y: -68 },
    walk2: { x: -39, y: -78 },
    walk3: { x: -53, y: -69 },
    walk4: { x: -39, y: -79 },
    eat: { x: -52, y: -32 },
    drink: { x: -51, y: -63 },
    happy: { x: -56, y: -80 },
    sleep: { x: -7, y: -40 },
    walk:  { x: -53, y: -68 },
  };

  const CAT_HEAD = {
    idle: { x: -14, y: -83 },
    walk1: { x: -5, y: -81 },
    walk2: { x: -14, y: -83 },
    walk3: { x: -5, y: -82 },
    walk4: { x: -14, y: -84 },
    eat: { x: -2, y: -65 },
    drink: { x: 41, y: -94 },
    happy: { x: -44, y: -98 },
    sleep: { x: -25, y: -79 },
    walk:  { x: -5, y: -81 },
  };
  const CAT_NECK = {
    idle: { x: -14, y: -43 },
    walk1: { x: -5, y: -40 },
    walk2: { x: -14, y: -43 },
    walk3: { x: -5, y: -41 },
    walk4: { x: -14, y: -44 },
    eat: { x: -2, y: -31 },
    drink: { x: 41, y: -59 },
    happy: { x: -44, y: -74 },
    sleep: { x: -25, y: -49 },
    walk:  { x: -5, y: -40 },
  };
  const CAT_NOSE = {
    idle: { x: -32, y: -64 },
    walk1: { x: -23, y: -61 },
    walk2: { x: -32, y: -64 },
    walk3: { x: -23, y: -62 },
    walk4: { x: -32, y: -65 },
    eat: { x: -19, y: -49 },
    drink: { x: 31, y: -87 },
    happy: { x: -58, y: -94 },
    sleep: { x: -45, y: -63 },
    walk:  { x: -23, y: -61 },
  };

  const DOG_HEAD = {
    idle: { x: -17, y: -82 },
    walk1: { x: -19, y: -82 },
    walk2: { x: -17, y: -82 },
    walk3: { x: -19, y: -83 },
    walk4: { x: -17, y: -84 },
    eat: { x: -1, y: -72 },
    drink: { x: -30, y: -51 },
    happy: { x: 16, y: -78 },
    sleep: { x: -11, y: -63 },
    walk:  { x: -19, y: -82 },
  };
  const DOG_NECK = {
    idle: { x: -17, y: -43 },
    walk1: { x: -19, y: -43 },
    walk2: { x: -17, y: -43 },
    walk3: { x: -19, y: -44 },
    walk4: { x: -17, y: -44 },
    eat: { x: -1, y: -36 },
    drink: { x: -30, y: -15 },
    happy: { x: 16, y: -40 },
    sleep: { x: -11, y: -45 },
    walk:  { x: -19, y: -43 },
  };
  const DOG_NOSE = {
    idle: { x: -35, y: -64 },
    walk1: { x: -36, y: -63 },
    walk2: { x: -35, y: -64 },
    walk3: { x: -36, y: -64 },
    walk4: { x: -35, y: -65 },
    eat: { x: -15, y: -50 },
    drink: { x: -44, y: -29 },
    happy: { x: 6, y: -60 },
    sleep: { x: -24, y: -59 },
    walk:  { x: -36, y: -63 },
  };

  const DUCK_HEAD = {
    idle: { x: -15, y: -92 },
    walk1: { x: -18, y: -91 },
    walk2: { x: -15, y: -92 },
    walk3: { x: -18, y: -92 },
    walk4: { x: -15, y: -93 },
    eat: { x: -33, y: -52 },
    drink: { x: -32, y: -64 },
    happy: { x: 22, y: -86 },
    sleep: { x: -12, y: -76 },
    walk:  { x: -18, y: -91 },
  };
  const DUCK_NECK = {
    idle: { x: -15, y: -52 },
    walk1: { x: -18, y: -51 },
    walk2: { x: -15, y: -52 },
    walk3: { x: -18, y: -52 },
    walk4: { x: -15, y: -53 },
    eat: { x: -33, y: -16 },
    drink: { x: -32, y: -27 },
    happy: { x: 22, y: -51 },
    sleep: { x: -12, y: -47 },
    walk:  { x: -18, y: -51 },
  };
  const DUCK_NOSE = {
    idle: { x: -36, y: -73 },
    walk1: { x: -38, y: -72 },
    walk2: { x: -36, y: -73 },
    walk3: { x: -38, y: -73 },
    walk4: { x: -36, y: -74 },
    eat: { x: -48, y: -30 },
    drink: { x: -48, y: -46 },
    happy: { x: 12, y: -70 },
    sleep: { x: -41, y: -61 },
    walk:  { x: -38, y: -72 },
  };

  const CROW_HEAD = {
    idle: { x: -20, y: -85 },
    walk1: { x: -25, y: -85 },
    walk2: { x: -20, y: -85 },
    walk3: { x: -25, y: -86 },
    walk4: { x: -20, y: -86 },
    eat: { x: -32, y: -68 },
    drink: { x: -34, y: -59 },
    happy: { x: -56, y: -94 },
    sleep: { x: 22, y: -68 },
    walk:  { x: -25, y: -85 },
  };
  const CROW_NECK = {
    idle: { x: -20, y: -46 },
    walk1: { x: -25, y: -47 },
    walk2: { x: -20, y: -46 },
    walk3: { x: -25, y: -48 },
    walk4: { x: -20, y: -47 },
    eat: { x: -32, y: -31 },
    drink: { x: -34, y: -23 },
    happy: { x: -56, y: -52 },
    sleep: { x: 22, y: -17 },
    walk:  { x: -25, y: -47 },
  };
  const CROW_NOSE = {
    idle: { x: -39, y: -66 },
    walk1: { x: -43, y: -67 },
    walk2: { x: -39, y: -66 },
    walk3: { x: -43, y: -68 },
    walk4: { x: -39, y: -67 },
    eat: { x: -48, y: -50 },
    drink: { x: -49, y: -42 },
    happy: { x: -66, y: -74 },
    sleep: { x: 12, y: -44 },
    walk:  { x: -43, y: -67 },
  };

  const RAT_HEAD = {
    idle: { x: -11, y: -78 },
    walk1: { x: -14, y: -70 },
    walk2: { x: -11, y: -78 },
    walk3: { x: -14, y: -70 },
    walk4: { x: -11, y: -79 },
    eat: { x: 52, y: -77 },
    drink: { x: 28, y: -77 },
    happy: { x: 32, y: -85 },
    sleep: { x: 18, y: -63 },
    walk:  { x: -14, y: -70 },
  };
  const RAT_NECK = {
    idle: { x: -11, y: -39 },
    walk1: { x: -14, y: -29 },
    walk2: { x: -11, y: -39 },
    walk3: { x: -14, y: -30 },
    walk4: { x: -11, y: -40 },
    eat: { x: 52, y: -46 },
    drink: { x: 28, y: -49 },
    happy: { x: 32, y: -36 },
    sleep: { x: 18, y: -38 },
    walk:  { x: -14, y: -29 },
  };
  const RAT_NOSE = {
    idle: { x: -29, y: -59 },
    walk1: { x: -31, y: -50 },
    walk2: { x: -29, y: -59 },
    walk3: { x: -31, y: -51 },
    walk4: { x: -29, y: -60 },
    eat: { x: 42, y: -60 },
    drink: { x: -1, y: -63 },
    happy: { x: 22, y: -62 },
    sleep: { x: 7, y: -52 },
    walk:  { x: -31, y: -50 },
  };

  // Per-species designed field: set `field` to a MyPetWorld.FIELDS id when that
  // art is ready. Capybara uses capy_spa only; the fox may use meadow or
  // autumn_den (they start in the meadow); every other pet uses meadow.
  const SPECIES = {
    sheep_valais: {
      id: "sheep_valais",
      name: "Valais sheep",
      short: "Valais",
      defaultName: "Biscuit",
      emoji: "🐑",
      ready: true,
      prefix: "sheep",
      colorSlots: [
        { key: "wool", label: "Wool", pal: "WOOL" },
        { key: "face", label: "Face", pal: "FACE" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "white", face: "black", eyes: "white" },
      defaultItems: { water: "basin", food: "hay_trough", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      HEAD: SHEEP_HEAD,
      NECK: SHEEP_NECK,
      NOSE: SHEEP_NOSE,
      moods: [],
    },
    fox: {
      id: "fox",
      name: "Fox",
      short: "Fox",
      defaultName: "Ember",
      emoji: "🦊",
      ready: true,
      prefix: "fox",
      colorSlots: [
        { key: "wool", label: "Fur", pal: "FOX_FUR" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "orange", face: "cream", eyes: "white" },
      defaultItems: { water: "basin", food: "hay_trough", bed: "hay_bed" },
      defaultField: "meadow",
      field: "autumn_den",
      homeDecor: null,
      HEAD: FOX_HEAD,
      NECK: FOX_NECK,
      NOSE: FOX_NOSE,
      moods: [],
    },
    capybara: {
      id: "capybara",
      name: "Capybara",
      short: "Capy",
      defaultName: "Yuzu",
      emoji: "🦫",
      ready: true,
      prefix: "capy",
      colorSlots: [
        { key: "wool", label: "Fur", pal: "CAPY_FUR" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "sand", face: "cocoa", eyes: "white" },
      defaultItems: { water: "hottub", food: "veggie_bowl", bed: "straw_mat" },
      defaultField: "capy_spa",
      field: "capy_spa",
      homeDecor: null,
      HEAD: CAPY_HEAD,
      NECK: CAPY_NECK,
      NOSE: CAPY_NOSE,
      moods: ["yuzu", "sit"],
    },
    rock: {
      id: "rock",
      name: "Rock",
      short: "Rock",
      defaultName: "Pebble",
      emoji: "🪨",
      ready: true,
      prefix: "rock",
      colorSlots: [
        { key: "wool", label: "Stone", pal: "ROCK_STONE" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "pebble", face: "pebble", eyes: "white" },
      defaultItems: { water: "basin", food: "veggie_bowl", bed: "straw_mat" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      walk: "wobble",
      HEAD: ROCK_HEAD,
      NECK: ROCK_NECK,
      NOSE: ROCK_NOSE,
      moods: [],
    },
    dragon: {
      id: "dragon",
      name: "Dragon",
      short: "Dragon",
      defaultName: "Minty",
      emoji: "🐉",
      ready: true,
      prefix: "dragon",
      colorSlots: [
        { key: "wool", label: "Body", pal: "DRAGON_BODY" },
        { key: "face", label: "Wings", pal: "DRAGON_WINGS" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "mint", face: "lavender", eyes: "white" },
      defaultItems: { water: "basin", food: "veggie_bowl", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      HEAD: DRAGON_HEAD,
      NECK: DRAGON_NECK,
      NOSE: DRAGON_NOSE,
      moods: [],
    },
    kiwi: {
      id: "kiwi",
      name: "Kiwi bird",
      short: "Kiwi",
      defaultName: "Kiki",
      emoji: "🥝",
      ready: true,
      prefix: "kiwi",
      colorSlots: [
        { key: "wool", label: "Feathers", pal: "KIWI_FEATHER" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "brown", face: "tan", eyes: "white" },
      defaultItems: { water: "basin", food: "veggie_bowl", bed: "straw_mat" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      hop: true,
      HEAD: KIWI_HEAD,
      NECK: KIWI_NECK,
      NOSE: KIWI_NOSE,
      moods: [],
    },
    cat: {
      id: "cat",
      name: "Cat",
      short: "Cat",
      defaultName: "Marmalade",
      emoji: "🐱",
      ready: true,
      prefix: "cat",
      colorSlots: [
        { key: "wool", label: "Fur", pal: "CAT_FUR" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "orange", face: "cream", eyes: "white" },
      defaultItems: { water: "basin", food: "veggie_bowl", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      HEAD: CAT_HEAD,
      NECK: CAT_NECK,
      NOSE: CAT_NOSE,
      moods: [],
    },
    dog: {
      id: "dog",
      name: "Dog",
      short: "Pup",
      defaultName: "Waffles",
      emoji: "🐶",
      ready: true,
      prefix: "dog",
      colorSlots: [
        { key: "wool", label: "Fur", pal: "DOG_FUR" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "caramel", face: "cream", eyes: "white" },
      defaultItems: { water: "basin", food: "hay_trough", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      HEAD: DOG_HEAD,
      NECK: DOG_NECK,
      NOSE: DOG_NOSE,
      moods: [],
    },
    duck: {
      id: "duck",
      name: "Duck",
      short: "Duck",
      defaultName: "Puddles",
      emoji: "🦆",
      ready: true,
      prefix: "duck",
      colorSlots: [
        { key: "wool", label: "Feathers", pal: "DUCK_FEATHER" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "yellow", face: "orange", eyes: "white" },
      defaultItems: { water: "basin", food: "veggie_bowl", bed: "straw_mat" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      hop: true,
      HEAD: DUCK_HEAD,
      NECK: DUCK_NECK,
      NOSE: DUCK_NOSE,
      moods: [],
    },
    crow: {
      id: "crow",
      name: "Crow",
      short: "Crow",
      defaultName: "Inky",
      emoji: "🐦‍⬛",
      ready: true,
      prefix: "crow",
      colorSlots: [
        { key: "wool", label: "Feathers", pal: "CROW_FEATHER" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "ink", face: "ink", eyes: "white" },
      defaultItems: { water: "basin", food: "hay_trough", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      hop: true,
      HEAD: CROW_HEAD,
      NECK: CROW_NECK,
      NOSE: CROW_NOSE,
      moods: [],
    },
    rat: {
      id: "rat",
      name: "Rat",
      short: "Rat",
      defaultName: "Nibbles",
      emoji: "🐭",
      ready: true,
      prefix: "rat",
      colorSlots: [
        { key: "wool", label: "Fur", pal: "RAT_FUR" },
        { key: "eyes", label: "Eyes", pal: "EYES" },
      ],
      defaults: { wool: "gray", face: "cream", eyes: "white" },
      defaultItems: { water: "basin", food: "hay_trough", bed: "hay_bed" },
      defaultField: "meadow",
      field: "meadow",
      homeDecor: null,
      hop: true,
      HEAD: RAT_HEAD,
      NECK: RAT_NECK,
      NOSE: RAT_NOSE,
      moods: [],
    },
  };

  const COMING_SOON = [];

  const ITEMS = {
    water: [
      { id: "trough", name: "Trough", emoji: "🚰", file: "item_water_trough.png", origin: [0.50, 0.55] },
      { id: "basin", name: "Basin", emoji: "🥣", file: "item_basin.png", origin: [74 / 110, 47 / 97] },
      { id: "hottub", name: "Hot tub", emoji: "♨️", file: "item_hottub.png", origin: [0.50, 0.52] },
    ],
    food: [
      { id: "hay_trough", name: "Hay", emoji: "🌾", file: "item_hay_trough.png", origin: [69 / 141, 53 / 104] },
      { id: "veggie_bowl", name: "Veggies", emoji: "🥕", file: "item_veggie_bowl.png", origin: [0.50, 0.62] },
    ],
    bed: [
      { id: "hay_bed", name: "Hay bed", emoji: "🛏️", file: "item_hay_bed.png", origin: [70 / 144, 82 / 121] },
      { id: "straw_mat", name: "Straw mat", emoji: "🧺", file: "item_straw_mat.png", origin: [0.50, 0.42] },
    ],
  };
  const ITEM_SLOT_SPOT = { water: "basin", food: "trough", bed: "bed" };

  const ONSEN_PROPS = [
    { key: "prop_bamboo", file: "prop_bamboo.png", x: 160, y: 520, origin: [0.5, 1] },
    { key: "prop_reeds", file: "prop_reeds.png", x: 190, y: 420, origin: [0.5, 1] },
    { key: "prop_pond", file: "prop_pond.png", x: 820, y: 350, origin: [0.5, 0.55] },
    { key: "prop_stones", file: "prop_stones.png", x: 660, y: 380, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 880, y: 420, origin: [0.5, 0.5] },
    { key: "prop_bamboo2", file: "prop_bamboo.png", x: 900, y: 680, origin: [0.5, 1], flip: true },
    { key: "prop_reeds2", file: "prop_reeds.png", x: 930, y: 500, origin: [0.5, 1] },
  ];

  const DEN_PROPS = [
    { key: "prop_den", file: "prop_den.png", x: 200, y: 540, origin: [0.5, 1] },
    { key: "prop_log", file: "prop_log.png", x: 640, y: 700, origin: [0.5, 0.75] },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 880, y: 400, origin: [0.5, 0.5] },
  ];
  const GARDEN_PROPS = [
    { key: "prop_stones", file: "prop_stones.png", x: 220, y: 420, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 860, y: 400, origin: [0.5, 0.5] },
    { key: "prop_log", file: "prop_log.png", x: 640, y: 700, origin: [0.5, 0.75] },
  ];
  const GROVE_PROPS = [
    { key: "prop_bamboo", file: "prop_bamboo.png", x: 170, y: 520, origin: [0.5, 1] },
    { key: "prop_bamboo2", file: "prop_bamboo.png", x: 900, y: 680, origin: [0.5, 1], flip: true },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 840, y: 430, origin: [0.5, 0.5] },
  ];
  const THICKET_PROPS = [
    { key: "prop_reeds", file: "prop_reeds.png", x: 190, y: 430, origin: [0.5, 1] },
    { key: "prop_reeds2", file: "prop_reeds.png", x: 920, y: 500, origin: [0.5, 1] },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
  ];
  const POND_PROPS = [
    { key: "prop_pond", file: "prop_pond.png", x: 820, y: 350, origin: [0.5, 0.55] },
    { key: "prop_reeds", file: "prop_reeds.png", x: 190, y: 430, origin: [0.5, 1] },
    { key: "prop_reeds2", file: "prop_reeds.png", x: 900, y: 500, origin: [0.5, 1] },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
  ];
  const YARD_PROPS = [
    { key: "prop_log", file: "prop_log.png", x: 640, y: 700, origin: [0.5, 0.75] },
    { key: "prop_stones", file: "prop_stones.png", x: 260, y: 400, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 880, y: 400, origin: [0.5, 0.5] },
  ];
  const PERCH_PROPS = [
    { key: "prop_log", file: "prop_log.png", x: 640, y: 700, origin: [0.5, 0.75] },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
    { key: "prop_stones2", file: "prop_stones.png", x: 880, y: 420, origin: [0.5, 0.5] },
  ];
  const NOOK_PROPS = [
    { key: "prop_log", file: "prop_log.png", x: 640, y: 700, origin: [0.5, 0.75] },
    { key: "prop_den", file: "prop_den.png", x: 200, y: 540, origin: [0.5, 1] },
    { key: "prop_stones", file: "prop_stones.png", x: 300, y: 400, origin: [0.5, 0.5] },
  ];
  const HOME_DECOR = {
    onsen: ONSEN_PROPS, den: DEN_PROPS, garden: GARDEN_PROPS, grove: GROVE_PROPS,
    thicket: THICKET_PROPS, pond: POND_PROPS, yard: YARD_PROPS, perch: PERCH_PROPS, nook: NOOK_PROPS,
  };

  function of(petOrId) {
    const id = (petOrId && typeof petOrId === "object") ? (petOrId.species || "sheep_valais") : (petOrId || "sheep_valais");
    return SPECIES[id] || SPECIES.sheep_valais;
  }
  function prefix(pet) { return of(pet).prefix || "sheep"; }
  function poseFile(pet, pose) { return prefix(pet) + "_" + pose + ".png"; }
  function poseTex(pet, pose) { return prefix(pet) + "_" + pose; }
  function headOf(pet, pose) {
    const H = of(pet).HEAD || SHEEP_HEAD;
    return H[pose] || H.idle || SHEEP_HEAD.idle;
  }
  function neckOf(pet, pose) {
    const N = of(pet).NECK || SHEEP_NECK;
    return N[pose] || N.idle || SHEEP_NECK.idle;
  }
  function noseOf(pet, pose) {
    const N = of(pet).NOSE || SHEEP_NOSE;
    return N[pose] || N.idle || SHEEP_NOSE.idle;
  }
  function defaultNameOf(petOrId) {
    const sp = of(petOrId);
    return (sp && sp.defaultName) || "Biscuit";
  }
  function allowsLooks(petOrId) {
    const sp = of(petOrId);
    return !!(sp && sp.id === "sheep_valais");
  }
  function findItem(slot, id) {
    const list = ITEMS[slot] || [];
    if (!id) return null;
    for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function defaultItems(pet) {
    return Object.assign({ water: "basin", food: "hay_trough", bed: "hay_bed" }, of(pet).defaultItems || {});
  }
  function normalizeItems(pet) {
    if (!pet) return pet;
    const def = defaultItems(pet);
    pet.items = pet.items && typeof pet.items === "object" ? pet.items : {};
    ["water", "food", "bed"].forEach((slot) => {
      const cur = pet.items[slot];
      pet.items[slot] = findItem(slot, cur) ? cur : def[slot];
    });
    return pet;
  }

  window.MyPetSpecies = {
    POSES, SPECIES, COMING_SOON, ITEMS, ITEM_SLOT_SPOT, ONSEN_PROPS, DEN_PROPS, HOME_DECOR,
    of, prefix, poseFile, poseTex, headOf, neckOf, noseOf,
    defaultNameOf, allowsLooks,
    findItem, defaultItems, normalizeItems,
  };
})();
