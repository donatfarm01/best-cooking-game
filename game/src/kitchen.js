// Sizzle Station — the kitchen: state, orders, cooking and serving.
//
// The kitchen is one plain state object. createKitchen builds it,
// updateKitchen advances it one frame from the input actions, and the
// renderer only reads it. Nothing here touches the DOM or the canvas,
// so the rules can be tested from a console with no graphics at all.

import { INGREDIENTS, INGREDIENT_IDS, RECIPES, finalStage, nextStageAfter, matchingOrder, recipeById } from './recipes.js';
import { makeRng } from './random.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const SHIFT_LENGTH = 150;
export const CHOP_TIME = 1.4;
export const COOK_TIME = 3.0;
export const BURN_TIME = 6.0;
export const MAX_ORDERS = 4;
export const MAX_HEARTS = 3;

// The kitchen floor plan. Counters sit along the top of the floor;
// the serving pass is a window in the right wall.
export const STATIONS = {
  pantry: { id: 'pantry', label: 'Pantry', x: 16, y: 250, w: 190, h: 150, solid: true },
  board: { id: 'board', label: 'Chopping Board', x: 260, y: 250, w: 190, h: 150, solid: true },
  stove: { id: 'stove', label: 'Wok Stove', x: 500, y: 250, w: 280, h: 150, solid: true },
  plate: { id: 'plate', label: 'Plating Counter', x: 830, y: 250, w: 190, h: 150, solid: true },
  bin: { id: 'bin', label: 'Bin', x: 1070, y: 250, w: 100, h: 150, solid: true },
  pass: { id: 'pass', label: 'Serving Pass', x: 1180, y: 500, w: 84, h: 140, solid: true },
};

export const FLOOR = { x: 14, y: 210, w: 1252, h: 576 };

// Where each burner sits on the stove, in canvas pixels.
export const BURNERS = [
  { x: 570, y: 315 },
  { x: 710, y: 315 },
];

export function createKitchen(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    phase: 'title', // title | playing | paused | over
    frozen: false, // screenshot mode: state is staged and never advances
    time: 0,
    timeLeft: SHIFT_LENGTH,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    served: 0,
    failed: 0,
    chopped: 0,
    cooked: 0,
    trashed: 0,
    orderSeq: 0,
    orders: [],
    nextOrderIn: 0,
    chef: { x: 640, y: 600, r: 22, speed: 280, dir: 'down', moving: false },
    hands: [null, null],
    board: { item: null, progress: 0, done: false, chopTick: 0 },
    woks: [
      { item: null, cookT: 0, done: false, warned: false, dinged: false },
      { item: null, cookT: 0, done: false, warned: false, dinged: false },
    ],
    plate: { items: [] },
    pantryOpen: false,
    particles: [],
    floats: [],
    banner: null, // { text, t, life }
    rushAnnounced: false,
    overReason: null, // 'time' | 'hearts'
    muted: false,
  };
  return state;
}

// How fast new tickets arrive, and how patient they are, as the shift
// goes on. Pressure grows; the chores never do.
export function spawnIntervalAt(elapsed) {
  return Math.max(7, 12 - elapsed * 0.04);
}

export function patienceAt(elapsed) {
  return Math.max(34, 50 - elapsed * 0.08);
}

export function spawnOrder(state) {
  const recipe = state.rng.pick(RECIPES);
  const patience = patienceAt(state.time);
  state.orders.push({
    id: ++state.orderSeq,
    recipeId: recipe.id,
    patience,
    maxPatience: patience,
    state: 'open',
  });
  state.nextOrderIn = spawnIntervalAt(state.time);
}

export function openOrders(state) {
  return state.orders.filter((o) => o.state === 'open');
}

export function addFloat(state, x, y, text, color) {
  state.floats.push({ x, y, text, color: color || '#ffffff', t: 0, life: 1.1 });
}

export function addParticles(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = state.rng.next() * Math.PI * 2;
    const v = (speed || 60) * (0.4 + state.rng.next() * 0.8);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 40,
      t: 0,
      life: 0.5 + state.rng.next() * 0.5,
      color,
      size: 2 + state.rng.next() * 3,
    });
  }
}

export function showBanner(state, text) {
  state.banner = { text, t: 0, life: 2.2 };
}

