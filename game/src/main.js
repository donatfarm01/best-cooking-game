// Sizzle Station — bootstrap and the game loop.
//
// Wires the kitchen, the renderer, the input and the sounds together.
// The canvas is fixed at 1280x800 internally and scaled by CSS. The
// loop runs on requestAnimationFrame with a clamped delta so a tab
// that was hidden for a while never jumps the shift forward.

import { createKitchen, updateKitchen, startShift, STATIONS } from './kitchen.js';
import { render, BUTTONS, pointInRect } from './render.js';
import { createInput } from './input.js';
import { createSoundBank, attachSizzle } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') || '20261125', 10);
const seed = Number.isFinite(seedParam) ? seedParam : 20261125;

const sounds = createSoundBank();
attachSizzle(sounds);
const input = createInput(canvas);

let state;
if (shotName) {
  state = stageShot(shotName, seed) || createKitchen(seed);
} else {
  state = createKitchen(seed);
}

// Announce the phase for screen readers, without spamming the live region.
let lastStatus = '';
function announce(text) {
  if (text === lastStatus) return;
  lastStatus = text;
  statusEl.textContent = text;
}

function statusText() {
  if (state.phase === 'title') return 'Sizzle Station. Press Enter or click Start Shift to play.';
  if (state.phase === 'paused') return 'Paused. Press P to keep cooking.';
  if (state.phase === 'over') {
    return 'Shift over. Final score ' + state.score + ', ' + state.served + ' dishes served. Press R to cook again.';
  }
  const open = state.orders.filter((o) => o.state === 'open').length;
  return 'Playing. ' + state.timeLeft + ' seconds left, ' + open + ' open orders, score ' + state.score + '.';
}

// The nearest station to the chef, for the highlight ring.
function nearestStationId() {
  const chef = state.chef;
  let best = null;
  let bestD = 110;
  for (const station of Object.values(STATIONS)) {
    const nx = Math.max(station.x, Math.min(chef.x, station.x + station.w));
    const ny = Math.max(station.y, Math.min(chef.y, station.y + station.h));
    const d = Math.hypot(chef.x - nx, chef.y - ny);
    if (d < bestD) {
      bestD = d;
      best = station.id;
    }
  }
  return best;
}

function handleAction(action) {
  if (action.type === 'mute') {
    const muted = sounds.toggleMute();
    state.muted = muted;
    return;
  }
  if (state.phase === 'title') {
    if (action.type === 'confirm' || action.type === 'click') {
      if (action.type === 'click' && !pointInRect(action.x, action.y, BUTTONS.start)) return;
      sounds.unlock();
      startShift(state, sounds);
    }
    return;
  }
  if (state.phase === 'over') {
    if (action.type === 'restart' || action.type === 'confirm' || action.type === 'click') {
      if (action.type === 'click' && !pointInRect(action.x, action.y, BUTTONS.again)) return;
      sounds.unlock();
      startShift(state, sounds);
    }
    return;
  }
  if (action.type === 'pause') {
    state.phase = state.phase === 'paused' ? 'playing' : 'paused';
    sounds.click();
    return;
  }
  if (state.phase === 'paused') return;
  if (action.type === 'restart') {
    startShift(state, sounds);
    return;
  }
  // Playing: everything else goes to the kitchen.
  if (action.type === 'click' && state.pantryOpen) {
    // The kitchen's click handler checks the pantry panel first.
    updateKitchen(state, 0, { move: { x: 0, y: 0 }, list: [action] }, sounds);
    return;
  }
  if (action.type === 'interact' || action.type === 'digit' || action.type === 'click') {
    updateKitchen(state, 0, { move: { x: 0, y: 0 }, list: [action] }, sounds);
  }
}

// --- The frame loop ---------------------------------------------------------

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    const actions = input.drain();
    for (const action of actions) handleAction(action);
    if (state.phase === 'playing' && !state.frozen) {
      updateKitchen(state, dt, { move: input.moveVector(), list: [] }, sounds);
    }
  } catch (err) {
    // One bad action must never freeze the game: log it and keep going.
    console.error('Sizzle Station frame error:', err);
  }
  render(ctx, state, now / 1000, state.phase === 'playing' ? nearestStationId() : null);
  announce(statusText());
  requestAnimationFrame(frame);
}

window.addEventListener('blur', () => input.clear());

// A read-only window into the game for play-testing: the page never
// needs it to play, and it changes nothing about the kitchen.
window.__sizzle = {
  version: '1.0.0',
  get state() {
    return {
      phase: state.phase,
      timeLeft: Math.round(state.timeLeft),
      score: state.score,
      coins: state.coins,
      combo: state.combo,
      hearts: state.hearts,
      served: state.served,
      failed: state.failed,
      orders: state.orders.map((o) => ({ id: o.id, recipe: o.recipeId, patience: Math.round(o.patience), state: o.state })),
      chef: { x: Math.round(state.chef.x), y: Math.round(state.chef.y) },
      hands: state.hands.map((h) => (h ? h.ing + ':' + h.stage : null)),
      board: state.board.item ? state.board.item.ing + ':' + (state.board.done ? 'done' : 'chopping') : null,
      woks: state.woks.map((w) => (w.item ? w.item.ing + ':' + w.item.stage + '@' + w.cookT.toFixed(1) : null)),
      plate: state.plate.items.map((i) => i.ing + ':' + i.stage),
      pantryOpen: state.pantryOpen,
    };
  },
  start() {
    startShift(state, sounds);
  },
};

requestAnimationFrame(frame);
