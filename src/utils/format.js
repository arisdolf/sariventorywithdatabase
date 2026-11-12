export const CATS = ['Beverages', 'Snacks', 'Canned Goods', 'Household']

export const peso = n =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const STORE_TYPES = [
  ['sari_sari', 'Sari-sari store'],
  ['small_business', 'Small business'],
  ['street_vendor', 'Street vendor'],
  ['mini_grocery', 'Mini grocery / convenience store'],
  ['food_stall', 'Food stall / carinderia'],
  ['online_seller', 'Online seller'],
  ['other', 'Other'],
]

export const UNITS = [['mg', 'mg'], ['g', 'g'], ['kg', 'kg'], ['oz', 'oz'], ['lb', 'lb'], ['ml', 'ml'], ['l', 'L'], ['gal', 'gal']]
export const BASE = { mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592, ml: 1, l: 1000, gal: 3785.41 } // to grams or ml
export const MASS = ['mg', 'g', 'kg', 'oz', 'lb']
export const isMass = u => MASS.includes(u)
export const unitLabel = u => (u === 'l' ? 'L' : u)
export const r2 = n => Math.round(n * 100) / 100

// base grams/ml -> a friendly [value, unit] that the database accepts (mg, g, kg, ml, l)
export const nice = (base, mass) => mass
  ? (base >= 1000 ? [r2(base / 1000), 'kg'] : base < 1 ? [r2(base * 1000), 'mg'] : [r2(base), 'g'])
  : (base >= 1000 ? [r2(base / 1000), 'l'] : [r2(base), 'ml'])