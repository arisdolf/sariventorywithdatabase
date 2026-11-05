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
