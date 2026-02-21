const USE_MOCK = true

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MENU = [
  {
    id: 1,
    name: 'Main',
    icon: '🍽️',
    items: [
      { id: 101, name: 'Garlic Chicken', description: 'Prepared by quickly frying the chicken in olive oil with garlic cloves', price: 150.00, available: true, emoji: '🍗' },
      { id: 102, name: 'Chicken BBQ Honey', description: 'Smokiness and savory taste from great barbeque sauce with floral sweetness of honey', price: 150.00, available: true, emoji: '🍗' },
      { id: 103, name: 'Chicken Pork Adobo', description: 'Filipino dish made by braising chicken legs in vinegar, soy sauce, garlic, and black pepper', price: 150.00, available: true, emoji: '🍗' },
      { id: 104, name: 'Chicken Sisig', description: 'Made from a mixture of chicken liver and other meat parts', price: 150.00, available: true, emoji: '🍳' },
      { id: 105, name: 'Laing', description: 'Taro leaves with meat or seafood cooked in thick coconut milk spiced with labuyo chili, lemongrass, garlic, and shrimp paste', price: 150.00, available: true, emoji: '🥬' },
      { id: 106, name: 'Pinkabet', description: 'Made from mixed vegetables sautéed in fish or shrimp sauce', price: 150.00, available: true, emoji: '🥦' },
      { id: 107, name: 'Pancit Canton', description: 'Combines yellow wheat noodles with meat, seafood, and vegetables in soy and oyster sauce', price: 150.00, available: true, emoji: '🍝' },
      { id: 108, name: 'Palabok', description: 'Filipino rice noodle dish with rich pork and shrimp sauce, garnished with smoked fish, eggs, and chicharron', price: 150.00, available: true, emoji: '🍜' },
      { id: 109, name: 'Kare-Kare', description: 'Made with peanuts, achuete, and toasted rice, simmered with tender cuts of beef or oxtail', price: 150.00, available: true, emoji: '🥜' },
      { id: 110, name: 'Bulalo', description: 'Beef shanks and bone marrow cooked until collagen and fat melts into the clear broth', price: 150.00, available: true, emoji: '🍲' },
      { id: 111, name: 'Beef Tapa', description: 'Sliced beef sirloin in a sweet, salty, and tangy calamansi and soy marinade', price: 150.00, available: true, emoji: '🥩' },
    ],
  },
  {
    id: 2,
    name: 'Starter',
    icon: '🥗',
    items: [
      { id: 201, name: 'Sizzling Tofu', description: 'Diced tofu in a special soy sauce and mayo dressing served on a sizzling plate', price: 150.00, available: true, emoji: '🧆' },
      { id: 202, name: 'Fried Kesong Puti', description: 'Native white cheese coated in breadcrumbs and deep-fried until golden. Served with sweet chili guava sauce', price: 150.00, available: true, emoji: '🧀' },
      { id: 203, name: "Tokwa't Belly", description: 'Deep fried bangus belly and tofu cubes in a distinctive vinegar soy dressing with minced onion', price: 150.00, available: true, emoji: '🍢' },
      { id: 204, name: 'Crispy Drunken Shrimp', description: 'Nilasing na hipon, fried to crispy crunchiness served with a special vinegar sauce', price: 150.00, available: true, emoji: '🍤' },
    ],
  },
  {
    id: 3,
    name: 'Sides',
    icon: '🍟',
    items: [
      { id: 301, name: 'Skin on Fries', description: 'Crispy skin-on fries', price: 199.00, available: true, emoji: '🍟' },
      { id: 302, name: 'Spiced Skin-on Fries', description: 'Crispy skin-on fries with seasoning', price: 199.00, available: true, emoji: '🍟' },
      { id: 303, name: 'Onion Rings', description: 'Crispy battered onion rings', price: 199.00, available: true, emoji: '🧅' },
      { id: 304, name: 'Garlic Tortilla', description: 'Toasted tortilla with garlic butter', price: 199.00, available: true, emoji: '🫓' },
      { id: 305, name: 'Homemade Red Slaw', description: 'House-made red cabbage coleslaw', price: 199.00, available: true, emoji: '🥗' },
    ],
  },
  {
    id: 4,
    name: 'Drinks',
    icon: '🥤',
    items: [
      { id: 401, name: 'Apple Juice', description: 'Freshly served apple juice', price: 109.00, available: true, emoji: '🍎' },
      { id: 402, name: 'Pineapple Juice', description: 'Freshly served pineapple juice', price: 109.00, available: true, emoji: '🍍' },
      { id: 403, name: 'Avocado Juice', description: 'Freshly served avocado juice', price: 89.00, available: true, emoji: '🥑' },
      { id: 404, name: 'Iced Tea', description: 'House-brewed iced tea', price: 69.00, available: true, emoji: '🍵' },
      { id: 405, name: 'Mojito', description: 'Classic refreshing mojito', price: 299.00, available: true, emoji: '🍹' },
      { id: 406, name: 'Water', description: '500ml bottled water', price: 49.00, available: true, emoji: '💧' },
      { id: 407, name: 'Iced Swiss Latte', description: 'Chilled Swiss-style espresso latte over ice', price: 199.00, available: true, emoji: '🧋' },
      { id: 408, name: 'Spanish Latte', description: 'Espresso with condensed milk over ice', price: 199.00, available: true, emoji: '☕' },
    ],
  },
  {
    id: 5,
    name: 'Dessert',
    icon: '🍰',
    items: [
      { id: 501, name: 'Special Halo-Halo', description: 'A delightful mix of Filipino sweet fruits, milk, ice cream and crushed ice', price: 199.00, available: true, emoji: '🍧' },
      { id: 502, name: 'Buko Pandan', description: 'Blend of gelatine cubes and tender young coconut in pandan infused cream', price: 89.00, available: true, emoji: '🥥' },
      { id: 503, name: 'Mais Con Yelo', description: 'Sweet cream corn with milk, crushed ice and ice cream', price: 159.00, available: true, emoji: '🌽' },
      { id: 504, name: 'Fried Banana Split', description: 'Fried banana split with ice cream', price: 299.00, available: true, emoji: '🍌' },
    ],
  },
]

