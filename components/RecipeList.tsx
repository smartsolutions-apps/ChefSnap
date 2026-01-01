import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { ICONS } from '../constants';
import { getAverageRating, getRatingCount } from '../services/storageService';
import { generateRecipeImage } from '../services/geminiService';

interface RecipeListProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  onUpdateRecipe?: (id: string, updates: Partial<Recipe>) => void;
  isLoading: boolean;
  ingredients: string[];
  lastUpdated?: number; // Prop to force re-render when ratings change
  savedRecipeIds?: Set<string>;
  onToggleSave?: (recipe: Recipe) => void;
  isSavedView?: boolean;
  introText?: string;
}

// Sub-component for handling image generation and display
const RecipeCardImage: React.FC<{ 
    recipe: Recipe;
    onUpdateRecipe?: (id: string, updates: Partial<Recipe>) => void;
}> = ({ recipe, onUpdateRecipe }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(recipe.imageUrl || null);
  const [loading, setLoading] = useState(!recipe.imageUrl);

  useEffect(() => {
    let mounted = true;
    
    const fetchImage = async () => {
      // If we already have the image in the recipe object, don't fetch
      if (recipe.imageUrl) {
          setImageSrc(recipe.imageUrl);
          setLoading(false);
          return;
      }

      try {
        const base64 = await generateRecipeImage(recipe.title, recipe.tags);
        if (mounted && base64) {
          setImageSrc(base64);
          // Persist back to parent state
          if (onUpdateRecipe) {
              onUpdateRecipe(recipe.id, { imageUrl: base64 });
          }
        }
      } catch (e) {
        console.error("Failed to generate image for", recipe.title);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchImage();

    return () => { mounted = false; };
  }, [recipe.id, recipe.title, recipe.tags, recipe.imageUrl, onUpdateRecipe]); 

  return (
    <div className="h-48 relative overflow-hidden bg-slate-100 group-hover:opacity-100 transition-opacity">
        {imageSrc ? (
            <>
                <img 
                    src={imageSrc} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                 
                 {/* Subtle AI Badge */}
                 <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/30 backdrop-blur-md rounded border border-white/10 text-[8px] font-medium text-white/80 uppercase tracking-widest pointer-events-none">
                    AI Generated
                 </div>
            </>
        ) : (
            <>
                {/* Background Pattern/Gradient Placeholder */}
                <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                    recipe.difficulty === 'Easy' ? 'from-emerald-50 to-teal-100/50' :
                    recipe.difficulty === 'Medium' ? 'from-amber-50 to-orange-100/50' :
                    'from-rose-50 to-red-100/50'
                }`}></div>
                
                {/* Animated Icon Placeholder or Loading Spinner */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-300/60">
                    {loading ? (
                         <div className="animate-pulse transform scale-[2.5] opacity-50 flex flex-col items-center gap-2">
                             {ICONS.ChefHat}
                             <span className="text-[8px] font-bold tracking-widest uppercase">Creating Visuals...</span>
                         </div>
                    ) : (
                        <div className="transform scale-[2.5] opacity-50">{ICONS.ChefHat}</div>
                    )}
                </div>
            </>
        )}

        {/* Difficulty Badge - Always Visible */}
        <div className="absolute top-4 left-4 z-10">
             <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm border border-white/20 backdrop-blur-md ${
                recipe.difficulty === 'Easy' ? 'bg-emerald-500/90 text-white' :
                recipe.difficulty === 'Medium' ? 'bg-amber-500/90 text-white' :
                'bg-rose-500/90 text-white'
             }`}>
                {recipe.difficulty}
             </span>
        </div>
    </div>
  );
};

export const RecipeList: React.FC<RecipeListProps> = ({ 
  recipes, 
  onSelectRecipe, 
  onUpdateRecipe,
  isLoading,
  ingredients,
  savedRecipeIds = new Set(),
  onToggleSave,
  isSavedView = false,
  introText
}) => {
  const [toastMsg, setToastMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientFilter, setIngredientFilter] = useState('');

  const handleShare = async (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation(); // Prevent card selection when clicking share

    const shareData = {
      title: `ChefSnap: ${recipe.title}`,
      text: `Check out this recipe for ${recipe.title}!\n\n${recipe.description}\n\nDifficulty: ${recipe.difficulty}\nTime: ${recipe.prepTime}\nCalories: ${recipe.calories}\nProtein: ${recipe.protein || 'N/A'}, Carbs: ${recipe.carbohydrates || 'N/A'}, Fat: ${recipe.fat || 'N/A'}\n\nGenerated by ChefSnap`,
      url: recipe.sourceUrl || window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text + (recipe.sourceUrl ? `\n\nSource: ${recipe.sourceUrl}` : ''));
        setToastMsg('Recipe copied to clipboard!');
        setTimeout(() => setToastMsg(''), 3000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleSourceClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSaveClick = (e: React.MouseEvent, recipe: Recipe) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(recipe);
    }
  };

  // Filter recipes based on search term and ingredient filter
  const filteredRecipes = recipes.filter(recipe => {
    // General Search: Title or Tags
    const matchesSearch = !searchTerm || (
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Ingredient Filter: Specific ingredient match
    const matchesIngredient = !ingredientFilter || (
      recipe.ingredients.some(ing => ing.name.toLowerCase().includes(ingredientFilter.toLowerCase()))
    );

    return matchesSearch && matchesIngredient;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-pulse">
        <div className="w-24 h-24 bg-slate-200 rounded-full mb-4"></div>
        <div className="h-6 w-48 bg-slate-200 rounded mb-2"></div>
        <div className="h-4 w-64 bg-slate-200 rounded"></div>
      </div>
    );
  }

  // Empty State for Saved View (only if no recipes exist at all)
  if (isSavedView && recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-400">
          {ICONS.Heart}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Saved Recipes Yet</h2>
        <p className="text-slate-500 max-w-xs">Tap the heart icon on any recipe to save it to your personal cookbook.</p>
      </div>
    );
  }

  // Helper to render star rating
  const renderRating = (title: string) => {
    const avg = getAverageRating(title);
    const count = getRatingCount(title);

    if (!avg) return <div className="h-4"></div>; // Spacer

    return (
      <div className="flex items-center gap-1.5 mb-2">
        <div className="text-amber-400 transform scale-75">{ICONS.StarFilled}</div>
        <span className="text-xs font-bold text-slate-700">{avg}</span>
        <span className="text-[10px] text-slate-400">({count} reviews)</span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto relative bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                {isSavedView ? 'My Cookbook' : 'Suggested Recipes'}
              </h2>
              
              {/* Intro Text Section */}
              {!isSavedView && introText && (
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl flex items-start gap-3 shadow-sm animate-fade-in max-w-3xl">
                   <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600 shrink-0">
                     {ICONS.ChefHat}
                   </div>
                   <p className="text-emerald-900 text-sm font-medium italic leading-relaxed py-1">
                     "{introText}"
                   </p>
                </div>
              )}

              {!isSavedView && ingredients.length > 0 && !introText && (
                <div className="flex flex-wrap gap-2 text-sm text-slate-600 mt-2">
                  <span className="opacity-75">Based on your ingredients:</span>
                  {ingredients.slice(0, 5).map((ing, i) => (
                    <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">
                      {ing}
                    </span>
                  ))}
                  {ingredients.length > 5 && <span className="text-xs text-slate-400">+{ingredients.length - 5} more</span>}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Ingredient Filter */}
              <div className="relative w-full sm:w-56 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  {ICONS.Leaf}
                </div>
                <input
                  type="text"
                  placeholder="Filter by ingredient..."
                  value={ingredientFilter}
                  onChange={(e) => setIngredientFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm shadow-sm transition-all"
                />
              </div>

              {/* General Search Bar */}
              <div className="relative w-full sm:w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  {ICONS.Search}
                </div>
                <input
                  type="text"
                  placeholder="Search titles, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm shadow-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
               {ICONS.Search}
             </div>
             <p className="text-lg font-medium text-slate-600">No recipes found</p>
             <p className="text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 pb-24">
            {filteredRecipes.map((recipe) => (
              <div 
                key={recipe.id} 
                onClick={() => onSelectRecipe(recipe)}
                className="group bg-white rounded-3xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full relative"
              >
                {/* Use the new RecipeCardImage component */}
                <RecipeCardImage 
                    recipe={recipe} 
                    onUpdateRecipe={onUpdateRecipe}
                />

                {/* Action Buttons Overlay - Adjusted z-index and position to align with new image component */}
                <div className="absolute top-4 right-4 flex space-x-2 z-20">
                    {recipe.sourceUrl && (
                            <button
                            onClick={(e) => handleSourceClick(e, recipe.sourceUrl!)}
                            className="p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full text-slate-500 hover:text-emerald-600 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                            title="View Source"
                            >
                            <div className="w-4 h-4">{ICONS.Link}</div>
                            </button>
                    )}
                    <button
                        onClick={(e) => handleShare(e, recipe)}
                        className="p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full text-slate-500 hover:text-blue-500 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                        title="Share"
                    >
                        <div className="w-4 h-4">{ICONS.Share}</div>
                    </button>
                    <button
                        onClick={(e) => handleToggleSaveClick(e, recipe)}
                        className={`p-2 bg-white/90 hover:bg-white backdrop-blur-md rounded-full transition-all shadow-sm hover:shadow-md transform hover:scale-105 ${
                            savedRecipeIds.has(recipe.id) ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                        }`}
                        title="Save"
                    >
                        <div className="w-4 h-4">{savedRecipeIds.has(recipe.id) ? ICONS.HeartFilled : ICONS.Heart}</div>
                    </button>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                    <div className="mb-1">
                       {renderRating(recipe.title)}
                       <h3 className="font-bold text-lg text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                         {recipe.title}
                       </h3>
                    </div>

                    {/* Tags */}
                    {recipe.tags && recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3 mb-4">
                            {recipe.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px] font-medium uppercase tracking-wide border border-slate-100">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                       {recipe.description}
                    </p>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                         <div className="flex items-center space-x-2 text-slate-600 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="text-slate-400">{ICONS.Clock}</div>
                            <span>{recipe.prepTime}</span>
                         </div>
                         <div className="flex items-center space-x-2 text-slate-600 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="text-slate-400">{ICONS.Flame}</div>
                            <span>{recipe.calories}</span>
                         </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Missing Items</span>
                            <span className={`text-sm font-bold ${recipe.missingIngredients.length === 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {recipe.missingIngredients.length === 0 ? 'You have everything!' : `${recipe.missingIngredients.length} items needed`}
                            </span>
                         </div>
                         
                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1 shadow-sm">
                            {ICONS.Next}
                         </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-full shadow-2xl text-sm font-medium animate-bounce-in z-50 flex items-center gap-2 transition-all">
          <div className="text-emerald-400">{ICONS.CheckCircle}</div>
          {toastMsg}
        </div>
      )}
    </div>
  );
};