// Sizzle Station — keyboard and mouse input.
//
// The game reads a held-key set every frame for movement, and queues
// edge-triggered actions (interact, pause, number keys, clicks) for the
// kitchen to consume once. Mouse positions arrive in canvas pixels so
// the renderer and the kitchen agree on where a click landed.

export function createInput(canvas) {
  const keys = new Set();
  const queue = [];
  let mouse = { x: -1, y: -1, inside: false };

  const MOVE_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  }

  window.addEventListener('keydown', (event) => {
    const name = keyName(event);
    if (MOVE_KEYS.includes(name) || name === ' ') event.preventDefault();
    if (event.repeat) return;
    keys.add(name);
    if (name === 'e' || name === ' ') queue.push({ type: 'interact' });
    else if (name === 'enter') queue.push({ type: 'confirm' });
    else if (name === 'p' || name === 'escape') queue.push({ type: 'pause' });
    else if (name === 'r') queue.push({ type: 'restart' });
    else if (name === 'm') queue.push({ type: 'mute' });
    else if (/^[1-8]$/.test(name)) queue.push({ type: 'digit', digit: Number(name) });
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(keyName(event));
  });

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    const point = canvasPoint(event);
    queue.push({ type: 'click', x: point.x, y: point.y });
  });

  canvas.addEventListener('pointermove', (event) => {
    const point = canvasPoint(event);
    mouse = { x: point.x, y: point.y, inside: true };
  });

  canvas.addEventListener('pointerleave', () => {
    mouse.inside = false;
  });

  return {
    // A unit movement vector from the held keys, or {x:0,y:0}.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('arrowleft') || keys.has('a')) x -= 1;
      if (keys.has('arrowright') || keys.has('d')) x += 1;
      if (keys.has('arrowup') || keys.has('w')) y -= 1;
      if (keys.has('arrowdown') || keys.has('s')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    // Take the queued actions out; the queue is empty afterwards.
    drain() {
      return queue.splice(0, queue.length);
    },
    get mouse() {
      return mouse;
    },
    // Forget every held key and queued action (used when the window
    // blurs, so the chef never keeps walking after an alt-tab).
    clear() {
      keys.clear();
      queue.length = 0;
    },
  };
}
