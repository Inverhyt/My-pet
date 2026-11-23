/* Asset paths: relative so GitHub Pages ( /my-pet/ ) works, and /assets/ still works on the Pi server. */
function assetUrl(path) {
  path = String(path || "").replace(/^\/+/, "");
  const base = (typeof window.ASSET_BASE === "string") ? window.ASSET_BASE + path : path;
  const v = window.MYPET_ASSET_V || "11";
  return base + (base.indexOf("?") >= 0 ? "&" : "?") + "v=" + v;
}

/* My Pet — Phaser pasture + HTML chrome */
(() => {
  const W = 720, H = 1100;
  const FIELD = 1024;

  // Hotspots in field texture pixels (1024x1024 empty pasture).
  const SPOTS = {
    trough: { x: 291, y: 331, r: 78, stand: { x: 300, y: 430 }, action: "eat", label: "eat" },
    basin:  { x: 745, y: 313, r: 62, stand: { x: 745, y: 400 }, action: "drink", label: "drink" },
    bed:    { x: 736, y: 745, r: 80, stand: { x: 736, y: 700 }, sleep: { x: 736, y: 745 }, action: "nap", label: "nap" },
  };
  const FLOWERS = [
    { x: 200, y: 400 }, { x: 455, y: 230 }, { x: 530, y: 250 },
    { x: 470, y: 430 }, { x: 560, y: 620 }, { x: 400, y: 500 },
    { x: 180, y: 680 }, { x: 500, y: 800 }, { x: 870, y: 450 },
    { x: 880, y: 650 }, { x: 360, y: 360 }, { x: 620, y: 430 },
  ];
  const WALK = { x0: 160, y0: 200, x1: 880, y1: 850 };
  const COSTUME_TEX = { crown: "costume_crown", bow: "costume_bow", hat: "costume_hat", witch: "costume_witch" };
  // Per-frame head anchors, from feet (origin 0.5,1). Sit low on the forehead,
  // not on the wool peak. walk1–4 share idle's body; only hooves move.
  const HEAD = {
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
  const COSTUME_NUDGE = {
    crown: { x: 0, y: 0 },
    bow:   { x: 24, y: 0 },
    hat:   { x: 0, y: 4 },
    witch: { x: 0, y: 4 },
  };
  const COSTUME_ORIGIN = {
    crown: { x: 0.5, y: 1 },
    bow:   { x: 0.5, y: 1 },
    hat:   { x: 0.5, y: 1 },
    witch: { x: 0.5, y: 1 },
  };
  const COSTUME_SCALE = { crown: 1.08, bow: 1.08, hat: 1.08, witch: 1.26 };
  const COSTUME_SIZE = { crown: [72, 28], bow: [48, 32], hat: [58, 36], witch: [58, 40], collar: [30, 14] };
  // Sleep uses the shared HEAD.sleep sit (centered on the face, snug on the
  // bangs). Do not reuse standing-pose ear/brim nudges, or hats drift right
  // and float on the wool. Crown has 8px of empty padding under the flowers.
  const COSTUME_NUDGE_SLEEP = {
    crown: { x: 0, y: 8 },
    bow:   { x: 0, y: 0 },
    hat:   { x: 0, y: 0 },
    witch: { x: 0, y: 0 },
  };
  // Neck anchors, from feet (origin 0.5,1). Band sits on chest wool under the chin.
  const NECK = {
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
  const EXTRA_UNLOCKS = [
    { id: "collar", at: 12, name: "Bell", emoji: "🔔" },
    { id: "witch", at: 40, name: "Witch hat", emoji: "🧙" },
  ];
  const STATIC_SAVE = "mypet-static-v1";
  // Tappable park toys, in field pixels.
  const PARK = {
    hay:    { x: 300, y: 820, r: 80, kind: "hop",    standL: { x: 186, y: 820 }, standR: { x: 414, y: 820 }, label: "hay" },
    slide:  { x: 760, y: 580, r: 90, kind: "slide",  start: { x: 685, y: 615 }, top: { x: 715, y: 475 }, end: { x: 850, y: 660 }, label: "slide" },
    tunnel: { x: 250, y: 580, r: 80, kind: "tunnel", start: { x: 170, y: 595 }, end: { x: 340, y: 595 }, label: "tunnel" },
  };

  const FOOTPRINT = {
    item_hay_trough: { rx: 58, ry: 34 },
    item_water_trough: { rx: 58, ry: 34 },
    item_veggie_bowl: { rx: 34, ry: 24 },
    item_basin: { rx: 46, ry: 30 },
    item_hottub: { rx: 70, ry: 46 },
    item_hay_bed: { rx: 66, ry: 38 },
    item_straw_mat: { rx: 72, ry: 36 },
    prop_den: { rx: 48, ry: 28 },
    prop_log: { rx: 52, ry: 20 },
    prop_stones: { rx: 38, ry: 16 },
    prop_pond: { rx: 102, ry: 46 },
    prop_bamboo: { rx: 16, ry: 14 },
    prop_reeds: { rx: 16, ry: 14 },
    capy_reeds: { rx: 42, ry: 30 },
    capy_bed: { rx: 62, ry: 36 },
    autumn_bush: { rx: 50, ry: 34 },
    autumn_den: { rx: 62, ry: 38 },
    autumn_tree: { rx: 40, ry: 28 },
    pebble_rock: { rx: 92, ry: 48 },
    pebble_pond: { rx: 108, ry: 58 },
    pebble_moss: { rx: 96, ry: 68 },
    pebble_seesaw: { rx: 108, ry: 58 },
    home_bed: { rx: 84, ry: 54 },
    home_water: { rx: 88, ry: 52 },
    home_food: { rx: 64, ry: 40 },
    home_play: { rx: 86, ry: 54 },
    hay_bale: { rx: 68, ry: 36 },
    slide: { rx: 78, ry: 48 },
    tunnel: { rx: 72, ry: 40 },
  };

  const FIELD_LAYOUTS = {
    meadow: {
      spots: SPOTS,
      park: true,
      pool: null,
      beach: null,
      oranges: null,
      start: { x: 512, y: 560 },
    },
    capy_spa: {
      spots: {
        trough: { x: 317, y: 322, r: 70, stand: { x: 317, y: 396 }, action: "eat", label: "eat" },
        bed: { x: 756, y: 311, r: 78, stand: { x: 756, y: 377 }, sleep: { x: 756, y: 319 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: { cx: 508, cy: 696, rx: 327, ry: 126 },
      beach: { x: 505, y: 548, rx: 62, ry: 50 },
      shoreGate: { x0: 448, x1: 568, y0: 470, y1: 620 },
      shoreLand: { x: 508, y: 480 },
      shoreWater: { x: 508, y: 590 },
      rockPad: { rx: 90, ry: 74 },
      oranges: [
        { x: 490, y: 746 }, { x: 248, y: 634 }, { x: 379, y: 757 },
        { x: 645, y: 688 }, { x: 356, y: 646 },
      ],
      start: { x: 508, y: 501 },
    },
    autumn_den: {
      spots: {
        trough: { x: 300, y: 325, r: 72, stand: { x: 300, y: 410 }, action: "eat", label: "eat" },
        basin:  { x: 400, y: 590, r: 58, stand: { x: 400, y: 655 }, action: "drink", label: "drink" },
        bed:    { x: 756, y: 330, r: 82, stand: { x: 756, y: 415 }, sleep: { x: 756, y: 338 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      fallingLeaves: true,
      leafPiles: [
        { x: 230, y: 740, r: 64, stand: { x: 230, y: 800 } },
        { x: 700, y: 620, r: 64, stand: { x: 700, y: 685 } },
      ],
      stream: [
        { cx: 200, cy: 535, rx: 36, ry: 20 },
        { cx: 280, cy: 555, rx: 38, ry: 20 },
        { cx: 360, cy: 575, rx: 40, ry: 22 },
        { cx: 440, cy: 598, rx: 38, ry: 20 },
        { cx: 520, cy: 622, rx: 36, ry: 20 },
        { cx: 600, cy: 660, rx: 34, ry: 20 },
        { cx: 670, cy: 710, rx: 32, ry: 20 },
      ],
      stones: [
        { x: 335, y: 568, r: 18 },
        { x: 455, y: 598, r: 18 },
        { x: 570, y: 632, r: 18 },
      ],
      blockers: [
        { id: "care-food", x: 300, y: 325, key: "autumn_bush" },
        { id: "care-bed", x: 756, y: 330, key: "autumn_den" },
        { id: "den-tree", x: 800, y: 250, key: "autumn_tree" },
      ],
      start: { x: 512, y: 700 },
    },
    pebble_yard: {
      spots: {
        trough: { x: 750, y: 715, r: 92, stand: { x: 600, y: 730 }, action: "eat", label: "eat" },
        basin:  { x: 730, y: 305, r: 88, stand: { x: 730, y: 410 }, action: "drink", label: "drink" },
        bed:    { x: 250, y: 285, r: 90, stand: { x: 250, y: 385 }, sleep: { x: 238, y: 252 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 170, y0: 200, x1: 870, y1: 825 },
      seesaw: {
        x: 275, y: 773, r: 110,
        stand: { x: 280, y: 640 },
        sit: { x: 220, y: 728 },
        originX: 95 / 204,
        originY: 80 / 116,
        tip: 16,
      },
      blockers: [
        { id: "care-bed", x: 250, y: 285, key: "pebble_rock" },
        { id: "care-water", x: 730, y: 305, key: "pebble_pond" },
        { id: "care-food", x: 750, y: 715, key: "pebble_moss" },
        { id: "yard-seesaw", x: 275, y: 748, key: "pebble_seesaw" },
      ],
      start: { x: 512, y: 500 },
    },
    crystal_spring: {
      spots: {
        trough: { x: 710, y: 720, r: 80, stand: { x: 710, y: 810 }, action: "eat", label: "eat" },
        basin:  { x: 680, y: 280, r: 80, stand: { x: 680, y: 370 }, action: "drink", label: "drink" },
        bed:    { x: 290, y: 270, r: 86, stand: { x: 290, y: 360 }, sleep: { x: 290, y: 270 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 290, y: 270, key: "home_bed" },
        { id: "care-water", x: 680, y: 280, key: "home_water" },
        { id: "care-food", x: 710, y: 720, key: "home_food" },
        { id: "home-play", x: 260, y: 700, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    plank_fort: {
      spots: {
        trough: { x: 680, y: 760, r: 80, stand: { x: 680, y: 850 }, action: "eat", label: "eat" },
        basin:  { x: 740, y: 720, r: 80, stand: { x: 740, y: 810 }, action: "drink", label: "drink" },
        bed:    { x: 720, y: 280, r: 86, stand: { x: 720, y: 370 }, sleep: { x: 720, y: 280 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 720, y: 280, key: "home_bed" },
        { id: "care-water", x: 740, y: 720, key: "home_water" },
        { id: "care-food", x: 680, y: 760, key: "home_food" },
        { id: "home-play", x: 260, y: 720, key: "home_play" },
        { id: "home-extra1", x: 260, y: 280, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    charm_nest: {
      spots: {
        trough: { x: 660, y: 760, r: 80, stand: { x: 660, y: 850 }, action: "eat", label: "eat" },
        basin:  { x: 740, y: 740, r: 80, stand: { x: 740, y: 830 }, action: "drink", label: "drink" },
        bed:    { x: 720, y: 280, r: 86, stand: { x: 720, y: 370 }, sleep: { x: 720, y: 280 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 720, y: 280, key: "home_bed" },
        { id: "care-water", x: 740, y: 740, key: "home_water" },
        { id: "care-food", x: 660, y: 760, key: "home_food" },
        { id: "home-play", x: 240, y: 280, key: "home_play" },
        { id: "home-extra1", x: 240, y: 720, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    lily_pond: {
      spots: {
        trough: { x: 720, y: 760, r: 80, stand: { x: 720, y: 850 }, action: "eat", label: "eat" },
        basin:  { x: 700, y: 280, r: 80, stand: { x: 700, y: 370 }, action: "drink", label: "drink" },
        bed:    { x: 260, y: 280, r: 86, stand: { x: 260, y: 370 }, sleep: { x: 260, y: 280 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 260, y: 280, key: "home_bed" },
        { id: "care-water", x: 700, y: 280, key: "home_water" },
        { id: "care-food", x: 720, y: 760, key: "home_food" },
        { id: "home-play", x: 260, y: 720, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    fox_hollow: {
      spots: {
        trough: { x: 740, y: 780, r: 80, stand: { x: 740, y: 870 }, action: "eat", label: "eat" },
        basin:  { x: 220, y: 760, r: 80, stand: { x: 220, y: 850 }, action: "drink", label: "drink" },
        bed:    { x: 740, y: 280, r: 86, stand: { x: 740, y: 370 }, sleep: { x: 740, y: 280 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 740, y: 280, key: "home_bed" },
        { id: "care-water", x: 220, y: 760, key: "home_water" },
        { id: "care-food", x: 740, y: 780, key: "home_food" },
        { id: "home-play", x: 260, y: 280, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    root_cave: {
      spots: {
        trough: { x: 680, y: 740, r: 80, stand: { x: 680, y: 830 }, action: "eat", label: "eat" },
        basin:  { x: 760, y: 780, r: 80, stand: { x: 760, y: 870 }, action: "drink", label: "drink" },
        bed:    { x: 260, y: 260, r: 86, stand: { x: 260, y: 350 }, sleep: { x: 260, y: 260 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 260, y: 260, key: "home_bed" },
        { id: "care-water", x: 760, y: 780, key: "home_water" },
        { id: "care-food", x: 680, y: 740, key: "home_food" },
        { id: "home-play", x: 260, y: 740, key: "home_play" },
        { id: "home-extra1", x: 720, y: 280, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    puppy_yard: {
      spots: {
        trough: { x: 720, y: 760, r: 80, stand: { x: 720, y: 850 }, action: "eat", label: "eat" },
        basin:  { x: 720, y: 300, r: 80, stand: { x: 720, y: 390 }, action: "drink", label: "drink" },
        bed:    { x: 280, y: 280, r: 86, stand: { x: 280, y: 370 }, sleep: { x: 280, y: 280 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 280, y: 280, key: "home_bed" },
        { id: "care-water", x: 720, y: 300, key: "home_water" },
        { id: "care-food", x: 720, y: 760, key: "home_food" },
        { id: "home-play", x: 260, y: 740, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    cat_garden: {
      spots: {
        trough: { x: 716, y: 723, r: 60, stand: { x: 738, y: 724 }, via: { x: 745, y: 640 }, face: "left", action: "eat", label: "eat" },
        basin:  { x: 795, y: 723, r: 60, stand: { x: 818, y: 726 }, via: { x: 825, y: 640 }, face: "left", action: "drink", label: "drink" },
        bed:    { x: 760, y: 300, r: 86, stand: { x: 760, y: 412 }, sleep: { x: 760, y: 300 }, nap: { x: 780, y: 352, flip: false }, action: "nap", label: "nap" },
      },
      park: false, pool: null, beach: null, oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "cat-post", x: 285, y: 320, rx: 40, ry: 25 },
        { id: "care-bed", x: 765, y: 330, rx: 85, ry: 40 },
        { id: "cat-tunnel", x: 300, y: 710, rx: 110, ry: 45 },
        { id: "care-food", x: 755, y: 730, rx: 85, ry: 25 },
      ],
      fronts: [{ key: "front_cat_bed", x: 668, y: 190, base: 366 }, { key: "front_cat_bowls", x: 684, y: 699, base: 746 }],
      plays: [
        { id: "yarn", kind: "yarn", x: 258, y: 760, r: 50, stand: { x: 320, y: 790 }, msg: "Got the yarn! 🧶" },
        { id: "post", kind: "post", x: 287, y: 255, r: 75, stand: { x: 338, y: 340 }, top: { x: 287, y: 186 }, msg: "Scritch scratch 🐾" },
      ],
      start: { x: 512, y: 520 },
    },
    orange_pond: {
      spots: {
        trough: { x: 420, y: 700, r: 80, stand: { x: 420, y: 790 }, action: "eat", label: "eat" },
        basin:  { x: 520, y: 700, r: 80, stand: { x: 520, y: 790 }, action: "drink", label: "drink" },
        bed:    { x: 760, y: 300, r: 86, stand: { x: 760, y: 390 }, sleep: { x: 760, y: 300 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 760, y: 300, key: "home_bed" },
        { id: "care-water", x: 520, y: 700, key: "home_water" },
        { id: "care-food", x: 420, y: 700, key: "home_food" },
        { id: "home-play", x: 260, y: 260, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
    carrot_yard: {
      spots: {
        trough: { x: 300, y: 310, r: 80, stand: { x: 300, y: 400 }, action: "eat", label: "eat" },
        basin:  { x: 740, y: 320, r: 80, stand: { x: 740, y: 410 }, action: "drink", label: "drink" },
        bed:    { x: 740, y: 720, r: 86, stand: { x: 740, y: 810 }, sleep: { x: 740, y: 720 }, action: "nap", label: "nap" },
      },
      park: false,
      pool: null,
      beach: null,
      oranges: null,
      walk: { x0: 160, y0: 170, x1: 860, y1: 850 },
      blockers: [
        { id: "care-bed", x: 740, y: 720, key: "home_bed" },
        { id: "care-water", x: 740, y: 320, key: "home_water" },
        { id: "care-food", x: 300, y: 310, key: "home_food" },
        { id: "home-play", x: 280, y: 520, key: "home_play" },
        { id: "home-extra1", x: 270, y: 740, key: "home_play" },
      ],
      start: { x: 512, y: 520 },
    },
  };

  const $ = (id) => document.getElementById(id);
  let state = null;
  let game = null;
  let pasture = null;
  let busy = false;
  let brushMode = false;
  let viewSlot = 0;
  let slotBusy = false;

  function toast(msg, ms = 2200) {
    const el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._until = Date.now() + ms;
    toast._t = setTimeout(() => {
      el.classList.remove("show");
      toast._until = 0;
      const next = (toast._q || []).shift();
      if (next) toast(next.msg, next.ms);
    }, ms);
  }
  function toastWhenFree(msg, ms = 2200) {
    const wait = Math.max(0, (toast._until || 0) - Date.now()) + 80;
    if (wait <= 80 && !($("toast") && $("toast").classList.contains("show"))) {
      toast(msg, ms);
      return;
    }
    (toast._q || (toast._q = [])).push({ msg: msg, ms: ms });
    if (wait > 80 && !toast._t) {
      toast._t = setTimeout(() => {
        const next = (toast._q || []).shift();
        if (next) toast(next.msg, next.ms);
      }, wait);
    }
  }

  function blip(kind) {
    try {
      const ctx = blip._ctx || (blip._ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      const now = ctx.currentTime;
      const freqs = { heart: 520, eat: 320, coin: 880, unlock: 660, nap: 240, splash: 400, click: 300 };
      o.frequency.value = freqs[kind] || 360;
      if (kind === "coin" || kind === "unlock") {
        o.frequency.setValueAtTime(freqs[kind], now);
        o.frequency.exponentialRampToValueAtTime(freqs[kind] * 1.5, now + 0.12);
      }
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(now); o.stop(now + 0.2);
    } catch (e) {}
  }

  function syncActivePet() {
    if (!state) return;
    if (!Array.isArray(state.pets)) state.pets = state.pet ? [state.pet] : [];
    if (state.pet) {
      let i = typeof state.activePet === "number" ? state.activePet : -1;
      if (i < 0 || i >= state.pets.length || state.pets[i] !== state.pet) {
        const id = state.pet.id;
        const j = id ? state.pets.findIndex((p) => p && p.id === id) : -1;
        if (j >= 0) i = j;
        else if (i < 0 || i >= state.pets.length) i = 0;
      }
      if (i >= 0 && i < state.pets.length) {
        state.pets[i] = state.pet;
        state.activePet = i;
      } else if (!state.pets.length) {
        state.pets = [state.pet];
        state.activePet = 0;
      }
    }
  }

  const RAINBOW_SAVE = "mypet-rainbow-v1";

  function loadRainbowPaid() {
    let paid = [];
    try {
      const raw = localStorage.getItem(RAINBOW_SAVE);
      if (raw) {
        const a = JSON.parse(raw);
        if (a && Array.isArray(a.paid)) paid = a.paid.map(String);
      }
    } catch (e) {}
    if (state && Array.isArray(state.rainbowPaid)) {
      state.rainbowPaid.forEach((id) => {
        id = String(id);
        if (paid.indexOf(id) < 0) paid.push(id);
      });
    }
    if (!state) state = {};
    state.rainbowPaid = paid;
    return paid;
  }

  function isRainbowPaid(id) {
    if (!id) return false;
    return ((state && state.rainbowPaid) || []).indexOf(String(id)) >= 0;
  }

  function markRainbowPaid(id) {
    if (!id || !state) return;
    if (!Array.isArray(state.rainbowPaid)) state.rainbowPaid = [];
    id = String(id);
    if (state.rainbowPaid.indexOf(id) < 0) state.rainbowPaid.push(id);
    if (state.rainbowPaid.length > 80) state.rainbowPaid = state.rainbowPaid.slice(-80);
    try { localStorage.setItem(RAINBOW_SAVE, JSON.stringify({ paid: state.rainbowPaid })); } catch (e) {}
    persistStaticPet();
  }

  function persistStaticPet() {
    if (!state) return;
    if (window.MyPetRoster && state.pet) MyPetRoster.normalizePet(state.pet);
    syncActivePet();
    try {
      const data = {
        version: 11,
        pet: state.pet || null,
        pets: state.pets || [],
        activePet: state.activePet || 0,
        coins: typeof state.coins === "number" ? state.coins : 0,
        rainbowPaid: Array.isArray(state.rainbowPaid) ? state.rainbowPaid : [],
      };
      if (data.pet && window.MyPetColor) MyPetColor.migratePet(data.pet);
      localStorage.setItem(STATIC_SAVE, JSON.stringify(data));
      if (data.pet) {
        try {
          localStorage.setItem("mypet-colors-v1", JSON.stringify({
            wool: data.pet.wool, face: data.pet.face, eyes: data.pet.eyes,
            costumeColors: data.pet.costumeColors || {},
          }));
        } catch (e2) {}
        try {
          localStorage.setItem("mypet-world-v1", JSON.stringify({ fieldTheme: data.pet.fieldTheme || "meadow" }));
        } catch (e3) {}
      }
    } catch (e) {}
  }

  function mergePet(resPet) {
    const old = state && state.pet;
    if (resPet) {
      if (!state) state = {};
      if (old) {
        ["id", "species", "wool", "face", "eyes", "costumeColors", "fieldTheme",
          "birthday", "created_at", "journal", "birthdaySeen", "collar"].forEach((k) => {
          if ((resPet[k] == null || resPet[k] === "") && old[k] != null) resPet[k] = old[k];
        });
      }
      state.pet = resPet;
    }
    if (!state || !state.pet) return;
    if (!state.pet.wool || !state.pet.face || !state.pet.eyes) {
      try {
        const raw = localStorage.getItem("mypet-colors-v1");
        if (raw) {
          const c = JSON.parse(raw);
          if (!state.pet.wool && c.wool) state.pet.wool = c.wool;
          if (!state.pet.face && c.face) state.pet.face = c.face;
          if (!state.pet.eyes && c.eyes) state.pet.eyes = c.eyes;
          if (!state.pet.costumeColors && c.costumeColors) state.pet.costumeColors = c.costumeColors;
        }
      } catch (e) {}
    }
    if (!state.pet.fieldTheme) {
      try {
        const rawW = localStorage.getItem("mypet-world-v1");
        if (rawW) {
          const w = JSON.parse(rawW);
          if (w.fieldTheme) state.pet.fieldTheme = w.fieldTheme;
        }
      } catch (e) {}
    }
    if (window.MyPetWorld && window.MyPetWorld.forced && window.MyPetWorld.forced.field) {
      state.pet.fieldTheme = window.MyPetWorld.forced.field;
    }
    if (!state.pet.fieldTheme) state.pet.fieldTheme = "meadow";
    if (window.MyPetWorld && MyPetWorld.clampFieldId) state.pet.fieldTheme = MyPetWorld.clampFieldId(state.pet.fieldTheme, state.pet);
    else if (window.MyPetWorld && MyPetWorld.FIELD_IDS.indexOf(state.pet.fieldTheme) < 0) state.pet.fieldTheme = "meadow";
    if (window.MyPetColor) MyPetColor.migratePet(state.pet);
    if (window.MyPetRoster) MyPetRoster.normalizePet(state.pet);
    syncActivePet();
    persistStaticPet();
  }

  function petColors(pet) {
    const p = pet || (state && state.pet) || {};
    const def = (window.MyPetSpecies && MyPetSpecies.of(p).defaults) || { wool: "white", face: "black", eyes: "white" };
    return { wool: p.wool || def.wool, face: p.face || def.face, eyes: p.eyes || def.eyes, dye: p.dye || null };
  }
  function costumeColorOf(id) {
    const map = (state && state.pet && state.pet.costumeColors) || {};
    return map[id] || "default";
  }
  function liveKey(key) { return key ? "_c_" + key : key; }

  const SHEEP_KEYS = ["idle", "walk1", "walk2", "walk3", "walk4", "eat", "drink", "happy", "sleep"];
  const ITEM_FILES = [
    "item_water_trough.png", "item_basin.png", "item_hottub.png",
    "item_hay_trough.png", "item_veggie_bowl.png",
    "item_hay_bed.png", "item_straw_mat.png",
    "prop_bamboo.png", "prop_reeds.png", "prop_stones.png", "prop_pond.png",
    "prop_den.png", "prop_log.png",
    "yuzu.png", "orange.png",
  ];

  function currentSpecies() {
    return (window.MyPetSpecies && MyPetSpecies.of(state && state.pet)) || null;
  }
  function posePrefix(pet) {
    return (window.MyPetSpecies && MyPetSpecies.prefix(pet || (state && state.pet))) || "sheep";
  }
  function posePrefixes() {
    const out = ["sheep"];
    const all = window.MyPetSpecies && MyPetSpecies.SPECIES;
    if (all) {
      Object.keys(all).forEach((id) => {
        const pre = all[id] && all[id].prefix;
        if (pre && out.indexOf(pre) < 0) out.push(pre);
      });
    }
    return out;
  }
  function headAt(pose, pet) {
    if (window.MyPetSpecies) return MyPetSpecies.headOf(pet || (state && state.pet), pose);
    return HEAD[pose] || HEAD.idle;
  }
  function neckAt(pose, pet) {
    if (window.MyPetSpecies) return MyPetSpecies.neckOf(pet || (state && state.pet), pose);
    return NECK[pose] || NECK.idle;
  }
  function noseAt(pose, pet) {
    if (window.MyPetSpecies) return MyPetSpecies.noseOf(pet || (state && state.pet), pose);
    return { x: -44, y: pose === "happy" ? -70 : -66 };
  }
  function recolorPet(img, colors, pet) {
    if (!img || !window.MyPetColor) return null;
    const who = pet || (state && state.pet);
    const sp = who && who.species;
    if (MyPetColor.recolorPetImage) return MyPetColor.recolorPetImage(img, colors || petColors(), sp);
    return MyPetColor.recolorSheepImage(img, colors || petColors());
  }
  const COLOR_IMG = {};
  function loadColorImg(file, cb) {
    const existing = COLOR_IMG[file];
    const ok = (im) => im && im.complete && im.naturalWidth;
    const dead = (im) => !!(im && (im._failed || (im.complete && !im.naturalWidth && im.src)));
    if (ok(existing)) {
      if (cb) cb(existing);
      return existing;
    }
    if (dead(existing)) {
      if (cb) cb(existing);
      return existing;
    }
    const im = existing || new Image();
    COLOR_IMG[file] = im;
    im.crossOrigin = "anonymous";
    if (cb) {
      im.addEventListener("load", () => { if (cb) cb(im); }, { once: true });
      im.addEventListener("error", () => { im._failed = true; if (cb) cb(im); }, { once: true });
    } else if (!im._errBound) {
      im._errBound = true;
      im.addEventListener("error", () => { im._failed = true; }, { once: true });
    }
    if (!im.src) im.src = assetUrl("assets/" + file);
    return im;
  }
  function sheepCanvas(pose, pet) {
    const file = posePrefix(pet) + "_" + pose + ".png";
    const im = COLOR_IMG[file];
    if (!im || !im.naturalWidth || !window.MyPetColor) return null;
    return recolorPet(im, petColors(pet), pet);
  }
  function sheepDataUrl(pose, pet) {
    const c = sheepCanvas(pose, pet);
    const file = posePrefix(pet) + "_" + pose + ".png";
    return c ? c.toDataURL("image/png") : assetUrl("assets/" + file);
  }
  function costumeDataUrl(id) {
    const file = (id === "collar" ? "costume_collar" : (COSTUME_TEX[id] || ("costume_" + id))) + ".png";
    const im = COLOR_IMG[file];
    if (!im || !im.naturalWidth || !window.MyPetColor) return assetUrl("assets/" + file);
    const kind = id === "collar" ? "collar" : id;
    return MyPetColor.recolorCostumeImage(im, kind, costumeColorOf(id)).toDataURL("image/png");
  }
  function preloadColorImages(done) {
    const speciesFiles = [];
    posePrefixes().forEach((pre) => {
      SHEEP_KEYS.forEach((k) => speciesFiles.push(pre + "_" + k + ".png"));
    });
    ["swim1", "swim2", "swim3", "swim4"].forEach((k) => speciesFiles.push("capy_" + k + ".png"));
    const files = speciesFiles.concat([
      "costume_crown.png", "costume_bow.png", "costume_hat.png", "costume_witch.png", "costume_collar.png",
    ]);
    let left = files.length;
    files.forEach((f) => loadColorImg(f, () => { left--; if (left <= 0 && done) done(); }));
  }

  function applyPetLook() {
    if (!pasture || !pasture.textures) return;
    const sc = pasture;
    const spId = (state && state.pet && state.pet.species) || "sheep_valais";
    const prefix = posePrefix();
    if (!sc._baseImgs) sc._baseImgs = {};
    if (sc._baseSpecies !== spId) {
      sc._baseSpecies = spId;
      const lookKeys = SHEEP_KEYS.slice();
      if (prefix === "capy") ["swim1", "swim2", "swim3", "swim4"].forEach((k) => lookKeys.push(k));
      lookKeys.forEach((k) => {
        const texKey = prefix + "_" + k;
        const tex = sc.textures.exists(texKey) ? sc.textures.get(texKey) : (sc.textures.exists(k) ? sc.textures.get(k) : null);
        if (tex && tex.getSourceImage) {
          const src = tex.getSourceImage();
          const c = document.createElement("canvas");
          c.width = src.width; c.height = src.height;
          c.getContext("2d", { willReadFrequently: true }).drawImage(src, 0, 0);
          sc._baseImgs[k] = c;
        }
      });
    }
    if (!sc._costumeBases) {
      sc._costumeBases = true;
      ["costume_crown", "costume_bow", "costume_hat", "costume_witch", "costume_collar"].forEach((k) => {
        const tex = sc.textures.get(k);
        if (tex && tex.getSourceImage) {
          const src = tex.getSourceImage();
          const c = document.createElement("canvas");
          c.width = src.width; c.height = src.height;
          c.getContext("2d", { willReadFrequently: true }).drawImage(src, 0, 0);
          sc._baseImgs[k] = c;
        }
      });
    }
    function paint(key, canvas) {
      if (!canvas) return;
      const live = liveKey(key);
      if (!sc.textures.exists(live)) {
        sc.textures.addCanvas(live, canvas);
      } else {
        const tex = sc.textures.get(live);
        const src = tex.getSourceImage && tex.getSourceImage();
        if (src && src.getContext) {
          const ctx = src.getContext("2d", { willReadFrequently: true });
          ctx.clearRect(0, 0, src.width, src.height);
          ctx.drawImage(canvas, 0, 0);
        }
        if (typeof tex.refresh === "function") tex.refresh();
      }
    }
    if (window.MyPetColor) {
      const paintKeys = SHEEP_KEYS.slice();
      if (prefix === "capy") ["swim1", "swim2", "swim3", "swim4"].forEach((k) => paintKeys.push(k));
      paintKeys.forEach((k) => {
        const base = sc._baseImgs[k];
        if (base) paint(k, recolorPet(base, petColors()));
      });
      const map = { crown: "costume_crown", bow: "costume_bow", hat: "costume_hat", witch: "costume_witch", collar: "costume_collar" };
      Object.keys(map).forEach((id) => {
        const base = sc._baseImgs[map[id]];
        if (base) paint(map[id], MyPetColor.recolorCostumeImage(base, id, costumeColorOf(id)));
      });
    }
    if (sc.sheep) {
      const raw = String(sc.sheep.texture && sc.sheep.texture.key || "idle").replace(/^_c_/, "");
      if (raw === "walk" || raw.indexOf("walk") === 0) {
        if (sc.sheep.anims) sc.sheep.play("walk");
      } else if (raw === "swim" || raw.indexOf("swim") >= 0) {
        if (sc.sheep.anims && sc.refreshSwimAnim) { sc.refreshSwimAnim(); sc.sheep.play("swim"); }
        else if (sc.textures.exists(liveKey(raw))) sc.sheep.setTexture(liveKey(raw));
      } else if (sc.textures.exists(liveKey(raw))) {
        sc.sheep.setTexture(liveKey(raw));
      }
      if (sc.costume && sc.sheep.costumeId && COSTUME_TEX[sc.sheep.costumeId]) {
        const live = liveKey(COSTUME_TEX[sc.sheep.costumeId]);
        if (sc.textures.exists(live)) sc.costume.setTexture(live);
      }
      if (sc.collar && sc.sheep.collarId === "collar" && sc.textures.exists(liveKey("costume_collar"))) {
        sc.collar.setTexture(liveKey("costume_collar"));
      }
      sc.layoutWear();
    }
  }

  function petAllowsLooks(pet) {
    pet = pet || (state && state.pet);
    return !!(window.MyPetSpecies && MyPetSpecies.allowsLooks && MyPetSpecies.allowsLooks(pet));
  }
  function defaultPetName(petOrId) {
    if (window.MyPetSpecies && MyPetSpecies.defaultNameOf) return MyPetSpecies.defaultNameOf(petOrId);
    return "Biscuit";
  }

  function grantStaticUnlocks() {
    if (!state || !state.pet) return [];
    if (!petAllowsLooks(state.pet)) return [];
    const unlocked = Array.isArray(state.pet.unlocked) ? state.pet.unlocked.slice() : [];
    const newly = [];
    for (const u of EXTRA_UNLOCKS) {
      if ((state.pet.friendship || 0) >= u.at && !unlocked.includes(u.id)) {
        unlocked.push(u.id);
        newly.push(u);
      }
    }
    if (newly.length) {
      state.pet.unlocked = unlocked;
      persistStaticPet();
    }
    return newly;
  }

  function noteUnlocks(res, extraGranted) {
    extraGranted = extraGranted || [];
    const seen = {};
    const list = [];
    if (res && res.new_unlocks) {
      for (const u of res.new_unlocks) {
        if (u && u.id && !seen[u.id]) { seen[u.id] = true; list.push(u); }
      }
    }
    for (const u of extraGranted) {
      if (u && u.id && !seen[u.id]) { seen[u.id] = true; list.push(u); }
    }
    if (!list.length) return;
    if (window.MyPetRoster && state.pet) {
      list.forEach((u) => MyPetRoster.logLookUnlock(state.pet, u.id));
      persistStaticPet();
    }
    list.forEach((u, i) => {
      const show = () => {
        toast("New look! " + u.emoji + " " + u.name, 3000);
        blip("unlock");
      };
      if (i === 0) show();
      else setTimeout(show, 2000 * i);
    });
  }

  function renderHud() {
    if (!state || !state.pet) return;
    $("petName").textContent = state.pet.name;
    $("hearts").textContent = "💗 " + state.pet.friendship;
    $("coinMark").textContent = state.coin_today ? "🪙 today" : "🪙";
    $("coinMark").title = state.coin_today ? "You already got today's coin" : "Care once today for 1 coin";
    updateMood();
  }

  function updateMood() {
    const el = $("petMood");
    if (!el) return;
    const asleep = pasture && pasture.mode === "sleep";
    if (asleep) el.textContent = "😴 Sleepy";
    else el.textContent = "😊 Happy";
  }

  function allowedFieldIds(pet) {
    if (window.MyPetWorld && MyPetWorld.allowedFieldIds) return MyPetWorld.allowedFieldIds(pet || (state && state.pet));
    return ["meadow"];
  }
  function currentFieldId() {
    const allowed = allowedFieldIds();
    if (window.MyPetWorld && MyPetWorld.forced && MyPetWorld.forced.field && allowed.indexOf(MyPetWorld.forced.field) >= 0) {
      return MyPetWorld.forced.field;
    }
    const sp = currentSpecies && currentSpecies();
    const id = (state && state.pet && state.pet.fieldTheme) || (sp && (sp.defaultField || sp.field)) || "meadow";
    if (window.MyPetWorld && MyPetWorld.clampFieldId) return MyPetWorld.clampFieldId(id, state && state.pet);
    return allowed.indexOf(id) >= 0 ? id : (allowed[0] || "meadow");
  }
  function fieldLayout() {
    const id = currentFieldId();
    return FIELD_LAYOUTS[id] || FIELD_LAYOUTS.meadow;
  }
  function walkBox() {
    const L = fieldLayout();
    return (L && L.walk) || WALK;
  }

  // Unflipped art is drawn facing left. These poses were drawn facing right,
  // so flipX must be inverted for that pose or the pet walks/eats backwards.
  // v33: checked every frame by eye. Only these walk cycles face right; every
  // eat/drink frame faces left, and Biscuit's walk faces left too.
  const POSE_FACE_RIGHT = {
    fox: { walk: true },
    cat: { walk: true },
    dragon: { walk: true },
    rat: { walk: true },
  };
  function facingPoseKey(pose) {
    const k = String(pose || "idle").replace(/^_c_/, "");
    if (k === "walk" || /^walk\d/.test(k)) return "walk";
    if (k === "swim" || /^swim\d/.test(k)) return "swim";
    return k;
  }
  function poseArtFacesRight(pose) {
    const sp = currentSpecies && currentSpecies();
    if (!sp) return false;
    const row = POSE_FACE_RIGHT[sp.id];
    return !!(row && row[facingPoseKey(pose)]);
  }
  function poseNameOf(scene) {
    if (!scene) return "idle";
    if (typeof scene.poseName === "function") return scene.poseName();
    if (scene.mode === "walk") return "walk";
    if (scene.mode === "eat") return "eat";
    return "idle";
  }
  function napFootWorld(scene, s) {
    const sleep = (s && s.sleep) || s || { x: 512, y: 560 };
    let h = 110;
    if (scene && scene.textures) {
      const key = scene.textures.exists(liveKey("sleep")) ? liveKey("sleep") : (scene.textures.exists("sleep") ? "sleep" : null);
      if (key) {
        const tex = scene.textures.get(key);
        const src = tex && tex.getSourceImage && tex.getSourceImage();
        if (src) h = src.naturalHeight || src.height || h;
        else if (tex && tex.frames && tex.frames.__BASE) h = tex.frames.__BASE.height || h;
      }
    }
    // Feet origin (0.5, 1): put the body, not the feet, on the sleep spot.
    return scene.toWorld(sleep.x, sleep.y + Math.round(h * 0.42));
  }
  const FRONT_KEYS = ["front_cat_bed", "front_cat_bowls"];
  function fieldSpots() {
    const L = fieldLayout();
    return (L && L.spots) || SPOTS;
  }
  function inEllipse(x, y, e, padX, padY) {
    if (!e) return false;
    const rx = e.rx + (padX || 0), ry = e.ry + (padY == null ? (padX || 0) : padY);
    if (rx <= 0 || ry <= 0) return false;
    const nx = (x - (e.cx != null ? e.cx : e.x)) / rx;
    const ny = (y - (e.cy != null ? e.cy : e.y)) / ry;
    return nx * nx + ny * ny <= 1;
  }

  function applySky(cycle) {
    if (!window.MyPetWorld) return;
    cycle = cycle || MyPetWorld.nowCycle();
    const body = document.body;
    ["dawn", "day", "sunset", "night"].forEach((p) => body.classList.remove("sky-" + p));
    body.classList.add("sky-" + cycle.phase);
    body.style.setProperty("--sky", cycle.sky);
    if (cycle.phase === "sunset") {
      body.style.background = "linear-gradient(180deg, " + cycle.sky2 + " 0%, " + cycle.sky + " 70%)";
    } else {
      body.style.background = cycle.sky;
    }
    const meta = document.querySelector("meta[name='theme-color']");
    if (meta) meta.setAttribute("content", cycle.sky);
    const skyIcon = $("skyIcon");
    if (skyIcon) skyIcon.src = assetUrl("assets/" + cycle.skyIcon);
    const wxIcon = $("wxIcon");
    if (wxIcon) {
      if (cycle.weatherIcon) {
        wxIcon.src = assetUrl("assets/" + cycle.weatherIcon);
        wxIcon.classList.remove("hidden");
      } else {
        wxIcon.removeAttribute("src");
        wxIcon.classList.add("hidden");
      }
    }
    const chip = $("skyChip");
    if (chip) chip.title = cycle.label + (cycle.weather !== "clear" ? " · " + cycle.weatherLabel : "");
    if (pasture && pasture.cameras && pasture.cameras.main) {
      pasture.cameras.main.setBackgroundColor(cycle.sky);
    }
    updateMood();
  }

  async function addTestHearts(n) {
    n = n || 10;
    if (!state || !state.pet || !MyPetApi.addHearts) return;
    const res = await MyPetApi.addHearts(n);
    mergePet(res.pet || state.pet);
    state.coin_today = res.coin_today || state.coin_today;
    if (window.MyPetRoster && state.pet) {
      MyPetRoster.maybeHeartMilestones(state.pet);
      persistStaticPet();
    }
    const grantedExtra = grantStaticUnlocks();
    renderHud();
    renderPetChrome();
    if (res.new_unlocks && res.new_unlocks.length) {
      noteUnlocks(res, grantedExtra);
    } else if (grantedExtra.length) {
      noteUnlocks(res, grantedExtra);
    } else {
      toast("+" + n + " 💗");
      blip("unlock");
    }
  }

  async function setCollar(on) {
    if (!state || !state.pet) return;
    if (!petAllowsLooks(state.pet)) return;
    grantStaticUnlocks();
    if (on && !(state.pet.unlocked || []).includes("collar")) {
      toast("Need 💗 12");
      return;
    }
    state.pet.collar = on ? "collar" : null;
    persistStaticPet();
    if (typeof MyPetApi.equipCollar === "function") {
      try {
        const res = await MyPetApi.equipCollar(state.pet.collar);
        if (res && res.pet) {
          const kept = state.pet.collar;
          state.pet = res.pet;
          if (!state.pet.collar) state.pet.collar = kept;
        }
      } catch (e) {}
    }
    if (pasture) pasture.wearCollar(state.pet.collar);
    renderHud();
    renderLooks();
  }

  function renderLooks() {
    const grid = $("looksGrid");
    grid.innerHTML = "";
    const pet = state && state.pet;
    if (window.MyPetColor && pet) MyPetColor.migratePet(pet);
    const lead = $("looksPane") && $("looksPane").querySelector(".lead");
    if (pet && !petAllowsLooks(pet)) {
      grid.style.display = "none";
      if (lead) lead.textContent = "Pick a color for your pet.";
      paintLookPreviews();
      renderLooksColors();
      return;
    }
    grid.style.display = "";
    if (lead) lead.textContent = "Care for your pet to unlock these.";
    const unlocked = (pet && pet.unlocked) || [];
    const items = [
      { id: null, name: "No look", emoji: "✨", img: assetUrl("assets/sheep_idle.png"), at: 0, slot: "costume" },
      { id: "crown", name: "Flower crown", emoji: "🌸", img: assetUrl("assets/look_crown.png"), at: 8, slot: "costume" },
      { id: "collar", name: "Bell", emoji: "🔔", img: assetUrl("assets/look_collar.png"), at: 12, slot: "collar" },
      { id: "bow", name: "Bow", emoji: "🎀", img: assetUrl("assets/look_bow.png"), at: 16, slot: "costume" },
      { id: "hat", name: "Little hat", emoji: "🎩", img: assetUrl("assets/look_hat.png"), at: 28, slot: "costume" },
      { id: "witch", name: "Witch hat", emoji: "🧙", img: assetUrl("assets/look_witch.png"), at: 40, slot: "costume" },
    ];
    for (const it of items) {
      const have = it.id === null || unlocked.includes(it.id);
      const equipped = it.slot === "collar"
        ? !!(pet && pet.collar === "collar")
        : !!(pet && pet.costume === it.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "look" + (have ? "" : " locked") + (equipped ? " equipped" : "");
      btn.innerHTML = `<img src="${it.img}" alt="">
        <span>${it.emoji} ${it.name}</span>
        <span class="need">${have ? (it.id === null ? "Always" : "Unlocked") : "💗 " + it.at}</span>`;
      if (have) {
        btn.addEventListener("click", async () => {
          if (it.slot === "collar") {
            const on = !(state.pet && state.pet.collar === "collar");
            await setCollar(on);
            toast(on ? "Cute! 🔔" : "Bell off");
            blip("click");
            return;
          }
          const res = await MyPetApi.equip(it.id);
          mergePet(res.pet);
          persistStaticPet();
          applyPetLook();
          renderHud(); renderLooks();
          if (pasture) pasture.wear(state.pet.costume);
          toast(it.id ? "Cute! " + it.emoji : "Look cleared");
          blip("click");
        });
      }
      grid.appendChild(btn);
    }
    paintLookPreviews();
    renderLooksColors();
  }

  function paintLookPreviews() {
    if (!window.MyPetColor) return;
    const idleFile = posePrefix() + "_idle.png";
    const sheepIm = COLOR_IMG[idleFile];
    if (!sheepIm || !sheepIm.naturalWidth) {
      if (sheepIm && (sheepIm._failed || (sheepIm.complete && !sheepIm.naturalWidth && sheepIm.src))) return;
      loadColorImg(idleFile, () => { paintLookPreviews(); renderLooksColors(); });
      return;
    }
    const sheep = recolorPet(sheepIm, petColors());
    const grid = $("looksGrid");
    if (!grid) return;
    const btns = grid.querySelectorAll(".look");
    const ids = [null, "crown", "collar", "bow", "hat", "witch"];
    btns.forEach((btn, i) => {
      const img = btn.querySelector("img");
      const id = ids[i];
      if (!img) return;
      if (!id) { img.src = sheep.toDataURL("image/png"); return; }
      const file = id === "collar" ? "costume_collar.png" : "costume_" + id + ".png";
      const cim = COLOR_IMG[file];
      if (!cim || !cim.naturalWidth) {
        if (cim && (cim._failed || (cim.complete && !cim.naturalWidth && cim.src))) return;
        loadColorImg(file, paintLookPreviews);
        return;
      }
      const hat = MyPetColor.recolorCostumeImage(cim, id, costumeColorOf(id));
      const c = document.createElement("canvas");
      c.width = 133; c.height = 139;
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheep, 0, (139 - sheep.height) / 2);
      // Feet at the bottom of the 121px idle art, drawn at y=(139-121)/2.
      // Hats use HEAD + nudge; the collar uses NECK once (do not add it twice).
      const scale = 1;
      const feetY = (139 - sheep.height) / 2 + sheep.height;
      const feetX = 133 / 2;
      const sit = id === "collar" ? neckAt("idle") : headAt("idle");
      const nudge = id === "collar" ? { x: 0, y: 0 } : (COSTUME_NUDGE[id] || { x: 0, y: 0 });
      const mul = id === "collar" ? 1 : (COSTUME_SCALE[id] == null ? 1.08 : COSTUME_SCALE[id]);
      const dx = feetX + (sit.x + nudge.x) * scale;
      const dy = feetY + (sit.y + nudge.y) * scale;
      ctx.drawImage(hat, dx - (hat.width * mul) / 2, dy - hat.height * mul, hat.width * mul, hat.height * mul);
      img.src = c.toDataURL("image/png");
    });
  }


  function dyeTrackHue(s, l) {
    const stops = [];
    for (let i = 0; i <= 6; i++) stops.push("hsl(" + (i * 60) + ", " + Math.round(s * 100) + "%, " + Math.round(l * 100) + "%)");
    return "linear-gradient(to right, " + stops.join(", ") + ")";
  }
  function dyeTrackSat(h, l) {
    return "linear-gradient(to right, hsl(" + h + ", 0%, " + Math.round(l * 100) + "%), hsl(" + h + ", 100%, " + Math.round(l * 100) + "%))";
  }
  function dyeTrackLit(h, s) {
    const sat = Math.round(s * 100);
    return "linear-gradient(to right, hsl(" + h + ", " + sat + "%, 4%), hsl(" + h + ", " + sat + "%, 50%), hsl(" + h + ", " + sat + "%, 96%))";
  }
  function paintDyeTracks(row, dye) {
    if (!row || !dye) return;
    const hue = row.querySelector(".dye-hue");
    const sat = row.querySelector(".dye-sat");
    const lit = row.querySelector(".dye-lit");
    const h = dye.h || 0, s = dye.s == null ? 0.6 : dye.s, l = dye.l == null ? 0.5 : dye.l;
    // Hue track stays vivid so the rainbow is easy to read
    if (hue) hue.style.background = dyeTrackHue(0.85, 0.5);
    if (sat) sat.style.background = dyeTrackSat(h, Math.max(0.35, Math.min(0.65, l)));
    if (lit) lit.style.background = dyeTrackLit(h, s);
  }
  function readDyeFromRow(row) {
    const hue = row.querySelector(".dye-hue");
    const sat = row.querySelector(".dye-sat");
    const lit = row.querySelector(".dye-lit");
    return {
      h: hue ? Number(hue.value) : 0,
      s: sat ? Number(sat.value) / 100 : 0,
      l: lit ? Number(lit.value) / 100 : 0.5,
      custom: true,
    };
  }
  function writeDyeToRow(row, dye, currentId, map) {
    if (!dye) return;
    const hue = row.querySelector(".dye-hue");
    const sat = row.querySelector(".dye-sat");
    const lit = row.querySelector(".dye-lit");
    if (hue) hue.value = String(Math.round(dye.h || 0));
    if (sat) sat.value = String(Math.round((dye.s == null ? 0 : dye.s) * 100));
    if (lit) lit.value = String(Math.round((dye.l == null ? 0.5 : dye.l) * 100));
    paintDyeTracks(row, dye);
    row.querySelectorAll("button.swatch").forEach((btn) => {
      btn.classList.toggle("on", currentId && btn.dataset.id === currentId);
    });
  }
  function renderColorPickers(box, model, onChange) {
    if (!box || !window.MyPetColor) return;
    const sp = window.MyPetSpecies && MyPetSpecies.of(model);
    const slots = (sp && sp.colorSlots) || [
      { key: "wool", label: "Wool", pal: "WOOL" },
      { key: "face", label: "Face", pal: "FACE" },
      { key: "eyes", label: "Eyes", pal: "EYES" },
    ];
    MyPetColor.ensureDye(model);
    const sig = (model.species || "") + ":" + slots.map((s) => s.key).join(",");
    if (box.dataset.dyeSig === sig && box.querySelector(".dye-slot")) {
      slots.forEach((slot) => {
        const row = box.querySelector('.dye-slot[data-key="' + slot.key + '"]');
        if (row) writeDyeToRow(row, model.dye[slot.key], model[slot.key], null);
      });
      return;
    }
    box.dataset.dyeSig = sig;
    box.innerHTML = "";
    slots.forEach((slot) => {
      const pal = MyPetColor.PALS && MyPetColor.PALS[slot.pal];
      const order = pal ? pal.order : [];
      const names = pal ? pal.names : {};
      const map = pal ? pal.map : {};
      const wrap = document.createElement("div");
      wrap.className = "swatch-row dye-slot";
      wrap.dataset.key = slot.key;
      const lab = document.createElement("div");
      lab.className = "lab";
      lab.textContent = slot.label;
      wrap.appendChild(lab);
      const rowEl = document.createElement("div");
      rowEl.className = "swatches";
      (order || []).forEach((id) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.id = id;
        btn.className = "swatch" + (model[slot.key] === id ? " on" : "");
        btn.title = (names && names[id]) || id;
        btn.setAttribute("aria-label", (names && names[id]) || id);
        const entry = map && map[id];
        btn.style.background = (entry && entry.hex) || "#eee";
        btn.addEventListener("click", () => {
          const dye = MyPetColor.dyeFromPreset(entry);
          if (!model.dye) model.dye = {};
          dye.custom = !MyPetColor.isIdentityEntry(entry);
          model.dye[slot.key] = dye;
          model[slot.key] = id;
          writeDyeToRow(wrap, dye, id, map);
          if (onChange) onChange(model, { key: slot.key, from: "swatch" });
        });
        rowEl.appendChild(btn);
      });
      wrap.appendChild(rowEl);
      const bars = document.createElement("div");
      bars.className = "dye-bars";
      [
        { cls: "dye-hue", emoji: "🌈", name: "Hue", min: 0, max: 360, val: Math.round((model.dye[slot.key] && model.dye[slot.key].h) || 0) },
        { cls: "dye-sat", emoji: "💧", name: "Sat", min: 0, max: 100, val: Math.round(((model.dye[slot.key] && model.dye[slot.key].s) || 0) * 100) },
        { cls: "dye-lit", emoji: "🌗", name: "Light", min: 0, max: 100, val: Math.round(((model.dye[slot.key] && model.dye[slot.key].l) || 0.5) * 100) },
      ].forEach((bar) => {
        const labEl = document.createElement("label");
        labEl.className = "dye-bar";
        labEl.innerHTML = '<span class="dye-ico" aria-hidden="true">' + bar.emoji + '</span><span class="dye-name">' + bar.name + "</span>";
        const input = document.createElement("input");
        input.type = "range";
        input.className = bar.cls;
        input.min = String(bar.min);
        input.max = String(bar.max);
        input.step = "1";
        input.value = String(bar.val);
        input.setAttribute("aria-label", bar.name);
        const fire = (done) => {
          const dye = readDyeFromRow(wrap);
          if (!model.dye) model.dye = {};
          model.dye[slot.key] = dye;
          model[slot.key] = "custom";
          paintDyeTracks(wrap, dye);
          wrap.querySelectorAll("button.swatch").forEach((btn) => btn.classList.remove("on"));
          if (onChange) onChange(model, { key: slot.key, from: "slider", done: !!done });
        };
        input.addEventListener("input", () => fire(false));
        input.addEventListener("change", () => fire(true));
        labEl.appendChild(input);
        bars.appendChild(labEl);
      });
      wrap.appendChild(bars);
      paintDyeTracks(wrap, model.dye[slot.key]);
      box.appendChild(wrap);
    });
  }

  function renderLooksColors() {
    const box = $("looksColors");
    if (!box || !window.MyPetColor) return;
    box.innerHTML = "";
    const pet = state && state.pet;
    if (!pet) return;
    if (window.MyPetColor && MyPetColor.ensureDye) MyPetColor.ensureDye(pet);
    let lookTimer = renderLooksColors._t;
    renderColorPickers(box, pet, (model, ev) => {
      state.pet.wool = model.wool;
      state.pet.face = model.face;
      state.pet.eyes = model.eyes;
      state.pet.dye = model.dye;
      if (ev && ev.from === "slider" && !ev.done) {
        clearTimeout(renderLooksColors._t);
        renderLooksColors._t = setTimeout(() => applyPetLook(), 40);
        return;
      }
      persistStaticPet();
      applyPetLook();
      if (!(ev && ev.from === "slider")) blip("click");
    });
    const unlocked = pet.unlocked || [];
    const rows = [];
    if (petAllowsLooks(pet) && pet.costume && unlocked.includes(pet.costume)) {
      rows.push({ id: pet.costume, label: ({ crown: "🌸 Crown", bow: "🎀 Bow", hat: "🎩 Hat", witch: "🧙 Hat" }[pet.costume] || "Color") });
    }
    if (pet.collar === "collar" && unlocked.includes("collar")) {
      rows.push({ id: "collar", label: "🔔 Bell" });
    }
    if (!rows.length) return;
    rows.forEach((row) => {
      const wrap = document.createElement("div");
      wrap.className = "swatch-row";
      wrap.innerHTML = '<div class="lab">' + row.label + '</div>';
      const rowEl = document.createElement("div");
      rowEl.className = "swatches";
      const current = costumeColorOf(row.id);
      MyPetColor.HUT_ORDER.forEach((cid) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "swatch" + (current === cid ? " on" : "");
        btn.title = MyPetColor.HUT_NAMES[cid] || cid;
        btn.setAttribute("aria-label", MyPetColor.HUT_NAMES[cid] || cid);
        btn.style.background = MyPetColor.swatchHex(row.id, cid);
        btn.addEventListener("click", () => {
          if (!state.pet.costumeColors) state.pet.costumeColors = {};
          state.pet.costumeColors[row.id] = cid;
          persistStaticPet();
          applyPetLook();
          renderLooks();
          blip("click");
        });
        rowEl.appendChild(btn);
      });
      wrap.appendChild(rowEl);
      box.appendChild(wrap);
    });
  }

  async function setCostumeColor(id, colorId) {
    if (!state || !state.pet) return;
    if (!state.pet.costumeColors) state.pet.costumeColors = {};
    state.pet.costumeColors[id] = colorId || "default";
    persistStaticPet();
    applyPetLook();
    renderLooks();
  }

  async function doCare(action, after) {
    const res = await MyPetApi.care(action);
    mergePet(res.pet);
    state.coins = res.coins;
    state.coin_today = res.pet.coin_day === res.day_key;
    if (window.MyPetRoster && state.pet) {
      if (action === "bath") MyPetRoster.logMilestone(state.pet, "first_bath", "First bath", "🛁");
      if (action === "brush") MyPetRoster.logMilestone(state.pet, "first_brush", "First brush", "🪮");
      MyPetRoster.maybeHeartMilestones(state.pet);
      persistStaticPet();
    }
    const grantedExtra = grantStaticUnlocks();
    renderHud();
    renderPetChrome();
    if (res.coin_awarded) {
      toastWhenFree("+1 coin 🪙");
      blip("coin");
    }
    if ((res.new_unlocks && res.new_unlocks.length) || grantedExtra.length) {
      setTimeout(() => noteUnlocks(res, grantedExtra), res.coin_awarded ? 1600 : 200);
    }
    if (after) after(res);
    return res;
  }

  class Pasture extends Phaser.Scene {
    constructor() { super("pasture"); }

    preload() {
      const A = (typeof assetUrl === "function") ? (name) => assetUrl("assets/" + name) : (name) => "/assets/" + name;
      const img = (key, file) => this.load.image(key, A(file));
      const meadow = window.MyPetWorld && MyPetWorld.FIELDS && MyPetWorld.FIELDS.filter((f) => f.id === "meadow")[0];
      img("field", (meadow && meadow.file) || "field_meadow.png");
      if (window.MyPetWorld) {
        MyPetWorld.FIELDS.forEach((f) => img("field_" + f.id, f.file));
      }
      img("wx_drop", "wx_drop.png");
      img("wx_flake", "wx_flake.png");
      img("wx_leaf", "wx_leaf.png");
      img("meadow_fox_gate", "field_meadow_fox_gate.png");
      img("prop_seesaw", "prop_seesaw.png");
      img("prop_seesaw_pad", "prop_seesaw_pad.png");
      FRONT_KEYS.forEach((k) => img(k, k + ".png"));
      posePrefixes().forEach((pre) => {
        SHEEP_KEYS.forEach((k) => img(pre + "_" + k, pre + "_" + k + ".png"));
      });
      img("idle", "sheep_idle.png");
      img("walk1", "sheep_walk1.png");
      img("walk2", "sheep_walk2.png");
      img("walk3", "sheep_walk3.png");
      img("walk4", "sheep_walk4.png");
      img("eat", "sheep_eat.png");
      img("drink", "sheep_drink.png");
      img("happy", "sheep_happy.png");
      img("sleep", "sheep_sleep.png");
      img("blanket", "blanket.png");
      img("costume_crown", "costume_crown.png");
      img("costume_bow", "costume_bow.png");
      img("costume_hat", "costume_hat.png");
      img("costume_witch", "costume_witch.png");
      img("costume_collar", "costume_collar.png");
      img("ball", "ball.png");
      img("yarn", "yarn.png");
      img("treat", "treat.png");
      img("heart", "heart.png");
      img("sparkle", "sparkle.png");
      img("bubble", "bubble.png");
      img("note", "note.png");
      img("zzz", "zzz.png");
      img("bf1", "butterfly1.png");
      img("bf2", "butterfly2.png");
      img("bfb1", "butterfly_b1.png");
      img("bfb2", "butterfly_b2.png");
      img("hay_bale", "hay_bale.png");
      img("slide", "slide.png");
      img("tunnel", "tunnel.png");
      img("party_hat", "party_hat.png");
      img("bunting", "bunting.png");
      img("orange", "orange.png");
      ["swim1", "swim2", "swim3", "swim4"].forEach((k) => img("capy_" + k, "capy_" + k + ".png"));
    }

    create() {
      pasture = this;
      applyPetLook();
      this.refreshWalkAnim();
      this.anims.create({ key: "bf", frames: [{ key: "bf1" }, { key: "bf2" }], frameRate: 5, repeat: -1 });
      this.anims.create({ key: "bfb", frames: [{ key: "bfb1" }, { key: "bfb2" }], frameRate: 5, repeat: -1 });

      const top = 70, bot = 108;
      const availW = W - 16, availH = H - top - bot;
      const scale = Math.min(availW / FIELD, availH / FIELD);
      this.fScale = scale;
      this.fieldX = (W - FIELD * scale) / 2;
      this.fieldY = top + (availH - FIELD * scale) / 2;

      const fieldKey = this.textures.exists("field_" + currentFieldId()) ? ("field_" + currentFieldId()) : "field";
      this.field = this.add.image(this.fieldX, this.fieldY, fieldKey).setOrigin(0, 0).setScale(scale);
      this.field.setInteractive();
      this.bunting = this.add.image(this.fieldX + FIELD * scale / 2, this.fieldY + 108 * scale, "bunting")
        .setOrigin(0.5, 0).setVisible(false).setDepth(8);
      this.bunting.setDisplaySize(864 * scale, 48 * scale * 1.35);
      this.skyTint = this.add.rectangle(this.fieldX, this.fieldY, FIELD * scale, FIELD * scale, 0x152044, 0).setOrigin(0, 0).setDepth(1);
      this.stars = [];
      this.wxGfx = this.add.graphics().setDepth(8010);
      this.rainbow = this.add.graphics().setDepth(3);
      this.drops = [];
      this.flakes = [];
      this.ripples = [];
      this._wx = "clear";
      this._phase = "day";

      this.sheep = this.add.sprite(0, 0, this.textures.exists(liveKey("idle")) ? liveKey("idle") : "idle").setOrigin(0.5, 1).setScale(scale);
      this.sheep.playX = 0.5;
      this.blanket = this.add.image(0, 0, "blanket").setOrigin(0.5, 0.7).setScale(scale).setVisible(false);
      this.costume = this.add.image(0, 0, this.textures.exists(liveKey("costume_crown")) ? liveKey("costume_crown") : "costume_crown").setOrigin(0.5, 1).setScale(scale * 1.08).setVisible(false);
      this.collar = this.add.image(0, 0, this.textures.exists(liveKey("costume_collar")) ? liveKey("costume_collar") : "costume_collar").setOrigin(0.5, 1).setScale(scale).setVisible(false);
      this.partyHat = this.add.image(0, 0, "party_hat").setOrigin(0.5, 1).setScale(scale).setVisible(false);

      const startPt = (fieldLayout() && fieldLayout().start) || { x: 512, y: 560 };
      const start = this.toWorld(startPt.x, startPt.y);
      this.place(start.x, start.y);
      this.mode = "idle";
      this.target = null;
      this.onArrive = null;
      this.idleAt = this.time.now + 8000;
      this.facing = 1;
      this.wear(state.pet && state.pet.costume);
      this.wearCollar(state.pet && state.pet.collar);
      applyBirthdayDecor();
      this.placePark();
      this.placeCareItems();
      this.placeHomeDecor();
      this.applyFieldLayout();

      this.field.on("pointerdown", (p) => this.onTap(p));
      this.input.addPointer(2);
      this.input.on("pointermove", (p) => this.onMove(p));
      const canvas = this.game.canvas;
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("touchmove", (e) => { if (brushMode) e.preventDefault(); }, { passive: false });
      }

      this.butterflies = [];
      this.time.addEvent({ delay: 18000, loop: true, callback: () => this.spawnButterflies() });
      this.time.delayedCall(4000, () => this.spawnButterflies());
      this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.layoutWear, this);
      this.applyWorld(true);
      this.time.addEvent({ delay: 1000, loop: true, callback: () => this.applyWorld(false) });
    }

    toWorld(fx, fy) {
      return { x: this.fieldX + fx * this.fScale, y: this.fieldY + fy * this.fScale };
    }
    toField(wx, wy) {
      return { x: (wx - this.fieldX) / this.fScale, y: (wy - this.fieldY) / this.fScale };
    }

    place(x, y) {
      this.footX = x; this.footY = y;
      this.sheep.x = x; this.sheep.y = y;
      if (this.fScale) this.sheep.setScale(this.fScale, this.fScale);
      this.layoutWear();
    }

    resetWalkPose() {
      if (!this.sheep) return;
      if (this.footX != null) this.sheep.x = this.footX;
      if (this.footY != null) this.sheep.y = this.footY;
      if (this.fScale) this.sheep.setScale(this.fScale, this.fScale);
    }

    applyWalkMotion() {
      if (!this.sheep || !this.target || this.footX == null) return;
      const s = this.fScale;
      const sp = currentSpecies();
      if (sp && sp.walk === "wobble") {
        this.sheep.setScale(s, s);
        this.sheep.x = this.footX;
        this.sheep.y = this.footY;
        return;
      }
      if (this.inPoolFeet && this.inPoolFeet()) {
        this.sheep.setScale(s, s);
        this.sheep.x = this.footX;
        this.sheep.y = this.footY + Math.sin(this.time.now / 280) * 1.6 * s;
        return;
      }
      const wave = Math.abs(Math.sin(this.time.now / 140));
      const hop = (sp && sp.hop) ? wave * 8 * s : wave * 2.2 * s;
      this.sheep.setScale(s * (1 + wave * 0.04), s * (1 - wave * 0.05));
      this.sheep.x = this.footX;
      this.sheep.y = this.footY - hop;
    }

    poseName() {
      if (this.mode === "sleep") return "sleep";
      const texRaw = this.sheep.texture && this.sheep.texture.key;
      const tex = texRaw && String(texRaw).replace(/^_c_/, "");
      const anims = this.sheep.anims;
      const playing = !!(anims && anims.isPlaying);
      if (playing) {
        const frame = anims.currentFrame;
        const frameKey = frame && (frame.textureKey || (frame.frame && frame.frame.textureKey));
        if (frameKey && (HEAD[frameKey] || /swim/.test(String(frameKey)))) {
          const raw = String(frameKey).replace(/^_c_/, "").replace(/^capy_/, "");
          return raw;
        }
        if (anims.currentAnim && anims.currentAnim.key === "swim") return "swim";
        if (this.mode === "walk" || (anims.currentAnim && anims.currentAnim.key === "walk")) return "walk";
      }
      if (tex && HEAD[tex]) return tex;
      if (this.mode === "walk") return "walk";
      if (this.mode === "swim" || (tex && String(tex).indexOf("swim") >= 0)) return "swim";
      if (tex && String(tex).indexOf("walk") === 0) return "walk";
      return "idle";
    }

    layoutWear() {
      if (!this.sheep) return;
      if (!this.target) {
        this.footX = this.sheep.x;
        this.footY = this.sheep.y;
      }
      const s = this.fScale;
      if (this.mode === "sleep") this.sheep.angle = 0;
      const sx = Math.abs(this.sheep.scaleX) || s;
      const sy = Math.abs(this.sheep.scaleY) || s;
      const flip = this.sheep.flipX ? -1 : 1;
      const ang = this.sheep.angle || 0;
      const rad = ang * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const pin = (sprite, ox, oy, mul, origin, depthOff) => {
        if (!sprite) return;
        const lx = ox * sx * flip;
        const ly = oy * sy;
        sprite.setOrigin(origin.x, origin.y);
        sprite.setScale(sx * mul, sy * mul);
        sprite.setFlipX(!!this.sheep.flipX);
        sprite.setAngle(ang);
        sprite.x = this.sheep.x + lx * cos - ly * sin;
        sprite.y = this.sheep.y + lx * sin + ly * cos;
        sprite.setDepth((this.footY != null ? this.footY : this.sheep.y) + depthOff);
      };
      if (this.blanket) {
        pin(this.blanket, 0, -10, 1, { x: 0.5, y: 0.7 }, -1);
        this.blanket.setVisible(false);
      }
      const id = this.sheep.costumeId;
      if (id && COSTUME_TEX[id] && this.costume) {
        const pose = this.poseName();
        const head = headAt(pose);
        const n = (pose === "sleep"
          ? (COSTUME_NUDGE_SLEEP[id] || { x: 0, y: 0 })
          : (COSTUME_NUDGE[id] || { x: 0, y: 0 }));
        const orig = COSTUME_ORIGIN[id] || { x: 0.5, y: 1 };
        const mul = COSTUME_SCALE[id] == null ? 1.08 : COSTUME_SCALE[id];
        pin(this.costume, head.x + n.x, head.y + n.y, mul, orig, 4);
        this.costume.setVisible(true);
      } else if (this.costume) {
        this.costume.setVisible(false);
      }
      const cid = this.sheep.collarId;
      if (cid === "collar" && this.collar) {
        const pose = this.poseName();
        const neck = neckAt(pose);
        pin(this.collar, neck.x, neck.y, 1, { x: 0.5, y: 1 }, 3);
        this.collar.setVisible(true);
      } else if (this.collar) {
        this.collar.setVisible(false);
      }
      if (this.partyHat) {
        const party = window.MyPetRoster && state && state.pet
          && MyPetRoster.isBirthdayToday(state.pet)
          && !state.pet.costume
          && this.sheep && this.sheep.visible
          && viewSlot === state.activePet;
        if (party) {
          const pose = this.poseName();
          const head = headAt(pose);
          pin(this.partyHat, head.x, head.y - 10, 1.22, { x: 0.5, y: 1 }, 5);
          this.partyHat.setVisible(true);
        } else {
          this.partyHat.setVisible(false);
        }
      }
      if (this.moodItem && this.moodItem.active) {
        if (this.mode === "idle") {
          const head = headAt("idle");
          pin(this.moodItem, head.x + 6, head.y + 8, 1, { x: 0.5, y: 1 }, 6);
          this.moodItem.setVisible(true);
        } else {
          this.moodItem.setVisible(false);
        }
      }
      const bf = this._perchedBf;
      if (bf && bf.active) {
        const pose = this.poseName();
        const nose = noseAt(pose);
        const noseY = nose.y;
        const noseX = nose.x;
        const flip = this.sheep.flipX ? -1 : 1;
        const rad = (this.sheep.angle || 0) * Math.PI / 180;
        const lx = noseX * Math.abs(this.sheep.scaleX) * flip;
        const ly = noseY * Math.abs(this.sheep.scaleY);
        const rx = lx * Math.cos(rad) - ly * Math.sin(rad);
        const ry = lx * Math.sin(rad) + ly * Math.cos(rad);
        bf.x = this.sheep.x + rx;
        bf.y = this.sheep.y + ry;
        bf.setDepth((this.footY != null ? this.footY : this.sheep.y) + 6);
      }
      const baseY = this.footY != null ? this.footY : this.sheep.y;
      this.sheep.setDepth(this._depthLock != null ? this._depthLock : baseY);
      this.layoutCarriedOranges && this.layoutCarriedOranges();
    }

    wear(id) {
      if (!petAllowsLooks()) id = null;
      this.sheep.costumeId = id || null;
      const tex = COSTUME_TEX[id];
      const live = tex && liveKey(tex);
      if (live && this.textures.exists(live)) this.costume.setTexture(live);
      else if (tex && this.textures.exists(tex)) this.costume.setTexture(tex);
      this.layoutWear();
    }

    wearCollar(id) {
      if (!petAllowsLooks()) id = null;
      this.sheep.collarId = id || null;
      const live = liveKey("costume_collar");
      if (id === "collar" && this.textures.exists(live)) this.collar.setTexture(live);
      else if (id === "collar" && this.textures.exists("costume_collar")) this.collar.setTexture("costume_collar");
      this.layoutWear();
    }

    setFacing(dx) {
      if (Math.abs(dx) >= 0.5) this._faceRight = dx > 0;
      this.applyFacing();
    }

    applyFacing(pose) {
      if (!this.sheep) return;
      if (this._faceRight == null) this._faceRight = false;
      let want = !!this._faceRight;
      const key = pose || poseNameOf(this);
      if (poseArtFacesRight(key)) want = !want;
      if (this.sheep.flipX !== want) this.sheep.setFlipX(want);
      this.layoutWear();
    }

    refreshWalkAnim() {
      if (this.anims.exists("walk")) this.anims.remove("walk");
      const walkKeys = ["walk1", "walk2", "walk3", "walk4"].map((k) => this.textures.exists(liveKey(k)) ? liveKey(k) : k);
      const sp = currentSpecies();
      const even = !!(sp && sp.prefix && sp.prefix !== "sheep");
      this.anims.create({
        key: "walk",
        frames: walkKeys.map((k, i) => ({ key: k, duration: even ? 130 : ((i % 2 === 0) ? 150 : 90) })),
        repeat: -1,
      });
    }

    hasSwim() {
      const sp = currentSpecies();
      return !!(sp && sp.prefix === "capy" && (this.textures.exists(liveKey("swim1")) || this.textures.exists("capy_swim1")));
    }

    swimFrameKey(k) {
      if (this.textures.exists(liveKey(k))) return liveKey(k);
      if (this.textures.exists("capy_" + k)) return "capy_" + k;
      return k;
    }

    refreshSwimAnim() {
      if (this.anims.exists("swim")) this.anims.remove("swim");
      const keys = ["swim1", "swim2", "swim3", "swim4"].map((k) => this.swimFrameKey(k));
      this.anims.create({
        key: "swim",
        frames: keys.map((k) => ({ key: k, duration: 240 })),
        repeat: -1,
      });
    }

    showAnim(key) {
      this.sheep.stop();
      if (key === "walk") {
        this.refreshWalkAnim();
        this.sheep.play("walk");
      } else if (key === "swim") {
        this.refreshSwimAnim();
        this.sheep.play("swim");
      } else {
        this.sheep.setTexture(this.textures.exists(liveKey(key)) ? liveKey(key) : key);
      }
      this.applyFacing(key);
    }

    inPoolAt(fx, fy) {
      const L = fieldLayout();
      return !!(L && L.pool && inEllipse(fx, fy, L.pool, -2, -2));
    }
    inBeachAt(fx, fy) {
      return this.inShoreAt(fx, fy);
    }
    inShoreAt(fx, fy) {
      const L = fieldLayout();
      if (!L) return false;
      const r = L.shoreGate;
      if (r && fx >= r.x0 && fx <= r.x1 && fy >= r.y0 && fy <= r.y1) return true;
      const g = L.shore || L.beach;
      return !!(g && inEllipse(fx, fy, g, 0, 0));
    }
    inPoolFeet() {
      if (!this.sheep) return false;
      const f = (this.footX != null) ? this.toField(this.footX, this.footY) : this.toField(this.sheep.x, this.sheep.y);
      return this.inPoolAt(f.x, f.y);
    }
    onSpaRock(fx, fy) {
      const L = fieldLayout();
      if (!L || !L.pool) return false;
      if (this.inPoolAt(fx, fy) || this.inShoreAt(fx, fy)) return false;
      const pad = L.rockPad || { rx: 90, ry: 74 };
      return inEllipse(fx, fy, L.pool, pad.rx, pad.ry);
    }
    spaZone(fx, fy) {
      if (this.inPoolAt(fx, fy)) return "water";
      if (this.onSpaRock(fx, fy)) return "rock";
      return "land";
    }
    locoAnim() {
      return (this.hasSwim() && this.inPoolFeet()) ? "swim" : "walk";
    }
    syncLocomotion() {
      if (!this.sheep) return;
      const wantSwim = this.hasSwim() && this.inPoolFeet();
      const nowPool = wantSwim;
      if (this._wasInPool && !nowPool) this.dropOranges();
      this._wasInPool = nowPool;
      const playing = this.sheep.anims && this.sheep.anims.currentAnim && this.sheep.anims.currentAnim.key;
      if (this.mode === "walk" || this.target) {
        const want = this.locoAnim();
        if (playing !== want) this.showAnim(want);
      } else if (this.mode === "idle" && !busy) {
        if (wantSwim && playing !== "swim") this.showAnim("swim");
        else if (!wantSwim && playing === "swim") this.showAnim("idle");
      }
    }

    walkTo(fx, fy, then, opts) {
      if (this.clearMood) this.clearMood();
      if (this.footX == null && this.sheep) { this.footX = this.sheep.x; this.footY = this.sheep.y; }
      this._ghostLast = false;
      this._ghostLeg = false;
      this._legBest = null;
      this._exactEnd = null;
      if (opts && opts.exact) {
        // v33: care spots (bowls, beds) — path to the nearest open ground,
        // then step straight onto the stand spot even if it sits in a prop's
        // keep-out ring. Stops pets getting lost around their own bowls.
        const ex = { x: this.clamp(fx), y: this.clampY(fy) };
        if (opts.via && this.hitsBlocker(ex.x, ex.y)) {
          // v34: come at the spot from a set side (e.g. from above the bowls).
          const near = this.pushOut(opts.via.x, opts.via.y);
          this._waypoints = this.buildPath(near.x, near.y);
          this._waypoints.push(ex);
          this._ghostLast = true;
          this._exactEnd = { near: near, ex: ex };
        } else if (this.hitsBlocker(ex.x, ex.y)) {
          const near = this.nearestWalkable(ex.x, ex.y);
          this._waypoints = this.buildPath(near.x, near.y);
          this._waypoints.push(ex);
          this._ghostLast = true;
          this._exactEnd = { near: near, ex: ex };
        } else {
          this._waypoints = this.buildPath(ex.x, ex.y);
        }
      } else {
        const dest = this.pushOut(fx, fy);
        this._waypoints = this.buildPath(dest.x, dest.y);
      }
      this._wpI = 0;
      const first = this._waypoints[0] || dest;
      const p = this.toWorld(first.x, first.y);
      this.target = p;
      this.onArrive = then || null;
      this.mode = "walk";
      this.setFacing(p.x - this.footX);
      this.showAnim(this.locoAnim());
    }

    clamp(x) { const w = walkBox(); return Phaser.Math.Clamp(x, w.x0, w.x1); }
    clampY(y) { const w = walkBox(); return Phaser.Math.Clamp(y, w.y0, w.y1); }

    footprintOf(key) {
      return FOOTPRINT[key] || { rx: 40, ry: 24 };
    }

    rebuildBlockers() {
      this.blockers = [];
      const add = (id, fx, fy, key, rx, ry) => {
        const fp = rx != null ? { rx: rx, ry: ry } : this.footprintOf(key);
        this.blockers.push({ id: id, fx: fx, fy: fy, rx: fp.rx, ry: fp.ry, key: key });
      };
      const L = fieldLayout();
      const spots = fieldSpots();
      if (L && L.blockers) {
        L.blockers.forEach((b) => add(b.id, b.x, b.y, b.key, b.rx, b.ry));
      } else if (L && !L.pool) {
        // Standard meadow care props (baked into field_meadow.png).
        if (spots.basin) add("care-water", spots.basin.x, spots.basin.y, "item_basin");
        if (spots.trough) add("care-food", spots.trough.x, spots.trough.y, "item_hay_trough");
        if (spots.bed) add("care-bed", spots.bed.x, spots.bed.y, "item_hay_bed");
      } else {
        if (spots.trough) add("care-food", spots.trough.x, spots.trough.y, "capy_reeds");
        if (spots.bed) add("care-bed", spots.bed.x, spots.bed.y, "capy_bed");
      }
      if (L && L.park) {
        add("park-hay", PARK.hay.x, PARK.hay.y, "hay_bale");
        add("park-slide", PARK.slide.x, PARK.slide.y, "slide");
        add("park-tunnel", PARK.tunnel.x, PARK.tunnel.y, "tunnel");
      }
    }

    hitsBlocker(fx, fy) {
      const list = this.blockers || [];
      const pad = 30;
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        const nx = (fx - b.fx) / (b.rx + pad), ny = (fy - b.fy) / (b.ry + pad);
        if (nx * nx + ny * ny >= 1) continue;
        return b;
      }
      const stream = this.inAutumnStream && this.inAutumnStream(fx, fy);
      if (stream && !(this.onSteppingStone && this.onSteppingStone(fx, fy))) {
        return { id: "stream", fx: stream.cx, fy: stream.cy, rx: stream.rx, ry: stream.ry, key: "stream" };
      }
      if (this.onSpaRock && this.onSpaRock(fx, fy)) {
        const p = fieldLayout().pool;
        const ang = Math.atan2(fy - p.cy, fx - p.cx);
        return {
          id: "spa-rocks",
          fx: p.cx + Math.cos(ang) * p.rx,
          fy: p.cy + Math.sin(ang) * p.ry,
          rx: 22, ry: 18, key: "rocks",
        };
      }
      return null;
    }

    lineHits(x0, y0, x1, y1) {
      const steps = Math.max(4, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const b = this.hitsBlocker(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
        if (b) return b;
      }
      return null;
    }

    nearestWalkable(fx, fy, maxR) {
      const x0 = this.clamp(fx), y0 = this.clampY(fy);
      if (!this.hitsBlocker(x0, y0)) return { x: x0, y: y0 };
      maxR = maxR || 240;
      let best = null, bestD = 1e9;
      for (let r = 8; r <= maxR; r += 8) {
        const n = Math.max(8, Math.round((Math.PI * 2 * r) / 8));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const x = this.clamp(fx + Math.cos(a) * r);
          const y = this.clampY(fy + Math.sin(a) * r);
          if (this.hitsBlocker(x, y)) continue;
          const d = Math.hypot(x - fx, y - fy);
          if (d < bestD) { best = { x: x, y: y }; bestD = d; }
        }
        if (best && bestD <= r + 0.1) return best;
      }
      const L = fieldLayout();
      if (L && L.shoreLand) {
        const pts = [L.shoreLand, L.shoreWater, L.beach, L.start].filter(Boolean);
        for (let i = 0; i < pts.length; i++) {
          const p = { x: this.clamp(pts[i].x), y: this.clampY(pts[i].y) };
          if (this.hitsBlocker(p.x, p.y)) continue;
          const d = Math.hypot(p.x - fx, p.y - fy);
          if (d < bestD) { best = p; bestD = d; }
        }
      }
      return best || { x: x0, y: y0 };
    }

    pushOut(fx, fy) {
      const pad = 30;
      let p = { x: this.clamp(fx), y: this.clampY(fy) };
      if (this.onSpaRock && this.onSpaRock(p.x, p.y)) return this.nearestWalkable(p.x, p.y);
      for (let guard = 0; guard < 12; guard++) {
        const b = this.hitsBlocker(p.x, p.y);
        if (!b) return p;
        const ang = Math.atan2(p.y - b.fy, p.x - b.fx);
        const a = (p.x === b.fx && p.y === b.fy) ? -Math.PI / 2 : ang;
        const clear = pad + 8;
        const cand = [
          { x: this.clamp(b.fx + Math.cos(a) * (b.rx + clear)), y: this.clampY(b.fy + Math.sin(a) * (b.ry + clear)) },
          { x: this.clamp(p.x), y: this.clampY(b.fy + b.ry + clear) },
          { x: this.clamp(p.x), y: this.clampY(b.fy - b.ry - clear) },
          { x: this.clamp(b.fx + b.rx + clear), y: this.clampY(p.y) },
          { x: this.clamp(b.fx - b.rx - clear), y: this.clampY(p.y) },
        ];
        let next = null;
        for (let i = 0; i < cand.length; i++) {
          if (!this.hitsBlocker(cand[i].x, cand[i].y)) { next = cand[i]; break; }
        }
        if (!next) return p;
        if (next.x === p.x && next.y === p.y) return p;
        p = next;
      }
      return p;
    }

    aroundPoint(b, from, dest) {
      const vx = dest.x - from.x, vy = dest.y - from.y;
      const len = Math.hypot(vx, vy) || 1;
      const px = -vy / len, py = vx / len;
      const pad = 46;
      const cands = [
        { x: b.fx + px * (b.rx + pad), y: b.fy + py * (b.ry + pad) },
        { x: b.fx - px * (b.rx + pad), y: b.fy - py * (b.ry + pad) },
        { x: b.fx, y: b.fy - b.ry - pad },
        { x: b.fx, y: b.fy + b.ry + pad },
        { x: b.fx - b.rx - pad, y: b.fy },
        { x: b.fx + b.rx + pad, y: b.fy },
      ];
      let best = null, bestScore = 1e9;
      for (let i = 0; i < cands.length; i++) {
        const c = { x: this.clamp(cands[i].x), y: this.clampY(cands[i].y) };
        if (this.hitsBlocker(c.x, c.y)) continue;
        const score = Math.hypot(c.x - from.x, c.y - from.y) + Math.hypot(c.x - dest.x, c.y - dest.y) * 0.6;
        if (score < bestScore) { best = c; bestScore = score; }
      }
      if (!best) {
        best = this.pushOut(b.fx + px * (b.rx + pad + 8), b.fy + py * (b.ry + pad + 8));
      }
      return best;
    }

    smoothPath(pts) {
      if (!pts || pts.length <= 2) return (pts || []).slice(1);
      const out = [];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        for (; j > i + 1; j--) {
          if (!this.lineHits(pts[i].x, pts[i].y, pts[j].x, pts[j].y)) break;
        }
        out.push(pts[j]);
        i = j;
      }
      return out;
    }

    findGridPath(start, dest) {
      const step = 24;
      const snap = (v) => Math.round(v / step) * step;
      const w = walkBox();
      const ok = (x, y) => x >= w.x0 && x <= w.x1 && y >= w.y0 && y <= w.y1 && !this.hitsBlocker(x, y);
      const nudge = (x, y) => {
        if (ok(x, y)) return { x, y };
        for (let r = step; r <= step * 3; r += step) {
          const dirs = [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]];
          for (let i = 0; i < dirs.length; i++) {
            const nx = x + dirs[i][0], ny = y + dirs[i][1];
            if (ok(nx, ny)) return { x: nx, y: ny };
          }
        }
        const p = this.pushOut(x, y);
        return { x: snap(p.x), y: snap(p.y) };
      };
      const s = nudge(snap(start.x), snap(start.y));
      const d = nudge(snap(dest.x), snap(dest.y));
      const key = (x, y) => x + "," + y;
      const open = [{ x: s.x, y: s.y, g: 0, f: Math.hypot(d.x - s.x, d.y - s.y), from: null }];
      const bestG = {};
      bestG[key(s.x, s.y)] = 0;
      const dirs = [[step, 0], [-step, 0], [0, step], [0, -step], [step, step], [step, -step], [-step, step], [-step, -step]];
      const diag = step * Math.SQRT2;
      let found = null;
      for (let guard = 0; guard < 2200 && open.length; guard++) {
        let bi = 0;
        for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
        const cur = open.splice(bi, 1)[0];
        if (cur.x === d.x && cur.y === d.y) { found = cur; break; }
        for (let i = 0; i < dirs.length; i++) {
          const ox = dirs[i][0], oy = dirs[i][1];
          const nx = cur.x + ox, ny = cur.y + oy;
          if (!ok(nx, ny)) continue;
          if (ox && oy && (!ok(cur.x + ox, cur.y) || !ok(cur.x, cur.y + oy))) continue;
          const g = cur.g + ((ox && oy) ? diag : step);
          const id = key(nx, ny);
          if (bestG[id] != null && bestG[id] <= g) continue;
          bestG[id] = g;
          open.push({ x: nx, y: ny, g: g, f: g + Math.hypot(d.x - nx, d.y - ny), from: cur });
        }
      }
      if (!found) return null;
      const raw = [];
      for (let n = found; n; n = n.from) raw.push({ x: n.x, y: n.y });
      raw.reverse();
      if (raw.length && Math.hypot(raw[0].x - start.x, raw[0].y - start.y) < step * 0.75) raw.shift();
      raw.push({ x: dest.x, y: dest.y });
      return this.smoothPath([{ x: start.x, y: start.y }].concat(raw));
    }

    pathSegment(start, dest) {
      if (!this.lineHits(start.x, start.y, dest.x, dest.y)) return [dest];
      const found = this.findGridPath(start, dest);
      if (found && found.length) return found;
      const path = [];
      let cur = { x: start.x, y: start.y };
      for (let guard = 0; guard < 8; guard++) {
        const hit = this.lineHits(cur.x, cur.y, dest.x, dest.y);
        if (!hit) { path.push(dest); return path; }
        if (hit.id === "spa-rocks") break;
        const wp = this.aroundPoint(hit, cur, dest);
        if (Math.hypot(wp.x - cur.x, wp.y - cur.y) < 4) break;
        path.push(wp);
        cur = wp;
      }
      path.push(dest);
      return path;
    }

    shoreWaypoints() {
      const L = fieldLayout();
      if (!L || !L.pool) return null;
      const land = L.shoreLand || (L.beach && { x: L.beach.x, y: L.beach.y - 18 }) || { x: 508, y: 480 };
      const water = L.shoreWater || (L.beach && { x: L.beach.x, y: L.beach.y + 40 }) || { x: 508, y: 590 };
      return {
        land: this.pushOut(land.x, land.y),
        water: this.pushOut(water.x, water.y),
      };
    }

    buildPath(fx, fy) {
      const dest = this.pushOut(fx, fy);
      let start = this.toField(this.footX, this.footY);
      const path = [];
      if (this.hitsBlocker(start.x, start.y)) {
        start = this.pushOut(start.x, start.y);
        path.push(start);
      }
      const L = fieldLayout();
      if (L && L.pool && this.spaZone) {
        const zs = this.spaZone(start.x, start.y);
        const zd = this.spaZone(dest.x, dest.y);
        if (zs !== zd && zs !== "rock" && zd !== "rock") {
          const shore = this.shoreWaypoints();
          if (shore) {
            const first = (zs === "land") ? shore.land : shore.water;
            const second = (zs === "land") ? shore.water : shore.land;
            return path.concat(
              this.pathSegment(start, first),
              this.pathSegment(first, second),
              this.pathSegment(second, dest)
            );
          }
        }
      }
      if (!this.lineHits(start.x, start.y, dest.x, dest.y)) {
        path.push(dest);
        return path;
      }
      const found = this.findGridPath(start, dest);
      if (found && found.length) return path.concat(found);
      // Do not hug the rock ring with aroundPoint — go via the shore if the line hits it.
      const hit0 = this.lineHits(start.x, start.y, dest.x, dest.y);
      if (hit0 && hit0.id === "spa-rocks") {
        const shore = this.shoreWaypoints();
        if (shore) {
          const zs = this.spaZone(start.x, start.y);
          const first = (zs === "water") ? shore.water : shore.land;
          const second = (zs === "water") ? shore.land : shore.water;
          return path.concat(
            this.pathSegment(start, first),
            this.pathSegment(first, second),
            this.pathSegment(second, dest)
          );
        }
      }
      let cur = { x: start.x, y: start.y };
      for (let guard = 0; guard < 8; guard++) {
        const hit = this.lineHits(cur.x, cur.y, dest.x, dest.y);
        if (!hit) { path.push(dest); return path; }
        if (hit.id === "spa-rocks") break;
        const wp = this.aroundPoint(hit, cur, dest);
        if (Math.hypot(wp.x - cur.x, wp.y - cur.y) < 4) break;
        path.push(wp);
        cur = wp;
      }
      path.push(dest);
      return path;
    }

    nextWaypoint() {
      this._wpI = (this._wpI || 0) + 1;
      this._ghostLeg = false;
      this._legBest = null;
      if (this._waypoints && this._wpI < this._waypoints.length) {
        const n = this._waypoints[this._wpI];
        this.target = this.toWorld(n.x, n.y);
        this.setFacing(this.target.x - this.footX);
        return true;
      }
      return false;
    }

    arrive() {
      if (this.nextWaypoint()) return;
      this.target = null;
      this._waypoints = null;
      this._ghostLast = false;
      this._ghostLeg = false;
      this._legBest = null;
      this._exactEnd = null;
      this.resetWalkPose();
      const fn = this.onArrive;
      this.onArrive = null;
      if (fn) fn();
      else this.goIdle();
    }

    interruptNight() {
      this._wantNightSleep = false;
      if (this._bedWalk) {
        this.target = null;
        this.onArrive = null;
        this._bedWalk = false;
      }
      if (this.mode === "sleep") this.wakeGently();
    }
    wakeGently() {
      this.leaveNapSpot();
      this.stopZzz();
      this._nightSleep = false;
      this.mode = "idle";
      this.showAnim("idle");
      this.layoutWear();
      updateMood();
    }
    startNightSleep() {
      if (busy || this.mode === "sleep") return;
      if (!window.MyPetWorld || !MyPetWorld.isNight()) return;
      this._wantNightSleep = false;
      this._bedWalk = true;
      const s = fieldSpots().bed;
      if (!s) return;
      this.walkTo(s.stand.x, s.stand.y, () => {
        this._bedWalk = false;
        if (busy || !MyPetWorld.isNight()) { this.goIdle(); return; }
        const dest = this.napDest(s);
        this.tweens.add({
          targets: this.sheep, x: dest.x, y: dest.y, duration: 400,
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            if (busy || !MyPetWorld.isNight()) { this.goIdle(); return; }
            this.mode = "sleep";
            this._nightSleep = true;
            this.sheep.angle = 0;
            this.showNapPose(s);
            this.layoutWear();
            this.startZzz();
            updateMood();
          },
        });
      }, { exact: true });
    }
    startZzz() {
      this.stopZzz();
      const puff = () => {
        if (!this.sheep || this.mode !== "sleep") return;
        this.floatSprite("zzz", this.sheep.x + 16 + Math.random() * 18, this.sheep.y - 82 - Math.random() * 18, 1600);
      };
      puff();
      this._zzzEv = this.time.addEvent({ delay: 1700, loop: true, callback: puff });
    }
    stopZzz() {
      if (this._zzzEv) { this._zzzEv.remove(false); this._zzzEv = null; }
    }
    placeCareItems() {
      if (this.careItems) this.careItems.forEach((s) => s.destroy());
      this.careItems = [];
      // Meadow art is the composite field (trough, basin, bed already painted).
      // Do not overlay item sprites — they would double-draw on live Pages.
      this.rebuildBlockers();
    }
    placeHomeDecor() {
      if (this.homeDecor) this.homeDecor.forEach((s) => s.destroy());
      this.homeDecor = [];
      this.rebuildBlockers();
    }
        clearMood() {
      if (this.moodItem) {
        this.moodItem.destroy();
        this.moodItem = null;
      }
    }
    tickMood() {
      this.clearMood();
      const sp = currentSpecies();
      if (!sp || !sp.moods || sp.moods.indexOf("yuzu") < 0) return;
      if (this.mode !== "idle") return;
      if (Math.random() < 0.35) return;
      const kind = Math.random() < 0.5 ? "yuzu" : "orange";
      if (!this.textures.exists(kind)) return;
      this.moodItem = this.add.image(this.sheep.x, this.sheep.y, kind)
        .setOrigin(0.5, 1)
        .setScale(this.fScale);
      this.layoutWear();
    }
    setFieldTheme(id, arrive) {
      const changed = this._fieldId !== id;
      this._fieldId = id;
      const key = "field_" + id;
      if (this.textures.exists(key) && this.field) this.field.setTexture(key);
      this.applyFieldLayout();
      if (this.sheep && this.place && (arrive || changed)) {
        const L = fieldLayout();
        const pt = arrive || (L && L.start) || { x: 512, y: 560 };
        const w = this.toWorld(pt.x, pt.y);
        this.place(w.x, w.y);
        this.sheep.angle = 0;
        if (this.goIdle) this.goIdle();
      }
    }

    applyFieldLayout() {
      const L = fieldLayout();
      const showPark = !!(L && L.park);
      if (this.parkSprites) {
        Object.keys(this.parkSprites).forEach((k) => {
          const spr = this.parkSprites[k];
          if (spr && spr.setVisible) spr.setVisible(showPark);
        });
      }
      this.placeOranges();
      this.placeFronts();
      this.rebuildBlockers();
      this._wasInPool = this.inPoolFeet && this.inPoolFeet();
      if (!this._wasInPool) this.dropOranges(true);
      this.syncLocomotion && this.syncLocomotion();
      if (this.placeFoxGate) this.placeFoxGate();
      if (this.placeSeesaw) this.placeSeesaw();
      if (this.startFallingLeaves) this.startFallingLeaves();
      if (this._hintField !== currentFieldId()) {
        this._hintField = currentFieldId();
        if (this.showFieldHint) this.showFieldHint();
      }
    }

    placeFoxGate() {
      if (this.foxGate) { this.foxGate.destroy(); this.foxGate = null; }
      const sp = currentSpecies();
      const show = false; // fox lives only in Autumn Den; meadow gate overlay retired
      if (!show) return;
      this.foxGate = this.add.image(this.fieldX, this.fieldY, "meadow_fox_gate")
        .setOrigin(0, 0).setScale(this.fScale).setDepth(4);
    }

    placeSeesaw() {
      if (this.seesaw) { this.seesaw.destroy(); this.seesaw = null; }
      if (this.seesawPad) { this.seesawPad.destroy(); this.seesawPad = null; }
      const L = fieldLayout();
      const sw = L && L.seesaw;
      if (!sw || !this.textures.exists("prop_seesaw")) return;
      const pos = this.toWorld(sw.x, sw.y);
      const s = this.fScale || 1;
      const ox = sw.originX != null ? sw.originX : 0.5;
      const oy = sw.originY != null ? sw.originY : 0.5;
      const depth = (pos.y || 0) + 1;
      if (this.textures.exists("prop_seesaw_pad")) {
        this.seesawPad = this.add.image(pos.x, pos.y, "prop_seesaw_pad")
          .setOrigin(ox, oy).setScale(s).setDepth(depth - 1);
      }
      this.seesaw = this.add.image(pos.x, pos.y, "prop_seesaw")
        .setOrigin(ox, oy).setScale(s).setDepth(depth);
      this.seesaw.angle = 0;
    }

    playSeesaw() {
      const L = fieldLayout();
      const sw = L && L.seesaw;
      if (!sw) return;
      if (busy) return;
      busy = true;
      this.interruptNight();
      const stand = sw.stand || { x: sw.x, y: sw.y - 80 };
      const sit = sw.sit || { x: sw.x - 70, y: sw.y - 50 };
      this.walkTo(stand.x, stand.y, () => {
        this.mode = "hop";
        this._hopping = true;
        this.showAnim("happy");
        const on = this.toWorld(sit.x, sit.y);
        this.setFacing(on.x - (this.footX != null ? this.footX : this.sheep.x));
        this.tweens.add({
          targets: this.sheep, x: on.x, y: on.y, duration: 300, ease: "Quad.easeOut",
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            if (!this._hopping) return;
            const spr = this.seesaw;
            const tip = sw.tip || 16;
            const dip = 14 * (this.fScale || 1);
            if (spr) {
              this.tweens.add({
                targets: spr, angle: tip, duration: 380, ease: "Quad.easeIn",
                yoyo: true, hold: 120,
                onComplete: () => {
                  if (!spr.active) return;
                  this.tweens.add({
                    targets: spr, angle: -tip, duration: 480, ease: "Sine.easeInOut",
                    yoyo: true,
                    onComplete: () => { if (spr && spr.active) spr.angle = 0; },
                  });
                },
              });
            }
            this.tweens.add({
              targets: this.sheep, y: on.y + dip, duration: 380, ease: "Quad.easeIn",
              yoyo: true, hold: 120,
              onUpdate: () => this.layoutWear(),
              onComplete: () => {
                if (!this._hopping) return;
                this.tweens.add({
                  targets: this.sheep, y: on.y - dip, duration: 480, ease: "Sine.easeInOut",
                  yoyo: true,
                  onUpdate: () => this.layoutWear(),
                  onComplete: () => {
                    if (!this._hopping) return;
                    const land = this.toWorld(stand.x, stand.y);
                    this.tweens.add({
                      targets: this.sheep, x: land.x, y: land.y, duration: 280, ease: "Quad.easeIn",
                      onUpdate: () => this.layoutWear(),
                      onComplete: () => {
                        this.sheep.angle = 0;
                        this.place(land.x, land.y);
                        this._hopping = false;
                        if (this.seesaw) this.seesaw.angle = 0;
                        this.finishPlay("See-saw! 🪵");
                      },
                    });
                  },
                });
              },
            });
          },
        });
      });
    }

    inAutumnStream(fx, fy) {
      const L = fieldLayout();
      if (!L || !L.stream) return null;
      for (let i = 0; i < L.stream.length; i++) {
        const s = L.stream[i];
        const nx = (fx - s.cx) / s.rx, ny = (fy - s.cy) / s.ry;
        if (nx * nx + ny * ny <= 1) return s;
      }
      return null;
    }
    onSteppingStone(fx, fy) {
      const L = fieldLayout();
      if (!L || !L.stones) return false;
      for (let i = 0; i < L.stones.length; i++) {
        const s = L.stones[i];
        if (Math.hypot(fx - s.x, fy - s.y) <= (s.r || 16)) return true;
      }
      return false;
    }

    showFieldHint() {
      if (this._hintTimer) { this._hintTimer.remove(false); this._hintTimer = null; }
      if (this.hint && this.hint.destroy) { this.hint.destroy(); this.hint = null; }
      const hintFid = currentFieldId();
      const HINTS = {
        capy_spa: "Tap the reeds, the bed, or a floating orange",
        autumn_den: "Tap the berry bush, the den, the stream, or a leaf pile",
        pebble_yard: "Tap the sun rock, the pond, the moss, or the seesaw",
        crystal_spring: "Tap the crystal rock, the spring, the cushion, or the perch",
        plank_fort: "Tap the flower-pot nest, the pond, or the tunnels",
        charm_nest: "Tap the stone nest, the birdbath, the stump, or the tree",
        lily_pond: "Tap the straw hut, the lily pond, the trough, or the slide",
        fox_hollow: "Tap the hollow log, the stream, the bowl, or the burrow",
        root_cave: "Tap the root cave, the pond, the bug patch, or the log",
        puppy_yard: "Tap the doghouse, the pool, the bowls, or the ball",
        cat_garden: "Tap the basket, the bowls, the yarn, or the scratch post",
        orange_pond: "Tap the woven bed, the pond, the oranges, or the cattails",
        carrot_yard: "Tap the hay nest, the carrot trough, the tub, or the slide",
      };
      const hintMsg = HINTS[hintFid] || "Tap the food, water, bed, or a flower";
      const scale = this.fScale || 1;
      this.hint = this.add.text(W / 2, this.fieldY + 28 * scale, hintMsg, {
        fontFamily: "Lexend, sans-serif", fontSize: "16px", fontStyle: "600", color: "#4a3426",
        backgroundColor: "#fffaf3cc", padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 0).setDepth(20);
      this._hintTimer = this.time.delayedCall(5000, () => { if (this.hint) { this.hint.destroy(); this.hint = null; } this._hintTimer = null; });
    }
    startFallingLeaves() {
      this.stopFallingLeaves();
      const L = fieldLayout();
      if (!L || !L.fallingLeaves) return;
      this.leaves = [];
      for (let i = 0; i < 16; i++) this.leaves.push(this.spawnLeaf(true));
    }
    stopFallingLeaves() {
      (this.leaves || []).forEach((d) => { if (d && d.destroy) d.destroy(); });
      this.leaves = [];
    }
    spawnLeaf(randomY) {
      const s = this.fScale;
      const key = this.textures.exists("wx_leaf") ? "wx_leaf" : (this.textures.exists("wx_flake") ? "wx_flake" : "sparkle");
      const p = this.toWorld(140 + Math.random() * 740, randomY ? (160 + Math.random() * 700) : 120);
      const tints = [0xc86428, 0xdcc64a, 0xb43c28, 0xe6a03c, 0x8c5028];
      const d = this.add.image(p.x, p.y, key).setScale(s * (2.4 + Math.random() * 1.2)).setDepth(8011).setAlpha(0.95);
      if (d.setTint) d.setTint(tints[Math.floor(Math.random() * tints.length)]);
      d._vy = (0.025 + Math.random() * 0.03) * s;
      d._vx = (Math.random() - 0.5) * 0.04 * s;
      d._w = Math.random() * Math.PI * 2;
      d._spin = (Math.random() - 0.5) * 0.04;
      return d;
    }
    tickLeaves(dt) {
      if (!this.leaves || !this.leaves.length) return;
      const s = this.fScale;
      const top = this.fieldY + 80 * s;
      const bot = this.fieldY + 940 * s;
      const left = this.fieldX + 80 * s;
      const right = this.fieldX + 944 * s;
      for (let i = 0; i < this.leaves.length; i++) {
        const d = this.leaves[i];
        if (!d || !d.active) { this.leaves[i] = this.spawnLeaf(false); continue; }
        d._w += dt * 0.0015;
        d.y += d._vy * dt;
        d.x += d._vx * dt + Math.sin(d._w) * 0.05 * s * dt * 0.05;
        d.angle = (d.angle || 0) + (d._spin || 0) * dt;
        if (d.y > bot) { d.x = left + Math.random() * (right - left); d.y = top; }
      }
    }
    puffLeaves(wx, wy) {
      const s = this.fScale || 1;
      const key = this.textures.exists("wx_leaf") ? "wx_leaf" : "sparkle";
      const tints = [0xc86428, 0xdcc64a, 0xb43c28, 0xe6a03c];
      for (let i = 0; i < 8; i++) {
        const lf = this.add.image(wx, wy, key).setScale(s * 2.2).setDepth(9000);
        if (lf.setTint) lf.setTint(tints[i % tints.length]);
        this.tweens.add({
          targets: lf,
          x: wx + (Math.random() - 0.5) * 80 * s,
          y: wy - (20 + Math.random() * 50) * s,
          angle: (Math.random() - 0.5) * 180,
          alpha: 0,
          duration: 700 + Math.random() * 200,
          onComplete: () => lf.destroy(),
        });
      }
    }
    currentPathGate() {
      const L = fieldLayout();
      if (L && L.pathGate) return L.pathGate;
      return null;
    }
    tryPathGate(f) {
      const gate = this.currentPathGate();
      if (!gate) return false;
      if (Math.hypot(f.x - gate.x, f.y - gate.y) > gate.r) return false;
      this.usePathGate(gate);
      return true;
    }
    usePathGate(gate) {
      if (busy) return;
      busy = true;
      this.interruptNight();
      this.walkTo(gate.stand.x, gate.stand.y, () => {
        const dest = gate.to;
        toast(dest === "autumn_den" ? "Autumn Den 🍂" : "Back to the meadow 🌿");
        setFieldTheme(dest, false, gate.arrive);
        busy = false;
      });
    }
    playLeafPounce(pile) {
      if (!pile) return;
      this.interruptNight();
      if (busy) return;
      busy = true;
      const stand = pile.stand || { x: pile.x, y: pile.y + 50 };
      this.walkTo(stand.x, stand.y, () => {
        this.mode = "hop";
        this._hopping = true;
        this.showAnim("happy");
        const mid = this.toWorld(pile.x, pile.y - 40);
        const land = this.toWorld(pile.x + 36, pile.y + 8);
        this.setFacing(land.x - (this.footX != null ? this.footX : this.sheep.x));
        this.tweens.add({
          targets: this.sheep, x: mid.x, y: mid.y, duration: 280, ease: "Quad.easeOut",
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            if (!this._hopping) return;
            this.puffLeaves(mid.x, mid.y);
            this.tweens.add({
              targets: this.sheep,
              x: land.x, y: land.y, angle: (this.sheep.angle || 0) + 360,
              duration: 520, ease: "Quad.easeIn",
              onUpdate: () => this.layoutWear(),
              onComplete: () => {
                if (!this._hopping) return;
                this.sheep.angle = 0;
                this.place(land.x, land.y);
                this._hopping = false;
                this.puffLeaves(land.x, land.y);
                this.finishPlay("Pounce! 🍂");
              },
            });
          },
        });
      });
    }

    placeOranges() {
      (this.oranges || []).forEach((o) => { if (o && o.destroy) o.destroy(); });
      this.oranges = [];
      const L = fieldLayout();
      if (!L || !L.oranges || !this.textures.exists("orange")) return;
      const s = this.fScale || 1;
      L.oranges.forEach((h, i) => {
        const p = this.toWorld(h.x, h.y);
        const spr = this.add.image(p.x, p.y, "orange").setScale(s * 2.6).setDepth(p.y + 2);
        spr._home = { x: h.x, y: h.y };
        spr._carried = false;
        spr._phase = i * 1.15;
        spr._bob0 = p.y;
        this.oranges.push(spr);
      });
    }

    tickOranges() {
      const s = this.fScale || 1;
      (this.oranges || []).forEach((o) => {
        if (!o || !o.active || o._carried || o._returning) return;
        o.y = o._bob0 + Math.sin(this.time.now / 900 + o._phase) * 5 * s;
      });
      this.layoutCarriedOranges();
    }

    layoutCarriedOranges() {
      if (!this.sheep) return;
      const s = this.fScale || 1;
      const face = this.sheep.flipX ? -1 : 1;
      const carried = (this.oranges || []).filter((o) => o && o._carried);
      const swimming = !!(this.hasSwim && this.hasSwim() && this.inPoolFeet && this.inPoolFeet());
      carried.forEach((o, i) => {
        // On the swim sprite the back ridge is toward the rear (right when facing left).
        const ox = swimming ? (20 + i * 12) : (-20 - i * 12);
        const oy = swimming ? (72 + (i % 2) * 8) : (42 + (i % 2) * 8);
        o.x = this.sheep.x + face * ox * s;
        o.y = this.sheep.y - oy * s;
        o.setDepth((this.footY != null ? this.footY : this.sheep.y) + 4);
        o.setFlipX(!!this.sheep.flipX);
      });
    }

    tryOrangeTap(f, pointer) {
      const list = this.oranges || [];
      if (!list.length) return false;
      let best = null, bestD = 42;
      list.forEach((o) => {
        if (!o || !o.active || o._carried || o._returning) return;
        const of = this.toField(o.x, o.y);
        const d = Math.hypot(f.x - of.x, f.y - of.y);
        if (d < bestD) { bestD = d; best = o; }
      });
      if (!best) return false;
      this.collectOrange(best);
      return true;
    }

    collectOrange(o) {
      if (!o || o._carried || busy) return;
      const of = this.toField(o.x, o.y);
      const feet = (this.footX != null) ? this.toField(this.footX, this.footY) : of;
      const go = () => this.hopOrangeOn(o);
      if (Math.hypot(feet.x - of.x, feet.y - of.y) < 55) go();
      else {
        busy = true;
        this.interruptNight();
        this.walkTo(of.x, of.y, () => { busy = false; go(); });
      }
    }

    hopOrangeOn(o) {
      if (!o || o._carried) return;
      const s = this.fScale || 1;
      this.tweens.killTweensOf(o);
      o._returning = false;
      const destX = this.sheep.x;
      const destY = this.sheep.y - 48 * s;
      this.tweens.add({
        targets: o,
        x: destX,
        y: destY - 18 * s,
        duration: 180,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: o, x: destX, y: destY, duration: 140,
            onComplete: () => {
              o._carried = true;
              this.layoutCarriedOranges();
              blip("coin");
              toast("🍊");
            },
          });
        },
      });
    }

    dropOranges(instant) {
      const s = this.fScale || 1;
      (this.oranges || []).forEach((o) => {
        if (!o || !o.active || !o._carried) return;
        o._carried = false;
        o._returning = true;
        this.tweens.killTweensOf(o);
        const dest = this.toWorld(o._home.x, o._home.y);
        const land = () => {
          o.x = dest.x; o.y = dest.y;
          o._bob0 = dest.y;
          o._returning = false;
          o.setDepth(dest.y + 2);
          o.setFlipX(false);
        };
        if (instant) { land(); return; }
        this.tweens.add({
          targets: o,
          x: (o.x + dest.x) / 2,
          y: Math.min(o.y, dest.y) - 40 * s,
          duration: 220,
          ease: "Sine.easeOut",
          onComplete: () => {
            this.tweens.add({
              targets: o, x: dest.x, y: dest.y, duration: 280, ease: "Sine.easeIn",
              onComplete: land,
            });
          },
        });
      });
    }
    applyWorld(force) {
      if (!window.MyPetWorld) return;
      const cycle = MyPetWorld.nowCycle();
      applySky(cycle);
      if (this.skyTint) {
        this.skyTint.setFillStyle(cycle.tint, cycle.tintAlpha);
        this.skyTint.setVisible(cycle.tintAlpha > 0.01);
      }
      if (force || cycle.phase !== this._phase) {
        this._phase = cycle.phase;
        this.rebuildStars(cycle.phase === "night");
        if (cycle.phase !== "night" && this._nightSleep && this.mode === "sleep" && !busy) {
          this.wakeGently();
          this.goIdle();
        }
      }
      if (force || cycle.weather !== this._wx) {
        this._wx = cycle.weather;
        this.rebuildWeather(cycle.weather);
      }
      if (cycle.phase === "night" && this.mode === "idle" && !busy && !this._wantNightSleep && !this.target) {
        this._wantNightSleep = true;
        this.idleAt = Math.min(this.idleAt || 0, this.time.now + 2000);
      }
    }
    rebuildStars(on) {
      (this.stars || []).forEach((s) => { if (s && s.destroy) s.destroy(); });
      this.stars = [];
      if (!on) return;
      const s = this.fScale;
      const rng = (n) => {
        let x = Math.sin(n * 127.1 + 311.7) * 43758.5;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 26; i++) {
        const u = rng(i + 1), v = rng(i + 17);
        // Place in the margins around the fence, including the transparent field border.
        let fx, fy;
        const band = u < 0.5;
        if (v < 0.25) { fx = 20 + u * 980; fy = 10 + band * 50; }
        else if (v < 0.5) { fx = 20 + u * 980; fy = 960 + band * 50; }
        else if (v < 0.75) { fx = 8 + band * 40; fy = 80 + u * 860; }
        else { fx = 976 + band * 40; fy = 80 + u * 860; }
        const p = this.toWorld(fx, fy);
        const sz = (rng(i + 31) < 0.7 ? 2 : 3) * (s / 0.65);
        const st = this.add.rectangle(p.x, p.y, sz, sz, 0xfff6d0, 0.7 + rng(i + 9) * 0.3).setDepth(2);
        this.tweens.add({
          targets: st, alpha: 0.25, duration: 800 + rng(i + 4) * 1400,
          yoyo: true, repeat: -1, delay: rng(i + 21) * 800,
        });
        this.stars.push(st);
      }
    }
    rebuildWeather(kind) {
      (this.drops || []).forEach((d) => { if (d && d.destroy) d.destroy(); });
      (this.flakes || []).forEach((d) => { if (d && d.destroy) d.destroy(); });
      this.drops = []; this.flakes = []; this.ripples = [];
      if (this.wxGfx) this.wxGfx.clear();
      if (this.rainbow) this.rainbow.clear();
      this.clearRainbowFx();
      const s = this.fScale;
      if (kind === "rainbow") this.drawRainbow();
      if (kind === "rain") {
        for (let i = 0; i < 26; i++) this.drops.push(this.spawnDrop(true));
      }
      if (kind === "snow") {
        for (let i = 0; i < 22; i++) this.flakes.push(this.spawnFlake(true));
      }
    }
    clearRainbowFx() {
      (this.rbSparks || []).forEach((sp) => { if (sp && sp.destroy) sp.destroy(); });
      this.rbSparks = [];
      this._rbEnds = [];
      this._rbId = null;
    }

    drawRainbow() {
      if (!this.rainbow) return;
      this.rainbow.clear();
      this.clearRainbowFx();
      const s = this.fScale;
      // Arc sits in the canvas sky, ends on the top of the fence — not in the grass
      // (fence begins ~fy 123, grass ~fy 178).
      const fenceY = this.fieldY + 130 * s;
      const peakY = 78;
      const height = Math.max(90, fenceY - peakY);
      const r = height / 0.658;
      const cx = this.fieldX + FIELD * s * 0.5;
      const cy = peakY + r;
      const startA = Phaser.Math.DegToRad(200);
      const endA = Phaser.Math.DegToRad(340);
      const cols = [0xe45a5a, 0xf0a028, 0xf0d848, 0x5aaa5a, 0x5a8ad0];
      const lw = Math.max(5, 8 * s);
      cols.forEach((c, i) => {
        this.rainbow.lineStyle(lw, c, 0.88);
        this.rainbow.beginPath();
        this.rainbow.arc(cx, cy, Math.max(8, r - i * (lw + 1)), startA, endA, false);
        this.rainbow.strokePath();
      });
      this.rainbow.setDepth(6);
      const rEnd = r - 2 * (lw + 1);
      this._rbEnds = [startA, endA].map((a) => ({
        x: cx + rEnd * Math.cos(a),
        y: cy + rEnd * Math.sin(a),
      }));
      this._rbPeak = { x: cx, y: peakY };
      this._rbId = (window.MyPetWorld && MyPetWorld.rainbowId) ? MyPetWorld.rainbowId() : null;
      this.spawnRainbowSparkles();
    }

    spawnRainbowSparkles() {
      const s = this.fScale;
      const key = this.textures.exists("sparkle") ? "sparkle" : "heart";
      this.rbSparks = [];
      (this._rbEnds || []).forEach((e, i) => {
        const sp = this.add.image(e.x, e.y, key).setScale(s * 2.5).setDepth(7).setAlpha(0.95);
        this.tweens.add({
          targets: sp, alpha: 0.35, scale: s * 1.7,
          duration: 420 + i * 90, yoyo: true, repeat: -1,
        });
        const sp2 = this.add.image(e.x + (i ? 10 : -10) * s, e.y - 12 * s, key)
          .setScale(s * 1.6).setDepth(7).setAlpha(0.75);
        this.tweens.add({
          targets: sp2, alpha: 0.15, y: e.y - 20 * s, scale: s * 1.15,
          duration: 560, yoyo: true, repeat: -1, delay: 100,
        });
        this.rbSparks.push(sp, sp2);
      });
    }

    rainbowEndAt(wx, wy) {
      const ends = this._rbEnds || [];
      const hit = 46 * (this.fScale || 1);
      for (let i = 0; i < ends.length; i++) {
        if (Math.hypot(wx - ends[i].x, wy - ends[i].y) <= hit) return { i: i, end: ends[i] };
      }
      return null;
    }

    popRainbowCoin(wx, wy) {
      const s = this.fScale || 1;
      const t = this.add.text(wx, wy - 8, "🪙 +5", {
        fontFamily: "Lexend, sans-serif",
        fontSize: Math.round(22 * (s / 0.65)) + "px",
        fontStyle: "600",
        color: "#5a3a1a",
        stroke: "#fffaf3",
        strokeThickness: 4,
      }).setOrigin(0.5, 1).setDepth(9000);
      this.tweens.add({
        targets: t, y: wy - 56, alpha: 0, duration: 720, ease: "Quad.easeOut",
        onComplete: () => t.destroy(),
      });
    }

    tryRainbowTap(wx, wy) {
      const hit = this.rainbowEndAt(wx, wy);
      if (!hit) return false;
      const id = this._rbId;
      if (isRainbowPaid(id)) {
        if (this.sparkleAt) this.sparkleAt(hit.end.x, hit.end.y);
        return true;
      }
      state.coins = (typeof state.coins === "number" ? state.coins : 0) + 5;
      markRainbowPaid(id);
      this.popRainbowCoin(hit.end.x, hit.end.y);
      toast("+5 coins 🪙");
      if (typeof blip === "function") blip("coin");
      renderHud();
      return true;
    }
    spawnDrop(randomY) {
      const s = this.fScale;
      const key = this.textures.exists("wx_drop") ? "wx_drop" : "sparkle";
      const p = this.toWorld(140 + Math.random() * 740, randomY ? (160 + Math.random() * 700) : 120);
      const d = this.add.image(p.x, p.y, key).setScale(s * 2.8).setDepth(8012).setAlpha(0.95);
      d._vy = (0.22 + Math.random() * 0.12) * s;
      return d;
    }
    spawnFlake(randomY) {
      const s = this.fScale;
      const key = this.textures.exists("wx_flake") ? "wx_flake" : "sparkle";
      const p = this.toWorld(140 + Math.random() * 740, randomY ? (160 + Math.random() * 700) : 120);
      const d = this.add.image(p.x, p.y, key).setScale(s * (2.2 + Math.random() * 0.8)).setDepth(8012).setAlpha(0.98);
      d._vy = (0.05 + Math.random() * 0.05) * s;
      d._vx = (Math.random() - 0.5) * 0.06 * s;
      d._w = Math.random() * Math.PI * 2;
      return d;
    }
    tickWeather(dt) {
      const s = this.fScale;
      const top = this.fieldY + 80 * s;
      const bot = this.fieldY + 940 * s;
      const left = this.fieldX + 80 * s;
      const right = this.fieldX + 944 * s;
      if (this._wx === "rain") {
        for (let i = 0; i < this.drops.length; i++) {
          const d = this.drops[i];
          if (!d || !d.active) { this.drops[i] = this.spawnDrop(false); continue; }
          d.y += d._vy * dt;
          if (d.y > bot) {
            if (Math.random() < 0.22) this.addRipple(d.x, bot - 20 * s);
            d.x = left + Math.random() * (right - left);
            d.y = top;
          }
        }
      }
      if (this._wx === "snow") {
        for (let i = 0; i < this.flakes.length; i++) {
          const d = this.flakes[i];
          if (!d || !d.active) { this.flakes[i] = this.spawnFlake(false); continue; }
          d._w += dt * 0.002;
          d.y += d._vy * dt;
          d.x += d._vx * dt + Math.sin(d._w) * 0.04 * s * dt * 0.05;
          if (d.y > bot) { d.x = left + Math.random() * (right - left); d.y = top; }
        }
      }
      if (this.ripples && this.ripples.length && this.wxGfx) {
        this.wxGfx.clear();
        const next = [];
        for (const r of this.ripples) {
          r.r += dt * 0.025 * s;
          r.a -= dt * 0.0008;
          if (r.a <= 0) continue;
          this.wxGfx.lineStyle(2, 0x7eb7d8, Math.min(0.85, r.a + 0.15));
          this.wxGfx.strokeCircle(r.x, r.y, r.r);
          next.push(r);
        }
        this.ripples = next;
      }
    }
    addRipple(x, y) {
      if (this.ripples.length >= 5) this.ripples.shift();
      this.ripples.push({ x, y, r: 3, a: 0.55 });
    }
    goIdle() {
      this.leaveNapSpot();
      this.mode = "idle";
      this.resetWalkPose();
      this.showAnim((this.hasSwim && this.hasSwim() && this.inPoolFeet()) ? "swim" : "idle");
      this.blanket.setVisible(false);
      this.stopZzz();
      this._nightSleep = false;
      if (window.MyPetWorld && MyPetWorld.isNight()) {
        this._wantNightSleep = true;
        this.idleAt = this.time.now + 7000 + Math.random() * 5000;
      } else {
        this._wantNightSleep = false;
        this.idleAt = this.time.now + 7000 + Math.random() * 6000;
      }
      this.layoutWear();
      if (!(this.inPoolFeet && this.inPoolFeet())) this.tickMood();
      this.syncLocomotion && this.syncLocomotion();
      updateMood();
    }

    onTap(pointer) {
      if ($("looks").classList.contains("hidden") === false) return;
      if ($("friend").classList.contains("hidden") === false) return;
      if ($("bath") && $("bath").classList.contains("hidden") === false) return;
      if ($("brush") && $("brush").classList.contains("hidden") === false) return;
      if (this.tryRainbowTap(pointer.worldX, pointer.worldY)) return;
      const f = this.toField(pointer.worldX, pointer.worldY);
      const L0 = fieldLayout();
      if (L0 && L0.park) {
        const onHay = Math.hypot(f.x - PARK.hay.x, f.y - PARK.hay.y) <= PARK.hay.r;
        const feet = (this.footX != null) ? this.toField(this.footX, this.footY) : f;
        const sheepOnHay = Math.hypot(feet.x - PARK.hay.x, feet.y - PARK.hay.y) <= PARK.hay.r + 24;
        if (onHay || (this.overSheep(pointer) && (sheepOnHay || this._hopping))) {
          this.interruptNight();
          this.playPark("hop");
          return;
        }
      }
      if (busy) return;
      if (this.mode === "sleep") {
        const bed = fieldSpots().bed;
        const onBed = !!(bed && Math.hypot(f.x - bed.x, f.y - bed.y) <= bed.r);
        if (onBed && !this.overSheep(pointer)) {
          this.floatSprite("zzz", this.sheep.x + 20, this.sheep.y - 86, 1400);
          return;
        }
        this.interruptNight();
      } else if (this._wantNightSleep || this._bedWalk) {
        this.interruptNight();
      }
      if (brushMode) {
        if (this.overSheep(pointer)) this.sparkleAt(pointer.worldX, pointer.worldY);
        return;
      }
      // pet the sheep
      if (this.overSheep(pointer)) {
        this.petSheep();
        return;
      }
      if (this.tryOrangeTap(f, pointer)) return;
      for (const [id, s] of Object.entries(fieldSpots())) {
        if (!s) continue;
        const d = Math.hypot(f.x - s.x, f.y - s.y);
        if (d <= s.r) { this.useSpot(id, s); return; }
      }
      const Lp = fieldLayout();
      if (Lp && Lp.plays) {
        for (let i = 0; i < Lp.plays.length; i++) {
          const pl = Lp.plays[i];
          if (Math.hypot(f.x - pl.x, f.y - pl.y) <= pl.r) { this.usePlay(pl); return; }
        }
      }
      if (this.tryPathGate && this.tryPathGate(f)) return;
      const Ltap = fieldLayout();
      if (Ltap && Ltap.leafPiles) {
        for (let i = 0; i < Ltap.leafPiles.length; i++) {
          const pile = Ltap.leafPiles[i];
          if (Math.hypot(f.x - pile.x, f.y - pile.y) <= pile.r) { this.playLeafPounce(pile); return; }
        }
      }
      if (Ltap && Ltap.seesaw) {
        const sw = Ltap.seesaw;
        if (Math.hypot(f.x - sw.x, f.y - 748) <= (sw.r || 110)) {
          this.playSeesaw();
          return;
        }
      }
      if (Ltap && Ltap.park) {
        for (const [id, s] of Object.entries(PARK)) {
          if (Math.hypot(f.x - s.x, f.y - s.y) <= s.r) { this.playPark(s.kind); return; }
        }
      }
      const flowers = (Ltap && Ltap.park) ? FLOWERS : (Ltap && Ltap.pool ? FLOWERS.filter((fl) => fl.y < 520) : []);
      for (const fl of flowers) {
        if (Math.hypot(f.x - fl.x, f.y - fl.y) < 36) { this.giftFlower(fl); return; }
      }
    }

    overSheep(pointer) {
      const b = this.sheep.getBounds();
      return Phaser.Geom.Rectangle.Contains(b, pointer.worldX, pointer.worldY);
    }

    onMove(pointer) {
      if (!brushMode || !pointer.isDown) return;
      if (this.overSheep(pointer)) this.sparkleAt(pointer.worldX, pointer.worldY);
    }

    useSpot(id, s) {
      if (busy) return;
      busy = true;
      this.walkTo(s.stand.x, s.stand.y, () => {
        if (id === "trough" || id === "basin") {
          if (s.face) this._faceRight = s.face === "right";
          else this.faceSpot(s);
        }
        if (id === "trough") this.doEat();
        else if (id === "basin") this.doDrink();
        else if (id === "bed") this.doNap(s);
      }, { exact: true, via: s.via });
    }

    // v33: turn toward the bowl before eating/drinking (not the last walk direction).
    faceSpot(s) {
      if (!s || !this.sheep) return;
      const at = this.toField(this.footX != null ? this.footX : this.sheep.x, this.footY != null ? this.footY : this.sheep.y);
      const dx = s.x - at.x;
      if (Math.abs(dx) >= 12) this._faceRight = dx > 0;
    }

    doEat() {
      this.mode = "eat";
      this.showAnim("eat");
      blip("eat");
      this.tweens.add({
        targets: this.sheep, y: this.sheep.y + 4, yoyo: true, duration: 180, repeat: 4,
        onUpdate: () => this.layoutWear(),
        onComplete: () => {
          doCare("eat").catch(() => {});
          toast(currentFieldId() === "autumn_den" ? "Yum 🫐" : (currentFieldId() === "pebble_yard" ? "Yum 🌿" : "Yum 🥕"));
          this.goIdle();
          busy = false;
        },
      });
    }

    doDrink() {
      this.mode = "drink";
      this.showAnim("drink");
      blip("eat");
      this.tweens.add({
        targets: this.sheep, y: this.sheep.y + 5, yoyo: true, duration: 200, repeat: 3,
        onUpdate: () => this.layoutWear(),
        onComplete: () => {
          doCare("drink").catch(() => {});
          toast("Sip sip 💧");
          this.goIdle();
          busy = false;
        },
      });
    }

    doNap(s) {
      const dest = this.napDest(s);
      this.tweens.add({
        targets: this.sheep, x: dest.x, y: dest.y, duration: 400,
        onUpdate: () => this.layoutWear(),
        onComplete: () => {
          this.mode = "sleep";
          this.sheep.angle = 0;
          this.showNapPose(s);
          this.blanket.setVisible(false);
          this.layoutWear();
          this.floatSprite("zzz", this.sheep.x + 28, this.sheep.y - 90, 1600);
          this.time.delayedCall(900, () => this.floatSprite("zzz", this.sheep.x + 10, this.sheep.y - 100, 1600));
          this.time.delayedCall(1800, () => this.floatSprite("zzz", this.sheep.x + 32, this.sheep.y - 86, 1400));
          blip("nap");
          toast(currentFieldId() === "pebble_yard" ? "Sunny nap ☀️" : "Night night 😴");
          doCare("nap").catch(() => {});
          const stay = !!(window.MyPetWorld && MyPetWorld.isNight());
          if (stay) {
            this._nightSleep = true;
            this.startZzz();
            busy = false;
            updateMood();
          } else {
            this.time.delayedCall(3400, () => {
              this.goIdle();
              busy = false;
            });
          }
        },
      });
    }

    petSheep() {
      if (busy) return;
      busy = true;
      this.mode = "happy";
      this.showAnim("happy");
      this.heartBurst();
      blip("heart");
      toast("❤️");
      doCare("pet").catch(() => {});
      this.tweens.add({
        targets: this.sheep, y: this.sheep.y - 14, yoyo: true, duration: 180, repeat: 2,
        onUpdate: () => this.layoutWear(),
        onComplete: () => { this.goIdle(); busy = false; },
      });
    }

    giftFlower(fl) {
      if (busy) return;
      busy = true;
      this.walkTo(fl.x, fl.y + 20, () => {
        this.showAnim("happy");
        this.heartBurst();
        // wiggle
        this.tweens.add({
          targets: this.sheep, angle: { from: -10, to: 10 }, yoyo: true, duration: 120, repeat: 4,
          onComplete: () => { this.sheep.angle = 0; this.goIdle(); busy = false; },
        });
        toast("A flower! 🌸");
        blip("heart");
        doCare("flower").catch(() => {});
      });
    }

    startBrush() {
      this.interruptNight();
      if (busy) return;
      busy = true;
      openBrushMini(() => {
        doCare("brush").catch(() => {});
        this.heartBurst();
        this.sparkleBurst();
        this.showAnim("happy");
        toast("So fluffy ☁️");
        blip("unlock");
        this.goIdle();
        busy = false;
      });
    }

    sparkleAt(x, y) {
      const sp = this.add.image(x, y, "sparkle").setScale(this.fScale * 1.4).setDepth(999);
      this.tweens.add({ targets: sp, alpha: 0, y: y - 20, duration: 400, onComplete: () => sp.destroy() });
      if (!this._brushed && brushMode) {
        this._brushed = true;
        doCare("brush").then(() => toast("So shiny ✨")).catch(() => {});
        blip("unlock");
      }
    }

    startBath() {
      this.interruptNight();
      if (busy) return;
      busy = true;
      const openMini = () => {
        this.showAnim(this.hasSwim() && this.inPoolFeet() ? "swim" : "idle");
        this.layoutWear();
        openBathMini(() => {
          doCare("bath").catch(() => {});
          this.heartBurst();
          this.sparkleBurst();
          toast("So clean ✨");
          blip("unlock");
          this.goIdle();
          busy = false;
        });
      };
      const spots = fieldSpots();
      if (spots.basin) {
        this.walkTo(spots.basin.stand.x, spots.basin.stand.y, openMini, { exact: true });
      } else if (this.inPoolFeet()) {
        openMini();
      } else {
        const L = fieldLayout();
        const shore = (L && L.beach) || (L && L.start) || { x: 512, y: 520 };
        this.walkTo(shore.x, shore.y, openMini);
      }
    }

    startPlay() {
      const L = fieldLayout();
      if (L && L.pool) {
        this.playSpaSplash();
        return;
      }
      if (L && L.seesaw) {
        this.playSeesaw();
        return;
      }
      if (L && L.plays && L.plays.length) {
        this._playI = ((this._playI || 0) + 1) % L.plays.length;
        this.usePlay(L.plays[this._playI]);
        return;
      }
      if (L && L.leafPiles && L.leafPiles.length) {
        this._playI = ((this._playI || 0) + 1) % L.leafPiles.length;
        this.playLeafPounce(L.leafPiles[this._playI]);
        return;
      }
      const kinds = ["hop", "slide", "tunnel"];
      this._playI = ((this._playI || 0) + 1) % kinds.length;
      this.playPark(kinds[this._playI]);
    }

    playSpaSplash() {
      if (busy) return;
      const L = fieldLayout();
      if (!L || !L.pool) return;
      const p = L.pool;
      const a = Math.random() * Math.PI * 2;
      const u = 0.35 + Math.random() * 0.4;
      const fx = p.cx + Math.cos(a) * p.rx * u;
      const fy = p.cy + Math.sin(a) * p.ry * u;
      busy = true;
      this.interruptNight();
      this.walkTo(fx, fy, () => {
        this.showAnim(this.hasSwim() ? "swim" : "happy");
        if (this.addRipple) {
          this.addRipple(this.sheep.x, this.sheep.y);
          this.addRipple(this.sheep.x + 12, this.sheep.y + 6);
        }
        this.heartBurst();
        toast("Splash 💧");
        blip("splash");
        this.time.delayedCall(700, () => { this.goIdle(); busy = false; });
      });
    }

    placePark() {
      const s = this.fScale;
      const show = !!(fieldLayout() && fieldLayout().park);
      this.parkSprites = {};
      const hay = this.toWorld(PARK.hay.x, PARK.hay.y);
      this.parkSprites.hay = this.add.image(hay.x, hay.y, "hay_bale").setScale(s * 2.15).setOrigin(0.5, 1).setDepth(hay.y).setVisible(show);
      const sl = this.toWorld(PARK.slide.x, PARK.slide.y);
      this.parkSprites.slide = this.add.image(sl.x, sl.y, "slide").setScale(s * 1.85).setOrigin(0.5, 1).setDepth(sl.y + 2).setVisible(show);
      const tn = this.toWorld(PARK.tunnel.x, PARK.tunnel.y);
      this.parkSprites.tunnel = this.add.image(tn.x, tn.y, "tunnel").setScale(s * 1.85).setOrigin(0.5, 1).setDepth(tn.y + 8).setVisible(show);
      this.rebuildBlockers();
    }

    hopStands() {
      const p = PARK.hay;
      const fp = this.footprintOf("hay_bale");
      const clear = (fp.rx || 68) + 30 + 12;
      return {
        L: this.pushOut(p.x - clear, p.y),
        R: this.pushOut(p.x + clear, p.y),
      };
    }

    resetHop() {
      if (this.tweens) this.tweens.killTweensOf(this.sheep);
      const midAir = !!this._hopping;
      this._hopping = false;
      this.target = null;
      this.onArrive = null;
      this._waypoints = null;
      if (this.sheep) {
        let wx = midAir ? this.sheep.x : (this.footX != null ? this.footX : this.sheep.x);
        let wy = midAir ? this.sheep.y : (this.footY != null ? this.footY : this.sheep.y);
        const f = this.toField(wx, wy);
        const out = this.pushOut(f.x, f.y);
        const w = this.toWorld(out.x, out.y);
        this.place(w.x, w.y);
        this.sheep.angle = 0;
        if (this.fScale) this.sheep.setScale(this.fScale, this.fScale);
        this.showAnim("idle");
      }
      this.mode = "idle";
      busy = false;
    }

    playPark(kind) {
      if (!(fieldLayout() && fieldLayout().park)) return;
      this.interruptNight();
      if (kind === "hop") {
        this.resetHop();
        busy = true;
        this.doHop();
        return;
      }
      if (busy) return;
      busy = true;
      if (kind === "slide") this.doSlide();
      else this.doTunnel();
    }

    plantFeet() {
      if (!this.sheep) return;
      const f = this.toField(this.sheep.x, this.sheep.y);
      const out = this.pushOut(f.x, f.y);
      const w = this.toWorld(out.x, out.y);
      this.place(w.x, w.y);
    }

    // ---- v34: home-field plays — existing poses + simple code motion only ----
    footF() {
      return this.toField(this.footX != null ? this.footX : this.sheep.x, this.footY != null ? this.footY : this.sheep.y);
    }
    faceToward(fx) {
      const at = this.footF();
      if (Math.abs(fx - at.x) >= 4) this._faceRight = fx > at.x;
      this.applyFacing();
    }
    pWait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }
    pTween(cfg) {
      return new Promise((r) => {
        this.tweens.add(Object.assign({ onUpdate: () => this.layoutWear() }, cfg, { onComplete: () => r() }));
      });
    }
    async hopTo(fx, fy, o) {
      o = o || {};
      const a = { x: this.sheep.x, y: this.sheep.y };
      const b = this.toWorld(fx, fy);
      if (o.face !== false && Math.abs(b.x - a.x) > 2) this._faceRight = b.x > a.x;
      if (o.pose) this.showAnim(o.pose); else this.applyFacing();
      if (o.crop != null) this.cropBottom(o.crop);
      const h = (o.h != null ? o.h : 26) * this.fScale;
      const c = { t: 0 };
      await this.pTween({
        targets: c, t: 1, duration: o.dur || 380, ease: o.ease || "Linear",
        onUpdate: () => {
          const t = c.t;
          this.sheep.x = a.x + (b.x - a.x) * t;
          this.sheep.y = a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * h;
          this.layoutWear();
        },
      });
      this.sheep.x = b.x; this.sheep.y = b.y;
      this.layoutWear();
    }
    async glideTo(fx, fy, dur, ease) {
      const b = this.toWorld(fx, fy);
      await this.pTween({ targets: this.sheep, x: b.x, y: b.y, duration: dur || 900, ease: ease || "Sine.easeInOut" });
    }
    bob(n, amp, dur) {
      return this.pTween({ targets: this.sheep, y: this.sheep.y + amp * this.fScale, yoyo: true, repeat: Math.max(0, n - 1), duration: dur || 170 });
    }
    wiggle(n, amp, dur) {
      const x0 = this.sheep.x;
      return this.pTween({ targets: this.sheep, x: x0 + amp * this.fScale, yoyo: true, repeat: Math.max(0, n - 1), duration: dur || 70 })
        .then(() => { this.sheep.x = x0; this.layoutWear(); });
    }
    cropBottom(px) {
      if (!this.sheep) return;
      if (!px) { if (this.sheep.isCropped) this.sheep.setCrop(); return; }
      const fr = this.sheep.frame;
      this.sheep.setCrop(0, 0, fr.width, Math.max(1, fr.height - px));
    }
    fxPuff(key, fx, fy, dx, dy, dur, scale) {
      const w = this.toWorld(fx, fy);
      const s = this.add.image(w.x, w.y, key).setScale(this.fScale * (scale || 1)).setDepth(9000);
      this.tweens.add({ targets: s, x: w.x + (dx || 0) * this.fScale, y: w.y + (dy || -30) * this.fScale, alpha: 0, duration: dur || 900, onComplete: () => s.destroy() });
    }
    fxDots(fx, fy, n, color, spread) {
      const w = this.toWorld(fx, fy);
      for (let i = 0; i < n; i++) {
        const d = this.add.circle(w.x, w.y, (2 + Math.random() * 2) * this.fScale, color, 0.85).setDepth(9000);
        const a = -Math.PI * Math.random();
        const r = (spread || 24) * (0.5 + Math.random() * 0.6) * this.fScale;
        this.tweens.add({ targets: d, x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r + 10 * this.fScale, alpha: 0, duration: 500 + Math.random() * 300, onComplete: () => d.destroy() });
      }
    }
    fxRipple(fx, fy) {
      const w = this.toWorld(fx, fy);
      const e = this.add.ellipse(w.x, w.y, 34 * this.fScale, 11 * this.fScale);
      e.setStrokeStyle(Math.max(1, 2 * this.fScale), 0xffffff, 0.75);
      e.setDepth(w.y + 0.5);
      this.tweens.add({ targets: e, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 1000, onComplete: () => e.destroy() });
    }
    fxDrops(fx, fy, n) {
      const w = this.toWorld(fx, fy);
      for (let i = 0; i < n; i++) {
        const d = this.add.image(w.x, w.y, "wx_drop").setScale(this.fScale * 0.9).setDepth(9000);
        const a = -Math.PI * (0.1 + 0.8 * Math.random());
        const r = (30 + Math.random() * 30) * this.fScale;
        this.tweens.add({ targets: d, x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r, alpha: 0, duration: 550 + Math.random() * 250, onComplete: () => d.destroy() });
      }
    }

    // naps at hand-placed spots (doghouse, cave hole, nest, bed cushion)
    napDest(s) {
      if (s && s.nap) return this.toWorld(s.nap.x, s.nap.y);
      return napFootWorld(this, s);
    }
    showNapPose(s) {
      if (s && s.nap) {
        if (s.nap.flip != null) this._faceRight = !!s.nap.flip;
        this.showAnim(s.nap.pose || "sleep");
        this.cropBottom(s.nap.crop || 0);
        this._napSpot = s;
      } else {
        this.showAnim("sleep");
      }
    }
    leaveNapSpot() {
      const s = this._napSpot;
      if (!s) return;
      this._napSpot = null;
      this.cropBottom(0);
      if (s.stand && this.sheep && !this.target) {
        const w = this.toWorld(s.stand.x, s.stand.y);
        this.sheep.x = w.x; this.sheep.y = w.y;
        this.footX = w.x; this.footY = w.y;
      }
    }

    // front layers: parts of the field map that sit in front of the pet
    placeFronts() {
      (this.fronts || []).forEach((f) => { f.img.destroy(); f.sh.destroy(); });
      this.fronts = [];
      const L = fieldLayout();
      if (!L || !L.fronts) return;
      L.fronts.forEach((f) => {
        if (!this.textures.exists(f.key)) return;
        const w = this.toWorld(f.x, f.y);
        const d = this.toWorld(0, f.base).y;
        const img = this.add.image(w.x, w.y, f.key).setOrigin(0, 0).setScale(this.fScale).setDepth(d);
        const sh = this.add.image(w.x, w.y, f.key).setOrigin(0, 0).setScale(this.fScale).setDepth(d + 0.01).setAlpha(0);
        this.fronts.push({ img: img, sh: sh, key: f.key });
      });
    }

    usePlay(p) {
      if (busy || !p || !this.sheep) return;
      const fn = this["play_" + p.kind];
      if (!fn) return;
      busy = true;
      this.interruptNight();
      const field = currentFieldId();
      this.walkTo(p.stand.x, p.stand.y, () => {
        this.mode = "play";
        this._playing = p.id;
        let ok = true;
        Promise.resolve()
          .then(() => fn.call(this, p))
          .catch((e) => { ok = false; if (window.console) console.warn("play", e); })
          .then(() => this.endPlay(p, ok, field));
      }, { exact: true, via: p.via });
    }
    endPlay(p, ok, field) {
      this._playing = null;
      this.cropBottom(0);
      this.sheep.angle = 0;
      this._hopping = false;
      if (field !== currentFieldId()) {
        const st = (fieldLayout() && fieldLayout().start) || { x: 512, y: 520 };
        const w = this.toWorld(st.x, st.y);
        this.place(w.x, w.y);
        this.goIdle();
        busy = false;
        return;
      }
      if (ok) {
        doCare("play").catch(() => {});
        toast(p.msg || "Fun! ✨");
        blip("click");
      }
      this.showAnim("happy");
      this.pTween({ targets: this.sheep, y: this.sheep.y - 10 * this.fScale, yoyo: true, duration: 140, repeat: 1 })
        .then(() => { this.goIdle(); busy = false; });
    }

    async play_yarn(p) {
      const st = p.stand;
      this.faceToward(p.x);
      this.showAnim("eat");
      await this.pWait(350);
      for (let i = 0; i < 2; i++) {
        await this.hopTo(st.x - 24, st.y - 3, { pose: "happy", h: 22, dur: 300 });
        this.fxDots(p.x + 10, p.y + 8, 4, 0xe86a8a, 18);
        await this.hopTo(st.x, st.y, { pose: "happy", h: 12, dur: 260, face: false });
      }
      this.showAnim("idle");
      this.showBubble("bat bat! 🧶");
      await this.wiggle(6, 3, 80);
      this.fxPuff("heart", st.x, st.y - 70, 0, -30, 1000);
    }
    async play_post(p) {
      const st = p.stand;
      this.faceToward(p.x);
      this.showAnim("idle");
      this.showBubble("scritch scratch");
      for (let i = 0; i < 4; i++) {
        this.fxDots(st.x - 40, st.y - 30, 3, 0xc8a070, 16);
        await this.wiggle(2, 3, 70);
      }
      await this.pWait(200);
      await this.hopTo(p.top.x, p.top.y, { pose: "happy", h: 46, dur: 600 });
      this.showAnim("idle");
      this.showBubble("up high!");
      await this.pWait(2000);
      await this.hopTo(st.x, st.y, { pose: "happy", h: 28, dur: 520 });
    }
    async play_toy(p) {
      const st = p.stand;
      this.faceToward(p.ball.x);
      this.showAnim("happy");
      this.showBubble("woof!");
      for (let i = 0; i < 2; i++) {
        await this.hopTo(st.x - 20, st.y - 4, { pose: "happy", h: 20, dur: 280 });
        await this.hopTo(st.x, st.y, { pose: "happy", h: 12, dur: 240, face: false });
      }
      this.fxPuff("note", st.x - 10, st.y - 80, -10, -30, 1000);
      this.faceToward(p.bone.x);
      this.showAnim("eat");
      this.showBubble("chomp chomp 🦴");
      await this.bob(5, 3, 170);
    }
    async play_pool(p) {
      this.faceToward(p.in.x);
      await this.hopTo(p.in.x, p.in.y, { pose: "happy", h: 40, dur: 460 });
      this.fxDrops(p.in.x, p.in.y - 20, 8);
      this.fxRipple(p.in.x, p.in.y - 6);
      this.showAnim("idle");
      this.showBubble("splash!");
      for (const pt of p.pts) {
        this.faceToward(pt.x);
        this.fxRipple(this.footF().x, pt.y - 6);
        await this.glideTo(pt.x, pt.y, 1100);
        this.fxRipple(pt.x, pt.y - 6);
        await this.bob(2, 2, 220);
      }
      await this.hopTo(p.stand.x, p.stand.y, { pose: "happy", h: 40, dur: 460 });
      if (p.shake) {
        this.showAnim("idle");
        this.showBubble("shake shake!");
        const at = this.footF();
        this.fxDrops(at.x, at.y - 40, 12);
        await this.wiggle(8, 4, 55);
        this.fxDrops(at.x, at.y - 40, 8);
      }
    }
    async play_swim(p) {
      this.faceToward(p.in.x);
      await this.hopTo(p.in.x, p.in.y, { pose: "happy", h: 30, dur: 420 });
      this.showAnim("idle");
      this.cropBottom(p.crop);
      this.fxRipple(p.in.x, p.in.y - p.crop);
      this.showBubble("quack ♪");
      for (const pt of p.pts) {
        this.faceToward(pt.x);
        await this.glideTo(pt.x, pt.y, 1300);
        this.fxRipple(pt.x, pt.y - p.crop);
        await this.bob(2, 2, 240);
      }
      this.cropBottom(0);
      await this.hopTo(p.stand.x, p.stand.y, { pose: "happy", h: 30, dur: 440 });
      this.fxDrops(p.stand.x, p.stand.y - 30, 5);
    }
    async play_sit(p) {
      this.faceToward(p.in.x);
      await this.hopTo(p.in.x, p.in.y, { pose: "happy", h: 24, dur: 420 });
      this.showAnim("idle");
      this.cropBottom(p.crop);
      this.fxRipple(p.in.x, p.in.y - p.crop);
      this.showBubble("aah~");
      await this.bob(3, 2, 450);
      this.fxRipple(p.in.x, p.in.y - p.crop);
      await this.pWait(1400);
      this.cropBottom(0);
      await this.hopTo(p.stand.x, p.stand.y, { pose: "happy", h: 24, dur: 420 });
    }
    async play_slide(p) {
      for (const s of p.steps) await this.hopTo(s.x, s.y, { pose: "idle", h: 12, dur: 360 });
      this._faceRight = true;
      this.showAnim("happy");
      this.showBubble("weee!");
      this.sheep.angle = 22;
      await this.glideTo(p.end.x, p.end.y, 650, "Quad.easeIn");
      this.sheep.angle = 0;
      this.fxDots(p.end.x, p.end.y, 6, 0xd9c08a, 22);
      await this.hopTo(p.off.x, p.off.y, { pose: "happy", h: 14, dur: 300 });
    }
    async play_climb(p) {
      for (const s of p.steps) await this.hopTo(s.x, s.y, { pose: "idle", h: 26, dur: 460 });
      this._faceRight = false;
      this.showAnim("idle");
      this.showBubble(p.say || "up here!");
      this.fxPuff("note", p.steps[p.steps.length - 1].x, p.steps[p.steps.length - 1].y - 70, 10, -30, 1100);
      await this.pWait(2200);
      const back = p.steps.slice(0, -1).reverse().concat([p.stand]);
      for (const s of back) await this.hopTo(s.x, s.y, { pose: "happy", h: 22, dur: 420 });
    }
    async play_perch(p) {
      await this.hopTo(p.top.x, p.top.y, { pose: "happy", h: 70, dur: 900, ease: "Sine.easeInOut" });
      this._faceRight = false;
      this.showAnim("idle");
      this.showBubble("caw!");
      this.fxPuff("note", p.top.x, p.top.y - 60, -10, -30, 1100);
      await this.pWait(2600);
      await this.hopTo(p.stand.x, p.stand.y, { pose: "happy", h: 50, dur: 800, ease: "Sine.easeInOut" });
    }
    async play_sniff(p) {
      this.faceToward(p.x);
      this.showAnim("eat");
      this.showBubble("sniff sniff…");
      await this.bob(4, 3, 160);
      if (Math.random() < 0.65) {
        this.fxPuff("treat", p.stand.x - 40, p.stand.y - 10, 6, -26, 1200, 0.9);
        this.showBubble("crumbs! 😋");
        await this.bob(4, 2, 150);
        this.fxPuff("heart", p.stand.x, p.stand.y - 60, 0, -30, 1000);
      } else {
        await this.pWait(300);
        this.showBubble("nothing… this time");
        await this.pWait(500);
      }
    }
    async play_shiny(p) {
      const c = p.coin;
      this.faceToward(c.x);
      this.showAnim("eat");
      await this.bob(4, 4, 150);
      this.fxPuff("sparkle", c.x, c.y - 10, -6, -30, 900);
      this.fxPuff("sparkle", c.x + 14, c.y - 4, 8, -26, 1000);
      this.showBubble("ooh, shiny ✨");
      await this.pWait(500);
      await this.hopTo(p.stand.x, p.stand.y, { pose: "happy", h: 18, dur: 300, face: false });
    }

    finishPlay(msg) {
      this._hopping = false;
      this.plantFeet();
      doCare("play").catch(() => {});
      toast(msg);
      blip("click");
      this.showAnim("happy");
      this.tweens.add({
        targets: this.sheep, y: this.sheep.y - 12, yoyo: true, duration: 140, repeat: 2,
        onUpdate: () => this.layoutWear(),
        onComplete: () => {
          this.plantFeet();
          this.goIdle();
          busy = false;
        },
      });
    }

    doHop() {
      const p = PARK.hay;
      const stands = this.hopStands();
      const cur = (this.footX != null) ? this.toField(this.footX, this.footY) : { x: p.standL.x, y: p.standL.y };
      const dL = Math.hypot(cur.x - stands.L.x, cur.y - stands.L.y);
      const dR = Math.hypot(cur.x - stands.R.x, cur.y - stands.R.y);
      const from = dL <= dR ? stands.L : stands.R;
      const to = dL <= dR ? stands.R : stands.L;
      this.walkTo(from.x, from.y, () => {
        this._hopping = true;
        this.mode = "hop";
        this.showAnim("happy");
        const fromW = this.toWorld(from.x, from.y);
        const land = this.toWorld(to.x, to.y);
        const mid = this.toWorld((from.x + to.x) / 2, p.y - 90);
        this.setFacing(land.x - fromW.x);
        this.tweens.add({
          targets: this.sheep, x: mid.x, duration: 280, ease: "Sine.easeOut",
          onUpdate: () => this.layoutWear(),
        });
        this.tweens.add({
          targets: this.sheep, y: mid.y, duration: 280, ease: "Quad.easeOut",
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            if (!this._hopping) return;
            this.tweens.add({
              targets: this.sheep, x: land.x, y: land.y, duration: 280, ease: "Quad.easeIn",
              onUpdate: () => this.layoutWear(),
              onComplete: () => {
                if (!this._hopping) return;
                this.place(land.x, land.y);
                this._hopping = false;
                this.finishPlay("Hop! 🌾");
              },
            });
          },
        });
      });
    }

    doSlide() {
      const p = PARK.slide;
      this.walkTo(p.start.x, p.start.y, () => {
        const top = this.toWorld(p.top.x, p.top.y);
        const end = this.toWorld(p.end.x, p.end.y);
        this.showAnim("idle");
        this.tweens.add({
          targets: this.sheep, x: top.x, y: top.y, duration: 450,
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            this.showAnim("happy");
            this.tweens.add({
              targets: this.sheep, x: end.x, y: end.y, duration: 650, ease: "Quad.easeIn",
              onUpdate: () => this.layoutWear(),
              onComplete: () => this.finishPlay("Weee 🛝"),
            });
          },
        });
      });
    }

    doTunnel() {
      const p = PARK.tunnel;
      this.walkTo(p.start.x, p.start.y, () => {
        const end = this.toWorld(p.end.x, p.end.y);
        const arch = this.parkSprites && this.parkSprites.tunnel;
        if (arch) this._depthLock = arch.depth - 1;
        this.showAnim("walk");
        this.tweens.add({
          targets: this.sheep, x: end.x, y: end.y, duration: 700,
          onUpdate: () => this.layoutWear(),
          onComplete: () => { this._depthLock = null; this.finishPlay("Through! 🪵"); },
        });
      });
    }

    startTreat() {
      this.interruptNight();
      if (busy) return;
      busy = true;
      const f = this.toField(this.sheep.x, this.sheep.y);
      const fx = this.clamp(f.x + (Math.random() > 0.5 ? 90 : -90));
      const fy = this.clampY(f.y + 20);
      const p = this.toWorld(fx, fy);
      const t = this.add.image(p.x, p.y, "treat").setScale(this.fScale * 1.5).setDepth(this.sheep.y - 1);
      this.walkTo(fx, fy, () => {
        this.showAnim("eat");
        this.tweens.add({
          targets: t, alpha: 0, y: p.y - 16, duration: 300, onComplete: () => t.destroy(),
        });
        doCare("treat").catch(() => {});
        this.heartBurst();
        this.time.delayedCall(200, () => this.heartBurst());
        toast("Treat! 🍪");
        blip("heart");
        this.time.delayedCall(700, () => { this.goIdle(); busy = false; });
      });
    }

    takePhoto() {
      this.interruptNight();
      toast("Say cheese 📷");
      this.game.renderer.snapshot((img) => {
        const a = document.createElement("a");
        a.href = img.src;
        const n = (state.pet && state.pet.name) || "mypet";
        a.download = n.replace(/\s+/g, "_") + ".png";
        a.click();
        saveJournalPhoto(img.src);
      });
    }

    heartBurst() {
      for (let i = 0; i < 8; i++) {
        this.time.delayedCall(i * 60, () => {
          const h = this.add.image(this.sheep.x + (Math.random() - 0.5) * 50, this.sheep.y - 55, "heart")
            .setScale(this.fScale * (1.3 + Math.random() * 0.6)).setDepth(999);
          this.tweens.add({
            targets: h, y: h.y - 70, x: h.x + (Math.random() - 0.5) * 40, alpha: 0,
            scale: h.scale * 1.3, duration: 900,
            onComplete: () => h.destroy(),
          });
        });
      }
    }

    sparkleBurst() {
      for (let i = 0; i < 10; i++) {
        this.time.delayedCall(i * 50, () => {
          const x = this.sheep.x + (Math.random() - 0.5) * 70;
          const y = this.sheep.y - 20 - Math.random() * 70;
          const sp = this.add.image(x, y, "sparkle").setScale(this.fScale * 1.5).setDepth(999);
          this.tweens.add({ targets: sp, alpha: 0, y: y - 24, duration: 500, onComplete: () => sp.destroy() });
        });
      }
    }

    floatSprite(key, x, y, dur) {
      const s = this.add.image(x, y, key).setScale(this.fScale * 1.3).setDepth(999);
      this.tweens.add({ targets: s, y: y - 30, alpha: 0, duration: dur, onComplete: () => s.destroy() });
    }

    spawnButterflies() {
      if (this.mode === "sleep") return;
      if (!this.butterflies) this.butterflies = [];
      this.butterflies = this.butterflies.filter((b) => b && b.active);
      if (this.butterflies.length >= 3) return;
      const left = Math.random() < 0.5;
      const fy = this.clampY(240 + Math.random() * 420);
      const start = this.toWorld(left ? 150 : 870, fy);
      const end = this.toWorld(left ? 870 : 150, fy + (Math.random() - 0.5) * 80);
      const key = Math.random() < 0.5 ? "bf" : "bfb";
      const bf = this.add.sprite(start.x, start.y, key + "1").setScale(this.fScale * 1.4).setDepth(900);
      bf.play(key);
      bf._kind = key;
      bf.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(12, 9, 16), hitAreaCallback: Phaser.Geom.Circle.Contains });
      bf.on("pointerdown", (pointer) => {
        if (pointer && pointer.event && pointer.event.stopPropagation) pointer.event.stopPropagation();
        this.catchButterfly(bf);
      });
      bf._tween = this.tweens.add({
        targets: bf, x: end.x, y: end.y, duration: 8000, ease: "Sine.easeInOut",
        onComplete: () => { if (bf.active && !bf._caught) bf.destroy(); },
      });
      this.butterflies.push(bf);
      if (this.mode === "idle" && !busy && !this._catching && Math.random() < 0.55) {
        this.time.delayedCall(500, () => this.catchButterfly(bf));
      }
    }

    catchButterfly(bf) {
      if (!bf || !bf.active || bf._caught) return;
      if (this.mode === "sleep") return;
      if (busy || this._catching) return;
      busy = true;
      this._catching = true;
      bf._caught = true;
      if (bf._tween) { bf._tween.stop(); bf._tween = null; }
      const f = this.toField(bf.x, bf.y);
      this.walkTo(this.clamp(f.x), this.clampY(f.y + 10), () => {
        this.showAnim("happy");
        this.tweens.add({
          targets: this.sheep, y: this.sheep.y - 16, yoyo: true, duration: 150, repeat: 1,
          onComplete: () => this.landButterfly(bf),
        });
      });
    }

    landButterfly(bf) {
      if (!bf || !bf.active) {
        this._catching = false;
        this.goIdle();
        busy = false;
        return;
      }
      const s = this.fScale;
      const flip = this.sheep.flipX ? -1 : 1;
      // Sit on the snout, just in front of the face — never in the mouth.
      const nose = noseAt(this.poseName ? this.poseName() : "happy");
      const nx = this.sheep.x + nose.x * s * flip;
      const ny = this.sheep.y + nose.y * s;
      bf.setDepth(this.sheep.y + 6);
      this.tweens.add({
        targets: bf, x: nx, y: ny, duration: 280, ease: "Sine.easeOut",
        onComplete: () => {
          this._perchedBf = bf;
          this.showAnim("happy");
          this.heartBurst();
          toast("A friend! 🦋");
          blip("heart");
          if (window.MyPetRoster && state.pet) {
            if (MyPetRoster.logMilestone(state.pet, "first_butterfly", "First butterfly", "🦋")) persistStaticPet();
          }
          this.time.delayedCall(1100, () => {
            this._perchedBf = null;
            if (!bf.active) {
              this._catching = false;
              this.goIdle();
              busy = false;
              return;
            }
            const awayX = this.sheep.x + 140 * s * (this.sheep.flipX ? -1 : 1);
            const awayY = this.sheep.y - 130 * s;
            this.tweens.add({
              targets: bf, x: awayX, y: awayY, alpha: 0, duration: 900, ease: "Sine.easeIn",
              onComplete: () => {
                if (bf.active) bf.destroy();
                this._catching = false;
                this.goIdle();
                busy = false;
              },
            });
          });
        },
      });
    }

    catchNearestButterfly() {
      const list = (this.butterflies || []).filter((b) => b && b.active && !b._caught);
      if (!list.length) { this.spawnButterflies(); this.time.delayedCall(80, () => this.catchNearestButterfly()); return; }
      let best = list[0], bestD = 1e9;
      for (const b of list) {
        const d = Math.hypot(b.x - this.sheep.x, b.y - this.sheep.y);
        if (d < bestD) { bestD = d; best = b; }
      }
      this.catchButterfly(best);
    }

    idleMood() {
      if (this.mode !== "idle" || busy) return;
      if (this.inPoolFeet && this.inPoolFeet()) {
        this.showBubble("aah~");
        return;
      }
      const live = (this.butterflies || []).filter((b) => b && b.active && !b._caught);
      if (live.length && Math.random() < 0.4) {
        this.catchButterfly(live[0]);
        return;
      }
      const Lpl = fieldLayout();
      if (Lpl && Lpl.plays && Lpl.plays.length && !(window.MyPetWorld && MyPetWorld.isNight()) && Math.random() < 0.3) {
        this.usePlay(Lpl.plays[Math.floor(Math.random() * Lpl.plays.length)]);
        return;
      }
      const pick = Math.random();
      if (pick < 0.33) {
        // yawn
        this.floatSprite("zzz", this.sheep.x + 20, this.sheep.y - 70, 1400);
        this.showBubble("yaaawn");
        this.time.delayedCall(1400, () => this.goIdle());
      } else if (pick < 0.66) {
        this.floatSprite("note", this.sheep.x + 24, this.sheep.y - 70, 1400);
        this.time.delayedCall(200, () => this.floatSprite("note", this.sheep.x - 10, this.sheep.y - 90, 1400));
        this.showBubble("hmm ♪");
      } else {
        // roll
        busy = true;
        this.tweens.add({
          targets: this.sheep, angle: 360, duration: 700,
          onComplete: () => { this.sheep.angle = 0; busy = false; this.goIdle(); },
        });
        this.showBubble("whee!");
      }
    }

    showBubble(text) {
      const el = $("bubble");
      el.textContent = text;
      const canvas = this.game.canvas.getBoundingClientRect();
      const sx = this.game.scale.displayScale.x || (canvas.width / W);
      const sy = this.game.scale.displayScale.y || (canvas.height / H);
      el.style.left = (canvas.left + this.sheep.x * (canvas.width / W)) + "px";
      el.style.top = (canvas.top + (this.sheep.y - 110) * (canvas.height / H)) + "px";
      el.classList.remove("hidden");
      clearTimeout(this._bt);
      this._bt = setTimeout(() => el.classList.add("hidden"), 1400);
    }

    update(_, dt) {
      if (this.fronts && this.fronts.length && this.skyTint) {
        const a = this.skyTint.visible ? this.skyTint.fillAlpha : 0;
        const c = this.skyTint.fillColor;
        for (let i = 0; i < this.fronts.length; i++) {
          const sh = this.fronts[i].sh;
          if (sh._c !== c) { sh.setTintFill(c); sh._c = c; }
          if (sh.alpha !== a) sh.setAlpha(a);
        }
      }
      if (this.target) {
        if (this.footX == null) { this.footX = this.sheep.x; this.footY = this.sheep.y; }
        const speed = 0.12 * this.fScale * dt * (this._speedMul || 1);
        const dx = this.target.x - this.footX;
        const dy = this.target.y - this.footY;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) this.arrive();
        else {
          const step = Math.min(speed, dist);
          let nx = this.footX + (dx / dist) * step;
          let ny = this.footY + (dy / dist) * step;
          const destF = this._waypoints && this._waypoints.length
            ? this._waypoints[this._waypoints.length - 1]
            : this.toField(this.target.x, this.target.y);
          const nf = this.toField(nx, ny);
          // v33: pass-through cases so pets never freeze in place:
          //  - last step onto a care spot (bowl/bed stand),
          //  - already standing inside a keep-out ring (after a nap, a push, etc.),
          //  - no progress on this leg for ~0.9s.
          const curF0 = this.toField(this.footX, this.footY);
          const lastLeg = !!(this._waypoints && this._wpI >= this._waypoints.length - 1);
          if (this._legBest == null || dist < this._legBest - 2) {
            this._legBest = dist;
            this._legT = this.time.now;
          } else if (this.time.now - (this._legT || this.time.now) > 900) {
            this._ghostLeg = true;
          }
          const ghost = (this._ghostLast && lastLeg) || this._ghostLeg || !!this.hitsBlocker(curF0.x, curF0.y);
          if (ghost) {
            this.footX = nx;
            this.footY = ny;
            this._stuckN = 0;
            this.setFacing(dx);
            this.applyWalkMotion();
            this.syncLocomotion && this.syncLocomotion();
            this.layoutWear();
          } else {
          if (this.hitsBlocker(nf.x, nf.y)) {
            const ox = this.footX + (dx / dist) * step, oy = this.footY;
            const ofx = this.toField(ox, oy);
            if (!this.hitsBlocker(ofx.x, ofx.y)) { nx = ox; ny = oy; }
            else {
              const ox2 = this.footX, oy2 = this.footY + (dy / dist) * step;
              const ofy = this.toField(ox2, oy2);
              if (!this.hitsBlocker(ofy.x, ofy.y)) { nx = ox2; ny = oy2; }
            }
          }
          const still = this.toField(nx, ny);
          if (this.hitsBlocker(still.x, still.y)) {
            if (!this._repathAt || this.time.now - this._repathAt > 180) {
              this._repathAt = this.time.now;
              this._stuckN = (this._stuckN || 0) + 1;
              const curF = this.toField(this.footX, this.footY);
              if (this.hitsBlocker(curF.x, curF.y)) {
                const out = this.pushOut(curF.x, curF.y);
                const w = this.toWorld(out.x, out.y);
                this.place(w.x, w.y);
              }
              if (this._stuckN > 20) {
                const snap = this.nearestWalkable ? this.nearestWalkable(destF.x, destF.y) : this.pushOut(destF.x, destF.y);
                const w = this.toWorld(snap.x, snap.y);
                this.place(w.x, w.y);
                this._stuckN = 0;
                this.arrive();
                this.applyWalkMotion();
                this.layoutWear();
                return;
              }
              if (this._exactEnd) {
                // keep the final step onto the care spot after a re-path
                this._waypoints = this.buildPath(this._exactEnd.near.x, this._exactEnd.near.y);
                this._waypoints.push(this._exactEnd.ex);
              } else {
                this._waypoints = this.buildPath(destF.x, destF.y);
              }
              this._wpI = 0;
              const first = this._waypoints && this._waypoints[0];
              if (first) this.target = this.toWorld(first.x, first.y);
            }
            this.applyWalkMotion();
            this.layoutWear();
          } else {
            this.footX = nx;
            this.footY = ny;
            this._stuckN = 0;
            this.setFacing(dx);
            this.applyWalkMotion();
            if (this.sheep && this.sheep.anims && this.sheep.anims.currentAnim && (this.sheep.anims.currentAnim.key === "walk" || this.sheep.anims.currentAnim.key === "swim")) {
              const cruise = 0.12 * (this.fScale || 1);
              const spd = dt > 0 ? (step / dt) : cruise;
              this.sheep.anims.timeScale = Math.max(0.65, Math.min(1.35, spd / Math.max(0.0001, cruise)));
            }
            this.syncLocomotion && this.syncLocomotion();
            this.layoutWear();
          }
          }
        }
      } else if (this.mode === "idle" && this.time.now > this.idleAt) {
        if (this._wantNightSleep && window.MyPetWorld && MyPetWorld.isNight() && !busy) {
          this.startNightSleep();
        } else {
          this.idleAt = this.time.now + 9000 + Math.random() * 8000;
          this.idleMood();
        }
      }
      const sp = currentSpecies();
      if (sp && sp.walk === "wobble" && this.sheep) {
        if (this.mode === "sleep") {
          this.sheep.angle = 0;
        } else if (this.mode === "walk" || this.target) {
          this.sheep.angle = Math.sin(this.time.now / 110) * 10;
        } else if (this.mode === "idle" && !busy) {
          this.sheep.angle = Math.sin(this.time.now / 700) * 2.5;
        }
      }
      this.syncLocomotion && this.syncLocomotion();
      this.tickOranges && this.tickOranges();
      this.tickWeather(dt);
      if (this.tickLeaves) this.tickLeaves(dt);
    }
  }

  function dressPreview(sheepImg, hatImg, collarImg) {
    if (!sheepImg) return;
    const happy = /_happy/.test(sheepImg.getAttribute("src") || sheepImg.src || "");
    const boxH = sheepImg.getBoundingClientRect().height || sheepImg.clientHeight || 150;
    const artH = sheepImg.naturalHeight || (happy ? 139 : 121);
    const scale = boxH / artH;
    const pet = state && state.pet;
    const head = headAt(happy ? "happy" : "idle", pet);
    const neck = neckAt(happy ? "happy" : "idle", pet);
    function place(img, ox, oy, mul, src, size) {
      if (!img) return;
      if (!src) { img.classList.add("hidden"); img.removeAttribute("src"); return; }
      img.src = src;
      img.classList.remove("hidden");
      const hpx = (size && size[1] ? size[1] : 36) * scale * mul;
      img.style.height = hpx + "px";
      img.style.width = "auto";
      // Hats sit a hair high in the HTML box vs the Phaser crop; the collar should not.
      const fudge = (img === collarImg) ? 0 : 6;
      img.style.bottom = ((-oy * scale) - fudge) + "px";
      img.style.left = "50%";
      img.style.transform = "translateX(calc(-50% + " + (ox * scale) + "px))";
    }
    if (pet && pet.costume && COSTUME_TEX[pet.costume] && hatImg) {
      const n = COSTUME_NUDGE[pet.costume] || { x: 0, y: 0 };
      const mul = COSTUME_SCALE[pet.costume] == null ? 1.08 : COSTUME_SCALE[pet.costume];
      place(hatImg, head.x + n.x, head.y + n.y, mul,
        costumeDataUrl(pet.costume), COSTUME_SIZE[pet.costume]);
    } else if (hatImg) {
      place(hatImg, 0, 0, 1, null);
    }
    if (pet && pet.collar === "collar" && collarImg) {
      place(collarImg, neck.x, neck.y, 1,
        costumeDataUrl("collar"), COSTUME_SIZE.collar);
    } else if (collarImg) {
      place(collarImg, 0, 0, 1, null);
    }
  }

  function openBathMini(onDone) {
    const root = $("bath");
    if (!root) { if (onDone) onDone(); return; }
    const hint = $("bathHint");
    const fill = $("bathFill");
    const label = $("bathLabel");
    const wrap = $("bathSheepWrap");
    const fx = $("bathFx");
    const btnRinse = $("bathRinse");
    const btnDry = $("bathDry");
    const sheepImg = $("bathSheep");
    const actor = $("bathActor") || wrap;
    let soap = 0, clean = 0, dry = 0;
    let phase = "scrub";
    const bubbles = [];
    let finished = false;
    let lastTouch = Date.now();
    let helpTimer = 0;
    let autoTimer = 0;

    function setHint(msg) { if (hint) hint.textContent = msg; }
    function setMeter(v) {
      if (fill) fill.style.width = Math.max(0, Math.min(100, v)) + "%";
    }
    function setLabel(msg) { if (label) label.textContent = msg; }
    function show(el, on) {
      if (!el) return;
      el.classList.toggle("hidden", !on);
    }
    function setSheepPose(pose) {
      if (!sheepImg) return;
      sheepImg.src = sheepDataUrl(pose);
    }
    function sizeCanvas() {
      if (!fx || !wrap) return;
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fx.width = Math.max(1, Math.floor(r.width * dpr));
      fx.height = Math.max(1, Math.floor(r.height * dpr));
      fx.style.width = r.width + "px";
      fx.style.height = r.height + "px";
    }
    function draw() {
      if (!fx) return;
      const ctx = fx.getContext("2d");
      ctx.clearRect(0, 0, fx.width, fx.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const b of bubbles) {
        if (b.a <= 0) continue;
        ctx.beginPath();
        ctx.arc(b.x * dpr, b.y * dpr, b.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + b.a + ")";
        ctx.fill();
        ctx.strokeStyle = "rgba(180,220,230," + Math.min(1, b.a + 0.2) + ")";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x * dpr - b.r * 0.3 * dpr, b.y * dpr - b.r * 0.3 * dpr, b.r * 0.22 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + Math.min(1, b.a + 0.2) + ")";
        ctx.fill();
      }
    }
    function addBubble(x, y) {
      const rect = wrap.getBoundingClientRect();
      bubbles.push({ x: x - rect.left, y: y - rect.top, r: 6 + Math.random() * 12, a: 0.75 });
      if (bubbles.length > 40) bubbles.shift();
      draw();
    }
    function fxAt(cls, x, y, lingerMs) {
      const el = document.createElement("div");
      el.className = cls;
      el.style.left = x + "px";
      el.style.top = y + "px";
      if (lingerMs && lingerMs > 800) el.style.animationDuration = lingerMs + "ms";
      wrap.appendChild(el);
      setTimeout(() => el.remove(), lingerMs || 800);
    }
    function clearFx(sel) {
      if (!wrap) return;
      wrap.querySelectorAll(sel || ".drop, .steam-puff, .spot-sparkle").forEach((el) => el.remove());
    }
    function popBubble(b) {
      if (!b || b.a <= 0) return;
      b.a = 0;
      fxAt("drop", b.x, b.y);
      fxAt("spot-sparkle", b.x, b.y);
      blip("sparkle");
    }
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(helpTimer);
      clearTimeout(autoTimer);
      document.body.classList.remove("bathing");
      root.classList.add("hidden");
      wrap.style.cursor = "";
      wrap.removeEventListener("pointerdown", onPtr);
      wrap.removeEventListener("pointermove", onPtr);
      wrap.removeEventListener("pointerup", onUp);
      if (onDone) onDone();
    }
    function setCursor(file, hx, hy) {
      try {
        wrap.style.cursor = 'url("' + assetUrl("assets/" + file) + '") ' + hx + ' ' + hy + ', pointer';
      } catch (e) { wrap.style.cursor = "pointer"; }
    }

    function startRinse() {
      if (phase === "rinse" || phase === "dry" || finished) return;
      phase = "rinse";
      show(btnRinse, false);
      setHint("Rinse the soap 🚿");
      setLabel("💧 Clean");
      setMeter(clean);
      if (fill) fill.style.background = "linear-gradient(90deg, #8ec8e8, #b7e3a0)";
      setCursor("rinse_cursor.png", 24, 30);
      if (actor) actor.classList.add("wet");
      clearFx(".steam-puff");
      blip("splash");
      lastTouch = Date.now();
    }
    function startDry() {
      if (phase === "dry" || finished) return;
      phase = "dry";
      show(btnDry, false);
      show(btnRinse, false);
      bubbles.forEach((b) => { b.a = 0; });
      draw();
      clearFx(".drop, .spot-sparkle");
      setHint("Dry the wool 🌬️");
      setLabel("☁️ Dry");
      setMeter(dry);
      if (fill) fill.style.background = "linear-gradient(90deg, #f7efe0, #f3d291)";
      setCursor("dry_cursor.png", 40, 20);
      lastTouch = Date.now();
    }
    function finishDry() {
      if (finished) return;
      dry = 100;
      setMeter(100);
      setHint("All done ✨");
      setSheepPose("happy");
      dressPreview(sheepImg, $("bathHat"), $("bathCollar"));
      if (actor) {
        actor.classList.remove("wet");
        actor.classList.add("shake", "fluffy");
        setTimeout(() => actor.classList.remove("shake"), 700);
      }
      clearFx(".drop, .spot-sparkle");
      wrap.classList.add("sparkle");
      const r = wrap.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        setTimeout(() => fxAt("steam-puff", r.width * (0.3 + Math.random() * 0.4), r.height * (0.25 + Math.random() * 0.4)), i * 80);
      }
      blip("unlock");
      if (!openBathMini._hold) setTimeout(finish, 1200);
    }

    function onPtr(e) {
      if (finished) return;
      if (e.type === "pointermove" && !e.buttons) return;
      e.preventDefault();
      lastTouch = Date.now();
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX || 0) - rect.left;
      const y = (e.clientY || 0) - rect.top;
      if (phase === "scrub") {
        addBubble(e.clientX, e.clientY);
        soap = Math.min(80, soap + (e.buttons || e.pressure || 1) * 1.8);
        setMeter(soap);
        if (soap >= 60) {
          show(btnRinse, true);
          setHint("Nice! Now rinse");
          if (!autoTimer) autoTimer = setTimeout(startRinse, 1800);
        }
        return;
      }
      if (phase === "rinse") {
        fxAt("drop", x, y);
        let hit = false;
        for (const b of bubbles) {
          if (b.a <= 0) continue;
          if (Math.hypot(x - b.x, y - b.y) < b.r + 22) { popBubble(b); hit = true; }
        }
        clean = Math.min(100, clean + (hit ? 8 : 3));
        setMeter(clean);
        draw();
        if (clean >= 100 && bubbles.every((b) => b.a <= 0)) {
          show(btnDry, true);
          setHint("Nice! Now dry");
          if (autoTimer) clearTimeout(autoTimer);
          autoTimer = setTimeout(startDry, 1600);
        }
        return;
      }
      if (phase === "dry") {
        fxAt("steam-puff", x, y);
        dry = Math.min(100, dry + 4);
        setMeter(dry);
        if (dry >= 55 && actor) actor.classList.remove("wet");
        if (dry >= 100) finishDry();
      }
    }
    function onUp() {}

    function seedBubbles(n) {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      for (let i = 0; i < (n || 10); i++) {
        bubbles.push({
          x: r.width * (0.28 + Math.random() * 0.44),
          y: r.height * (0.28 + Math.random() * 0.36),
          r: 7 + Math.random() * 13,
          a: 0.72 + Math.random() * 0.2,
        });
      }
      draw();
    }
    function seedFx(cls, n, ms) {
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      for (let i = 0; i < (n || 6); i++) {
        fxAt(cls, r.width * (0.22 + Math.random() * 0.56), r.height * (0.22 + Math.random() * 0.5), ms);
      }
    }
    openBathMini._api = {
      startRinse, startDry, finishDry,
      phase: () => phase,
      setClean: (v) => { clean = Math.max(0, Math.min(100, v)); if (phase === "rinse") setMeter(clean); },
      setDry: (v) => {
        dry = Math.max(0, Math.min(100, v));
        if (phase === "dry") setMeter(dry);
        if (dry >= 55 && actor) actor.classList.remove("wet");
      },
      seedBubbles, seedFx,
      hold: (on) => { openBathMini._hold = !!on; },
    };

    btnRinse.onclick = () => { if (phase === "scrub") startRinse(); };
    btnDry.onclick = () => { if (phase === "rinse" || phase === "dry") startDry(); };

    openBathMini._hold = false;
    soap = 0; clean = 0; dry = 0;
    phase = "scrub";
    bubbles.length = 0;
    setMeter(0);
    setLabel("🧼 Soap");
    setHint("Scrub the wool 🧼");
    if (fill) fill.style.background = "linear-gradient(90deg, #c8e8f6, #9fd4f0)";
    show(btnRinse, false);
    show(btnDry, false);
    if (sheepImg) sheepImg.classList.remove("shake");
    setSheepPose("idle");
    if (actor) actor.classList.remove("shake", "fluffy", "wet");
    wrap.classList.remove("sparkle");
    wrap.style.cursor = "pointer";
    root.classList.remove("hidden");
    document.body.classList.add("bathing");
    dressPreview(sheepImg, $("bathHat"), $("bathCollar"));
    requestAnimationFrame(() => dressPreview(sheepImg, $("bathHat"), $("bathCollar")));
    sizeCanvas();
    draw();
    wrap.addEventListener("pointerdown", onPtr);
    wrap.addEventListener("pointermove", onPtr);
    wrap.addEventListener("pointerup", onUp);
    clearInterval(openBathMini._help);
    helpTimer = openBathMini._help = setInterval(() => {
      if (finished) { clearInterval(helpTimer); return; }
      if (Date.now() - lastTouch < 2500) return;
      if (phase === "scrub") {
        soap = Math.min(60, soap + 4);
        setMeter(soap);
        if (soap >= 60) {
          show(btnRinse, true);
          setHint("Nice! Now rinse");
          if (!autoTimer) autoTimer = setTimeout(startRinse, 1800);
        }
      } else if (phase === "rinse") {
        const left = bubbles.filter((b) => b.a > 0);
        if (left.length) popBubble(left[0]);
        clean = Math.min(100, clean + 8);
        setMeter(clean);
        draw();
        if (clean >= 100 && bubbles.every((b) => b.a <= 0)) {
          show(btnDry, true);
          setHint("Nice! Now dry");
          if (autoTimer) clearTimeout(autoTimer);
          autoTimer = setTimeout(startDry, 1600);
        }
      } else if (phase === "dry") {
        dry = Math.min(100, dry + 8);
        setMeter(dry);
        if (dry >= 100) finishDry();
      }
    }, 800);
  }

  function openBrushMini(onDone) {
    const root = $("brush");
    const canvas = $("brushCanvas");
    const meterFill = $("fluffFill");
    const meterLabel = $("fluffLabel");
    const wrap = $("brushWrap");
    const sheepImg = $("brushSheep");
    const actor = $("brushActor") || wrap;
    const spotsEl = $("brushSpots");
    const hint = $("brushHint");
    if (!root || !canvas || !wrap) { if (onDone) onDone(); return; }

    const W = 280, H = 260;
    let fluff = 0;
    let done = false;
    let helpTimer = 0;
    const N = 6;
    const kinds = ["burr", "dust", "burr", "dust", "burr", "dust"];

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    function setMeter() {
      if (meterFill) meterFill.style.width = fluff + "%";
      if (meterLabel) meterLabel.textContent = "☁️ Fluffy " + fluff + "%";
    }
    function setHint(msg) { if (hint) hint.textContent = msg; }
    function puffAt(x, y) {
      const el = document.createElement("div");
      el.className = "wool-puff";
      el.style.left = x + "px";
      el.style.top = y + "px";
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 700);
    }
    function sparkleAt(x, y) {
      const el = document.createElement("div");
      el.className = "spot-sparkle";
      el.style.left = x + "px";
      el.style.top = y + "px";
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 600);
    }
    function finish() {
      if (done) return;
      done = true;
      clearInterval(helpTimer);
      fluff = 100;
      setMeter();
      setHint("So fluffy!");
      if (sheepImg) sheepImg.src = sheepDataUrl("happy");
      dressPreview(sheepImg, $("brushHat"), $("brushCollar"));
      if (actor) {
        actor.classList.add("shake");
        setTimeout(() => actor.classList.remove("shake"), 700);
      }
      wrap.classList.add("sparkle");
      if (actor) actor.classList.add("fluffy");
      const r = wrap.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          puffAt(r.width * (0.3 + Math.random() * 0.4), r.height * (0.25 + Math.random() * 0.4));
        }, i * 90);
      }
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const h = document.createElement("div");
          h.className = "brush-heart";
          h.textContent = "❤️";
          h.style.left = (r.width * (0.25 + Math.random() * 0.5)) + "px";
          h.style.top = (r.height * (0.2 + Math.random() * 0.35)) + "px";
          wrap.appendChild(h);
          setTimeout(() => h.remove(), 900);
        }, i * 80);
      }
      setTimeout(() => {
        wrap.classList.remove("sparkle");
        root.classList.add("hidden");
        document.body.classList.remove("bathing", "brushing");
        if (onDone) onDone();
      }, 900);
    }

    // Spots sit on the wool body (right/back), never on the face or hat.
    const layout = [
      { x: 0.62, y: 0.40 },
      { x: 0.90, y: 0.42 },
      { x: 0.74, y: 0.54 },
      { x: 0.52, y: 0.66 },
      { x: 0.80, y: 0.76 },
      { x: 0.96, y: 0.62 },
    ];
    if (spotsEl) spotsEl.innerHTML = "";
    const host = actor || spotsEl;
    const spots = layout.slice(0, N).map((pt, i) => {
      const el = document.createElement("img");
      el.className = "brush-spot";
      el.src = assetUrl("assets/" + kinds[i] + ".png");
      el.alt = kinds[i] === "burr" ? "burr" : "dust";
      el.draggable = false;
      el.style.left = (pt.x * 100) + "%";
      el.style.top = (pt.y * 100) + "%";
      if (host) host.appendChild(el);
      else if (spotsEl) spotsEl.appendChild(el);
      return { el, gone: false, x: pt.x, y: pt.y };
    });

    function clearSpot(s) {
      if (!s || s.gone) return;
      s.gone = true;
      const wr = wrap.getBoundingClientRect();
      const b = s.el.getBoundingClientRect();
      const x = (b.left + b.width / 2) - wr.left;
      const y = (b.top + b.height / 2) - wr.top;
      s.el.classList.add("gone");
      setTimeout(() => s.el.remove(), 280);
      sparkleAt(x, y);
      puffAt(x, y);
      fluff = Math.min(100, fluff + Math.ceil(100 / N));
      setMeter();
      blip("sparkle");
      if (spots.every((sp) => sp.gone)) finish();
      else setHint("Keep brushing");
    }

    function hit(clientX, clientY) {
      const r = 26;
      for (const s of spots) {
        if (s.gone) continue;
        const b = s.el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        if (Math.hypot(clientX - cx, clientY - cy) < r) clearSpot(s);
      }
    }

    let lastTouch = Date.now();
    function pointer(e) {
      const ev = (e.touches && e.touches[0]) || e;
      if (!ev) return;
      lastTouch = Date.now();
      hit(ev.clientX, ev.clientY);
    }
    wrap.onpointerdown = (e) => { e.preventDefault(); pointer(e); };
    wrap.onpointermove = (e) => { if (e.buttons || e.pressure) pointer(e); };
    wrap.ontouchstart = (e) => { e.preventDefault(); pointer(e); };
    wrap.ontouchmove = (e) => { e.preventDefault(); pointer(e); };

    try {
      const cur = assetUrl("assets/brush_cursor.png");
      wrap.style.cursor = 'url("' + cur + '") 30 26, pointer';
    } catch (err) {}

    fluff = 0;
    setMeter();
    setHint("Brush the burrs");
    if (sheepImg) {
      sheepImg.src = sheepDataUrl("idle");
      sheepImg.classList.remove("shake");
    }
    if (actor) actor.classList.remove("shake", "fluffy");
    wrap.classList.remove("sparkle");
    root.classList.remove("hidden");
    document.body.classList.add("bathing", "brushing");
    dressPreview(sheepImg, $("brushHat"), $("brushCollar"));
    requestAnimationFrame(() => dressPreview(sheepImg, $("brushHat"), $("brushCollar")));

    let helpI = 0;
    helpTimer = setInterval(() => {
      if (done) return;
      if (Date.now() - lastTouch < 2800) return;
      const left = spots.filter((s) => !s.gone);
      if (!left.length) { finish(); return; }
      helpI++;
      if (helpI % 2 === 0) clearSpot(left[0]);
    }, 900);
  }

  function canPickField(pet) {
    const a = allowedFieldIds(pet || (state && state.pet));
    return !!(a && a.length > 1);
  }
  function canPickItems() {
    // Food, water, and bed are painted into every current field map.
    return false;
  }
  async function openLooks() {
    try { state = Object.assign(state || {}, await MyPetApi.me()); } catch (e) {}
    grantStaticUnlocks();
    renderHud();
    renderLooks();
    const tabField = $("tabField");
    if (tabField) tabField.classList.toggle("hidden", !canPickField());
    const tabItems = $("tabItems");
    if (tabItems) tabItems.classList.toggle("hidden", !canPickItems());
    showLooksTab("looks");
    $("looks").classList.remove("hidden");
  }
  function closeLooks() { $("looks").classList.add("hidden"); }

  let rehomeIndex = null;
  function openRehome(index) {
    const pets = (state && state.pets) || [];
    const i = (typeof index === "number") ? index
      : (typeof state.activePet === "number" ? state.activePet : 0);
    if (i < 0 || i >= pets.length) return;
    rehomeIndex = i;
    closeLooks();
    const name = (pets[i] && pets[i].name) || "This pet";
    if ($("rehomeConfirmLead")) $("rehomeConfirmLead").textContent = name + " can go to a new home.";
    if ($("rehomeConfirm")) $("rehomeConfirm").classList.remove("hidden");
  }
  function closeRehomeConfirm() {
    rehomeIndex = null;
    if ($("rehomeConfirm")) $("rehomeConfirm").classList.add("hidden");
  }
  function closeRehomeBye() {
    if ($("rehomeBye")) $("rehomeBye").classList.add("hidden");
    const leftover = ((state && state.pets) || []).length;
    if (!leftover) openAdopt();
  }
  function confirmRehome() {
    const pets = (state && state.pets) || [];
    const i = (typeof rehomeIndex === "number") ? rehomeIndex
      : (typeof state.activePet === "number" ? state.activePet : 0);
    if (i < 0 || i >= pets.length) return;
    const name = (pets[i] && pets[i].name) || "This pet";
    const onSlots = viewSlot >= pets.length;
    pets.splice(i, 1);
    state.pets = pets;
    rehomeIndex = null;
    closeRehomeConfirm();
    if (pets.length) {
      state.activePet = Math.min(i, pets.length - 1);
      state.pet = pets[state.activePet];
      viewSlot = onSlots ? pets.length : state.activePet;
      persistStaticPet();
      applySceneForPet();
      renderHud();
      renderLooks();
      renderPetChrome();
    } else {
      state.pet = null;
      state.activePet = 0;
      viewSlot = 0;
      persistStaticPet();
      if (pasture && pasture.sheep) {
        pasture.sheep.setVisible(false);
        if (pasture.costume) pasture.costume.setVisible(false);
        if (pasture.collar) pasture.collar.setVisible(false);
        if (pasture.partyHat) pasture.partyHat.setVisible(false);
      }
      if (pasture && pasture.placeCareItems) pasture.placeCareItems();
      if (pasture && pasture.placeHomeDecor) pasture.placeHomeDecor();
      renderHud();
      renderPetChrome();
    }
    if ($("rehomeByeTitle")) $("rehomeByeTitle").textContent = "Take care, " + name + ".";
    if ($("rehomeByeLead")) $("rehomeByeLead").textContent = name + " has a kind new home now.";
    if ($("rehomeBye")) $("rehomeBye").classList.remove("hidden");
  }
  function showLooksTab(which) {
    which = which || "looks";
    const tabs = { looks: $("tabLooks"), items: $("tabItems"), field: $("tabField") };
    const panes = { looks: $("looksPane"), items: $("itemsPane"), field: $("fieldPane") };
    ["looks", "items", "field"].forEach((id) => {
      if (tabs[id]) tabs[id].classList.toggle("on", which === id);
      if (panes[id]) panes[id].classList.toggle("hidden", which !== id);
    });
    if (which === "field") {
      if (!canPickField()) { showLooksTab("looks"); return; }
      renderFieldPicker();
    }
    if (which === "items") {
      if (!canPickItems()) { showLooksTab("looks"); return; }
      renderItemsPicker();
    }
  }
  function renderItemsPicker() {
    const box = $("itemsGrid");
    if (!box || !window.MyPetSpecies || !state || !state.pet) return;
    MyPetSpecies.normalizeItems(state.pet);
    box.innerHTML = "";
    const labels = { water: "💧 Water", food: "🥕 Food", bed: "🛏️ Bed" };
    ["water", "food", "bed"].forEach((slot) => {
      const row = document.createElement("div");
      row.className = "item-row";
      const lab = document.createElement("div");
      lab.className = "lab";
      lab.textContent = labels[slot];
      row.appendChild(lab);
      const picks = document.createElement("div");
      picks.className = "item-picks";
      const cur = state.pet.items[slot];
      MyPetSpecies.ITEMS[slot].forEach((it) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item-pick" + (it.id === cur ? " on" : "");
        btn.innerHTML = '<img alt="" src="' + assetUrl("assets/" + it.file) + '"><span class="name">' + it.emoji + " " + it.name + "</span>";
        btn.addEventListener("click", () => {
          state.pet.items[slot] = it.id;
          persistStaticPet();
          if (pasture && pasture.placeCareItems) pasture.placeCareItems();
          renderItemsPicker();
          toast(it.emoji + " " + it.name);
          blip("click");
        });
        picks.appendChild(btn);
      });
      row.appendChild(picks);
      box.appendChild(row);
    });
  }
  function renderFieldPicker() {
    const grid = $("fieldGrid");
    if (!grid || !window.MyPetWorld) return;
    const cur = currentFieldId();
    const allowed = allowedFieldIds();
    grid.innerHTML = "";
    MyPetWorld.FIELDS.forEach((f) => {
      if (allowed.indexOf(f.id) < 0) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "field-pick" + (f.id === cur ? " on" : "");
      btn.innerHTML = '<img alt="" src="' + assetUrl("assets/" + f.thumb) + '"><span class="name">' + f.emoji + " " + f.name + "</span>";
      btn.addEventListener("click", () => setFieldTheme(f.id));
      grid.appendChild(btn);
    });
  }
  function setFieldTheme(id, quiet, arrive) {
    if (!state || !state.pet || !window.MyPetWorld) return;
    if (MyPetWorld.FIELD_IDS.indexOf(id) < 0) return;
    if (MyPetWorld.clampFieldId) id = MyPetWorld.clampFieldId(id, state.pet);
    state.pet.fieldTheme = id;
    persistStaticPet();
    if (pasture && pasture.setFieldTheme) pasture.setFieldTheme(id, arrive);
    renderFieldPicker();
    if (!quiet) blip("click");
  }
  function openFriend() { $("friend").classList.remove("hidden"); }
  function closeFriend() { $("friend").classList.add("hidden"); }

  function bindUi() {
    $("toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn || !pasture) return;
      if (viewSlot >= ((state && state.pets) || []).length) {
        goToSlot(((state && state.pets) || []).length - 1, -1);
        return;
      }
      const act = btn.dataset.act;
      if (act === "brush") pasture.startBrush();
      else if (act === "bath") pasture.startBath();
      else if (act === "play") pasture.startPlay();
      else if (act === "treat") pasture.startTreat();
      else if (act === "photo") pasture.takePhoto();
      else if (act === "looks") openLooks();
      else if (act === "friend") openFriend();
    });
    $("looksClose").addEventListener("click", closeLooks);
    const rehomeNo = $("rehomeNo");
    if (rehomeNo) rehomeNo.addEventListener("click", closeRehomeConfirm);
    const rehomeYes = $("rehomeYes");
    if (rehomeYes) rehomeYes.addEventListener("click", confirmRehome);
    const rehomeByeOk = $("rehomeByeOk");
    if (rehomeByeOk) rehomeByeOk.addEventListener("click", closeRehomeBye);
    const tabLooks = $("tabLooks");
    const tabItems = $("tabItems");
    const tabField = $("tabField");
    if (tabLooks) tabLooks.addEventListener("click", () => showLooksTab("looks"));
    if (tabItems) tabItems.addEventListener("click", () => showLooksTab("items"));
    if (tabField) tabField.addEventListener("click", () => showLooksTab("field"));
    $("friendClose").addEventListener("click", closeFriend);
    const testBtn = $("testBtn");
    if (testBtn) {
      testBtn.addEventListener("click", () => addTestHearts(10));
      if (window.MYPET_TEST_MODE) testBtn.classList.remove("hidden");
    }
    $("adoptBtn").addEventListener("click", onAdopt);
    $("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") onAdopt(); });
    bindRosterUi();
  }

  function defaultAdoptPick(speciesId) {
    const sp = window.MyPetSpecies && MyPetSpecies.of(speciesId || "sheep_valais");
    const def = (sp && sp.defaults) || { wool: "white", face: "black", eyes: "white" };
    const pick = {
      species: (sp && sp.id) || "sheep_valais",
      wool: def.wool, face: def.face, eyes: def.eyes,
      field: (sp && sp.defaultField) || "meadow",
    };
    if (window.MyPetColor && MyPetColor.ensureDye) MyPetColor.ensureDye(pick);
    return pick;
  }
  function syncAdoptNamePlaceholder() {
    const el = $("nameInput");
    if (!el) return;
    const pick = window._adoptPick || defaultAdoptPick("sheep_valais");
    el.placeholder = defaultPetName(pick.species || "sheep_valais");
  }

  function renderSpeciesCards() {
    const row = $("speciesRow");
    if (!row) return;
    if (!window._adoptPick) window._adoptPick = defaultAdoptPick("sheep_valais");
    const list = window.MyPetSpecies
      ? Object.keys(MyPetSpecies.SPECIES).map((id) => MyPetSpecies.SPECIES[id]).filter((s) => s.ready)
      : [{ id: "sheep_valais", name: "Valais sheep", short: "Valais", emoji: "🐑", prefix: "sheep", ready: true }];
    row.innerHTML = "";
    list.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "species-card" + (window._adoptPick.species === s.id ? " on" : "");
      b.setAttribute("data-id", s.id);
      const img = document.createElement("img");
      img.alt = s.name;
      const file = (s.prefix || "sheep") + "_idle.png";
      const colors = window._adoptPick.species === s.id
        ? window._adoptPick
        : ((window.MyPetSpecies && MyPetSpecies.of(s.id).defaults) || { wool: "white", face: "black", eyes: "white" });
      const im = COLOR_IMG[file];
      if (im && im.naturalWidth && window.MyPetColor && MyPetColor.recolorPetImage) {
        img.src = MyPetColor.recolorPetImage(im, colors, s.id).toDataURL("image/png");
      } else {
        img.src = assetUrl("assets/" + file);
        if (!im) loadColorImg(file, renderSpeciesCards);
      }
      const name = document.createElement("span");
      name.textContent = s.emoji + " " + (s.short || s.name);
      b.appendChild(img);
      b.appendChild(name);
      b.addEventListener("click", () => {
        window._adoptPick = defaultAdoptPick(s.id);
        const ac = $("adoptColors");
        if (ac) ac.dataset.dyeSig = "";
        bindAdoptColors();
        syncAdoptNamePlaceholder();
        renderSpeciesCards();
        renderAdoptFields();
        refreshAdoptPreview();
      });
      row.appendChild(b);
    });
  }
  function renderSoonCards() {
    const row = $("soonRow");
    if (!row || !window.MyPetRoster) return;
    row.innerHTML = "";
    const list = MyPetRoster.COMING_SOON || [];
    const lab = document.querySelector(".soon-label");
    const empty = !list.length;
    if (lab) lab.style.display = empty ? "none" : "";
    row.style.display = empty ? "none" : "";
    if (empty) return;
    list.forEach((s) => {
      const b = document.createElement("div");
      b.className = "soon-card";
      const img = document.createElement("img");
      img.alt = "";
      img.src = assetUrl("assets/" + s.file);
      const name = document.createElement("span");
      name.textContent = s.emoji + " " + s.name;
      const tag = document.createElement("span");
      tag.className = "soon-tag";
      tag.textContent = "Coming soon";
      const lock = document.createElement("span");
      lock.className = "lock-mark";
      lock.textContent = "🔒";
      b.appendChild(lock);
      b.appendChild(img);
      b.appendChild(name);
      b.appendChild(tag);
      row.appendChild(b);
    });
  }

  function renderAdoptFields() {
    const row = $("adoptFields");
    if (!row || !window.MyPetWorld) return;
    if (!window._adoptPick) window._adoptPick = defaultAdoptPick("sheep_valais");
    if (!window._adoptPick.species) window._adoptPick.species = "sheep_valais";
    const allowed = allowedFieldIds(window._adoptPick);
    const home = (allowed && allowed[0]) || (window.MyPetSpecies && MyPetSpecies.of(window._adoptPick).defaultField) || "meadow";
    if (!window._adoptPick.field || allowed.indexOf(window._adoptPick.field) < 0) window._adoptPick.field = home;
    row.innerHTML = "";
    if (!allowed || allowed.length <= 1) {
      row.style.display = "none";
      return;
    }
    row.style.display = "";
    MyPetWorld.FIELDS.forEach((f) => {
      if (allowed.indexOf(f.id) < 0) return;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "adopt-field" + (window._adoptPick.field === f.id ? " on" : "");
      const img = document.createElement("img");
      img.alt = "";
      img.src = assetUrl("assets/" + f.thumb);
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = f.emoji + " " + f.name;
      b.appendChild(img);
      b.appendChild(name);
      b.addEventListener("click", () => {
        window._adoptPick.field = f.id;
        renderAdoptFields();
      });
      row.appendChild(b);
    });
  }

  function prepareAdoptPaper() {
    const d = $("adoptDate");
    if (d && window.MyPetRoster) d.textContent = MyPetRoster.formatShort(MyPetRoster.pacificYmd(new Date()));
    renderSpeciesCards();
    renderSoonCards();
    renderAdoptFields();
    bindAdoptColors();
    refreshAdoptPreview();
  }

  function openAdopt() {
    prepareAdoptPaper();
    if ($("nameInput")) $("nameInput").value = "";
    syncAdoptNamePlaceholder();
    if ($("adoptBtn")) $("adoptBtn").disabled = false;
    $("adopt").classList.remove("hidden");
  }

  function playStampAndConfetti() {
    return new Promise((resolve) => {
      const fx = $("stampFx");
      const conf = $("confetti");
      if (fx) {
        fx.classList.remove("hidden");
        fx.classList.remove("go");
        void fx.offsetWidth;
        fx.classList.add("go");
      }
      if (conf) {
        // v33: lift confetti to the page so it falls past the whole UI, not half the card.
        if (conf.parentNode !== document.body) document.body.appendChild(conf);
        conf.innerHTML = "";
        const colors = ["#e8899a", "#f3d291", "#8fd3a0", "#8ec8e8", "#d4a0e8", "#f3b36a", "#fff"];
        for (let i = 0; i < 36; i++) {
          const el = document.createElement("i");
          el.style.left = (3 + Math.random() * 94) + "%";
          el.style.background = colors[i % colors.length];
          el.style.width = (8 + Math.random() * 8) + "px";
          el.style.height = (12 + Math.random() * 10) + "px";
          el.style.animationDelay = (Math.random() * 0.2) + "s";
          el.style.animationDuration = (1.5 + Math.random() * 0.8) + "s";
          conf.appendChild(el);
        }
      }
      blip("unlock");
      if (conf) setTimeout(() => { conf.innerHTML = ""; }, 2600);
      setTimeout(resolve, 900);
    });
  }

  function applyBirthdayDecor(on) {
    if (on == null) {
      on = !!(window.MyPetRoster && state && state.pet
        && viewSlot === state.activePet
        && MyPetRoster.isBirthdayToday(state.pet));
    }
    if (!pasture) return;
    if (pasture.bunting) {
      const s = pasture.fScale || 1;
      pasture.bunting.setVisible(!!on);
      pasture.bunting.setDisplaySize(864 * s, 48 * s * 1.35);
      const pos = pasture.toWorld(512, 108);
      pasture.bunting.x = pos.x;
      pasture.bunting.y = pos.y;
      pasture.bunting.setDepth(8);
    }
    if (pasture.layoutWear) pasture.layoutWear();
  }

  function applySceneForPet() {
    if (!pasture) return;
    applyPetLook();
    if (state.pet && state.pet.fieldTheme) setFieldTheme(state.pet.fieldTheme, true);
    if (pasture.wear) pasture.wear(state.pet && state.pet.costume);
    if (pasture.wearCollar) pasture.wearCollar(state.pet && state.pet.collar);
    if (pasture.toWorld && pasture.place) {
      const st = (typeof fieldLayout === "function" && fieldLayout().start) || { x: 512, y: 560 };
      const start = pasture.toWorld(st.x, st.y);
      pasture.place(start.x, start.y);
    }
    if (pasture.sheep) {
      pasture.sheep.setVisible(viewSlot < ((state.pets || []).length));
      pasture.sheep.flipX = false;
      pasture.mode = "idle";
      if (pasture.sheep.anims) pasture.sheep.stop();
      const idle = pasture.textures.exists(liveKey("idle")) ? liveKey("idle") : "idle";
      pasture.sheep.setTexture(idle);
    }
    applyBirthdayDecor();
    if (pasture.placeCareItems) pasture.placeCareItems();
    if (pasture.placeHomeDecor) pasture.placeHomeDecor();
    if (pasture.applyFieldLayout) pasture.applyFieldLayout();
    if (pasture.clearMood) pasture.clearMood();
    if (pasture.applyWorld) pasture.applyWorld(true);
    applySky();
    busy = false;
  }

  function renderSlotGrid(host, n, unlocked, max) {
    const grid = document.createElement("div");
    grid.className = "slot-grid";
    for (let i = 0; i < max; i++) {
      const here = viewSlot === i || (i >= n && viewSlot >= n && i === n);
      if (i < n) {
        const wrap = document.createElement("div");
        wrap.className = "slot-spot" + (here ? " here" : "");
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "slot-cell filled" + (here ? " here" : "");
        cell.textContent = "🐾";
        const name = (state.pets[i] && state.pets[i].name) || ("Pet " + (i + 1));
        cell.title = name;
        cell.setAttribute("aria-label", name);
        const idx = i;
        cell.addEventListener("click", () => goToSlot(idx));
        const rh = document.createElement("button");
        rh.type = "button";
        rh.className = "slot-rehome";
        rh.textContent = "🏡 Re-home";
        rh.title = "Re-home " + name;
        rh.setAttribute("aria-label", "Re-home " + name);
        rh.addEventListener("click", (ev) => { ev.stopPropagation(); openRehome(idx); });
        wrap.appendChild(cell);
        wrap.appendChild(rh);
        grid.appendChild(wrap);
      } else {
        const cell = document.createElement("button");
        cell.type = "button";
        const kind = i < unlocked ? "plus" : "lock";
        cell.className = "slot-cell " + kind + (here ? " here" : "");
        cell.textContent = i < unlocked ? "➕" : "🔒";
        cell.title = i < unlocked ? "Adopt" : "Locked";
        cell.addEventListener("click", () => goToSlot(n));
        grid.appendChild(cell);
      }
    }
    host.appendChild(grid);
  }

  function renderSlotCard(locked) {
    const card = $("slotCard");
    if (!card) return;
    const n = ((state && state.pets) || []).length;
    const need = window.MyPetRoster ? MyPetRoster.slotAt(n + 1) : 30;
    const have = window.MyPetRoster ? MyPetRoster.totalHearts(state) : 0;
    const unlocked = window.MyPetRoster ? MyPetRoster.unlockedSlots(state) : 1;
    const max = window.MyPetRoster ? MyPetRoster.MAX_SLOTS : 14;
    card.innerHTML = "";
    const title = document.createElement("div"); title.className = "slot-title";
    title.textContent = locked ? "Soon" : "Adopt";
    card.appendChild(title);
    renderSlotGrid(card, n, unlocked, max);
    if (locked) {
      const pct = Math.min(100, Math.round((have / Math.max(need, 1)) * 100));
      const needP = document.createElement("p"); needP.className = "slot-need"; needP.textContent = "Need 💗 " + need;
      const bar = document.createElement("div"); bar.className = "heart-bar"; bar.setAttribute("aria-label", "Hearts");
      const fill = document.createElement("span"); fill.style.width = pct + "%"; bar.appendChild(fill);
      const haveP = document.createElement("p"); haveP.className = "slot-need"; haveP.textContent = "💗 " + have + " / " + need;
      card.appendChild(needP); card.appendChild(bar); card.appendChild(haveP);
    } else {
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "big"; btn.id = "slotAdoptBtn"; btn.textContent = "💗 Adopt";
      btn.addEventListener("click", () => openAdopt());
      card.appendChild(btn);
    }
  }

  function renderPetChrome() {
    const n = (state && state.pets && state.pets.length) || 0;
    const hasPet = n > 0;
    const jbtn = $("journalBtn");
    if (jbtn) jbtn.classList.toggle("hidden", !hasPet || viewSlot >= n);
    const dots = $("petDots");
    const prev = $("petPrev");
    const next = $("petNext");
    const pane = $("slotPane");
    const unlocked = window.MyPetRoster ? MyPetRoster.unlockedSlots(state) : 1;
    const max = window.MyPetRoster ? MyPetRoster.MAX_SLOTS : 14;
    if (viewSlot == null) viewSlot = (state && state.activePet) || 0;
    if (viewSlot < 0) viewSlot = 0;
    if (viewSlot > n) viewSlot = n;
    if (dots) {
      dots.classList.remove("hidden");
      dots.innerHTML = "";
      for (let i = 0; i < max; i++) {
        const b = document.createElement("button");
        b.type = "button";
        if (i < n) {
          b.className = "pet-dot" + (viewSlot === i ? " on" : "");
          const name = (state.pets[i] && state.pets[i].name) || ("Pet " + (i + 1));
          b.title = name;
          b.setAttribute("aria-label", name);
          b.addEventListener("click", () => goToSlot(i));
        } else if (i < unlocked) {
          b.className = "pet-dot plus" + (viewSlot === n && i === n ? " on" : "");
          b.textContent = "➕";
          b.title = "Adopt";
          b.setAttribute("aria-label", "Adopt");
          b.addEventListener("click", () => goToSlot(n));
        } else {
          b.className = "pet-dot lock";
          b.textContent = "🔒";
          b.title = "Locked";
          b.setAttribute("aria-label", "Locked");
          b.addEventListener("click", () => goToSlot(n));
        }
        dots.appendChild(b);
      }
    }
    const onSlots = viewSlot >= n || !hasPet;
    if (prev) prev.classList.toggle("hidden", viewSlot <= 0 || onSlots);
    if (next) next.classList.toggle("hidden", viewSlot >= n || onSlots);
    if (pane) {
      if (viewSlot >= n || !hasPet) {
        pane.classList.remove("hidden");
        renderSlotCard(n >= unlocked);
      } else {
        pane.classList.add("hidden");
      }
    }
    if (pasture && pasture.sheep) {
      const show = viewSlot < n;
      pasture.sheep.setVisible(show);
      if (!show) {
        if (pasture.costume) pasture.costume.setVisible(false);
        if (pasture.collar) pasture.collar.setVisible(false);
        if (pasture.partyHat) pasture.partyHat.setVisible(false);
      }
    }
  }

  function goToSlot(i, dir) {
    if (slotBusy) return;
    const n = ((state && state.pets) || []).length;
    if (i < 0 || i > n) return;
    if (i === viewSlot) return;
    dir = dir || (i > viewSlot ? 1 : -1);
    slotBusy = true;
    const g = $("game");
    if (g) {
      g.classList.remove("slide-left", "slide-right");
      void g.offsetWidth;
      g.classList.add(dir > 0 ? "slide-left" : "slide-right");
    }
    setTimeout(() => {
      viewSlot = i;
      if (i < n) {
        persistStaticPet();
        state.activePet = i;
        state.pet = state.pets[i];
        persistStaticPet();
        applySceneForPet();
        renderHud();
        renderLooks();
        maybeCelebrateBirthday();
      } else {
        applyBirthdayDecor(false);
        if (pasture && pasture.sheep) pasture.sheep.setVisible(false);
      }
      renderPetChrome();
      setTimeout(() => { slotBusy = false; }, 200);
    }, 120);
  }

  let bdayPending = null;

  function showBirthday(st) {
    bdayPending = st;
    const year = st.type === "year";
    if ($("bdayTitle")) $("bdayTitle").textContent = year ? "🎂 Happy birthday!" : "🎂 A little birthday!";
    const name = (state.pet && state.pet.name) || "Friend";
    if ($("bdayLead")) {
      $("bdayLead").textContent = year
        ? (name + " is " + (st.years || 1) + " today.")
        : ("One more month with " + name + ".");
    }
    if ($("bdayBonus")) $("bdayBonus").textContent = "+" + (st.bonus || 0) + " 💗";
    $("bday").classList.remove("hidden");
  }

  function maybeCelebrateBirthday() {
    if (!window.MyPetRoster || !state || !state.pet || viewSlot !== state.activePet) {
      applyBirthdayDecor(false);
      return;
    }
    const st = MyPetRoster.birthdayStatus(state.pet);
    applyBirthdayDecor(!!(st && st.party));
    if (!st || !st.type || st.seen) return;
    showBirthday(st);
  }

  async function closeBirthday() {
    if ($("bday")) $("bday").classList.add("hidden");
    const st = bdayPending;
    bdayPending = null;
    if (!st || !state || !state.pet) return;
    MyPetRoster.markBirthdaySeen(state.pet, st.key);
    if (st.bonus) {
      if (MyPetApi.addHearts) {
        try {
          const res = await MyPetApi.addHearts(st.bonus);
          mergePet(res.pet || state.pet);
        } catch (e) {
          state.pet.friendship = (state.pet.friendship || 0) + st.bonus;
        }
      } else {
        state.pet.friendship = (state.pet.friendship || 0) + st.bonus;
      }
    }
    MyPetRoster.logMilestone(state.pet, "bday_" + st.key, st.type === "year" ? "Birthday" : "Mini birthday", "🎂");
    MyPetRoster.maybeHeartMilestones(state.pet);
    const grantedExtra = grantStaticUnlocks();
    persistStaticPet();
    renderHud();
    renderPetChrome();
    applyBirthdayDecor(true);
    if (grantedExtra.length) noteUnlocks({}, grantedExtra);
    toast("+" + (st.bonus || 0) + " 💗");
    blip("heart");
  }

  function openJournal() {
    if (!state || !state.pet || !window.MyPetRoster) return;
    const p = state.pet;
    if ($("jName")) $("jName").textContent = p.name;
    const days = MyPetRoster.daysTogether(p);
    if ($("jMeta")) $("jMeta").textContent = "🎂 " + MyPetRoster.formatShort(p.birthday) + " · Together " + days + " days";
    const ul = $("jMiles");
    if (ul) {
      ul.innerHTML = "";
      const miles = (p.journal && p.journal.milestones) || [];
      if (!miles.length) {
        const li = document.createElement("li");
        li.className = "j-empty";
        li.textContent = "No notes yet.";
        ul.appendChild(li);
      } else {
        miles.forEach((m) => {
          const li = document.createElement("li");
          const e = document.createElement("span"); e.className = "e"; e.textContent = m.emoji || "💗";
          const lab = document.createElement("span"); lab.textContent = m.label;
          const when = document.createElement("span"); when.className = "when"; when.textContent = MyPetRoster.formatShort(m.date);
          li.appendChild(e); li.appendChild(lab); li.appendChild(when);
          ul.appendChild(li);
        });
      }
    }
    const album = $("jAlbum");
    if (album) {
      album.innerHTML = "";
      const photos = (p.journal && p.journal.photos) || [];
      if (!photos.length) {
        const empty = document.createElement("div");
        empty.className = "j-empty";
        empty.style.gridColumn = "1 / -1";
        empty.textContent = "No photos yet. Tap 📷 Photo.";
        album.appendChild(empty);
      } else {
        photos.slice().reverse().forEach((ph) => {
          const im = document.createElement("img");
          im.src = ph.src;
          im.alt = ph.date || "photo";
          album.appendChild(im);
        });
      }
    }
    $("journal").classList.remove("hidden");
  }

  function saveJournalPhoto(dataUrl) {
    if (!window.MyPetRoster || !state || !state.pet || !dataUrl) return;
    const im = new Image();
    im.onload = () => {
      const w = 200, h = Math.max(1, Math.round(im.height * 200 / Math.max(im.width, 1)));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(im, 0, 0, w, h);
      let out = dataUrl;
      try { out = c.toDataURL("image/jpeg", 0.7); } catch (e) {}
      MyPetRoster.addPhoto(state.pet, out);
      persistStaticPet();
    };
    im.src = dataUrl;
  }

  function bindRosterUi() {
    if ($("petPrev")) $("petPrev").addEventListener("click", () => goToSlot(viewSlot - 1, -1));
    if ($("petNext")) $("petNext").addEventListener("click", () => goToSlot(viewSlot + 1, 1));
    if ($("journalBtn")) $("journalBtn").addEventListener("click", openJournal);
    if ($("journalClose")) $("journalClose").addEventListener("click", () => $("journal").classList.add("hidden"));
    if ($("bdayClose")) $("bdayClose").addEventListener("click", closeBirthday);
    let sx = 0, sy = 0, st = 0;
    const app = $("app") || document.body;
    app.addEventListener("touchstart", (e) => {
      if (!e.touches || !e.touches[0]) return;
      const t = e.target;
      if (t && t.closest && (t.closest("button") || t.closest("input") || t.closest(".overlay"))) return;
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    }, { passive: true });
    app.addEventListener("touchend", (e) => {
      if (!sx) return;
      const t = (e.changedTouches && e.changedTouches[0]) || {};
      const dx = (t.clientX || 0) - sx, dy = (t.clientY || 0) - sy;
      sx = 0;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
      if (Date.now() - st > 800) return;
      if (document.querySelector(".overlay:not(.hidden)")) return;
      if (dx < 0) goToSlot(viewSlot + 1, 1);
      else goToSlot(viewSlot - 1, -1);
    }, { passive: true });
  }

  async function onAdopt() {
    const pick = window._adoptPick || defaultAdoptPick("sheep_valais");
    const typed = ($("nameInput").value || "").trim().slice(0, 24);
    const name = typed || defaultPetName(pick.species || "sheep_valais");
    try {
      $("adoptBtn").disabled = true;
      await playStampAndConfetti();
      const already = !!(state && state.pets && state.pets.length);
      let pet;
      if (!already) {
        state = await MyPetApi.adopt(name, "sheep_valais", "field");
        pet = state.pet;
      } else {
        pet = MyPetRoster.makePet({
          name: name,
          species: pick.species || "sheep_valais",
          wool: pick.wool,
          face: pick.face,
          eyes: pick.eyes,
          dye: pick.dye,
          fieldTheme: pick.field || "meadow",
        });
        if (window.MyPetColor) MyPetColor.migratePet(pet);
        if (!Array.isArray(state.pets)) state.pets = [];
        state.pets.push(pet);
        state.activePet = state.pets.length - 1;
        state.pet = pet;
      }
      if (pet) {
        pet.name = name;
        pet.species = pick.species || pet.species || "sheep_valais";
        pet.wool = pick.wool;
        pet.face = pick.face;
        pet.eyes = pick.eyes;
        if (pick.dye) pet.dye = JSON.parse(JSON.stringify(pick.dye));
        pet.fieldTheme = pick.field || (window.MyPetSpecies && MyPetSpecies.of(pet).defaultField) || "meadow";
        if (window.MyPetSpecies) {
          pet.items = MyPetSpecies.defaultItems(pet);
          MyPetSpecies.normalizeItems(pet);
        }
        if (window.MyPetColor) MyPetColor.migratePet(pet);
        if (window.MyPetRoster) {
          MyPetRoster.normalizePet(pet);
          MyPetRoster.logMilestone(pet, "adopted", "Came home", "💗", pet.birthday);
        }
      }
      if (!Array.isArray(state.pets) || !state.pets.length) {
        state.pets = [pet];
        state.activePet = 0;
      }
      state.pet = pet;
      persistStaticPet();
      $("adopt").classList.add("hidden");
      const fx = $("stampFx");
      if (fx) fx.classList.add("hidden");
      viewSlot = state.activePet;
      if (!game) startGame();
      else {
        applySceneForPet();
        renderHud();
        renderLooks();
        renderPetChrome();
      }
      toast("Welcome, " + state.pet.name + " 💗");
      blip("unlock");
      $("adoptBtn").disabled = false;
    } catch (err) {
      toast(String(err.message || err));
      $("adoptBtn").disabled = false;
      const fx = $("stampFx");
      if (fx) fx.classList.add("hidden");
    }
  }


  function whenUiFontsReady() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    const loads = [
      document.fonts.load("800 32px \"Baloo 2\""),
      document.fonts.load("700 32px \"Baloo 2\""),
      document.fonts.load("600 24px \"Baloo 2\""),
      document.fonts.load("400 16px Lexend"),
      document.fonts.load("500 16px Lexend"),
      document.fonts.load("600 16px Lexend"),
    ];
    const ready = document.fonts.ready || Promise.resolve();
    return Promise.race([
      Promise.all([ready].concat(loads.map((p) => p.catch(() => null)))),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }

  function startGame() {
    $("hud").classList.remove("hidden");
    $("boot").classList.add("hidden");
    applySky();
    renderHud();
    viewSlot = (state && typeof state.activePet === "number") ? state.activePet : 0;
    renderPetChrome();
    if (game) {
      applySceneForPet();
      setTimeout(() => maybeCelebrateBirthday(), 400);
      return;
    }
    const bootPhaser = () => {
    if (game) return;
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: W,
      height: H,
      backgroundColor: "#c5dff2",
      pixelArt: true,
      antialias: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Pasture],
    });
    window.__mypet = {
      game, get pasture() { return pasture; }, get state() { return state; },
      toast, toastWhenFree, doCare, renderHud, addHearts: addTestHearts,
      openBath: openBathMini,
      startBathRinse: () => openBathMini._api && openBathMini._api.startRinse(),
      startBathDry: () => openBathMini._api && openBathMini._api.startDry(),
      finishBathDry: () => openBathMini._api && openBathMini._api.finishDry(),
      bathApi: () => openBathMini._api,
      openBrush: openBrushMini,
      setPetColors: (wool, face, eyes) => {
        if (!state || !state.pet) return;
        if (wool) state.pet.wool = wool;
        if (face) state.pet.face = face;
        if (eyes) state.pet.eyes = eyes;
        if (state.pet.dye) {
          ["wool", "face", "eyes"].forEach((k) => {
            if (state.pet.dye[k]) state.pet.dye[k].custom = false;
          });
        }
        if (window.MyPetColor) MyPetColor.migratePet(state.pet);
        persistStaticPet();
        applyPetLook();
        renderLooks();
        refreshAdoptPreview();
      },
      setDye: (key, dye) => {
        if (!state || !state.pet || !dye) return;
        if (!state.pet.dye) state.pet.dye = {};
        const next = { h: +dye.h || 0, s: +dye.s || 0, l: (dye.l == null ? 0.5 : +dye.l), custom: true };
        if (key === "all") {
          ["wool", "face"].forEach((k) => { state.pet.dye[k] = Object.assign({}, next); state.pet[k] = "custom"; });
        } else {
          state.pet.dye[key] = next;
          state.pet[key] = "custom";
        }
        persistStaticPet();
        applyPetLook();
        const box = $("looksColors");
        if (box) box.dataset.dyeSig = "";
        renderLooks();
      },
      setCostumeColor,
      applyPetLook,
      catchButterfly: () => pasture && pasture.catchNearestButterfly && pasture.catchNearestButterfly(),
      spawnButterflies: () => pasture && pasture.spawnButterflies && pasture.spawnButterflies(),
      setBusy: (v) => { busy = !!v; },
      get busy() { return busy; },
      setPose: (key) => {
        if (!pasture) return;
        pasture.target = null;
        const k = key || "idle";
        const tex = (kk) => pasture.textures.exists(liveKey(kk)) ? liveKey(kk) : kk;
        if (k === "sleep") {
          pasture.mode = "sleep";
          pasture.sheep.stop();
          pasture.sheep.angle = 0;
          pasture.sheep.setTexture(tex("sleep"));
        } else if (k === "walk" || String(k).indexOf("walk") === 0) {
          pasture.mode = "walk";
          pasture.sheep.stop();
          pasture.sheep.setTexture(tex(k === "walk" ? "walk1" : k));
        } else {
          pasture.mode = (k === "idle") ? "idle" : k;
          pasture.sheep.stop();
          pasture.sheep.setTexture(tex(k));
        }
        pasture.layoutWear();
      },
      wear: (id) => { if (pasture) pasture.wear(id); },
      wearCollar: (id) => { if (pasture) pasture.wearCollar(id); },
      setCollar,
      openLooks,
      paintLookPreviews,
      setPhase: (t) => {
        if (window.MyPetWorld) MyPetWorld.setForced({ t: t || null });
        applySky();
        if (pasture && pasture.applyWorld) pasture.applyWorld(true);
      },
      setWeather: (w) => {
        if (window.MyPetWorld) MyPetWorld.setForced({ w: w || null });
        applySky();
        if (pasture && pasture.applyWorld) pasture.applyWorld(true);
      },
      setField: (id) => setFieldTheme(id),
      applyWorld: () => { applySky(); if (pasture && pasture.applyWorld) pasture.applyWorld(true); },
      openAdopt,
      openJournal,
      goToSlot,
      playAdoptStamp: playStampAndConfetti,
      showBirthday: (st) => {
        st = st || (window.MyPetRoster && state && state.pet && MyPetRoster.birthdayStatus(state.pet)) || {};
        if (!st.type) st = { type: "year", key: "y-test", bonus: 10, party: true, years: 1, seen: false };
        applyBirthdayDecor(true);
        showBirthday(st);
      },
      renderPetChrome,
      prepareAdoptPaper,
      maybeCelebrateBirthday,
      walkTo: (fx, fy, then) => { if (pasture) pasture.walkTo(fx, fy, then); },
      pushOut: (fx, fy) => pasture && pasture.pushOut && pasture.pushOut(fx, fy),
      hitsBlocker: (fx, fy) => pasture && pasture.hitsBlocker && pasture.hitsBlocker(fx, fy),
      onSpaRock: (fx, fy) => pasture && pasture.onSpaRock && pasture.onSpaRock(fx, fy),
      spaZone: (fx, fy) => pasture && pasture.spaZone && pasture.spaZone(fx, fy),
      buildPath: (fx, fy) => pasture && pasture.buildPath && pasture.buildPath(fx, fy),
      footField: () => {
        if (!pasture) return null;
        return pasture.toField(pasture.footX, pasture.footY);
      },
      placeField: (fx, fy) => {
        if (!pasture || !pasture.toWorld) return;
        const p = pasture.toWorld(fx, fy);
        pasture.place(p.x, p.y);
      },
      inPool: () => !!(pasture && pasture.inPoolFeet && pasture.inPoolFeet()),
      oranges: () => (pasture && pasture.oranges) || [],
      collectOrange: (i) => { if (pasture && pasture.oranges && pasture.oranges[i]) pasture.collectOrange(pasture.oranges[i]); },
      dropOranges: (instant) => { if (pasture && pasture.dropOranges) pasture.dropOranges(instant); },
      fieldSpots: () => fieldSpots(),
      fieldPlays: () => ((fieldLayout() && fieldLayout().plays) || []),
      fieldId: () => currentFieldId(),
      openRehome,
    };
    setTimeout(() => maybeCelebrateBirthday(), 800);
    };
    whenUiFontsReady().then(bootPhaser).catch(bootPhaser);
  }

  async function main() {
    bindUi();
    try {
      if (window.MyPetDiscord && !window.MYPET_TEST_MODE) {
        await MyPetDiscord.boot();
      }
      state = await MyPetApi.me();
      loadRainbowPaid();
    } catch (err) {
      $("boot").innerHTML = "<div class='boot-card'>Could not sign in.<br><small>" +
        String((err && err.message) || err) + "</small></div>";
      return;
    }
    $("boot").classList.add("hidden");
    if (window.MyPetRoster) state = MyPetRoster.migrateState(state || {});
    mergePet(state && state.pet);
    applySky();
    grantStaticUnlocks();
    preloadColorImages(() => {
      if (state && state.pet) applyPetLook();
      refreshAdoptPreview();
      renderLooks();
    });
    bindAdoptColors();
    if (!state.pet) {
      openAdopt();
    } else {
      startGame();
    }
    window.__mypet = window.__mypet || {};
    window.__mypet.playAdoptStamp = window.__mypet.playAdoptStamp || playStampAndConfetti;
    window.__mypet.openAdopt = window.__mypet.openAdopt || openAdopt;
    window.__mypet.openJournal = window.__mypet.openJournal || openJournal;
    window.__mypet.prepareAdoptPaper = window.__mypet.prepareAdoptPaper || prepareAdoptPaper;
    window.__mypet.getState = () => state;
  }

  window._adoptPick = defaultAdoptPick("sheep_valais");

  function bindAdoptColors() {
    const box = $("adoptColors");
    if (!box || !window.MyPetColor) return;
    const pick = window._adoptPick || defaultAdoptPick("sheep_valais");
    window._adoptPick = pick;
    if (MyPetColor.ensureDye) MyPetColor.ensureDye(pick);
    // Force rebuild when species changes; live slider updates stay in place
    renderColorPickers(box, pick, (model, ev) => {
      window._adoptPick = model;
      if (ev && ev.from === "slider" && !ev.done) {
        clearTimeout(bindAdoptColors._t);
        bindAdoptColors._t = setTimeout(() => {
          renderSpeciesCards();
          refreshAdoptPreview();
        }, 40);
        return;
      }
      renderSpeciesCards();
      refreshAdoptPreview();
    });
  }
  function refreshAdoptPreview() {
    renderSpeciesCards();
  }

  window.addEventListener("load", main);
})();
