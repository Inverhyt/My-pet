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
  const WOOL_ORDER = ["white", "cream", "peach", "butter", "mist"];
  const FACE_ORDER = ["black", "brown", "cream"];
  const EYE_ORDER  = ["white", "honey", "sky", "moss", "berry"];
  const WOOL_NAMES = { white: "White", cream: "Cream", peach: "Peach", butter: "Butter", mist: "Mist" };
  const FACE_NAMES = { black: "Black", brown: "Brown", cream: "Cream" };
  const EYE_NAMES  = { white: "White", honey: "Honey", sky: "Sky", moss: "Moss", berry: "Berry" };

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
    const eyeMask = (eyeRgb || woolPal || facePal) ? findEyes(data, w, h) : null;
    if (!woolPal && !facePal && !eyeRgb) return src;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4, a = data[i + 3];
      if (a === 0) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const L = lum(r, g, b);
      if (eyeMask && eyeMask[p]) {
        if (eyeRgb) {
          const er = eyeRgb[0], eg = eyeRgb[1], eb = eyeRgb[2];
          if (L > 245) {
            data[i] = Math.min(255, er + 45); data[i + 1] = Math.min(255, eg + 40); data[i + 2] = Math.min(255, eb + 40);
          } else {
            const t = Math.max(0, Math.min(1, (L - 180) / 70));
            data[i] = lerp((er * 0.72) | 0, er, t);
            data[i + 1] = lerp((eg * 0.72) | 0, eg, t);
            data[i + 2] = lerp((eb * 0.72) | 0, eb, t);
          }
        }
        continue;
      }
      if (L < 18) continue;
      const isWool = L > 140 && r > 150 && g > 140;
      const isFace = L >= 18 && L < 90 && !isWool;
      if (isWool) {
        if (woolPal) {
          const n = mapTone(r, g, b, woolPal, 247, 165, 255);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      } else if (isFace) {
        if (facePal) {
          const n = mapTone(r, g, b, facePal, 58, 18, 110);
          data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
        }
      } else if (woolPal && r > 130 && g > 120 && L >= 90) {
        const n = mapTone(r, g, b, woolPal, 247, 165, 255);
        data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
      } else if (facePal && L < 140) {
        const n = mapTone(r, g, b, facePal, 58, 18, 110);
        data[i] = n[0]; data[i + 1] = n[1]; data[i + 2] = n[2];
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

  function migratePet(pet) {
    if (!pet) return pet;
    if (!WOOL[pet.wool]) pet.wool = "white";
    if (!FACE[pet.face]) pet.face = "black";
    if (!EYES[pet.eyes]) pet.eyes = "white";
    if (!pet.costumeColors || typeof pet.costumeColors !== "object") pet.costumeColors = {};
    return pet;
  }

  function swatchHex(kind, colorId) {
    if (colorId === "default") return DEFAULT_SWATCH[kind] || "#C8B49A";
    return (HUT[colorId] && HUT[colorId].hex) || "#C8B49A";
  }

  root.MyPetColor = {
    HUT, HUT_ORDER, HUT_NAMES, DEFAULT_SWATCH,
    WOOL, FACE, EYES, WOOL_ORDER, FACE_ORDER, EYE_ORDER, WOOL_NAMES, FACE_NAMES, EYE_NAMES,
    migratePet, recolorSheepImage, recolorCostumeImage, imageToCanvas, swatchHex,
  };
})(typeof window !== "undefined" ? window : this);
