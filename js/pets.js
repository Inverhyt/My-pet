/* My Pet roster — multi-pet save, slot unlocks, birthdays, journal. */
(() => {
  const TZ = "America/Los_Angeles";
  const SLOT_START = [0, 30, 75];
  const SLOT_STEP = 60;
  const MAX_SLOTS = 8;
  const PHOTO_CAP = 12;
  const SPECIES = {
    sheep_valais: { id: "sheep_valais", name: "Valais sheep", short: "Valais", emoji: "🐑", ready: true },
  };
  const COMING_SOON = [
    { id: "fox", name: "Fox", emoji: "🦊", file: "soon_fox.png" },
    { id: "rock", name: "Rock", emoji: "🪨", file: "soon_rock.png" },
    { id: "capybara", name: "Capybara", emoji: "🐾", file: "soon_capybara.png" },
    { id: "dragon", name: "Dragon", emoji: "🐉", file: "soon_dragon.png" },
    { id: "kiwi", name: "Kiwi bird", emoji: "🥝", file: "soon_kiwi.png" },
    { id: "cat", name: "Cat", emoji: "🐱", file: "soon_cat.png" },
    { id: "dog", name: "Dog", emoji: "🐶", file: "soon_dog.png" },
  ];
  const HEART_MARKS = [8, 12, 16, 20, 28, 30, 40, 50, 75, 100, 135, 150, 195, 200];
  const LOOK_MILESTONES = {
    crown: { label: "Crown look", emoji: "👑" },
    hat: { label: "Little hat", emoji: "🎩" },
    bow: { label: "Bow look", emoji: "🎀" },
    collar: { label: "Bell collar", emoji: "🔔" },
    witch: { label: "Witch hat", emoji: "🧙" },
  };

  function pacificYmd(d) {
    d = d instanceof Date ? d : (d != null && d !== "" ? new Date(d) : new Date());
    if (isNaN(d.getTime())) d = new Date();
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);
  }

  function formatShort(ymd) {
    if (!ymd) return "";
    const parts = String(ymd).slice(0, 10).split("-");
    if (parts.length !== 3) return String(ymd);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const m = +parts[1], day = +parts[2], y = +parts[0];
    if (!m || !months[m - 1]) return String(ymd);
    return months[m - 1] + " " + day + ", " + y;
  }

  function isRealDate(v) {
    if (v == null || v === "") return false;
    if (typeof v === "number") {
      if (v < Date.parse("2024-01-01T00:00:00Z")) return false;
      if (v > Date.now() + 86400000 * 2) return false;
      return true;
    }
    if (typeof v === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const y = +v.slice(0, 4);
        return y >= 2024 && y <= 2100;
      }
      const t = Date.parse(v);
      return isFinite(t) && isRealDate(t);
    }
    return false;
  }

  function createdToYmd(v) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && isRealDate(v)) return v;
    if (!isRealDate(v)) return pacificYmd(new Date());
    return pacificYmd(typeof v === "number" ? new Date(v) : new Date(v));
  }

  function slotAt(n) {
    if (n <= 1) return SLOT_START[0];
    if (n === 2) return SLOT_START[1];
    if (n === 3) return SLOT_START[2];
    return SLOT_START[2] + (n - 3) * SLOT_STEP;
  }

  function totalHearts(state) {
    const pets = (state && state.pets) || (state && state.pet ? [state.pet] : []);
    let sum = 0;
    for (let i = 0; i < pets.length; i++) sum += (pets[i] && pets[i].friendship) || 0;
    return sum;
  }

  function unlockedSlots(state) {
    const total = totalHearts(state);
    let n = 1;
    for (let i = 2; i <= MAX_SLOTS; i++) {
      if (total >= slotAt(i)) n = i;
      else break;
    }
    return n;
  }

  function emptyJournal() {
    return { milestones: [], photos: [] };
  }

  function newId() {
    return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function normalizePet(pet) {
    if (!pet) return pet;
    pet.id = pet.id || newId();
    pet.species = pet.species || "sheep_valais";
    pet.name = pet.name || "Biscuit";
    pet.friendship = typeof pet.friendship === "number" ? pet.friendship : 0;
    pet.unlocked = Array.isArray(pet.unlocked) ? pet.unlocked.slice() : [];
    if (pet.costume === undefined) pet.costume = null;
    if (pet.collar === undefined) pet.collar = null;
    pet.wool = pet.wool || "white";
    pet.face = pet.face || "black";
    pet.eyes = pet.eyes || "white";
    pet.costumeColors = pet.costumeColors || {};
    pet.fieldTheme = pet.fieldTheme || "meadow";
    if (!isRealDate(pet.created_at)) pet.created_at = Date.now();
    if (!(pet.birthday && isRealDate(pet.birthday))) {
      pet.birthday = createdToYmd(pet.created_at);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(pet.birthday))) {
      pet.birthday = createdToYmd(pet.birthday);
    } else {
      pet.birthday = String(pet.birthday).slice(0, 10);
    }
    pet.birthdaySeen = Array.isArray(pet.birthdaySeen) ? pet.birthdaySeen : [];
    pet.journal = pet.journal && typeof pet.journal === "object" ? pet.journal : emptyJournal();
    if (!Array.isArray(pet.journal.milestones)) pet.journal.milestones = [];
    if (!Array.isArray(pet.journal.photos)) pet.journal.photos = [];
    return pet;
  }

  function hasMilestone(pet, id) {
    const list = pet && pet.journal && pet.journal.milestones;
    if (!list) return false;
    for (let i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return true;
    return false;
  }

  function logMilestone(pet, id, label, emoji, date) {
    if (!pet || !id) return false;
    if (!pet.journal) pet.journal = emptyJournal();
    if (!Array.isArray(pet.journal.milestones)) pet.journal.milestones = [];
    if (hasMilestone(pet, id)) return false;
    pet.journal.milestones.push({
      id: id,
      label: label,
      emoji: emoji || "💗",
      date: date || pacificYmd(new Date()),
    });
    return true;
  }

  function migrateState(state) {
    if (!state) state = {};
    if (!Array.isArray(state.pets) || !state.pets.length) {
      state.pets = state.pet ? [normalizePet(state.pet)] : [];
    } else {
      state.pets = state.pets.map((p) => normalizePet(p));
    }
    if (typeof state.activePet !== "number" || state.activePet < 0 || state.activePet >= state.pets.length) {
      state.activePet = 0;
    }
    state.pet = state.pets.length ? state.pets[state.activePet] : null;
    state.version = 10;
    state.pets.forEach((p) => {
      if (p && !hasMilestone(p, "adopted")) {
        logMilestone(p, "adopted", "Came home", "💗", p.birthday);
      }
    });
    return state;
  }

  function daysTogether(pet, today) {
    today = today || pacificYmd(new Date());
    const b = pet && pet.birthday;
    if (!b) return 0;
    const a = new Date(b + "T12:00:00");
    const c = new Date(today + "T12:00:00");
    if (isNaN(a.getTime()) || isNaN(c.getTime())) return 0;
    return Math.max(0, Math.round((c - a) / 86400000));
  }

  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function birthdayStatus(pet, today) {
    today = today || pacificYmd(new Date());
    if (!pet || !pet.birthday) return { type: null };
    const bp = String(pet.birthday).split("-").map(Number);
    const tp = String(today).split("-").map(Number);
    if (bp.length !== 3 || tp.length !== 3) return { type: null };
    const dim = daysInMonth(tp[0], tp[1]);
    const day = Math.min(bp[2], dim);
    if (tp[2] !== day) return { type: null };
    if (pet.birthday === today) return { type: null };
    const isYear = tp[1] === bp[1];
    const key = isYear
      ? ("y-" + tp[0])
      : ("m-" + tp[0] + "-" + String(tp[1]).padStart(2, "0"));
    const seen = (pet.birthdaySeen || []).indexOf(key) >= 0;
    return {
      type: isYear ? "year" : "mini",
      key: key,
      seen: seen,
      bonus: seen ? 0 : (isYear ? 10 : 3),
      party: true,
      years: tp[0] - bp[0],
    };
  }

  function isBirthdayToday(pet, today) {
    const st = birthdayStatus(pet, today);
    return !!(st && st.party);
  }

  function markBirthdaySeen(pet, key) {
    if (!pet) return;
    if (!Array.isArray(pet.birthdaySeen)) pet.birthdaySeen = [];
    if (key && pet.birthdaySeen.indexOf(key) < 0) pet.birthdaySeen.push(key);
  }

  function maybeHeartMilestones(pet) {
    if (!pet) return [];
    const added = [];
    const f = pet.friendship || 0;
    HEART_MARKS.forEach((n) => {
      if (f >= n && logMilestone(pet, "hearts_" + n, n + " hearts", "💗")) added.push(n);
    });
    return added;
  }

  function logLookUnlock(pet, id) {
    const info = LOOK_MILESTONES[id];
    if (!info) return false;
    return logMilestone(pet, "look_" + id, info.label, info.emoji);
  }

  function addPhoto(pet, dataUrl) {
    if (!pet || !dataUrl) return false;
    if (!pet.journal) pet.journal = emptyJournal();
    if (!Array.isArray(pet.journal.photos)) pet.journal.photos = [];
    pet.journal.photos.push({ src: dataUrl, date: pacificYmd(new Date()) });
    while (pet.journal.photos.length > PHOTO_CAP) pet.journal.photos.shift();
    return true;
  }

  function makePet(opts) {
    opts = opts || {};
    const today = pacificYmd(new Date());
    const pet = normalizePet({
      id: newId(),
      species: opts.species || "sheep_valais",
      name: opts.name || "Biscuit",
      friendship: 0,
      unlocked: [],
      costume: null,
      collar: null,
      wool: opts.wool || "white",
      face: opts.face || "black",
      eyes: opts.eyes || "white",
      costumeColors: {},
      fieldTheme: opts.fieldTheme || "meadow",
      created_at: Date.now(),
      birthday: opts.birthday || today,
      journal: emptyJournal(),
    });
    logMilestone(pet, "adopted", "Came home", "💗", pet.birthday);
    return pet;
  }

  window.MyPetRoster = {
    TZ, SLOT_START, SLOT_STEP, MAX_SLOTS, PHOTO_CAP, SPECIES, COMING_SOON, HEART_MARKS, LOOK_MILESTONES,
    slotAt, totalHearts, unlockedSlots,
    pacificYmd, formatShort, isRealDate, createdToYmd, daysTogether,
    normalizePet, migrateState, makePet,
    birthdayStatus, isBirthdayToday, markBirthdaySeen,
    hasMilestone, logMilestone, maybeHeartMilestones, logLookUnlock, addPhoto,
  };
})();
