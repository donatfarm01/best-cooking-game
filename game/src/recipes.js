// Sizzle Station — ingredients and recipes.
//
// Every ingredient has a preparation route through the kitchen:
//   cook       raw straight into the wok (rice, noodle, egg)
//   chop       raw onto the chopping board only (chilli, veg, cheese)
//   chop-cook  board first, then the wok (chicken, prawn)
// A dish is done when its three ingredients are all in their final stage
// on the plate, in any order. Recipes share ingredients on purpose, so
// the cook has to plan which station to visit next.

export const INGREDIENTS = {
  rice:    { name: 'Rice',    short: 'Rice',    prep: 'cook',      color: '#f5f0dc', dark: '#cbbf9a', icon: 'rice' },
  noodle:  { name: 'Noodle',  short: 'Noodle',  prep: 'cook',      color: '#f7c948', dark: '#c79a2e', icon: 'noodle' },
  chicken: { name: 'Chicken', short: 'Chicken', prep: 'chop-cook', color: '#f2a65a', dark: '#c47a33', icon: 'chicken' },
  prawn:   { name: 'Prawn',   short: 'Prawn',   prep: 'chop-cook', color: '#ff8f7a', dark: '#d95f4a', icon: 'prawn' },
  egg:     { name: 'Egg',     short: 'Egg',     prep: 'cook',      color: '#fff3b0', dark: '#d9c25e', icon: 'egg' },
  chilli:  { name: 'Chilli',  short: 'Chilli',  prep: 'chop',      color: '#e63946', dark: '#a91f2b', icon: 'chilli' },
  veg:     { name: 'Greens',  short: 'Greens',  prep: 'chop',      color: '#6abe30', dark: '#4a8c1f', icon: 'veg' },
  cheese:  { name: 'Cheese',  short: 'Cheese',  prep: 'chop',      color: '#ffd23f', dark: '#d9a400', icon: 'cheese' },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

// The stage an ingredient must reach before it can go on a plate.
export function finalStage(ingId) {
  const prep = INGREDIENTS[ingId].prep;
  if (prep === 'cook') return 'cooked';
  if (prep === 'chop') return 'chopped';
  return 'cooked'; // chop-cook ends cooked
}

// The next stage after the given station works on the item, or null
// when that station cannot work on it at all.
export function nextStageAfter(ingId, stage, station) {
  const prep = INGREDIENTS[ingId].prep;
  if (station === 'board') {
    if (stage === 'raw' && (prep === 'chop' || prep === 'chop-cook')) return 'chopped';
    return null;
  }
  if (station === 'wok') {
    if (stage === 'raw' && prep === 'cook') return 'cooked';
    if (stage === 'chopped' && prep === 'chop-cook') return 'cooked';
    return null;
  }
  return null;
}

export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 100, needs: ['rice', 'egg', 'chilli'] },
  { id: 'mie-ayam',    name: 'Mie Ayam',    price: 110, needs: ['noodle', 'chicken', 'veg'] },
  { id: 'tumis-udang', name: 'Tumis Udang', price: 120, needs: ['prawn', 'chilli', 'veg'] },
  { id: 'omelette',    name: 'Omelette Keju', price: 90, needs: ['egg', 'cheese', 'veg'] },
  { id: 'sup-ayam',    name: 'Sup Ayam',    price: 110, needs: ['chicken', 'noodle', 'chilli'] },
  { id: 'nasi-geprek', name: 'Nasi Geprek', price: 115, needs: ['rice', 'chicken', 'chilli'] },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// Does the plate (a list of finished items) match a recipe exactly?
// Order on the plate does not matter; each ingredient counts once.
export function plateMatchesRecipe(plateItems, recipe) {
  if (plateItems.length !== recipe.needs.length) return false;
  const have = plateItems.map((item) => item.ing).slice().sort();
  const want = recipe.needs.slice().sort();
  for (let i = 0; i < want.length; i++) {
    if (have[i] !== want[i]) return false;
  }
  return true;
}

// The first open order this plate can serve, or null.
export function matchingOrder(plateItems, orders) {
  for (const order of orders) {
    if (order.state !== 'open') continue;
    const recipe = recipeById(order.recipeId);
    if (recipe && plateMatchesRecipe(plateItems, recipe)) return order;
  }
  return null;
}

// A short human line describing what the plate still needs for a recipe.
export function plateHint(plateItems, recipe) {
  const have = {};
  for (const item of plateItems) have[item.ing] = (have[item.ing] || 0) + 1;
  const missing = [];
  for (const ing of recipe.needs) {
    if (!have[ing]) missing.push(INGREDIENTS[ing].short);
    else have[ing] -= 1;
  }
  if (missing.length === 0) return 'Ready to serve!';
  return 'Needs: ' + missing.join(', ');
}
