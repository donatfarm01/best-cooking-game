// Sizzle Station — staged states for the screenshots.
//
// ?shot=<name>&seed=<n> freezes the kitchen in a composed moment so a
// screenshot is the same every time it is taken. The four stages cover
// what the bounty asks the screenshots to show: the kitchen and the
// order board, ingredients on the counter, a dish mid-assembly, a timer
// and a plate ready to serve.

import { createKitchen, spawnOrder, showBanner } from './kitchen.js';
import { RECIPES } from './recipes.js';

function setOrder(state, index, recipeId, patience, maxPatience) {
  const order = {
    id: index + 1,
    recipeId,
    patience,
    maxPatience,
    state: 'open',
  };
  state.orders.push(order);
  return order;
}

function stageCover(state) {
  // A busy mid-shift: three tickets, a wok cooking, the board mid-chop,
  // a half-built plate and the chef carrying a finished egg.
  state.phase = 'playing';
  state.time = 54;
  state.timeLeft = 96;
  state.score = 240;
  state.coins = 240;
  state.combo = 2;
  state.hearts = 3;
  state.served = 2;
  setOrder(state, 0, 'nasi-goreng', 38, 50);
  setOrder(state, 1, 'mie-ayam', 26, 46);
  setOrder(state, 2, 'tumis-udang', 44, 48);
  state.chef.x = 640;
  state.chef.y = 470;
  state.chef.dir = 'up';
  state.hands = [{ ing: 'egg', stage: 'cooked' }, null];
  state.board.item = { ing: 'chilli', stage: 'raw' };
  state.board.progress = 0.9;
  state.board.done = false;
  state.woks[0].item = { ing: 'rice', stage: 'raw' };
  state.woks[0].cookT = 1.6;
  state.woks[0].done = false;
  state.plate.items = [
    { ing: 'rice', stage: 'cooked' },
    { ing: 'chilli', stage: 'chopped' },
  ];
}

function stageChop(state) {
  // The chopping board at work: a prawn half-chopped, greens waiting,
  // two tickets on the board and the chef at the board.
  state.phase = 'playing';
  state.time = 30;
  state.timeLeft = 120;
  state.score = 110;
  state.coins = 110;
  state.combo = 1;
  state.hearts = 3;
  state.served = 1;
  setOrder(state, 0, 'tumis-udang', 40, 50);
  setOrder(state, 1, 'omelette', 30, 48);
  state.chef.x = 355;
  state.chef.y = 470;
  state.chef.dir = 'up';
  state.hands = [null, null];
  state.board.item = { ing: 'prawn', stage: 'raw' };
  state.board.progress = 1.1;
  state.board.done = false;
  state.plate.items = [{ ing: 'veg', stage: 'chopped' }];
}

function stageServe(state) {
  // A plate ready to serve: all three items of a Nasi Goreng on the
  // plate, its ticket open, the chef at the pass ringing the bell.
  state.phase = 'playing';
  state.time = 88;
  state.timeLeft = 62;
  state.score = 430;
  state.coins = 430;
  state.combo = 3;
  state.bestCombo = 3;
  state.hearts = 3;
  state.served = 4;
  setOrder(state, 0, 'nasi-goreng', 22, 44);
  setOrder(state, 1, 'sup-ayam', 35, 46);
  state.chef.x = 1100;
  state.chef.y = 570;
  state.chef.dir = 'right';
  state.hands = [null, null];
  state.plate.items = [
    { ing: 'rice', stage: 'cooked' },
    { ing: 'egg', stage: 'cooked' },
    { ing: 'chilli', stage: 'chopped' },
  ];
  state.floats.push({ x: 1222, y: 480, text: 'Ready!', color: '#7dff8a', t: 0.2, life: 1.1 });
}

function stageRush(state) {
  // Rush hour: four tickets, one nearly out of patience, the timer
  // nearly gone, one heart left and a wok about to burn.
  state.phase = 'playing';
  state.time = 126;
  state.timeLeft = 24;
  state.score = 780;
  state.coins = 780;
  state.combo = 4;
  state.bestCombo = 5;
  state.hearts = 1;
  state.served = 7;
  state.failed = 2;
  setOrder(state, 0, 'mie-ayam', 6, 38);
  setOrder(state, 1, 'nasi-geprek', 18, 40);
  setOrder(state, 2, 'tumis-udang', 30, 42);
  setOrder(state, 3, 'sup-ayam', 36, 44);
  state.chef.x = 710;
  state.chef.y = 470;
  state.chef.dir = 'up';
  state.hands = [{ ing: 'chicken', stage: 'chopped' }, null];
  state.woks[0].item = { ing: 'noodle', stage: 'raw' };
  state.woks[0].cookT = 5.4;
  state.woks[0].done = true;
  state.woks[1].item = { ing: 'prawn', stage: 'chopped' };
  state.woks[1].cookT = 2.2;
  state.woks[1].done = false;
  state.board.item = { ing: 'veg', stage: 'raw' };
  state.board.progress = 0.4;
  state.board.done = false;
  showBanner(state, 'RUSH HOUR!');
  state.banner.t = 0.4;
}

// Build a frozen kitchen for the named shot, or null for an unknown one.
export function stageShot(name, seed) {
  const state = createKitchen(seed);
  state.frozen = true;
  state.rng = state.rng; // the seeded generator stays for particles
  if (name === 'cover') stageCover(state);
  else if (name === 'chop') stageChop(state);
  else if (name === 'serve') stageServe(state);
  else if (name === 'rush') stageRush(state);
  else return null;
  return state;
}

export const SHOT_NAMES = ['cover', 'chop', 'serve', 'rush'];

export function shotTitle(name) {
  return { cover: 'The kitchen at full steam', chop: 'Chopping for the next dish', serve: 'A plate ready to serve', rush: 'Rush hour' }[name] || name;
}
