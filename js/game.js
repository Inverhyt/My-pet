/* Asset paths: relative so GitHub Pages ( /my-pet/ ) works, and /assets/ still works on the Pi server. */
function assetUrl(path) {
  path = String(path || "").replace(/^\/+/, "");
  const base = (typeof window.ASSET_BASE === "string") ? window.ASSET_BASE + path : path;
  const v = window.MYPET_ASSET_V || "10";
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
    hay:    { x: 300, y: 820, r: 70, kind: "hop",    standL: { x: 215, y: 820 }, standR: { x: 400, y: 820 }, label: "hay" },
    slide:  { x: 760, y: 580, r: 90, kind: "slide",  start: { x: 685, y: 615 }, top: { x: 715, y: 475 }, end: { x: 850, y: 660 }, label: "slide" },
    tunnel: { x: 250, y: 580, r: 80, kind: "tunnel", start: { x: 170, y: 595 }, end: { x: 340, y: 595 }, label: "tunnel" },
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
    toast._t = setTimeout(() => el.classList.remove("show"), ms);
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

  function persistStaticPet() {
    if (!state) return;
    if (window.MyPetRoster && state.pet) MyPetRoster.normalizePet(state.pet);
    syncActivePet();
    try {
      const data = {
        version: 10,
        pet: state.pet || null,
        pets: state.pets || [],
        activePet: state.activePet || 0,
        coins: typeof state.coins === "number" ? state.coins : 0,
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
    if (window.MyPetColor) MyPetColor.migratePet(state.pet);
    if (window.MyPetRoster) MyPetRoster.normalizePet(state.pet);
    syncActivePet();
    persistStaticPet();
  }

  function petColors() {
    const p = (state && state.pet) || {};
    return { wool: p.wool || "white", face: p.face || "black", eyes: p.eyes || "white" };
  }
  function costumeColorOf(id) {
    const map = (state && state.pet && state.pet.costumeColors) || {};
    return map[id] || "default";
  }
  function liveKey(key) { return key ? "_c_" + key : key; }

  const SHEEP_KEYS = ["idle", "walk1", "walk2", "walk3", "walk4", "eat", "drink", "happy", "sleep"];
  const COLOR_IMG = {};
  function loadColorImg(file, cb) {
    if (COLOR_IMG[file] && COLOR_IMG[file].complete && COLOR_IMG[file].naturalWidth) {
      if (cb) cb(COLOR_IMG[file]);
      return COLOR_IMG[file];
    }
    const im = COLOR_IMG[file] || new Image();
    COLOR_IMG[file] = im;
    im.crossOrigin = "anonymous";
    if (cb) im.addEventListener("load", () => cb(im), { once: true });
    if (!im.src) im.src = assetUrl("assets/" + file);
    else if (im.complete && cb) cb(im);
    return im;
  }
  function sheepCanvas(pose) {
    const file = pose.indexOf("sheep_") === 0 ? pose + ".png" : "sheep_" + pose + ".png";
    const im = COLOR_IMG[file];
    if (!im || !im.naturalWidth || !window.MyPetColor) return null;
    return MyPetColor.recolorSheepImage(im, petColors());
  }
  function sheepDataUrl(pose) {
    const c = sheepCanvas(pose);
    return c ? c.toDataURL("image/png") : assetUrl("assets/" + (pose.indexOf("sheep_") === 0 ? pose + ".png" : "sheep_" + pose + ".png"));
  }
  function costumeDataUrl(id) {
    const file = (id === "collar" ? "costume_collar" : (COSTUME_TEX[id] || ("costume_" + id))) + ".png";
    const im = COLOR_IMG[file];
    if (!im || !im.naturalWidth || !window.MyPetColor) return assetUrl("assets/" + file);
    const kind = id === "collar" ? "collar" : id;
    return MyPetColor.recolorCostumeImage(im, kind, costumeColorOf(id)).toDataURL("image/png");
  }
  function preloadColorImages(done) {
    const files = SHEEP_KEYS.map((k) => "sheep_" + k + ".png").concat([
      "costume_crown.png", "costume_bow.png", "costume_hat.png", "costume_witch.png", "costume_collar.png",
    ]);
    let left = files.length;
    files.forEach((f) => loadColorImg(f, () => { left--; if (left <= 0 && done) done(); }));
  }

  function applyPetLook() {
    if (!pasture || !pasture.textures) return;
    const sc = pasture;
    if (!sc._baseImgs) {
      sc._baseImgs = {};
      SHEEP_KEYS.forEach((k) => {
        const tex = sc.textures.get(k);
        if (tex && tex.getSourceImage) {
          const src = tex.getSourceImage();
          const c = document.createElement("canvas");
          c.width = src.width; c.height = src.height;
          c.getContext("2d", { willReadFrequently: true }).drawImage(src, 0, 0);
          sc._baseImgs[k] = c;
        }
      });
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
      SHEEP_KEYS.forEach((k) => {
        const base = sc._baseImgs[k];
        if (base) paint(k, MyPetColor.recolorSheepImage(base, petColors()));
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

  function grantStaticUnlocks() {
    if (!state || !state.pet) return [];
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

  function currentFieldId() {
    if (window.MyPetWorld && MyPetWorld.forced && MyPetWorld.forced.field) return MyPetWorld.forced.field;
    const id = state && state.pet && state.pet.fieldTheme;
    if (window.MyPetWorld && MyPetWorld.FIELD_IDS.indexOf(id) >= 0) return id;
    return "meadow";
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
    const sheepIm = COLOR_IMG["sheep_idle.png"];
    if (!sheepIm || !sheepIm.naturalWidth) {
      loadColorImg("sheep_idle.png", () => { paintLookPreviews(); renderLooksColors(); });
      return;
    }
    const sheep = MyPetColor.recolorSheepImage(sheepIm, petColors());
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
      if (!cim || !cim.naturalWidth) { loadColorImg(file, paintLookPreviews); return; }
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
      const sit = id === "collar" ? (NECK.idle || { x: -16, y: -28 }) : (HEAD.idle || { x: -16, y: -92 });
      const nudge = id === "collar" ? { x: 0, y: 0 } : (COSTUME_NUDGE[id] || { x: 0, y: 0 });
      const mul = id === "collar" ? 1 : (COSTUME_SCALE[id] == null ? 1.08 : COSTUME_SCALE[id]);
      const dx = feetX + (sit.x + nudge.x) * scale;
      const dy = feetY + (sit.y + nudge.y) * scale;
      ctx.drawImage(hat, dx - (hat.width * mul) / 2, dy - hat.height * mul, hat.width * mul, hat.height * mul);
      img.src = c.toDataURL("image/png");
    });
  }

  function renderLooksColors() {
    const box = $("looksColors");
    if (!box || !window.MyPetColor) return;
    box.innerHTML = "";
    const pet = state && state.pet;
    if (!pet) return;
    const unlocked = pet.unlocked || [];
    const rows = [];
    if (pet.costume && unlocked.includes(pet.costume)) {
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
      toast("+1 coin 🪙");
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
      img("field", "field_meadow.png");
      if (window.MyPetWorld) {
        MyPetWorld.FIELDS.forEach((f) => img("field_" + f.id, f.file));
      }
      img("wx_drop", "wx_drop.png");
      img("wx_flake", "wx_flake.png");
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
    }

    create() {
      pasture = this;
      applyPetLook();
      const walkKeys = ["walk1", "walk2", "walk3", "walk4"].map((k) => this.textures.exists(liveKey(k)) ? liveKey(k) : k);
      this.anims.create({
        key: "walk",
        frames: walkKeys.map((k) => ({ key: k })),
        frameRate: 8, repeat: -1,
      });
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
      this.skyTint = this.add.rectangle(this.fieldX, this.fieldY, FIELD * scale, FIELD * scale, 0x152044, 0).setOrigin(0, 0).setDepth(8000);
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

      const start = this.toWorld(512, 560);
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

      this.hint = this.add.text(W / 2, this.fieldY + 28 * scale, "Tap the trough, water, hay, or a flower", {
        fontFamily: "Nunito, sans-serif", fontSize: "16px", color: "#4a3426",
        backgroundColor: "#fffaf3cc", padding: { x: 8, y: 4 },
      }).setOrigin(0.5, 0).setDepth(20);
      this.time.delayedCall(5000, () => this.hint && this.hint.destroy());
    }

    toWorld(fx, fy) {
      return { x: this.fieldX + fx * this.fScale, y: this.fieldY + fy * this.fScale };
    }
    toField(wx, wy) {
      return { x: (wx - this.fieldX) / this.fScale, y: (wy - this.fieldY) / this.fScale };
    }

    place(x, y) {
      this.sheep.x = x; this.sheep.y = y;
      this.layoutWear();
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
        if (frameKey && HEAD[frameKey]) return frameKey;
        if (this.mode === "walk" || (anims.currentAnim && anims.currentAnim.key === "walk")) return "walk";
      }
      if (tex && HEAD[tex]) return tex;
      if (this.mode === "walk") return "walk";
      if (tex && String(tex).indexOf("walk") === 0) return "walk";
      return "idle";
    }

    layoutWear() {
      if (!this.sheep) return;
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
        sprite.setDepth(this.sheep.y + depthOff);
      };
      if (this.blanket) {
        pin(this.blanket, 0, -10, 1, { x: 0.5, y: 0.7 }, -1);
        this.blanket.setVisible(false);
      }
      const id = this.sheep.costumeId;
      if (id && COSTUME_TEX[id] && this.costume) {
        const pose = this.poseName();
        const head = HEAD[pose] || HEAD.idle;
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
        const neck = NECK[pose] || NECK.idle;
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
          const head = HEAD[pose] || HEAD.idle;
          pin(this.partyHat, head.x, head.y - 10, 1.22, { x: 0.5, y: 1 }, 5);
          this.partyHat.setVisible(true);
        } else {
          this.partyHat.setVisible(false);
        }
      }
      const bf = this._perchedBf;
      if (bf && bf.active) {
        const pose = this.poseName();
        const noseY = pose === "happy" ? -70 : -66;
        const noseX = -44;
        const flip = this.sheep.flipX ? -1 : 1;
        const rad = (this.sheep.angle || 0) * Math.PI / 180;
        const lx = noseX * Math.abs(this.sheep.scaleX) * flip;
        const ly = noseY * Math.abs(this.sheep.scaleY);
        const rx = lx * Math.cos(rad) - ly * Math.sin(rad);
        const ry = lx * Math.sin(rad) + ly * Math.cos(rad);
        bf.x = this.sheep.x + rx;
        bf.y = this.sheep.y + ry;
        bf.setDepth(this.sheep.y + 6);
      }
      this.sheep.setDepth(this.sheep.y);
    }

    wear(id) {
      this.sheep.costumeId = id || null;
      const tex = COSTUME_TEX[id];
      const live = tex && liveKey(tex);
      if (live && this.textures.exists(live)) this.costume.setTexture(live);
      else if (tex && this.textures.exists(tex)) this.costume.setTexture(tex);
      this.layoutWear();
    }

    wearCollar(id) {
      this.sheep.collarId = id || null;
      const live = liveKey("costume_collar");
      if (id === "collar" && this.textures.exists(live)) this.collar.setTexture(live);
      else if (id === "collar" && this.textures.exists("costume_collar")) this.collar.setTexture("costume_collar");
      this.layoutWear();
    }

    setFacing(dx) {
      if (Math.abs(dx) < 1) return;
      this.sheep.setFlipX(dx > 0);
      this.layoutWear();
    }

    showAnim(key) {
      this.sheep.stop();
      if (key === "walk") this.sheep.play("walk");
      else this.sheep.setTexture(this.textures.exists(liveKey(key)) ? liveKey(key) : key);
    }

    walkTo(fx, fy, then) {
      const p = this.toWorld(this.clamp(fx), this.clampY(fy));
      this.target = p;
      this.onArrive = then || null;
      this.mode = "walk";
      this.setFacing(p.x - this.sheep.x);
      this.showAnim("walk");
    }

    clamp(x) { return Phaser.Math.Clamp(x, WALK.x0, WALK.x1); }
    clampY(y) { return Phaser.Math.Clamp(y, WALK.y0, WALK.y1); }

    arrive() {
      this.target = null;
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
      const s = SPOTS.bed;
      this.walkTo(s.stand.x, s.stand.y, () => {
        this._bedWalk = false;
        if (busy || !MyPetWorld.isNight()) { this.goIdle(); return; }
        const dest = this.toWorld(s.sleep.x, s.sleep.y + 8);
        this.tweens.add({
          targets: this.sheep, x: dest.x, y: dest.y, duration: 400,
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            if (busy || !MyPetWorld.isNight()) { this.goIdle(); return; }
            this.mode = "sleep";
            this._nightSleep = true;
            this.sheep.angle = 0;
            this.showAnim("sleep");
            this.layoutWear();
            this.startZzz();
            updateMood();
          },
        });
      });
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
    setFieldTheme(id) {
      const key = "field_" + id;
      if (this.textures.exists(key) && this.field) this.field.setTexture(key);
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
      const s = this.fScale;
      if (kind === "rainbow") this.drawRainbow();
      if (kind === "rain") {
        for (let i = 0; i < 26; i++) this.drops.push(this.spawnDrop(true));
      }
      if (kind === "snow") {
        for (let i = 0; i < 22; i++) this.flakes.push(this.spawnFlake(true));
      }
    }
    drawRainbow() {
      if (!this.rainbow) return;
      this.rainbow.clear();
      const s = this.fScale;
      const cx = this.fieldX + FIELD * s * 0.5;
      const cy = this.fieldY + FIELD * s * 0.46;
      const cols = [0xe45a5a, 0xf0a028, 0xf0d848, 0x5aaa5a, 0x5a8ad0];
      const lw = Math.max(4, 7 * s);
      cols.forEach((c, i) => {
        this.rainbow.lineStyle(lw, c, 0.8);
        this.rainbow.beginPath();
        this.rainbow.arc(cx, cy, (240 - i * (lw + 1)) * s, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
        this.rainbow.strokePath();
      });
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
      this.mode = "idle";
      this.showAnim("idle");
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
      updateMood();
    }

    onTap(pointer) {
      if (busy) return;
      if ($("looks").classList.contains("hidden") === false) return;
      if ($("friend").classList.contains("hidden") === false) return;
      if ($("bath") && $("bath").classList.contains("hidden") === false) return;
      if ($("brush") && $("brush").classList.contains("hidden") === false) return;
      const f = this.toField(pointer.worldX, pointer.worldY);
      if (this.mode === "sleep") {
        const bed = SPOTS.bed;
        const onBed = Math.hypot(f.x - bed.x, f.y - bed.y) <= bed.r;
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
      for (const [id, s] of Object.entries(SPOTS)) {
        const d = Math.hypot(f.x - s.x, f.y - s.y);
        if (d <= s.r) { this.useSpot(id, s); return; }
      }
      for (const [id, s] of Object.entries(PARK)) {
        if (Math.hypot(f.x - s.x, f.y - s.y) <= s.r) { this.playPark(s.kind); return; }
      }
      for (const fl of FLOWERS) {
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
        if (id === "trough") this.doEat();
        else if (id === "basin") this.doDrink();
        else if (id === "bed") this.doNap(s);
      });
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
          toast("Yum 🥕");
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
      const dest = this.toWorld(s.sleep.x, s.sleep.y + 8);
      this.tweens.add({
        targets: this.sheep, x: dest.x, y: dest.y, duration: 400,
        onUpdate: () => this.layoutWear(),
        onComplete: () => {
          this.mode = "sleep";
          this.sheep.angle = 0;
          this.showAnim("sleep");
          this.blanket.setVisible(false);
          this.layoutWear();
          this.floatSprite("zzz", this.sheep.x + 28, this.sheep.y - 90, 1600);
          this.time.delayedCall(900, () => this.floatSprite("zzz", this.sheep.x + 10, this.sheep.y - 100, 1600));
          this.time.delayedCall(1800, () => this.floatSprite("zzz", this.sheep.x + 32, this.sheep.y - 86, 1400));
          blip("nap");
          toast("Night night 😴");
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
      const s = SPOTS.basin;
      this.walkTo(s.stand.x, s.stand.y, () => {
        this.showAnim("idle");
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
      });
    }

    startPlay() {
      const kinds = ["hop", "slide", "tunnel"];
      this._playI = ((this._playI || 0) + 1) % kinds.length;
      this.playPark(kinds[this._playI]);
    }

    placePark() {
      const s = this.fScale;
      this.parkSprites = {};
      const hay = this.toWorld(PARK.hay.x, PARK.hay.y);
      this.parkSprites.hay = this.add.image(hay.x, hay.y, "hay_bale").setScale(s * 2.15).setOrigin(0.5, 1).setDepth(hay.y);
      const sl = this.toWorld(PARK.slide.x, PARK.slide.y);
      this.parkSprites.slide = this.add.image(sl.x, sl.y, "slide").setScale(s * 1.85).setOrigin(0.5, 1).setDepth(sl.y + 2);
      const tn = this.toWorld(PARK.tunnel.x, PARK.tunnel.y);
      this.parkSprites.tunnel = this.add.image(tn.x, tn.y, "tunnel").setScale(s * 1.85).setOrigin(0.5, 1).setDepth(tn.y + 8);
    }

    playPark(kind) {
      this.interruptNight();
      if (busy) return;
      busy = true;
      if (kind === "hop") this.doHop();
      else if (kind === "slide") this.doSlide();
      else this.doTunnel();
    }

    finishPlay(msg) {
      doCare("play").catch(() => {});
      toast(msg);
      blip("click");
      this.showAnim("happy");
      this.tweens.add({
        targets: this.sheep, y: this.sheep.y - 12, yoyo: true, duration: 140, repeat: 2,
        onUpdate: () => this.layoutWear(),
        onComplete: () => { this.goIdle(); busy = false; },
      });
    }

    doHop() {
      const p = PARK.hay;
      this.walkTo(p.standL.x, p.standL.y, () => {
        this.showAnim("happy");
        const mid = this.toWorld((p.standL.x + p.standR.x) / 2, p.y - 90);
        const land = this.toWorld(p.standR.x, p.standR.y);
        this.tweens.add({
          targets: this.sheep, x: mid.x, duration: 280, ease: "Sine.easeOut",
          onUpdate: () => this.layoutWear(),
        });
        this.tweens.add({
          targets: this.sheep, y: mid.y, duration: 280, ease: "Quad.easeOut",
          onUpdate: () => this.layoutWear(),
          onComplete: () => {
            this.tweens.add({
              targets: this.sheep, x: land.x, y: land.y, duration: 280, ease: "Quad.easeIn",
              onUpdate: () => this.layoutWear(),
              onComplete: () => this.finishPlay("Hop! 🌾"),
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
        if (arch) this.sheep.setDepth(arch.depth - 1);
        this.showAnim("walk");
        this.tweens.add({
          targets: this.sheep, x: end.x, y: end.y, duration: 700,
          onUpdate: () => this.layoutWear(),
          onComplete: () => this.finishPlay("Through! 🪵"),
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
      const nx = this.sheep.x + (-44) * s * flip;
      const ny = this.sheep.y + (-66) * s;
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
      const live = (this.butterflies || []).filter((b) => b && b.active && !b._caught);
      if (live.length && Math.random() < 0.4) {
        this.catchButterfly(live[0]);
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
      if (this.target) {
        const speed = 0.12 * this.fScale * dt; // px per ms scaled
        const dx = this.target.x - this.sheep.x;
        const dy = this.target.y - this.sheep.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) this.arrive();
        else {
          this.sheep.x += (dx / dist) * Math.min(speed, dist);
          this.sheep.y += (dy / dist) * Math.min(speed, dist);
          this.setFacing(dx);
          this.layoutWear();
        }
      } else if (this.mode === "idle" && this.time.now > this.idleAt) {
        if (this._wantNightSleep && window.MyPetWorld && MyPetWorld.isNight() && !busy) {
          this.startNightSleep();
        } else {
          this.idleAt = this.time.now + 9000 + Math.random() * 8000;
          this.idleMood();
        }
      }
      this.tickWeather(dt);
    }
  }

  function dressPreview(sheepImg, hatImg, collarImg) {
    if (!sheepImg) return;
    const happy = /sheep_happy/.test(sheepImg.getAttribute("src") || sheepImg.src || "");
    const boxH = sheepImg.getBoundingClientRect().height || sheepImg.clientHeight || 150;
    const artH = happy ? 139 : 121;
    const scale = boxH / artH;
    const pet = state && state.pet;
    const head = happy ? (HEAD.happy || HEAD.idle) : HEAD.idle;
    const neck = happy ? (NECK.happy || NECK.idle) : NECK.idle;
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

  async function openLooks() {
    try { state = Object.assign(state || {}, await MyPetApi.me()); } catch (e) {}
    grantStaticUnlocks();
    renderHud();
    renderLooks();
    showLooksTab("looks");
    $("looks").classList.remove("hidden");
  }
  function closeLooks() { $("looks").classList.add("hidden"); }
  function showLooksTab(which) {
    const looks = which !== "field";
    const tabLooks = $("tabLooks");
    const tabField = $("tabField");
    const paneLooks = $("looksPane");
    const paneField = $("fieldPane");
    if (tabLooks) tabLooks.classList.toggle("on", looks);
    if (tabField) tabField.classList.toggle("on", !looks);
    if (paneLooks) paneLooks.classList.toggle("hidden", !looks);
    if (paneField) paneField.classList.toggle("hidden", looks);
    if (!looks) renderFieldPicker();
  }
  function renderFieldPicker() {
    const grid = $("fieldGrid");
    if (!grid || !window.MyPetWorld) return;
    const cur = currentFieldId();
    grid.innerHTML = "";
    MyPetWorld.FIELDS.forEach((f) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "field-pick" + (f.id === cur ? " on" : "");
      btn.innerHTML = '<img alt="" src="' + assetUrl("assets/" + f.thumb) + '"><span class="name">' + f.emoji + " " + f.name + "</span>";
      btn.addEventListener("click", () => setFieldTheme(f.id));
      grid.appendChild(btn);
    });
  }
  function setFieldTheme(id, quiet) {
    if (!state || !state.pet || !window.MyPetWorld) return;
    if (MyPetWorld.FIELD_IDS.indexOf(id) < 0) return;
    state.pet.fieldTheme = id;
    persistStaticPet();
    if (pasture && pasture.setFieldTheme) pasture.setFieldTheme(id);
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
    const tabLooks = $("tabLooks");
    const tabField = $("tabField");
    if (tabLooks && tabField) {
      tabLooks.addEventListener("click", () => showLooksTab("looks"));
      tabField.addEventListener("click", () => showLooksTab("field"));
    }
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

  function renderSoonCards() {
    const row = $("soonRow");
    if (!row || !window.MyPetRoster) return;
    row.innerHTML = "";
    MyPetRoster.COMING_SOON.forEach((s) => {
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
    if (!window._adoptPick) window._adoptPick = { wool: "white", face: "black", eyes: "white", field: "meadow" };
    if (!window._adoptPick.field) window._adoptPick.field = "meadow";
    row.innerHTML = "";
    MyPetWorld.FIELDS.forEach((f) => {
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
    renderSoonCards();
    renderAdoptFields();
    refreshAdoptPreview();
  }

  function openAdopt() {
    prepareAdoptPaper();
    if ($("nameInput")) $("nameInput").value = "";
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
        conf.innerHTML = "";
        const colors = ["#e8899a", "#f3d291", "#8fd3a0", "#8ec8e8", "#d4a0e8", "#f3b36a", "#fff"];
        for (let i = 0; i < 36; i++) {
          const el = document.createElement("i");
          el.style.left = (3 + Math.random() * 94) + "%";
          el.style.background = colors[i % colors.length];
          el.style.width = (8 + Math.random() * 8) + "px";
          el.style.height = (12 + Math.random() * 10) + "px";
          el.style.animationDelay = (Math.random() * 0.2) + "s";
          el.style.animationDuration = (0.85 + Math.random() * 0.5) + "s";
          conf.appendChild(el);
        }
      }
      blip("unlock");
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
      const start = pasture.toWorld(512, 560);
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
    if (pasture.applyWorld) pasture.applyWorld(true);
    applySky();
    busy = false;
  }

  function renderSlotCard(locked) {
    const card = $("slotCard");
    if (!card) return;
    const need = window.MyPetRoster ? MyPetRoster.slotAt((state.pets || []).length + 1) : 30;
    const have = window.MyPetRoster ? MyPetRoster.totalHearts(state) : 0;
    card.innerHTML = "";
    if (locked) {
      const pct = Math.min(100, Math.round((have / Math.max(need, 1)) * 100));
      const lock = document.createElement("div"); lock.className = "slot-lock"; lock.textContent = "🔒";
      const title = document.createElement("div"); title.className = "slot-title"; title.textContent = "Soon";
      const needP = document.createElement("p"); needP.className = "slot-need"; needP.textContent = "Need 💗 " + need;
      const bar = document.createElement("div"); bar.className = "heart-bar"; bar.setAttribute("aria-label", "Hearts");
      const fill = document.createElement("span"); fill.style.width = pct + "%"; bar.appendChild(fill);
      const haveP = document.createElement("p"); haveP.className = "slot-need"; haveP.textContent = "💗 " + have + " / " + need;
      card.appendChild(lock); card.appendChild(title); card.appendChild(needP); card.appendChild(bar); card.appendChild(haveP);
    } else {
      const plus = document.createElement("div"); plus.className = "slot-plus"; plus.textContent = "➕";
      const title = document.createElement("div"); title.className = "slot-title"; title.textContent = "Adopt";
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "big"; btn.id = "slotAdoptBtn"; btn.textContent = "💗 Adopt";
      btn.addEventListener("click", () => openAdopt());
      card.appendChild(plus); card.appendChild(title); card.appendChild(btn);
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
    if (!hasPet) {
      if (dots) dots.classList.add("hidden");
      if (prev) prev.classList.add("hidden");
      if (next) next.classList.add("hidden");
      if (pane) pane.classList.add("hidden");
      return;
    }
    const unlocked = window.MyPetRoster ? MyPetRoster.unlockedSlots(state) : 1;
    if (viewSlot == null) viewSlot = state.activePet || 0;
    if (viewSlot < 0) viewSlot = 0;
    if (viewSlot > n) viewSlot = n;
    if (dots) {
      dots.classList.remove("hidden");
      dots.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "pet-dot" + (viewSlot === i ? " on" : "");
        const name = (state.pets[i] && state.pets[i].name) || ("Pet " + (i + 1));
        b.title = name;
        b.setAttribute("aria-label", name);
        b.addEventListener("click", () => goToSlot(i));
        dots.appendChild(b);
      }
      const trail = document.createElement("button");
      trail.type = "button";
      const locked = n >= unlocked;
      trail.className = "pet-dot " + (locked ? "lock" : "plus") + (viewSlot === n ? " on" : "");
      trail.textContent = locked ? "🔒" : "➕";
      trail.title = locked ? "Locked" : "Adopt";
      trail.addEventListener("click", () => goToSlot(n));
      dots.appendChild(trail);
    }
    if (prev) prev.classList.toggle("hidden", viewSlot <= 0);
    if (next) next.classList.toggle("hidden", viewSlot >= n);
    if (pane) {
      if (viewSlot >= n) {
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
    const name = ($("nameInput").value || "Biscuit").trim().slice(0, 24);
    const pick = window._adoptPick || { wool: "white", face: "black", eyes: "white", field: "meadow" };
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
          wool: pick.wool,
          face: pick.face,
          eyes: pick.eyes,
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
        pet.wool = pick.wool || "white";
        pet.face = pick.face || "black";
        pet.eyes = pick.eyes || "white";
        pet.fieldTheme = pick.field || "meadow";
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
      toast, doCare, renderHud, addHearts: addTestHearts,
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
        if (window.MyPetColor) MyPetColor.migratePet(state.pet);
        persistStaticPet();
        applyPetLook();
        renderLooks();
        refreshAdoptPreview();
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
        if (k === "sleep") {
          pasture.mode = "sleep";
          pasture.sheep.stop();
          pasture.sheep.angle = 0;
          pasture.sheep.setTexture("sleep");
        } else if (k === "walk" || String(k).indexOf("walk") === 0) {
          pasture.mode = "walk";
          pasture.sheep.stop();
          pasture.sheep.setTexture(k === "walk" ? "walk1" : k);
        } else {
          pasture.mode = (k === "idle") ? "idle" : k;
          pasture.sheep.stop();
          pasture.sheep.setTexture(k);
        }
        pasture.layoutWear();
      },
      wear: (id) => { if (pasture) pasture.wear(id); },
      wearCollar: (id) => { if (pasture) pasture.wearCollar(id); },
      setCollar,
      openLooks,
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
    };
    setTimeout(() => maybeCelebrateBirthday(), 800);
  }

  async function main() {
    bindUi();
    try {
      if (window.MyPetDiscord && !window.MYPET_TEST_MODE) {
        await MyPetDiscord.boot();
      }
      state = await MyPetApi.me();
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

  window._adoptPick = { wool: "white", face: "black", eyes: "white", field: "meadow" };

  function makeSwatches(el, order, names, pal, current, onPick) {
    if (!el) return;
    el.innerHTML = "";
    order.forEach((id) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch" + (current === id ? " on" : "");
      btn.title = names[id] || id;
      btn.setAttribute("aria-label", names[id] || id);
      const entry = pal[id];
      btn.style.background = (entry && entry.hex) || "#eee";
      btn.addEventListener("click", () => onPick(id));
      el.appendChild(btn);
    });
  }
  function bindAdoptColors() {
    if (!window.MyPetColor) return;
    const pick = window._adoptPick;
    const draw = () => {
      makeSwatches($("woolSwatches"), MyPetColor.WOOL_ORDER, MyPetColor.WOOL_NAMES, MyPetColor.WOOL, pick.wool, (id) => { pick.wool = id; draw(); refreshAdoptPreview(); });
      makeSwatches($("faceSwatches"), MyPetColor.FACE_ORDER, MyPetColor.FACE_NAMES, MyPetColor.FACE, pick.face, (id) => { pick.face = id; draw(); refreshAdoptPreview(); });
      makeSwatches($("eyeSwatches"), MyPetColor.EYE_ORDER, MyPetColor.EYE_NAMES, MyPetColor.EYES, pick.eyes, (id) => { pick.eyes = id; draw(); refreshAdoptPreview(); });
    };
    draw();
  }
  function refreshAdoptPreview() {
    const img = $("adoptPreview") || document.querySelector("#pickPet img");
    if (!img || !window.MyPetColor) return;
    const pose = COLOR_IMG["sheep_idle.png"];
    if (!pose || !pose.naturalWidth) {
      loadColorImg("sheep_idle.png", refreshAdoptPreview);
      return;
    }
    const pick = window._adoptPick || { wool: "white", face: "black", eyes: "white" };
    img.src = MyPetColor.recolorSheepImage(pose, pick).toDataURL("image/png");
  }

  window.addEventListener("load", main);
})();
