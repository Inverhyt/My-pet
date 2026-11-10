/* My Pet — static test mode. No backend. State lives in localStorage only.
   The daily coin here is just a badge. It is not a real Arbiter coin. */
const MyPetApi = (() => {
  const KEY = "mypet-static-v1";
  const TEST_GUILD = "1496914996444135565";
  const UNLOCKS = [
    { id: "crown", at: 8, name: "Flower crown", emoji: "🌸" },
    { id: "bow", at: 16, name: "Bow", emoji: "🎀" },
    { id: "hat", at: 28, name: "Little hat", emoji: "🎩" },
  ];
  const CARE = new Set(["eat","drink","nap","pet","brush","bath","play","flower","treat"]);

  const params = new URLSearchParams(location.search);
  let userId = String(params.get("user") || params.get("mock_user") || "local");
  let guildId = String(params.get("guild") || params.get("mock_guild") || TEST_GUILD);

  function dayKey(now) {
    now = now || new Date();
    // Same noon-Pacific turnover as the real game.
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit",
      hourCycle: "h23",
    });
    const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
    let y = Number(parts.year), m = Number(parts.month), d = Number(parts.day);
    const hour = Number(parts.hour);
    if (hour < 12) {
      const utc = Date.UTC(y, m - 1, d) - 86400000;
      const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(utc));
      return ymd;
    }
    return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }

  function empty() {
    return {
      user_id: userId,
      guild_id: guildId,
      pet: null,
      coins: 0,
      day_key: dayKey(),
      coin_today: false,
      catalog: { unlocks: UNLOCKS },
    };
  }

  function decorate(state) {
    state.day_key = dayKey();
    if (state.pet) {
      const unlocked = state.pet.unlocked || [];
      state.pet.next_unlocks = UNLOCKS.map((u) => ({ ...u, have: unlocked.includes(u.id) }));
      state.coin_today = state.pet.coin_day === state.day_key;
    } else {
      state.coin_today = false;
    }
    return state;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return decorate(empty());
      const s = JSON.parse(raw);
      return decorate(Object.assign(empty(), s, { user_id: userId, guild_id: guildId }));
    } catch (e) {
      return decorate(empty());
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify({
      pet: state.pet,
      coins: state.coins || 0,
    }));
    return decorate(state);
  }

  function applyUnlocks(pet, before) {
    const newly = [];
    const unlocked = Array.isArray(pet.unlocked) ? pet.unlocked.slice() : [];
    for (const u of UNLOCKS) {
      if (pet.friendship >= u.at && !unlocked.includes(u.id)) {
        unlocked.push(u.id);
        if (pet.friendship - (before || 0) > 0 && !((before || 0) >= u.at)) newly.push(u);
        else if (!before && true) newly.push(u);
      }
    }
    pet.unlocked = unlocked;
    return newly;
  }

  function setIds(u, g) {
    if (u != null) userId = String(u);
    if (g != null) guildId = String(g);
  }

  return {
    setIds,
    setSession: function () {},
    ids: () => ({ userId, guildId }),
    inActivity: () => false,
    apiPath: (p) => p,
    config: async () => ({ clientId: "", discordLogin: false, mockAllowed: true, testMode: true }),
    token: async () => { throw new Error("No Discord login in the phone test"); },
    me: async () => load(),
    adopt: async (name) => {
      const state = load();
      if (state.pet) throw new Error("You already have a pet");
      name = String(name || "").trim().slice(0, 24) || "Biscuit";
      state.pet = {
        species: "sheep_valais",
        background: "field",
        name,
        friendship: 0,
        costume: null,
        unlocked: [],
        coin_day: null,
        created_at: Date.now(),
      };
      return save(state);
    },
    care: async (action) => {
      if (!CARE.has(action)) throw new Error("unknown action");
      const state = load();
      if (!state.pet) throw new Error("no pet");
      const before = state.pet.friendship || 0;
      state.pet.friendship = before + 1;
      const newly = applyUnlocks(state.pet, before);
      let coin_awarded = false;
      const day = dayKey();
      if (state.pet.coin_day !== day) {
        state.pet.coin_day = day;
        state.coins = (state.coins || 0) + 1;
        coin_awarded = true;
      }
      save(state);
      return {
        pet: decorate(state).pet,
        action,
        coin_awarded,
        coins: state.coins,
        new_unlocks: newly,
        day_key: day,
      };
    },
    equip: async (costume) => {
      const state = load();
      if (!state.pet) throw new Error("no pet");
      if (costume && !(state.pet.unlocked || []).includes(costume)) throw new Error("locked");
      state.pet.costume = costume || null;
      save(state);
      return { pet: decorate(state).pet };
    },
    addHearts: async (n) => {
      n = Math.max(1, Math.min(99, Number(n) || 10));
      const state = load();
      if (!state.pet) throw new Error("no pet");
      const before = state.pet.friendship || 0;
      state.pet.friendship = before + n;
      const newly = applyUnlocks(state.pet, before);
      save(state);
      return { pet: decorate(state).pet, new_unlocks: newly, coin_today: decorate(state).coin_today };
    },
  };
})();