// --- Movement and collision ---------------------------------------------

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function moveChef(state, vx, vy, dt) {
  const chef = state.chef;
  if (vx === 0 && vy === 0) {
    chef.moving = false;
    return;
  }
  chef.moving = true;
  chef.dir = Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up');
  const step = chef.speed * dt;
  const solids = Object.values(STATIONS).filter((s) => s.solid);
  const nx = chef.x + vx * step;
  if (nx - chef.r >= FLOOR.x && nx + chef.r <= FLOOR.x + FLOOR.w) {
    if (!solids.some((s) => circleHitsRect(nx, chef.y, chef.r, s))) chef.x = nx;
  }
  const ny = chef.y + vy * step;
  if (ny - chef.r >= FLOOR.y && ny + chef.r <= FLOOR.y + FLOOR.h) {
    if (!solids.some((s) => circleHitsRect(chef.x, ny, chef.r, s))) chef.y = ny;
  }
}

function nearestStation(state) {
  const chef = state.chef;
  let best = null;
  let bestD = 110;
  for (const station of Object.values(STATIONS)) {
    const nx = Math.max(station.x, Math.min(chef.x, station.x + station.w));
    const ny = Math.max(station.y, Math.min(chef.y, station.y + station.h));
    const d = Math.hypot(chef.x - nx, chef.y - ny);
    if (d < bestD) {
      bestD = d;
      best = station;
    }
  }
  return best;
}

function freeHand(state) {
  return state.hands[0] === null ? 0 : state.hands[1] === null ? 1 : -1;
}

function carriedItem(state, hand) {
  return state.hands[hand];
}

// --- Interactions --------------------------------------------------------

export function grabFromPantry(state, ingId, sounds) {
  if (!INGREDIENTS[ingId]) return false;
  const hand = freeHand(state);
  if (hand === -1) {
    addFloat(state, state.chef.x, state.chef.y - 40, 'Hands full!', '#ff9d9d');
    if (sounds) sounds.fail();
    return false;
  }
  state.hands[hand] = { ing: ingId, stage: 'raw' };
  state.pantryOpen = false;
  if (sounds) sounds.grab();
  return true;
}

export function interact(state, stationId, sounds) {
  if (state.phase !== 'playing' || state.frozen) return;
  const station = STATIONS[stationId];
  if (!station) return;

  if (stationId === 'pantry') {
    state.pantryOpen = !state.pantryOpen;
    if (sounds) sounds.click();
    return;
  }
  state.pantryOpen = false;

  if (stationId === 'board') {
    const board = state.board;
    if (!board.item) {
      const hand = state.hands.findIndex((h) => h && nextStageAfter(h.ing, h.stage, 'board'));
      if (hand === -1) {
        addFloat(state, 355, 235, 'Needs something to chop', '#ffd166');
        return;
      }
      board.item = state.hands[hand];
      board.progress = 0;
      board.done = false;
      board.chopTick = 0;
      state.hands[hand] = null;
      if (sounds) sounds.place();
      return;
    }
    if (board.done) {
      const hand = freeHand(state);
      if (hand === -1) {
        addFloat(state, state.chef.x, state.chef.y - 40, 'Hands full!', '#ff9d9d');
        return;
      }
      state.hands[hand] = board.item;
      state.board.item = null;
      state.board.progress = 0;
      state.board.done = false;
      if (sounds) sounds.grab();
    }
    return;
  }

  if (stationId === 'stove') {
    // Pick the burner the chef is closest to.
    let wok = state.woks[0];
    let wokIndex = 0;
    const d0 = Math.hypot(state.chef.x - BURNERS[0].x, state.chef.y - BURNERS[0].y);
    const d1 = Math.hypot(state.chef.x - BURNERS[1].x, state.chef.y - BURNERS[1].y);
    if (d1 < d0) {
      wok = state.woks[1];
      wokIndex = 1;
    }
    void wokIndex;
    if (!wok.item) {
      const hand = state.hands.findIndex((h) => h && nextStageAfter(h.ing, h.stage, 'wok'));
      if (hand === -1) {
        addFloat(state, 640, 235, 'Needs something to cook', '#ffd166');
        return;
      }
      wok.item = state.hands[hand];
      wok.cookT = 0;
      wok.done = false;
      wok.warned = false;
      wok.dinged = false;
      state.hands[hand] = null;
      if (sounds) sounds.place();
      return;
    }
    if (wok.done || wok.cookT >= BURN_TIME) {
      const hand = freeHand(state);
      if (hand === -1) {
        addFloat(state, state.chef.x, state.chef.y - 40, 'Hands full!', '#ff9d9d');
        return;
      }
      if (wok.cookT >= BURN_TIME) {
        addFloat(state, state.chef.x, state.chef.y - 40, 'Burnt! Bin it.', '#ff9d9d');
      }
      state.hands[hand] = wok.item;
      wok.item = null;
      wok.cookT = 0;
      wok.done = false;
      wok.warned = false;
      wok.dinged = false;
      if (sounds) sounds.grab();
      return;
    }
    addFloat(state, 640, 235, 'Still cooking...', '#ffd166');
    return;
  }

  if (stationId === 'plate') {
    const hand = state.hands.findIndex((h) => h && h.stage === finalStage(h.ing));
    if (hand !== -1 && state.plate.items.length < 3) {
      state.plate.items.push(state.hands[hand]);
      state.hands[hand] = null;
      addParticles(state, 925, 315, '#ffffff', 8, 50);
      if (sounds) sounds.place();
      return;
    }
    if (hand === -1 && state.plate.items.length > 0 && freeHand(state) !== -1) {
      const back = state.plate.items.pop();
      state.hands[freeHand(state)] = back;
      if (sounds) sounds.grab();
      return;
    }
    if (state.plate.items.length >= 3) {
      addFloat(state, 925, 235, 'Plate is full', '#ffd166');
    } else {
      addFloat(state, 925, 235, 'Needs a finished item', '#ffd166');
    }
    return;
  }

  if (stationId === 'pass') {
    if (state.plate.items.length < 3) {
      addFloat(state, 1222, 480, 'Plate needs 3 items', '#ffd166');
      if (sounds) sounds.fail();
      return;
    }
    const order = matchingOrder(state.plate.items, state.orders);
    if (!order) {
      addFloat(state, 1222, 480, 'No order wants this!', '#ff9d9d');
      if (sounds) sounds.fail();
      return;
    }
    serveOrder(state, order, sounds);
    return;
  }

  if (stationId === 'bin') {
    const hand = state.hands.findIndex((h) => h !== null);
    if (hand !== -1) {
      state.hands[hand] = null;
      state.trashed += 1;
      if (sounds) sounds.place();
      return;
    }
    if (state.plate.items.length > 0) {
      state.plate.items = [];
      state.trashed += 1;
      if (sounds) sounds.place();
    }
    return;
  }
}

