// LocalStorage key for favourites
const FAVOURITES_KEY = 'mnemosyne_favourites';

// Get all favourite quote IDs from localStorage
export const getFavourites = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVOURITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading favourites:', error);
    return [];
  }
};

// Check if a quote is favourited
export const isFavourite = (quoteId: string): boolean => {
  const favourites = getFavourites();
  return favourites.includes(quoteId);
};

// Add a quote to favourites
export const addFavourite = (quoteId: string): void => {
  try {
    const favourites = getFavourites();
    if (!favourites.includes(quoteId)) {
      favourites.push(quoteId);
      localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
    }
  } catch (error) {
    console.error('Error adding favourite:', error);
  }
};

// Remove a quote from favourites
export const removeFavourite = (quoteId: string): void => {
  try {
    const favourites = getFavourites();
    const filtered = favourites.filter(id => id !== quoteId);
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favourite:', error);
  }
};

// Toggle favourite status
export const toggleFavourite = (quoteId: string): boolean => {
  if (isFavourite(quoteId)) {
    removeFavourite(quoteId);
    return false;
  } else {
    addFavourite(quoteId);
    return true;
  }
};
