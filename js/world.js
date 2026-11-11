/* My Pet — time of day, weather, and field themes. */
(function (root) {
  const CYCLE_MS = 8 * 60 * 60 * 1000; // 8 real hours = 1 game day; 3 days / 24h
  const WX_SLOT_MS = 90 * 60 * 1000;   // weather holds ~1.5 hours

  const FIELDS = [
    { id: "meadow", name: "Meadow",  emoji: "🌿", file: "field_meadow.png", thumb: "field_meadow_thumb.png" },
    { id: "autumn", name: "Autumn",  emoji: "🍂", file: "field_autumn.png", thumb: "field_autumn_thumb.png" },
    { id: "snow",   name: "Snow",    emoji: "❄️", file: "field_snow.png",   thumb: "field_snow_thumb.png" },
    { id: "flower", name: "Flowers", emoji: "🌸", file: "field_flower.png", thumb: "field_flower_thumb.png" },
    { id: "moss",   name: "Moss",    emoji: "🍄", file: "field_moss.png",   thumb: "field_moss_thumb.png" },
  ];
  const FIELD_IDS = FIELDS.map((f) => f.id);

  const PHASES = {
    dawn:   { icon: "sky_dawn.png",   label: "Dawn",   sky: "#f3c4b0", sky2: "#f7d4c4", tint: 0xf4c0a8, alpha: 0.10 },
    day:    { icon: "sky_sun.png",    label: "Day",    sky: "#c5dff2", sky2: "#d6e9f6", tint: 0xffffff, alpha: 0 },
    sunset: { icon: "sky_sunset.png", label: "Sunset", sky: "#e89a68", sky2: "#c9a0c8", tint: 0xf0a068, alpha: 0.12 },
    night:  { icon: "sky_moon.png",   label: "Night",  sky: "#1a2744", sky2: "#121a30", tint: 0x152044, alpha: 0.22 },
  };

  // Keyframes along one 8-hour cycle (t in 0..1). Colors lerp between them.
  const KEYS = [
    { t: 0.00, phase: "night",  sky: [26, 39, 68],    sky2: [18, 26, 48],    tint: [21, 32, 68],    alpha: 0.22 },
    { t: 0.08, phase: "night",  sky: [40, 48, 80],    sky2: [30, 36, 64],    tint: [40, 36, 70],    alpha: 0.16 },
    { t: 0.12, phase: "dawn",   sky: [243, 196, 176], sky2: [247, 212, 196], tint: [244, 192, 168], alpha: 0.10 },
    { t: 0.20, phase: "dawn",   sky: [247, 212, 196], sky2: [220, 214, 210], tint: [244, 200, 180], alpha: 0.06 },
    { t: 0.26, phase: "day",    sky: [197, 223, 242], sky2: [214, 233, 246], tint: [255, 255, 255], alpha: 0.00 },
    { t: 0.55, phase: "day",    sky: [185, 218, 240], sky2: [214, 233, 246], tint: [255, 255, 255], alpha: 0.00 },
    { t: 0.60, phase: "sunset", sky: [232, 154, 104], sky2: [201, 160, 200], tint: [240, 160, 104], alpha: 0.12 },
    { t: 0.68, phase: "sunset", sky: [201, 140, 160], sky2: [180, 130, 190], tint: [210, 140, 150], alpha: 0.12 },
    { t: 0.76, phase: "night",  sky: [26, 39, 68],    sky2: [18, 26, 48],    tint: [21, 32, 68],    alpha: 0.22 },
    { t: 1.00, phase: "night",  sky: [26, 39, 68],    sky2: [18, 26, 48],    tint: [21, 32, 68],    alpha: 0.22 },
  ];

  const WX_ICON = {
    clear: null,
    rain: "wx_rain.png",
    snow: "wx_snow.png",
    rainbow: "wx_rainbow.png",
  };
  const WX_LABEL = { clear: "Clear", rain: "Rain", snow: "Snow", rainbow: "Rainbow" };

  let forced = { t: null, w: null, field: null };

  function hex(rgb) {
    return "#" + rgb.map((n) => ("0" + Math.max(0, Math.min(255, n | 0)).toString(16)).slice(-2)).join("");
  }
  function phaserColor(rgb) {
    return ((rgb[0] & 255) << 16) | ((rgb[1] & 255) << 8) | (rgb[2] & 255);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerp3(a, b, t) { return [lerp(a[0], b[0], t) | 0, lerp(a[1], b[1], t) | 0, lerp(a[2], b[2], t) | 0]; }

  function localMs(date) {
    const d = date || new Date();
    return ((d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) * 1000) + d.getMilliseconds();
  }

  function cycleT(date) {
    return (localMs(date) % CYCLE_MS) / CYCLE_MS;
  }

  function sampleKeys(t) {
    let a = KEYS[0], b = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i++) {
      if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    }
    const span = b.t - a.t || 1;
    const u = (t - a.t) / span;
    return {
      phase: (u < 0.5 ? a.phase : b.phase),
      sky: lerp3(a.sky, b.sky, u),
      sky2: lerp3(a.sky2, b.sky2, u),
      tint: lerp3(a.tint, b.tint, u),
      alpha: lerp(a.alpha, b.alpha, u),
    };
  }

  function hash32(n) {
    n = (n ^ 0x9e3779b9) >>> 0;
    n = Math.imul(n ^ (n >>> 16), 0x85ebca6b) >>> 0;
    n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35) >>> 0;
    return (n ^ (n >>> 16)) >>> 0;
  }

  function slotIndex(date) {
    const d = date || new Date();
    // Local-time slots so a reload in the same hour keeps the same weather.
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return Math.floor((d.getTime() - start) / WX_SLOT_MS) + d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function rawWeather(slot) {
    const n = hash32(slot * 2654435761) % 100;
    if (n < 66) return "clear";
    if (n < 84) return "rain";
    return "snow";
  }

  function weatherFor(date) {
    const slot = slotIndex(date);
    const prev = rawWeather(slot - 1);
    const cur = rawWeather(slot);
    if (prev === "rain" && cur === "clear" && (hash32(slot ^ 0x5f3759df) % 100) < 45) {
      return "rainbow";
    }
    return cur;
  }

  function parseQuery() {
    try {
      const q = new URLSearchParams(root.location && root.location.search || "");
      const t = (q.get("t") || "").toLowerCase();
      const w = (q.get("w") || "").toLowerCase();
      const field = (q.get("field") || "").toLowerCase();
      if (PHASES[t]) forced.t = t;
      if (WX_LABEL[w]) forced.w = w;
      if (FIELD_IDS.indexOf(field) >= 0) forced.field = field;
    } catch (e) {}
    return { t: forced.t, w: forced.w, field: forced.field };
  }

  function setForced(opts) {
    opts = opts || {};
    if (opts.t === null || opts.t === "auto") forced.t = null;
    else if (opts.t && PHASES[opts.t]) forced.t = opts.t;
    if (opts.w === null || opts.w === "auto") forced.w = null;
    else if (opts.w && WX_LABEL[opts.w]) forced.w = opts.w;
    if (opts.field === null || opts.field === "auto") forced.field = null;
    else if (opts.field && FIELD_IDS.indexOf(opts.field) >= 0) forced.field = opts.field;
  }

  function nowCycle(date) {
    const t = cycleT(date);
    const s = sampleKeys(t);
    const phase = forced.t || s.phase;
    const meta = PHASES[phase];
    let sky = s.sky, sky2 = s.sky2, tint = s.tint, alpha = s.alpha;
    if (forced.t) {
      const k = KEYS.filter((k) => k.phase === forced.t);
      const pick = k[Math.floor(k.length / 2)] || k[0];
      if (pick) { sky = pick.sky; sky2 = pick.sky2; tint = pick.tint; alpha = pick.alpha; }
    }
    const weather = forced.w || weatherFor(date);
    return {
      t: forced.t ? -1 : t,
      phase,
      label: meta.label,
      sky: hex(sky),
      sky2: hex(sky2),
      skyRgb: sky,
      tint: phaserColor(tint),
      tintAlpha: alpha,
      skyIcon: meta.icon,
      weather,
      weatherIcon: WX_ICON[weather] || null,
      weatherLabel: WX_LABEL[weather] || "Clear",
    };
  }

  function isNight(cycle) {
    const c = cycle || nowCycle();
    return c.phase === "night";
  }

  function getField(id) {
    return FIELDS.filter((f) => f.id === id)[0] || FIELDS[0];
  }

  parseQuery();

  root.MyPetWorld = {
    FIELDS, FIELD_IDS, PHASES, CYCLE_MS,
    parseQuery, setForced, nowCycle, isNight, getField,
    get forced() { return { t: forced.t, w: forced.w, field: forced.field }; },
  };
})(typeof window !== "undefined" ? window : this);
