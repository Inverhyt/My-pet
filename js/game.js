/* Asset paths: relative so GitHub Pages ( /my-pet/ ) works, and /assets/ still works on the Pi server. */
function assetUrl(path) {
  path = String(path || "").replace(/^\/+/, "");
  const base = (typeof window.ASSET_BASE === "string") ? window.ASSET_BASE + path : path;
  const v = window.MYPET_ASSET_V || "2";
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
    { x: 215, y: 230 }, { x: 805, y: 240 }, { x: 798, y: 389 },
    { x: 700, y: 467 }, { x: 216, y: 546 }, { x: 790, y: 601 },
    { x: 286, y: 756 }, { x: 206, y: 765 }, { x: 430,  y: 683 },
    { x: 400, y: 280 }, { x: 560, y: 260 }, { x: 640, y: 520 },
  ];
  const WALK = { x0: 175, y0: 210, x1: 850, y1: 820 };
  const COSTUME_TEX = { crown: "costume_crown", bow: "costume_bow", hat: "costume_hat" };
  // Head tuft is left of sprite center (peak ~x 47 of 133). Offsets from feet (origin 0.5,1).
  const HEAD = {
    idle:  { x: -20, y: -108 },
    walk:  { x: -20, y: -108 },
    eat:   { x: -22, y: -98 },
    drink: { x: -20, y: -96 },
    happy: { x: -20, y: -120 },
    sleep: { x: -22, y: -112 },
  };
  const COSTUME_NUDGE = {
    crown: { x: 0, y: 0 },
    bow:   { x: 16, y: 10 },
    hat:   { x: 0, y: 6 },
  };
  // Tappable park toys, in field pixels.
  const PARK = {
    hay:    { x: 380, y: 655, r: 70, kind: "hop",    standL: { x: 295, y: 655 }, standR: { x: 475, y: 655 }, label: "hay" },
    slide:  { x: 590, y: 515, r: 90, kind: "slide",  start: { x: 515, y: 550 }, top: { x: 545, y: 410 }, end: { x: 700, y: 590 }, label: "slide" },
    tunnel: { x: 220, y: 530, r: 80, kind: "tunnel", start: { x: 140, y: 545 }, end: { x: 310, y: 545 }, label: "tunnel" },
  };

  const $ = (id) => document.getElementById(id);
  let state = null;
  let game = null;
  let pasture = null;
  let busy = false;
  let brushMode = false;

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

  function renderHud() {
    if (!state || !state.pet) return;
    $("petName").textContent = state.pet.name;
    $("hearts").textContent = "💗 " + state.pet.friendship;
    $("coinMark").textContent = state.coin_today ? "🪙 today" : "🪙";
    $("coinMark").title = state.coin_today ? "You already got today's coin" : "Care once today for 1 coin";
  }

  async function addTestHearts(n) {
    n = n || 10;
    if (!state || !state.pet || !MyPetApi.addHearts) return;
    const res = await MyPetApi.addHearts(n);
    state.pet = res.pet || state.pet;
    state.coin_today = res.coin_today || state.coin_today;
    renderHud();
    if (res.new_unlocks && res.new_unlocks.length) {
      const u = res.new_unlocks[0];
      toast("New look! " + u.emoji + " " + u.name, 3000);
    } else {
      toast("+" + n + " 💗");
    }
    blip("unlock");
  }

  function renderLooks() {
    const grid = $("looksGrid");
    grid.innerHTML = "";
    const pet = state && state.pet;
    const unlocked = (pet && pet.unlocked) || [];
    const items = [
      { id: null, name: "No look", emoji: "✨", img: assetUrl("assets/sheep_idle.png"), at: 0 },
      { id: "crown", name: "Flower crown", emoji: "🌸", img: assetUrl("assets/look_crown.png"), at: 8 },
      { id: "bow", name: "Bow", emoji: "🎀", img: assetUrl("assets/look_bow.png"), at: 16 },
      { id: "hat", name: "Little hat", emoji: "🎩", img: assetUrl("assets/look_hat.png"), at: 28 },
    ];
    for (const it of items) {
      const have = it.id === null || unlocked.includes(it.id);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "look" + (have ? "" : " locked") + (pet && pet.costume === it.id ? " equipped" : "");
      btn.innerHTML = `<img src="${it.img}" alt="">
        <span>${it.emoji} ${it.name}</span>
        <span class="need">${have ? (it.id === null ? "Always" : "Unlocked") : "💗 " + it.at}</span>`;
      if (have) {
        btn.addEventListener("click", async () => {
          const res = await MyPetApi.equip(it.id);
          state.pet = res.pet;
          renderHud(); renderLooks();
          if (pasture) pasture.wear(state.pet.costume);
          toast(it.id ? "Cute! " + it.emoji : "Look cleared");
          blip("click");
        });
      }
      grid.appendChild(btn);
    }
  }

  async function doCare(action, after) {
    const res = await MyPetApi.care(action);
    state.pet = res.pet;
    state.coins = res.coins;
    state.coin_today = res.pet.coin_day === res.day_key;
    renderHud();
    if (res.coin_awarded) {
      toast("+1 coin 🪙");
      blip("coin");
    }
    if (res.new_unlocks && res.new_unlocks.length) {
      const u = res.new_unlocks[0];
      setTimeout(() => { toast("New look! " + u.emoji + " " + u.name, 3000); blip("unlock"); }, res.coin_awarded ? 1600 : 200);
    }
    if (after) after(res);
    return res;
  }

  class Pasture extends Phaser.Scene {
    constructor() { super("pasture"); }

    preload() {
      const A = (typeof assetUrl === "function") ? (name) => assetUrl("assets/" + name) : (name) => "/assets/" + name;
      const img = (key, file) => this.load.image(key, A(file));
      img("field", "field.png");
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
    }

    create() {
      pasture = this;
      this.anims.create({
        key: "walk",
        frames: [{ key: "walk1" }, { key: "walk2" }, { key: "walk3" }, { key: "walk4" }],
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

      this.field = this.add.image(this.fieldX, this.fieldY, "field").setOrigin(0, 0).setScale(scale);
      this.field.setInteractive();

      this.sheep = this.add.sprite(0, 0, "idle").setOrigin(0.5, 1).setScale(scale);
      this.sheep.playX = 0.5;
      this.blanket = this.add.image(0, 0, "blanket").setOrigin(0.5, 0.7).setScale(scale).setVisible(false);
      this.costume = this.add.image(0, 0, "costume_crown").setOrigin(0.5, 1).setScale(scale * 1.08).setVisible(false);

      const start = this.toWorld(512, 560);
      this.place(start.x, start.y);
      this.mode = "idle";
      this.target = null;
      this.onArrive = null;
      this.idleAt = this.time.now + 8000;
      this.facing = 1;
      this.wear(state.pet && state.pet.costume);
      this.placePark();

      this.field.on("pointerdown", (p) => this.onTap(p));
      this.input.addPointer(2);
      this.input.on("pointermove", (p) => this.onMove(p));
      const canvas = this.game.canvas;
      if (canvas) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("touchmove", (e) => { if (brushMode) e.preventDefault(); }, { passive: false });
      }

      this.time.addEvent({ delay: 18000, loop: true, callback: () => this.spawnButterflies() });
      this.time.delayedCall(4000, () => this.spawnButterflies());

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
      if (this.mode === "walk" || (this.sheep.anims && this.sheep.anims.isPlaying && this.sheep.anims.currentAnim && this.sheep.anims.currentAnim.key === "walk")) return "walk";
      const key = this.sheep.texture && this.sheep.texture.key;
      if (HEAD[key]) return key;
      if (key && String(key).indexOf("walk") === 0) return "walk";
      return "idle";
    }

    layoutWear() {
      const s = this.fScale;
      this.blanket.x = this.sheep.x;
      this.blanket.y = this.sheep.y - 10 * s;
      this.blanket.setDepth(this.sheep.y - 1);
      this.blanket.setVisible(false);
      const id = this.sheep.costumeId;
      if (id && COSTUME_TEX[id]) {
        const pose = this.poseName();
        const head = HEAD[pose] || HEAD.idle;
        const n = COSTUME_NUDGE[id] || { x: 0, y: 0 };
        const flip = this.sheep.flipX ? -1 : 1;
        this.costume.x = this.sheep.x + (head.x + n.x) * s * flip;
        this.costume.y = this.sheep.y + (head.y + n.y) * s;
        this.costume.setFlipX(this.sheep.flipX);
        this.costume.setVisible(true);
        this.costume.setDepth(this.sheep.y + 4);
      } else {
        this.costume.setVisible(false);
      }
      this.sheep.setDepth(this.sheep.y);
    }

    wear(id) {
      this.sheep.costumeId = id || null;
      const tex = COSTUME_TEX[id];
      if (tex && this.textures.exists(tex)) this.costume.setTexture(tex);
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
      else this.sheep.setTexture(key);
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

    goIdle() {
      this.mode = "idle";
      this.showAnim("idle");
      this.blanket.setVisible(false);
      this.idleAt = this.time.now + 7000 + Math.random() * 6000;
      this.layoutWear();
    }

    onTap(pointer) {
      if (busy || this.mode === "sleep") return;
      if ($("looks").classList.contains("hidden") === false) return;
      if ($("friend").classList.contains("hidden") === false) return;
      if ($("bath") && $("bath").classList.contains("hidden") === false) return;
      const f = this.toField(pointer.worldX, pointer.worldY);
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
          this.showAnim("sleep");
          this.blanket.setVisible(false);
          this.layoutWear();
          this.floatSprite("zzz", this.sheep.x + 28, this.sheep.y - 90, 1600);
          this.time.delayedCall(900, () => this.floatSprite("zzz", this.sheep.x + 10, this.sheep.y - 100, 1600));
          this.time.delayedCall(1800, () => this.floatSprite("zzz", this.sheep.x + 32, this.sheep.y - 86, 1400));
          blip("nap");
          toast("Night night 😴");
          doCare("nap").catch(() => {});
          this.time.delayedCall(3400, () => {
            this.goIdle();
            busy = false;
          });
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
      brushMode = !brushMode;
      document.body.classList.toggle("brush", brushMode);
      document.querySelector('[data-act="brush"]').classList.toggle("on", brushMode);
      toast(brushMode ? "Swipe the wool ✨" : "Brush done");
      this._brushed = false;
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
      toast("Say cheese 📷");
      this.game.renderer.snapshot((img) => {
        const a = document.createElement("a");
        a.href = img.src;
        const n = (state.pet && state.pet.name) || "mypet";
        a.download = n.replace(/\s+/g, "_") + ".png";
        a.click();
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
      const left = Math.random() < 0.5;
      const fy = this.clampY(260 + Math.random() * 400);
      const start = this.toWorld(left ? 150 : 870, fy);
      const end = this.toWorld(left ? 870 : 150, fy + (Math.random() - 0.5) * 80);
      const key = Math.random() < 0.5 ? "bf" : "bfb";
      const bf = this.add.sprite(start.x, start.y, key + "1").setScale(this.fScale * 1.4).setDepth(900);
      bf.play(key);
      this.tweens.add({
        targets: bf, x: end.x, y: end.y, duration: 7000, ease: "Sine.easeInOut",
        onComplete: () => bf.destroy(),
      });
      // hop after if idle
      if (this.mode === "idle" && !busy && Math.random() < 0.7) {
        const hop = this.toField(start.x + (end.x - start.x) * 0.3, start.y);
        this.walkTo(hop.x, hop.y, () => {
          this.showAnim("happy");
          this.tweens.add({
            targets: this.sheep, y: this.sheep.y - 18, yoyo: true, duration: 140, repeat: 2,
            onUpdate: () => this.layoutWear(),
            onComplete: () => this.goIdle(),
          });
        });
      }
    }

    idleMood() {
      if (this.mode !== "idle" || busy) return;
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
        this.idleAt = this.time.now + 9000 + Math.random() * 8000;
        this.idleMood();
      }
    }
  }

  function openBathMini(onDone) {
    const root = $("bath");
    if (!root) { if (onDone) onDone(); return; }
    const hint = $("bathHint");
    const fill = $("bathFill");
    const wrap = $("bathSheepWrap");
    const fx = $("bathFx");
    const btnRinse = $("bathRinse");
    const btnDry = $("bathDry");
    const sheepImg = $("bathSheep");
    let clean = 0;
    let phase = "scrub"; // scrub | rinse | dry | done
    const bubbles = [];
    let finished = false;

    function setHint(msg) { if (hint) hint.textContent = msg; }
    function setMeter() {
      if (fill) fill.style.width = Math.max(0, Math.min(100, clean)) + "%";
    }
    function show(el, on) {
      if (!el) return;
      el.classList.toggle("hidden", !on);
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
      bubbles.push({
        x: x - rect.left,
        y: y - rect.top,
        r: 6 + Math.random() * 12,
        a: 0.75,
      });
      if (bubbles.length > 40) bubbles.shift();
      draw();
    }

    function finish() {
      if (finished) return;
      finished = true;
      document.body.classList.remove("bathing");
      root.classList.add("hidden");
      wrap.removeEventListener("pointerdown", onPtr);
      wrap.removeEventListener("pointermove", onPtr);
      wrap.removeEventListener("pointerup", onUp);
      if (onDone) onDone();
    }

    function onPtr(e) {
      if (phase !== "scrub") return;
      if (e.type === "pointermove" && !e.buttons) return;
      e.preventDefault();
      addBubble(e.clientX, e.clientY);
      clean = Math.min(80, clean + (e.buttons || e.pressure || 1) * 1.8);
      setMeter();
      if (clean >= 60) {
        show(btnRinse, true);
        setHint("Nice! Now rinse");
      }
    }
    function onUp() {}

    btnRinse.onclick = () => {
      if (phase !== "scrub") return;
      phase = "rinse";
      show(btnRinse, false);
      setHint("Rinse 🚿");
      blip("splash");
      // bubbles float away, meter fills
      const start = performance.now();
      function step(now) {
        const t = (now - start) / 900;
        for (const b of bubbles) {
          b.y -= 1.6;
          b.a = Math.max(0, 0.75 * (1 - t));
        }
        clean = Math.min(100, clean + 2);
        setMeter();
        draw();
        if (t < 1) requestAnimationFrame(step);
        else {
          bubbles.length = 0;
          draw();
          clean = 100;
          setMeter();
          phase = "dry";
          show(btnDry, true);
          setHint("Dry off");
        }
      }
      requestAnimationFrame(step);
    };

    btnDry.onclick = () => {
      if (phase !== "dry") return;
      phase = "done";
      show(btnDry, false);
      setHint("All done ✨");
      if (sheepImg) {
        sheepImg.classList.add("shake");
        setTimeout(() => sheepImg.classList.remove("shake"), 700);
      }
      wrap.classList.add("sparkle");
      blip("unlock");
      setTimeout(finish, 800);
    };

    clean = 0;
    phase = "scrub";
    bubbles.length = 0;
    setMeter();
    setHint("Scrub the wool 🧼");
    show(btnRinse, false);
    show(btnDry, false);
    if (sheepImg) sheepImg.classList.remove("shake");
    wrap.classList.remove("sparkle");
    root.classList.remove("hidden");
    document.body.classList.add("bathing");
    sizeCanvas();
    draw();
    wrap.addEventListener("pointerdown", onPtr);
    wrap.addEventListener("pointermove", onPtr);
    wrap.addEventListener("pointerup", onUp);
    // gentle auto help so there is no fail / stuck state
    clearInterval(openBathMini._help);
    openBathMini._help = setInterval(() => {
      if (phase !== "scrub") { clearInterval(openBathMini._help); return; }
      if (clean < 60) {
        clean = Math.min(60, clean + 3);
        setMeter();
        if (clean >= 60) { show(btnRinse, true); setHint("Nice! Now rinse"); }
      }
    }, 700);
  }

  async function openLooks() {
    try { state = Object.assign(state || {}, await MyPetApi.me()); renderHud(); } catch (e) {}
    renderLooks();
    $("looks").classList.remove("hidden");
  }
  function closeLooks() { $("looks").classList.add("hidden"); }
  function openFriend() { $("friend").classList.remove("hidden"); }
  function closeFriend() { $("friend").classList.add("hidden"); }

  function bindUi() {
    $("toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn || !pasture) return;
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
    $("friendClose").addEventListener("click", closeFriend);
    const testBtn = $("testBtn");
    if (testBtn) {
      testBtn.addEventListener("click", () => addTestHearts(10));
      if (window.MYPET_TEST_MODE) testBtn.classList.remove("hidden");
    }
    $("adoptBtn").addEventListener("click", onAdopt);
    $("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") onAdopt(); });
  }

  async function onAdopt() {
    const name = ($("nameInput").value || "Biscuit").trim().slice(0, 24);
    try {
      $("adoptBtn").disabled = true;
      state = await MyPetApi.adopt(name, "sheep_valais", "field");
      $("adopt").classList.add("hidden");
      startGame();
      toast("Welcome, " + state.pet.name + " 💗");
      blip("unlock");
    } catch (err) {
      toast(String(err.message || err));
      $("adoptBtn").disabled = false;
    }
  }

  function startGame() {
    $("hud").classList.remove("hidden");
    $("boot").classList.add("hidden");
    renderHud();
    if (game) return;
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      width: W,
      height: H,
      backgroundColor: "#f4efe4",
      pixelArt: true,
      antialias: false,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Pasture],
    });
    window.__mypet = {
      game, get pasture() { return pasture; }, get state() { return state; },
      toast, doCare, renderHud, addHearts: addTestHearts,
      openBath: openBathMini,
      setBusy: (v) => { busy = !!v; },
      get busy() { return busy; },
    };
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
    if (!state.pet) {
      $("adopt").classList.remove("hidden");
      $("nameInput").focus();
    } else {
      startGame();
    }
  }

  window.addEventListener("load", main);
})();
