// Les catégories de dépenses (les mêmes valeurs que dans le schéma PocketBase)

export const CATEGORIES = [
  { id: 'logement', label: 'Logement', emoji: '🏠', color: '#7c8cff' },
  { id: 'courses', label: 'Courses', emoji: '🛒', color: '#4fd1a5' },
  { id: 'restaurants', label: 'Restaurants', emoji: '🍽️', color: '#ff8a5c' },
  { id: 'transport', label: 'Transport', emoji: '🚗', color: '#5cc8ff' },
  { id: 'loisirs', label: 'Loisirs', emoji: '🎮', color: '#c084fc' },
  { id: 'abonnements', label: 'Abonnements', emoji: '📺', color: '#f472b6' },
  { id: 'sante', label: 'Santé', emoji: '💊', color: '#34d399' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#f4b942' },
  { id: 'autres', label: 'Autres', emoji: '📦', color: '#94a3b8' },
];

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
export const category = (id) => BY_ID[id] ?? BY_ID.autres;
