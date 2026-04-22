// Skin definitions. Each maps to a palette the Player renderer uses.
// Adding a new skin is just: palette + metadata + price.

export const SKINS = {
  shadow: {
    id: 'shadow',
    name: 'الظل',
    desc: 'الزي الأساسي — كتوم وثابت',
    price: 0,
    body: '#0b0f1e',
    body2: '#161b33',
    accent: '#3cf0d5',
    scarf: '#3cf0d5',
    eyeGlow: '#8ff8e6',
    trail: 'rgba(60, 240, 213, 0.6)',
  },
  crimson: {
    id: 'crimson',
    name: 'الجمر',
    desc: 'حُمرة الغروب — أسرع في القلب',
    price: 100,
    body: '#120608',
    body2: '#2a0a10',
    accent: '#ff5a4a',
    scarf: '#ff3860',
    eyeGlow: '#ffc1b8',
    trail: 'rgba(255, 90, 90, 0.6)',
  },
  azure: {
    id: 'azure',
    name: 'اللازورد',
    desc: 'أزرق المآذن تحت القمر',
    price: 250,
    body: '#05091e',
    body2: '#0d1742',
    accent: '#6aa8ff',
    scarf: '#6aa8ff',
    eyeGlow: '#cfe3ff',
    trail: 'rgba(120, 180, 255, 0.55)',
  },
  gold: {
    id: 'gold',
    name: 'الرمل الذهبي',
    desc: 'روح الصحراء في عباءة ذهبية',
    price: 500,
    body: '#2a1a06',
    body2: '#4a2d0b',
    accent: '#f5c04a',
    scarf: '#ffe38a',
    eyeGlow: '#fff2c0',
    trail: 'rgba(245, 192, 74, 0.6)',
  },
  phantom: {
    id: 'phantom',
    name: 'الطيف',
    desc: 'بالكاد مرئي. خطير كليًا.',
    price: 900,
    body: '#0a0a12',
    body2: '#191a2a',
    accent: '#d47dff',
    scarf: '#ff4ad6',
    eyeGlow: '#f5d0ff',
    trail: 'rgba(255, 120, 220, 0.5)',
  },
};

export function getSkin(id) {
  return SKINS[id] || SKINS.shadow;
}