function serveOrder(state, order, sounds) {
  const recipe = recipeById(order.recipeId);
  const tip = Math.round(50 * (order.patience / order.maxPatience));
  const earned = recipe.price + tip + state.combo * 10;
  state.score += earned;
  state.coins += earned;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  order.state = 'served';
  state.plate.items = [];
  addFloat(state, 1222, 480, '+' + earned, '#7dff8a');
  if (state.combo >= 2) addFloat(state, 1222, 455, 'Combo x' + state.combo + '!', '#ffd23f');
  addParticles(state, 1222, 500, '#ffd23f', 16, 90);
  if (sounds) {
    sounds.serve();
    sounds.coin();
  }
}

function failOrder(state, order, sounds) {
  order.state = 'failed';
  state.failed += 1;
  state.hearts -= 1;
  state.combo = 0;
  addFloat(state, 640, 150, 'Order failed: ' + recipeById(order.recipeId).name, '#ff6b6b');
  if (sounds) sounds.fail();
  if (state.hearts <= 0) {
    state.phase = 'over';
    state.overReason = 'hearts';
    if (sounds) sounds.over();
  }
}

// --- The frame update -----------------------------------------------------

export function updateKitchen(state, dt, actions, sounds) {
  if (state.phase !== 'playing' || state.frozen) return;
  state.time += dt;
  state.timeLeft = Math.max(0, SHIFT_LENGTH - state.time);

  if (state.timeLeft <= 0) {
    state.phase = 'over';
    state.overReason = 'time';
    if (sounds) sounds.over();
    return;
  }

  if (!state.rushAnnounced && state.timeLeft <= 30) {
    state.rushAnnounced = true;
    showBanner(state, 'RUSH HOUR!');
    if (sounds) sounds.tick();
  }

  // New tickets.
  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0 && openOrders(state).length < MAX_ORDERS) {
    spawnOrder(state);
  }

  // Patience drains; a ticket that runs out costs a heart.
  for (const order of state.orders) {
    if (order.state !== 'open') continue;
    order.patience -= dt;
    if (order.patience <= 0) failOrder(state, order, sounds);
  }
  if (state.phase !== 'playing') return;

  // Chopping board.
  const board = state.board;
  if (board.item && !board.done) {
    board.progress += dt;
    board.chopTick += dt;
    if (board.chopTick >= 0.35) {
      board.chopTick = 0;
      addParticles(state, 355, 300, '#d9c08a', 4, 40);
      if (sounds) sounds.chop();
    }
    if (board.progress >= CHOP_TIME) {
      board.done = true;
      board.item = { ing: board.item.ing, stage: 'chopped' };
      state.chopped += 1;
      if (sounds) sounds.chopDone();
    }
  }

  // Woks.
  let anyCooking = false;
  for (const wok of state.woks) {
    if (!wok.item) continue;
    anyCooking = true;
    wok.cookT += dt;
    if (!wok.done && wok.cookT >= COOK_TIME) {
      wok.done = true;
      wok.item = { ing: wok.item.ing, stage: 'cooked' };
      state.cooked += 1;
      if (sounds) sounds.cookDone();
    }
    if (!wok.warned && wok.cookT >= COOK_TIME + 2) {
      wok.warned = true;
      if (sounds) sounds.burnWarn();
    }
  }
  if (sounds) {
    if (anyCooking && sounds.sizzleStart) sounds.sizzleStart();
    if (!anyCooking && sounds.sizzleStop) sounds.sizzleStop();
  }

  // Chef movement.
  const vec = actions.move;
  moveChef(state, vec.x, vec.y, dt);

  // Queued actions.
  for (const action of actions.list) {
    if (action.type === 'interact') {
      const station = nearestStation(state);
      if (station) interact(state, station.id, sounds);
    } else if (action.type === 'digit') {
      if (state.pantryOpen) {
        const ingId = INGREDIENT_IDS[action.digit - 1];
        if (ingId) grabFromPantry(state, ingId, sounds);
      }
    } else if (action.type === 'click') {
      handleClick(state, action, sounds);
    }
  }

  // Particles, floats and banners age out.
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);
  for (const f of state.floats) f.t += dt;
  state.floats = state.floats.filter((f) => f.t < f.life);
  if (state.banner) {
    state.banner.t += dt;
    if (state.banner.t >= state.banner.life) state.banner = null;
  }
}

