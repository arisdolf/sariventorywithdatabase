export const CATS = ['Beverages', 'Snacks', 'Canned Goods', 'Household']

export const peso = n =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
