// Sizzle Station — everything the player sees.
//
// One canvas, drawn fresh every frame from the kitchen state. All art
// is drawn with canvas shapes: no image files, no fonts from the web.
// The layout is fixed at 1280x800 and scaled by CSS to fit the window.

import { INGREDIENTS, RECIPES, recipeById, plateHint } from './recipes.js';
import { STATIONS, BURNERS, VIEW_W, VIEW_H, SHIFT_LENGTH, CHOP_TIME, COOK_TIME, BURN_TIME, FLOOR } from './kitchen.js';

const FONT = 'bold 20px "Trebuchet MS", Verdana, sans-serif';
const FONT_BIG = 'bold 28px "Trebuchet MS", Verdana, sans-serif';
const FONT_TITLE = 'bold 64px "Trebuchet MS", Verdana, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function textOutlined(ctx, str, x, y, font, color, align = 'center') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// --- Ingredient icons ---------------------------------------------------

export function drawIngredientIcon(ctx, ingId, x, y, size, stage) {
  const ing = INGREDIENTS[ingId];
  const r = size / 2;
  ctx.save();
  ctx.translate(x, y);
  // Plate shadow under the item.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.75, r * 0.95, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  if (ing.icon === 'rice') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.35, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ing.icon === 'noodle') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(0, i * r * 0.35, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  } else if (ing.icon === 'chicken') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, r * 0.2);
    ctx.quadraticCurveTo(-r * 0.9, -r * 0.7, 0, -r * 0.7);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.7, r * 0.8, r * 0.2);
    ctx.quadraticCurveTo(r * 0.4, r * 0.8, 0, r * 0.8);
    ctx.quadraticCurveTo(-r * 0.4, r * 0.8, -r * 0.8, r * 0.2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.45, r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing.icon === 'prawn') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, r * 0.1, r * 0.62, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(r * 0.62, -r * 0.28, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing.icon === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (ing.icon === 'chilli') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.4);
    ctx.quadraticCurveTo(0, r * 0.9, r * 0.75, -r * 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, -r * 0.55);
    ctx.quadraticCurveTo(r * 0.95, -r * 0.85, r * 0.6, -r * 0.9);
    ctx.stroke();
  } else if (ing.icon === 'veg') {
    ctx.fillStyle = ing.color;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-r * 0.45 + i * r * 0.45, 0, r * 0.32, r * 0.62, (i - 1) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(0, r * 0.6);
    ctx.stroke();
  } else if (ing.icon === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.45);
    ctx.lineTo(r * 0.85, r * 0.45);
    ctx.lineTo(r * 0.85, -r * 0.15);
    ctx.lineTo(-r * 0.85, -r * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-0.3, 0.1], [0.25, -0.05], [0.55, 0.25]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Stage badge: chopped shows knife ticks, cooked shows a warm glow.
  if (stage === 'chopped') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.5);
    ctx.moveTo(r * 0.5, -r * 0.5);
    ctx.lineTo(-r * 0.5, r * 0.5);
    ctx.stroke();
  } else if (stage === 'cooked') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.02, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawItemChip(ctx, item, x, y, size) {
  drawIngredientIcon(ctx, item.ing, x, y, size, item.stage);
  ctx.font = 'bold 11px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#2b2118';
  ctx.fillText(INGREDIENTS[item.ing].short, x, y + size * 0.55);
}

// --- The kitchen ---------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = '#b08968';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Warm checker tiles.
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x * 80, y * 80, 80, 80);
    }
  }
  // Tile grout lines.
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 16; x++) {
    ctx.beginPath();
    ctx.moveTo(x * 80, 0);
    ctx.lineTo(x * 80, VIEW_H);
    ctx.stroke();
  }
  for (let y = 0; y <= 10; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * 80);
    ctx.lineTo(VIEW_W, y * 80);
    ctx.stroke();
  }
  // A worn rug where the chef does most of the walking, and a potted
  // plant in each bottom corner so the floor is not bare tiles.
  ctx.fillStyle = '#a4133c';
  ctx.beginPath();
  ctx.ellipse(640, 700, 260, 70, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffba08';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(640, 700, 230, 52, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (const px of [70, 1210]) {
    ctx.fillStyle = '#b5651d';
    ctx.beginPath();
    ctx.moveTo(px - 22, 740);
    ctx.lineTo(px + 22, 740);
    ctx.lineTo(px + 16, 780);
    ctx.lineTo(px - 16, 780);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2d6a4f';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.45;
      ctx.beginPath();
      ctx.ellipse(px + Math.cos(a) * 22, 736 + Math.sin(a) * 22, 8, 20, a + Math.PI / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCounter(ctx, station, highlight) {
  const { x, y, w, h, label } = station;
  ctx.fillStyle = '#7f4f24';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#a4713e';
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 8);
  ctx.fill();
  ctx.fillStyle = '#e9c893';
  roundRect(ctx, x + 4, y + 4, w - 8, 26, 8);
  ctx.fill();
  text(ctx, label, x + w / 2, y + 17, 'bold 13px "Trebuchet MS", Verdana, sans-serif', '#4a2c14');
  if (highlight) {
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 12);
    ctx.stroke();
  }
}