function handleClick(state, action, sounds) {
  // Clicking an ingredient in the open pantry grabs it.
  if (state.pantryOpen) {
    const slot = pantrySlotAt(action.x, action.y);
    if (slot) {
      grabFromPantry(state, slot, sounds);
      return;
    }
  }
  // Clicking a station the chef stands by uses it.
  const station = nearestStation(state);
  if (!station) return;
  const inside =
    action.x >= station.x - 20 && action.x <= station.x + station.w + 20 &&
    action.y >= station.y - 20 && action.y <= station.y + station.h + 20;
  if (inside) interact(state, station.id, sounds);
}

// The pantry panel shows the 8 ingredients in two columns of four.
// Returns the ingredient id under the click, or null.
export function pantrySlotAt(x, y) {
  const panel = { x: 230, y: 470, w: 820, h: 130 };
  if (x < panel.x || x > panel.x + panel.w || y < panel.y || y > panel.y + panel.h) return null;
  const col = Math.floor((x - panel.x) / (panel.w / 4));
  const row = Math.floor((y - panel.y) / (panel.h / 2));
  const index = row * 4 + col;
  return INGREDIENT_IDS[index] || null;
}

export function startShift(state, sounds) {
  state.phase = 'playing';
  state.time = 0;
  state.timeLeft = SHIFT_LENGTH;
  state.score = 0;
  state.coins = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.hearts = MAX_HEARTS;
  state.served = 0;
  state.failed = 0;
  state.chopped = 0;
  state.cooked = 0;
  state.trashed = 0;
  state.orders = [];
  state.nextOrderIn = 0;
  state.hands = [null, null];
  state.board = { item: null, progress: 0, done: false, chopTick: 0 };
  state.woks = [
    { item: null, cookT: 0, done: false, warned: false, dinged: false },
    { item: null, cookT: 0, done: false, warned: false, dinged: false },
  ];
  state.plate = { items: [] };
  state.pantryOpen = false;
  state.particles = [];
  state.floats = [];
  state.banner = null;
  state.rushAnnounced = false;
  state.overReason = null;
  state.chef.x = 640;
  state.chef.y = 600;
  spawnOrder(state);
  spawnOrder(state);
  showBanner(state, 'Shift started — serve them all!');
  if (sounds) sounds.start();
}
