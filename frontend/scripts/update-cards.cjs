const fs = require('fs');
const path = require('path');

const cardsFile = path.resolve(__dirname, '../src/data/cards.ts');
let content = fs.readFileSync(cardsFile, 'utf8');

// 1. Update CardData interface
content = content.replace(
  /export interface CardData \{([\s\S]*?)image_url: string;\n\}/m,
  `export interface CardData {$1image_url: string;\n  volume?: number;\n}`
);

// Add missing volume: 1 to existing AMBIS cards
content = content.replace(/(id: '[^']+', name: '[^']+', element: '[^']+', rarity: '[^']+', rarityLabel: '[^']+', hp: \d+, skill_name: '[^']+', skill_effect: '[^']+', weakness: '[^']+', lore: '[^']+', image_url: '[^']+')/g, "$1, volume: 1");


// 2. Add Vol 2 AMBIS cards
const newAmbis = `
  // Zaki - Vol 2
  { id: 'zaki-ocean', name: 'Zaki Ocean', element: 'Ambis', rarity: 'Ultra Rare', rarityLabel: 'IPK 4', hp: 0, skill_name: 'Zaki Ocean', skill_effect: '', weakness: 'Santuy', lore: '', image_url: '/images/vol2/zaki ocean.webp', volume: 2 },
`;
content = content.replace(/(const AMBIS_CARDS: CardData\[\] = \[[\s\S]*?)(\n\];)/m, `$1${newAmbis}$2`);

// 3. Add Vol 2 SANTUY cards
const newSantuy = `
  // Agip - Vol 2
  { id: 'agip-maba', name: 'Agip', element: 'Santuy', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Agip', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/agip.webp', volume: 2 },
  { id: 'agip-asistensi', name: 'Agip Asistensi', element: 'Santuy', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Agip Asistensi', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/agip asistensi.webp', volume: 2 },
  { id: 'agip-prof', name: 'Prof Agip', element: 'Santuy', rarity: 'Rare', rarityLabel: 'IPK 2.5', hp: 0, skill_name: 'Prof Agip', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/prof agip.webp', volume: 2 },
  { id: 'agip-demon', name: 'Demon King Sangata', element: 'Santuy', rarity: 'Exclusive Legendary', rarityLabel: 'IPK 4 EX', hp: 0, skill_name: 'Demon King Sangata', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/demon king sangata.webp', volume: 2 },

  // Baydar - Vol 2
  { id: 'baydar-pestapora', name: 'Baydar Pestapora', element: 'Santuy', rarity: 'Rare', rarityLabel: 'IPK 2.5', hp: 0, skill_name: 'Baydar Pestapora', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/baydar pestapora.webp', volume: 2 },
  { id: 'baydar-asasin', name: 'Asasin Baydar', element: 'Santuy', rarity: 'Exclusive Legendary', rarityLabel: 'IPK 4 EX', hp: 0, skill_name: 'Asasin Baydar', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/asasin baydar.webp', volume: 2 },
  { id: 'baydar-sarjana', name: 'Sarjana 3 Pikiran', element: 'Santuy', rarity: 'Super Rare', rarityLabel: 'IPK 3.5', hp: 0, skill_name: 'Sarjana 3 Pikiran', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/sarjana 3 pikiran.webp', volume: 2 },

  // Koten - Vol 2
  { id: 'koten-kesurupan', name: 'Koten Kesurupan', element: 'Santuy', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Koten Kesurupan', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/koten kesurupan.webp', volume: 2 },
  { id: 'koten-sybau', name: 'Koten Sybau', element: 'Santuy', rarity: 'Super Rare', rarityLabel: 'IPK 3.5', hp: 0, skill_name: 'Koten Sybau', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/koten sybau.webp', volume: 2 },
  { id: 'koten-poseidon', name: 'Koten Poseidon', element: 'Santuy', rarity: 'Exclusive Legendary', rarityLabel: 'IPK 4 EX', hp: 0, skill_name: 'Koten Poseidon', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/koten poseidon.webp', volume: 2 },

  // Mikel - Vol 2
  { id: 'mikel-intel', name: 'Mikel Intel', element: 'Santuy', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Mikel Intel', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/mikel intel.webp', volume: 2 },
  { id: 'mikel-okegas', name: 'Mikel Okegas', element: 'Santuy', rarity: 'Rare', rarityLabel: 'IPK 2.5', hp: 0, skill_name: 'Mikel Okegas', skill_effect: '', weakness: 'Bucin', lore: '', image_url: '/images/vol2/mikel okegas.webp', volume: 2 },
`;
content = content.replace(/(const SANTUY_CARDS: CardData\[\] = \[[\s\S]*?)(\n\];)/m, `$1${newSantuy}$2`);


