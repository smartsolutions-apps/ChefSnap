
export interface Ingredient {
  name: string;
}

export interface IngredientItem {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  sourceUrl?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: string;
  cookTime: string;
  calories: string;
  protein?: string;
  carbohydrates?: string;
  fat?: string;
  ingredients: IngredientItem[];
  missingIngredients: IngredientItem[];
  steps: string[];
  tags: string[];
  imageUrl?: string;
  
  // New Field for Koshary Fix Debugging (Optional on frontend, required in DB)
  visual_generation_prompts?: string; 
}

export interface ShoppingListItem {
  id: string;
  name: string;
  recipeTitle: string;
  acquired: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  preferences: {
    dietary: DietaryFilter;
    allergies: string[];
    dislikes: string[];
  };
  pantry: string[];
}

export enum AppView {
  HOME = 'HOME',
  RECIPES = 'RECIPES',
  COOKING = 'COOKING',
  SHOPPING = 'SHOPPING',
  SAVED = 'SAVED',
  PROFILE = 'PROFILE', // New View
}

export type DietaryFilter = 'None' | 'Vegetarian' | 'Vegan' | 'Keto' | 'Gluten-Free' | 'Paleo';

export type PrepTimeFilter = 'Any' | '< 15 mins' | '< 30 mins' | '< 60 mins';

export type CookTimeFilter = 'Any' | '< 15 mins' | '< 30 mins' | '< 60 mins';

export type DifficultyFilter = 'Any' | 'Easy' | 'Medium' | 'Hard';

export interface ScanResult {
  ingredients: string[];
}