function drawPantry(ctx, state, highlight) {
  const s = STATIONS.pantry;
  drawCounter(ctx, s, highlight);
  // Shelf rows of fresh ingredients.
  const ids = ['rice', 'noodle', 'chicken', 'prawn', 'egg', 'chilli', 'veg', 'cheese'];
  ids.forEach((id, i) => {
    const cx = s.x + 32 + (i % 4) * 46;
    const cy = s.y + 58 + Math.floor(i / 4) * 48;
    drawIngredientIcon(ctx, id, cx, cy, 30, 'raw');
  });
  text(ctx, 'E: open  •  1-8: grab', s.x + s.w / 2, s.y + s.h - 10, 'bold 11px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
}

function drawBoard(ctx, state, highlight) {
  const s = STATIONS.board;
  drawCounter(ctx, s, highlight);
  const cx = s.x + s.w / 2;
  const cy = s.y + 72;
  // The wooden board.
  ctx.fillStyle = '#d9a05b';
  roundRect(ctx, cx - 62, cy - 34, 124, 68, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  roundRect(ctx, cx - 62, cy - 34, 124, 68, 8);
  ctx.stroke();
  const board = state.board;
  if (board.item) {
    drawIngredientIcon(ctx, board.item.ing, cx, cy, 44, board.item.stage);
    if (!board.done) {
      const p = board.progress / CHOP_TIME;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, cx - 52, cy + 40, 104, 10, 5);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      roundRect(ctx, cx - 52, cy + 40, 104 * Math.min(1, p), 10, 5);
      ctx.fill();
      text(ctx, 'Chopping...', cx, cy + 58, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
    } else {
      text(ctx, 'Chopped! Press E to take', cx, cy + 58, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#7dff8a');
    }
  } else {
    text(ctx, 'Bring something to chop', cx, cy, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
  }
}

function drawStove(ctx, state, highlight, time) {
  const s = STATIONS.stove;
  drawCounter(ctx, s, highlight);
  BURNERS.forEach((b, i) => {
    const wok = state.woks[i];
    // Burner ring.
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f1f1f';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 42, 0, Math.PI * 2);
    ctx.fill();
    if (wok.item) {
      // Flame under a working wok.
      const flick = Math.sin(time * 9 + i * 2) * 4;
      ctx.fillStyle = 'rgba(255,140,0,0.85)';
      ctx.beginPath();
      ctx.moveTo(b.x - 34, b.y + 40);
      ctx.quadraticCurveTo(b.x - 20, b.y + 8 + flick, b.x, b.y + 2 + flick);
      ctx.quadraticCurveTo(b.x + 20, b.y + 8 + flick, b.x + 34, b.y + 40);
      ctx.closePath();
      ctx.fill();
      // The wok itself.
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 38, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, wok.item.ing, b.x, b.y, 40, wok.item.stage);
      const p = Math.min(1, wok.cookT / COOK_TIME);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      roundRect(ctx, b.x - 40, b.y + 52, 80, 8, 4);
      ctx.fill();
      ctx.fillStyle = wok.cookT >= BURN_TIME ? '#e63946' : '#ffd23f';
      roundRect(ctx, b.x - 40, b.y + 52, 80 * p, 8, 4);
      ctx.fill();
      if (wok.cookT >= BURN_TIME) {
        text(ctx, 'BURNT!', b.x, b.y + 66, 'bold 13px "Trebuchet MS", Verdana, sans-serif', '#ff6b6b');
      } else if (wok.done) {
        text(ctx, 'Done! E to take', b.x, b.y + 66, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#7dff8a');
      }
    } else {
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 46, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'Wok ' + (i + 1), b.x, b.y, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#cfcfcf');
    }
  });
}

function drawPlateCounter(ctx, state, highlight) {
  const s = STATIONS.plate;
  drawCounter(ctx, s, highlight);
  const cx = s.x + s.w / 2;
  const cy = s.y + 76;
  // The plate.
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 72, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#adb5bd';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 72, 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  state.plate.items.forEach((item, i) => {
    drawIngredientIcon(ctx, item.ing, cx - 44 + i * 44, cy - 4, 36, item.stage);
  });
  if (state.plate.items.length === 0) {
    text(ctx, 'Plate the dish here', cx, cy, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#6c757d');
  } else if (state.plate.items.length < 3) {
    text(ctx, state.plate.items.length + ' / 3 on the plate', cx, cy + 52, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
  } else {
    text(ctx, 'Ready! Take it to the pass', cx, cy + 52, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#7dff8a');
  }
}

function drawBin(ctx, highlight) {
  const s = STATIONS.bin;
  drawCounter(ctx, s, highlight);
  ctx.fillStyle = '#495057';
  roundRect(ctx, s.x + 28, s.y + 44, 44, 62, 6);
  ctx.fill();
  ctx.fillStyle = '#343a40';
  roundRect(ctx, s.x + 22, s.y + 36, 56, 12, 6);
  ctx.fill();
  text(ctx, 'E: trash', s.x + s.w / 2, s.y + s.h - 10, 'bold 11px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
}

function drawPass(ctx, state, highlight) {
  const s = STATIONS.pass;
  ctx.fillStyle = '#6c584c';
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.fillStyle = '#2b2118';
  roundRect(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 8);
  ctx.fill();
  text(ctx, 'SERVE', s.x + s.w / 2, s.y + 22, 'bold 13px "Trebuchet MS", Verdana, sans-serif', '#ffd23f');
  text(ctx, 'pass', s.x + s.w / 2, s.y + 40, 'bold 11px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
  // A bell on the pass.
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 84, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 18, s.y + 82, 36, 5);
  text(ctx, 'E: serve', s.x + s.w / 2, s.y + s.h - 10, 'bold 11px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
  if (highlight) {
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    roundRect(ctx, s.x - 3, s.y - 3, s.w + 6, s.h + 6, 12);
    ctx.stroke();
  }
}

// --- The chef ------------------------------------------------------------

function drawChef(ctx, state, time) {
  const c = state.chef;
  const bob = c.moving ? Math.sin(time * 14) * 2 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20 - bob, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron over a teal shirt.
  ctx.fillStyle = '#2a9d8f';
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8f9fa';
  roundRect(ctx, -11, -4, 22, 22, 6);
  ctx.fill();
  // Face.
  ctx.fillStyle = '#f2c89b';
  ctx.beginPath();
  ctx.arc(0, -8, 13, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -20, 8, 0, Math.PI * 2);
  ctx.arc(0, -23, 9, 0, Math.PI * 2);
  ctx.arc(6, -20, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-13, -21, 26, 6);
  // Eyes look where the chef faces.
  const look = c.dir === 'left' ? -3 : c.dir === 'right' ? 3 : 0;
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-4 + look, -8, 1.8, 0, Math.PI * 2);
  ctx.arc(4 + look, -8, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Carried items ride beside the chef, one per hand, so their labels
  // never cover the chef's face.
  state.hands.forEach((item, i) => {
    if (!item) return;
    const hx = c.x - 30 + i * 60;
    const hy = c.y - 8 + bob;
    drawItemChip(ctx, item, hx, hy, 26);
  });
}

// --- Order board and HUD ---------------------------------------------------

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#3d2b1f';
  roundRect(ctx, 16, 72, 1248, 118, 12);
  ctx.fill();
  ctx.fillStyle = '#5a3d29';
  roundRect(ctx, 16, 72, 1248, 30, 12);
  ctx.fill();
  text(ctx, 'ORDER BOARD', 640, 87, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#ffd23f');
  const open = state.orders.filter((o) => o.state === 'open');
  if (open.length === 0) {
    text(ctx, 'No orders yet — the lunch crowd is coming...', 640, 150, FONT, '#fff3d6');
    return;
  }
  open.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = 40 + i * 306;
    const y = 108;
    const w = 290;
    const h = 74;
    const urgent = order.patience < 12;
    ctx.fillStyle = urgent ? '#7f1d1d' : '#fff8e7';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b6b' : '#d9c08a';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    text(ctx, '#' + order.id + '  ' + recipe.name, x + 12, y + 16, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#2b2118', 'left');
    text(ctx, '$' + recipe.price, x + w - 12, y + 16, 'bold 15px "Trebuchet MS", Verdana, sans-serif', '#2b2118', 'right');
    recipe.needs.forEach((ing, j) => {
      drawIngredientIcon(ctx, ing, x + 28 + j * 44, y + 46, 30, 'raw');
    });
    // Patience bar.
    const p = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, x + 150, y + 40, 128, 12, 6);
    ctx.fill();
    ctx.fillStyle = urgent ? '#e63946' : p > 0.5 ? '#6abe30' : '#f7c948';
    roundRect(ctx, x + 150, y + 40, 128 * p, 12, 6);
    ctx.fill();
    text(ctx, Math.ceil(order.patience) + 's', x + 214, y + 46, 'bold 11px "Trebuchet MS", Verdana, sans-serif', '#2b2118');
  });
}

function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, VIEW_W, 64);
  const timeFrac = state.timeLeft / SHIFT_LENGTH;
  const low = state.timeLeft <= 30;
  text(ctx, '⏱ ' + Math.floor(state.timeLeft / 60) + ':' + String(Math.floor(state.timeLeft % 60)).padStart(2, '0'),
    24, 32, FONT_BIG, low ? '#ff6b6b' : '#ffffff', 'left');
  // Timer bar.
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, 170, 22, 260, 18, 9);
  ctx.fill();
  ctx.fillStyle = low ? '#e63946' : '#ffd23f';
  roundRect(ctx, 170, 22, 260 * timeFrac, 18, 9);
  ctx.fill();
  text(ctx, 'Sizzle Station', 640, 32, FONT_BIG, '#ffd23f');
  text(ctx, 'Score ' + state.score, 900, 32, FONT_BIG, '#ffffff');
  text(ctx, '🪙 ' + state.coins, 1060, 32, FONT_BIG, '#ffd23f');
  // Hearts.
  for (let i = 0; i < 3; i++) {
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i < state.hearts ? '❤️' : '🖤', 1200 + i * 28, 32);
  }
  if (state.combo >= 2) {
    text(ctx, 'Combo x' + state.combo, 640, 56, 'bold 14px "Trebuchet MS", Verdana, sans-serif', '#ffd23f');
  }
}

