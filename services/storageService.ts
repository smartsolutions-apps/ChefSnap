import { Recipe } from '../types';

const RATINGS_KEY = 'chefsnap_ratings';
const FAVORITES_KEY = 'chefsnap_favorites';

// --- Ratings Logic ---

// Map of Recipe Title -> Array of ratings
type RatingsMap = Record<string, number[]>;

export const getRatings = (): RatingsMap => {
  try {
    const stored = localStorage.getItem(RATINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load ratings", error);
    return {};
  }
};

export const saveRating = (title: string, rating: number) => {
  const ratings = getRatings();
  if (!ratings[title]) {
    ratings[title] = [];
  }
  ratings[title].push(rating);
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
};

export const getAverageRating = (title: string): number | null => {
  const ratings = getRatings();
  const list = ratings[title];
  if (!list || list.length === 0) return null;
  const sum = list.reduce((a, b) => a + b, 0);
  return Number((sum / list.length).toFixed(1));
};

export const getRatingCount = (title: string): number => {
  const ratings = getRatings();
  return ratings[title]?.length || 0;
};

// --- Favorites (Saved Recipes) Logic ---

export const getSavedRecipes = (): Recipe[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];

    const recipes = JSON.parse(stored);
    
    // Migration: ensure ingredients are objects with name and quantity
    return recipes.map((r: any) => ({
      ...r,
      ingredients: r.ingredients.map((i: any) => 
        typeof i === 'string' ? { name: i, quantity: '' } : i
      ),
      missingIngredients: r.missingIngredients ? r.missingIngredients.map((i: any) => 
        typeof i === 'string' ? { name: i, quantity: '' } : i
      ) : []
    }));
  } catch (error) {
    console.error("Failed to load favorites", error);
    return [];
  }
};

export const toggleSavedRecipe = (recipe: Recipe): Recipe[] => {
  const saved = getSavedRecipes();
  const existsIndex = saved.findIndex(r => r.id === recipe.id);
  
  let newSaved: Recipe[];
  if (existsIndex >= 0) {
    // Remove
    newSaved = saved.filter(r => r.id !== recipe.id);
  } else {
    // Add
    newSaved = [recipe, ...saved];
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(newSaved));
  return newSaved;
};