// 4. Add Vol 2 BUCIN cards
const newBucin = `
  // Aqil - Vol 2
  { id: 'aqil-maba', name: 'Aqil', element: 'Bucin', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Aqil', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/aqil.webp', volume: 2 },
  { id: 'aqil-parttimer', name: 'Aqil Part Timer', element: 'Bucin', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Aqil Part Timer', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/aqil part timer.webp', volume: 2 },
  { id: 'aqil-agent', name: 'Agent Qil', element: 'Bucin', rarity: 'Rare', rarityLabel: 'IPK 2.5', hp: 0, skill_name: 'Agent Qil', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/agent qil.webp', volume: 2 },

  // Pebasket - Vol 2
  { id: 'pebasket-cina', name: 'Pebasket Cina', element: 'Bucin', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Pebasket Cina', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/pebasket cina.webp', volume: 2 },
  { id: 'pebasket-tioclaude', name: 'Tio Claude', element: 'Bucin', rarity: 'Ultra Rare', rarityLabel: 'IPK 4', hp: 0, skill_name: 'Tio Claude', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/tio claude.webp', volume: 2 },

  // Zaka - Vol 2
  { id: 'zaka-epstein', name: 'Zaka Epstein', element: 'Bucin', rarity: 'Common', rarityLabel: 'IPK 1', hp: 0, skill_name: 'Zaka Epstein', skill_effect: '', weakness: 'Ambis', lore: '', image_url: '/images/vol2/zaka epstein.webp', volume: 2 },
`;
content = content.replace(/(const BUCIN_CARDS: CardData\[\] = \[[\s\S]*?)(\n\];)/m, `$1${newBucin}$2`);

// 5. Add Vol 2 EVENT cards
const newEvent = `
  { id: 'event-catudaya', name: 'Catu Daya', element: 'Event', rarity: 'Common', rarityLabel: 'Event', hp: 0, skill_name: 'Catu Daya', skill_effect: '', weakness: 'Lelah', lore: '', image_url: '/images/vol2/catu daya.webp', volume: 2 },
  { id: 'event-tamasyaikn', name: 'Tamasya IKN', element: 'Event', rarity: 'Common', rarityLabel: 'Event', hp: 0, skill_name: 'Tamasya IKN', skill_effect: '', weakness: 'Lelah', lore: '', image_url: '/images/vol2/tamasya ikn.webp', volume: 2 },
`;
content = content.replace(/(const EVENT_CARDS: CardData\[\] = \[[\s\S]*?)(\n\];)/m, `$1${newEvent}$2`);

// 6. Update generatePull and pickRandomCardFromPool to take volume
content = content.replace(
  /export function pickRandomCardFromPool\(rarity: CardData\['rarity'\]\): CardData \{([\s\S]*?)\}/,
  `export function pickRandomCardFromPool(rarity: CardData['rarity'], volume: number = 1): CardData {
  const allInRarity = RARITY_POOLS[rarity === 'Exclusive Legendary' ? 'legendary' : rarity === 'Super Rare' ? 'superRare' : rarity === 'Ultra Rare' ? 'ultraRare' : rarity.toLowerCase() as keyof typeof RARITY_POOLS] || [];
  const pool = allInRarity.filter(c => (c.volume || 1) === volume);
  
  if (!pool || pool.length === 0) {
    // Fallback
    const fallbackPool = RARITY_POOLS.common.filter(c => (c.volume || 1) === volume);
    if (!fallbackPool.length) return RARITY_POOLS.common[0];
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}`
);

content = content.replace(
  /export function generatePull\(\): CardData\[\] \{([\s\S]*?)  \}\);\n\}/,
  `export function generatePull(volume: number = 1): CardData[] {
  return SLOT_CONFIG.map((config) => {
    const rarity = pickRarity(config);
    const card = pickRandomCardFromPool(rarity, volume);
    return { ...card, id: \`\${Date.now()}-\${Math.random()}\` };
  });
}`
);

fs.writeFileSync(cardsFile, content, 'utf8');
console.log('Updated cards.ts successfully');