function delay(ms = 400) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Mock implementations ─────────────────────────────────────────────────────

async function mockValidateGuest(roomNumber, lastName) {
  await delay()
  // Accept any non-empty room + last name
  return { valid: true, name: `${lastName.charAt(0).toUpperCase() + lastName.slice(1)}` }
}

async function mockFetchMenu() {
  await delay()
  return MOCK_MENU
}

async function mockPlaceOrder({ items }) {
  await delay(600)
  const orderId = Math.floor(1000 + Math.random() * 9000)
  const total = items.reduce((sum, i) => {
    const found = MOCK_MENU.flatMap(c => c.items).find(m => m.id === i.menuItemId)
    return sum + (found?.price ?? 0) * i.quantity
  }, 0)
  return { orderId, total }
}

// ─── Real API implementations ─────────────────────────────────────────────────

const BASE = '/api'

async function realValidateGuest(roomNumber, lastName) {
  const res = await fetch(`${BASE}/mock/validate-guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomNumber, lastName }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Validation failed')
  return data
}

async function realFetchMenu() {
  const res = await fetch(`${BASE}/menu/categories`)
  if (!res.ok) throw new Error('Failed to load menu')
  return res.json()
}

async function realPlaceOrder({ roomNumber, lastName, items, notes }) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomNumber, lastName, items, notes }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Failed to place order')
  return data
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export const validateGuest = USE_MOCK ? mockValidateGuest : realValidateGuest
export const fetchMenu     = USE_MOCK ? mockFetchMenu     : realFetchMenu
export const placeOrder    = USE_MOCK ? mockPlaceOrder    : realPlaceOrder