function drawPantryPanel(ctx, state) {
  if (!state.pantryOpen) return;
  const panel = { x: 230, y: 470, w: 820, h: 130 };
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#d9c08a';
  ctx.lineWidth = 3;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 12);
  ctx.stroke();
  text(ctx, 'Pantry — click an ingredient or press 1-8  (E to close)', 640, panel.y + 18,
    'bold 15px "Trebuchet MS", Verdana, sans-serif', '#2b2118');
  const ids = ['rice', 'noodle', 'chicken', 'prawn', 'egg', 'chilli', 'veg', 'cheese'];
  ids.forEach((id, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const cx = panel.x + 100 + col * 205;
    const cy = panel.y + 62 + row * 52;
    drawIngredientIcon(ctx, id, cx - 70, cy, 34, 'raw');
    text(ctx, (i + 1) + '  ' + INGREDIENTS[id].name, cx - 40, cy, FONT, '#2b2118', 'left');
    const prep = INGREDIENTS[id].prep;
    text(ctx, prep === 'cook' ? 'cook' : prep === 'chop' ? 'chop' : 'chop + cook',
      cx + 80, cy, 'bold 12px "Trebuchet MS", Verdana, sans-serif', '#6c757d', 'left');
  });
}

function drawParticles(ctx, state) {
  for (const p of state.particles) {
    const alpha = Math.max(0, 1 - p.t / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    const alpha = Math.max(0, 1 - f.t / f.life);
    ctx.globalAlpha = alpha;
    textOutlined(ctx, f.text, f.x, f.y - f.t * 40, FONT_BIG, f.color);
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  const alpha = Math.min(1, (state.banner.life - state.banner.t) * 2);
  ctx.globalAlpha = alpha;
  textOutlined(ctx, state.banner.text, 640, 400, FONT_TITLE, '#ffd23f');
  ctx.globalAlpha = 1;
}

// --- Screens ---------------------------------------------------------------

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.82)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  textOutlined(ctx, 'SIZZLE STATION', 640, 150, FONT_TITLE, '#ffd23f');
  text(ctx, 'A fast little kitchen game — cook, plate, serve, repeat.', 640, 210, FONT_BIG, '#ffffff');
  const lines = [
    'Move with WASD or arrow keys. Interact with E or Space, or click a station.',
    'Pantry (1-8) gives you ingredients. Chop them on the board, cook them in the wok.',
    'Build each dish on the plate, then serve it at the pass before its ticket runs out.',
    'Chilli, greens and cheese need chopping. Rice, noodle and egg need the wok.',
    'Chicken and prawn need both. Burnt food goes in the bin. 150 seconds a shift!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 280 + i * 34, '18px "Trebuchet MS", Verdana, sans-serif', '#fff3d6'));
  // Start button.
  ctx.fillStyle = '#e63946';
  roundRect(ctx, 520, 490, 240, 64, 12);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 640, 522, FONT_BIG, '#ffffff');
  text(ctx, 'or press Enter', 640, 580, '16px "Trebuchet MS", Verdana, sans-serif', '#ffd23f');
  const recipes = RECIPES.slice(0, 3);
  recipes.forEach((r, i) => {
    text(ctx, r.name + ': ' + r.needs.map((n) => INGREDIENTS[n].short).join(' + '),
      640, 630 + i * 28, '16px "Trebuchet MS", Verdana, sans-serif', '#ffd166');
  });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  textOutlined(ctx, 'PAUSED', 640, 360, FONT_TITLE, '#ffffff');
  text(ctx, 'Press P or Esc to keep cooking', 640, 430, FONT_BIG, '#ffd23f');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const title = state.overReason === 'hearts' ? 'OUT OF HEARTS!' : 'SHIFT COMPLETE!';
  textOutlined(ctx, title, 640, 180, FONT_TITLE, '#ffd23f');
  text(ctx, 'Final score: ' + state.score + '   •   Coins: ' + state.coins, 640, 260, FONT_BIG, '#ffffff');
  text(ctx, 'Dishes served: ' + state.served + '   •   Best combo: x' + state.bestCombo, 640, 310, FONT_BIG, '#ffffff');
  text(ctx, 'Chopped: ' + state.chopped + '   •   Cooked: ' + state.cooked + '   •   Trashed: ' + state.trashed,
    640, 350, '18px "Trebuchet MS", Verdana, sans-serif', '#fff3d6');
  const best = state.score >= 900 ? 'Head chef material. The lunch crowd salutes you.'
    : state.score >= 500 ? 'A solid shift — the pass stayed clear most of the day.'
    : 'The kitchen won this round. Watch the tickets and plan your route.';
  text(ctx, best, 640, 410, '18px "Trebuchet MS", Verdana, sans-serif', '#ffd166');
  ctx.fillStyle = '#e63946';
  roundRect(ctx, 520, 470, 240, 64, 12);
  ctx.fill();
  text(ctx, 'COOK AGAIN  ↻', 640, 502, FONT_BIG, '#ffffff');
  text(ctx, 'or press R', 640, 560, '16px "Trebuchet MS", Verdana, sans-serif', '#ffd23f');
}

// --- The frame ---------------------------------------------------------------

export function render(ctx, state, time, highlightStation) {
  drawFloor(ctx);
  drawOrderBoard(ctx, state);
  drawPantry(ctx, state, highlightStation === 'pantry');
  drawBoard(ctx, state, highlightStation === 'board');
  drawStove(ctx, state, highlightStation === 'stove', time);
  drawPlateCounter(ctx, state, highlightStation === 'plate');
  drawBin(ctx, highlightStation === 'bin');
  drawPass(ctx, state, highlightStation === 'pass');
  drawParticles(ctx, state);
  drawChef(ctx, state, time);
  drawFloats(ctx, state);
  drawHud(ctx, state);
  drawBanner(ctx, state);
  drawPantryPanel(ctx, state);
  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'paused') drawPaused(ctx);
  else if (state.phase === 'over') drawGameOver(ctx, state);
}

// Button hit areas the main loop uses for clicks on the title and
// game-over screens, in canvas pixels.
export const BUTTONS = {
  start: { x: 520, y: 490, w: 240, h: 64 },
  again: { x: 520, y: 470, w: 240, h: 64 },
};

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
