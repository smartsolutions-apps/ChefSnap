import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { CameraCapture } from './components/CameraCapture';
import { RecipeList } from './components/RecipeList';
import { CookingMode } from './components/CookingMode';
import { ShoppingList } from './components/ShoppingList';
import { ProfileView } from './components/ProfileView';
import { AppView, Recipe, DietaryFilter, PrepTimeFilter, CookTimeFilter, DifficultyFilter, ShoppingListItem } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/geminiService';
import { saveRating, getSavedRecipes, toggleSavedRecipe } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ICONS } from './constants';

// Speech Recognition Polyfill
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInGuest } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
          {ICONS.ChefHat}
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to ChefSnap</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Your intelligent culinary assistant. Snap a photo of your fridge, and let AI create the perfect recipe for you.
        </p>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl font-bold text-slate-700 transition-all shadow-sm group"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             <span>Continue with Google</span>
          </button>
          
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Or</span></div>
          </div>

          <button
            onClick={signInGuest}
            className="w-full px-6 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  
  // State
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('None');
  const [prepTimeFilter, setPrepTimeFilter] = useState<PrepTimeFilter>('Any');
  const [cookTimeFilter, setCookTimeFilter] = useState<CookTimeFilter>('Any');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('Any');
  
  // Shopping List
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  
  // Recipe Lists
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [introText, setIntroText] = useState<string>('');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Derived state for quick lookup
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  
  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRecipes, setIsGeneratingRecipes] = useState(false);

  // Trigger re-render of RecipeList when ratings change
  const [ratingsVersion, setRatingsVersion] = useState(0);

  // Voice Control State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Load saved recipes on mount
  useEffect(() => {
    const saved = getSavedRecipes();
    setSavedRecipes(saved);
    setSavedRecipeIds(new Set(saved.map(r => r.id)));
  }, []);

  // Sync profile preferences if available
  useEffect(() => {
    if (userProfile?.preferences?.dietary) {
      setDietaryFilter(userProfile.preferences.dietary);
    }
  }, [userProfile]);

  // Handlers
  const handleCapture = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      // 1. Analyze Image
      const ingredients = await analyzeFridgeImage(base64Image);
      setDetectedIngredients(ingredients);
      
      // 2. Generate Recipes
      setIsGeneratingRecipes(true);
      setCurrentView(AppView.RECIPES);
      
      // PASS PANTRY: Use profile pantry or empty array
      const pantry = userProfile?.pantry || [];

      const { recipes, introText: newIntroText } = await generateRecipes(
        ingredients,
        pantry,
        dietaryFilter, 
        prepTimeFilter, 
        cookTimeFilter, 
        difficultyFilter
      );
      setGeneratedRecipes(recipes);
      setIntroText(newIntroText);
    } catch (error) {
      alert("Something went wrong analyzing the fridge. Please try again.");
      console.error(error);
      setCurrentView(AppView.HOME);
    } finally {
      setIsAnalyzing(false);
      setIsGeneratingRecipes(false);
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentView(AppView.COOKING);
  };

  const handleRecipeUpdate = (id: string, updates: Partial<Recipe>) => {
    setGeneratedRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    setSavedRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    if (selectedRecipe?.id === id) {
        setSelectedRecipe(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleAddToShoppingList = (items: string[], recipeTitle: string = 'General') => {
    const newItems: ShoppingListItem[] = items.map(name => ({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      name,
      recipeTitle,
      acquired: false
    }));
    setShoppingList(prev => [...prev, ...newItems]);
  };

  const handleRemoveShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleShoppingItem = (id: string) => {
    setShoppingList(prev => prev.map(item => 
      item.id === id ? { ...item, acquired: !item.acquired } : item
    ));
  };

  // --- Filter Logic wrappers ---
  const regenerateIfActive = async (
    d: DietaryFilter, 
    p: PrepTimeFilter, 
    c: CookTimeFilter, 
    df: DifficultyFilter
  ) => {
    if (detectedIngredients.length > 0 && currentView === AppView.RECIPES) {
      setIsGeneratingRecipes(true);
      setGeneratedRecipes([]);
      try {
        const pantry = userProfile?.pantry || [];
        const { recipes, introText: newIntroText } = await generateRecipes(detectedIngredients, pantry, d, p, c, df);
        setGeneratedRecipes(recipes);
        setIntroText(newIntroText);
      } catch (e) { console.error(e); } finally {
        setIsGeneratingRecipes(false);
      }
    }
  };

  const handleDietaryChange = (filter: DietaryFilter) => {
    setDietaryFilter(filter);
    regenerateIfActive(filter, prepTimeFilter, cookTimeFilter, difficultyFilter);
  };

  const handlePrepTimeChange = (filter: PrepTimeFilter) => {
    setPrepTimeFilter(filter);
    regenerateIfActive(dietaryFilter, filter, cookTimeFilter, difficultyFilter);
  };

  const handleCookTimeChange = (filter: CookTimeFilter) => {
    setCookTimeFilter(filter);
    regenerateIfActive(dietaryFilter, prepTimeFilter, filter, difficultyFilter);
  };

  const handleDifficultyChange = (filter: DifficultyFilter) => {
    setDifficultyFilter(filter);
    regenerateIfActive(dietaryFilter, prepTimeFilter, cookTimeFilter, filter);
  };

  const handleRateRecipe = (title: string, rating: number) => {
    saveRating(title, rating);
    setRatingsVersion(prev => prev + 1);
  };

  const handleToggleSave = (recipe: Recipe) => {
    const updatedSaved = toggleSavedRecipe(recipe);
    setSavedRecipes(updatedSaved);
    setSavedRecipeIds(new Set(updatedSaved.map(r => r.id)));
  };

  // --- Global Voice Control ---
  useEffect(() => {
    const stopRecognition = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
    if (!SpeechRecognition) return;
    if (currentView === AppView.COOKING) { stopRecognition(); return; }
    if (!isVoiceActive) { stopRecognition(); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();
      console.log('Voice Command:', transcript);

      if (transcript.includes('vegetarian')) handleDietaryChange('Vegetarian');
      else if (transcript.includes('easy')) handleDifficultyChange('Easy');
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') setIsVoiceActive(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) { console.error(e); }

    return stopRecognition;
  }, [isVoiceActive, currentView, detectedIngredients]);

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="animate-spin text-emerald-600">{ICONS.ChefHat}</div>
      </div>
    );
  }

  // Login Guard
  if (!user) {
    return <LoginScreen />;
  }

  // Main App Content
  const renderContent = () => {
    switch (currentView) {
      case AppView.HOME:
        return <CameraCapture onCapture={handleCapture} isAnalyzing={isAnalyzing} />;
      case AppView.RECIPES:
        return <RecipeList recipes={generatedRecipes} introText={introText} onSelectRecipe={handleRecipeSelect} onUpdateRecipe={handleRecipeUpdate} isLoading={isGeneratingRecipes} ingredients={detectedIngredients} lastUpdated={ratingsVersion} savedRecipeIds={savedRecipeIds} onToggleSave={handleToggleSave} />;
      case AppView.SAVED:
        return <RecipeList recipes={savedRecipes} onSelectRecipe={handleRecipeSelect} onUpdateRecipe={handleRecipeUpdate} isLoading={false} ingredients={[]} lastUpdated={ratingsVersion} savedRecipeIds={savedRecipeIds} onToggleSave={handleToggleSave} isSavedView={true} />;
      case AppView.SHOPPING:
        return <ShoppingList items={shoppingList} onRemoveItem={handleRemoveShoppingItem} onToggleItem={handleToggleShoppingItem} onClear={() => setShoppingList([])} />;
      case AppView.PROFILE:
        return <ProfileView />;
      case AppView.COOKING:
        return null;
      default:
        return <div>Not Implemented</div>;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900">
      {currentView !== AppView.COOKING && (
        <div className="hidden md:block h-full">
           <Sidebar
             currentView={currentView}
             onNavigate={setCurrentView}
             dietaryFilter={dietaryFilter}
             onFilterChange={handleDietaryChange}
             prepTimeFilter={prepTimeFilter}
             onPrepTimeChange={handlePrepTimeChange}
             cookTimeFilter={cookTimeFilter}
             onCookTimeChange={handleCookTimeChange}
             difficultyFilter={difficultyFilter}
             onDifficultyChange={handleDifficultyChange}
             shoppingListCount={shoppingList.filter(i => !i.acquired).length}
             isVoiceActive={isVoiceActive}
             onToggleVoice={() => setIsVoiceActive(!isVoiceActive)}
           />
        </div>
      )}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Mobile Header Logic */}
         <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
             <div className="font-bold text-emerald-600">ChefSnap</div>
             <button onClick={() => setIsVoiceActive(!isVoiceActive)} className={`p-1.5 rounded-full ${isVoiceActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{ICONS.Mic}</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentView(AppView.HOME)} className={`p-2 rounded-lg ${currentView === AppView.HOME ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>{ICONS.Camera}</button>
            <button onClick={() => setCurrentView(AppView.SAVED)} className={`p-2 rounded-lg ${currentView === AppView.SAVED ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>{ICONS.Book}</button>
            <button onClick={() => setCurrentView(AppView.PROFILE)} className={`p-2 rounded-lg ${currentView === AppView.PROFILE ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400'}`}>{ICONS.ChefHat}</button>
          </div>
        </div>

        {currentView === AppView.COOKING && selectedRecipe ? (
          <CookingMode 
            recipe={selectedRecipe} 
            onClose={() => setCurrentView(AppView.SAVED === currentView ? AppView.SAVED : AppView.RECIPES)}
            onAddToShoppingList={handleAddToShoppingList}
            onRateRecipe={handleRateRecipe}
          />
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
