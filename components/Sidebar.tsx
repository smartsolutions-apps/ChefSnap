
import React from 'react';
import { AppView, DietaryFilter, PrepTimeFilter, CookTimeFilter, DifficultyFilter } from '../types';
import { ICONS, DIETARY_OPTIONS, PREP_TIME_OPTIONS, COOK_TIME_OPTIONS, DIFFICULTY_OPTIONS } from '../constants';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  dietaryFilter: DietaryFilter;
  onFilterChange: (filter: DietaryFilter) => void;
  prepTimeFilter: PrepTimeFilter;
  onPrepTimeChange: (filter: PrepTimeFilter) => void;
  cookTimeFilter: CookTimeFilter;
  onCookTimeChange: (filter: CookTimeFilter) => void;
  difficultyFilter: DifficultyFilter;
  onDifficultyChange: (filter: DifficultyFilter) => void;
  shoppingListCount: number;
  isVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  dietaryFilter,
  onFilterChange,
  prepTimeFilter,
  onPrepTimeChange,
  cookTimeFilter,
  onCookTimeChange,
  difficultyFilter,
  onDifficultyChange,
  shoppingListCount,
  isVoiceActive,
  onToggleVoice
}) => {
  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-emerald-600">{ICONS.ChefHat}</div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ChefSnap</h1>
        </div>
        <button
          onClick={onToggleVoice}
          className={`p-2 rounded-full transition-all ${
            isVoiceActive 
              ? 'bg-emerald-100 text-emerald-600 animate-pulse ring-2 ring-emerald-200' 
              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
          title={isVoiceActive ? "Voice Commands On" : "Enable Voice Commands"}
        >
          {ICONS.Mic}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Nav */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
          <button
            onClick={() => onNavigate(AppView.HOME)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === AppView.HOME ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {ICONS.Camera}
            <span>Scan Fridge</span>
          </button>
          
          <button
            onClick={() => onNavigate(AppView.PROFILE)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === AppView.PROFILE ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {/* Using ChefHat as Profile icon placeholder or need a User icon in constants */}
            {ICONS.ChefHat} 
            <span>My Kitchen</span>
          </button>

           <button
            onClick={() => onNavigate(AppView.SAVED)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === AppView.SAVED ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {ICONS.Book}
            <span>Saved Recipes</span>
          </button>
          
          <button
            onClick={() => onNavigate(AppView.SHOPPING)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === AppView.SHOPPING ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              {ICONS.Cart}
              <span>Shopping List</span>
            </div>
            {shoppingListCount > 0 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {shoppingListCount}
              </span>
            )}
          </button>
        </div>

        {/* Difficulty Filters */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Difficulty</p>
          <div className="space-y-1">
            {DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onDifficultyChange(option as DifficultyFilter)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  difficultyFilter === option 
                    ? 'bg-purple-50 text-purple-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`flex items-center justify-center w-4 h-4 ${difficultyFilter === option ? 'text-purple-500' : 'text-slate-300'}`}>
                   {ICONS.Utensils}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Filters */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prep Time</p>
          <div className="space-y-1">
            {PREP_TIME_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onPrepTimeChange(option as PrepTimeFilter)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  prepTimeFilter === option 
                    ? 'bg-amber-50 text-amber-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`flex items-center justify-center w-4 h-4 ${prepTimeFilter === option ? 'text-amber-500' : 'text-slate-300'}`}>
                  {ICONS.Clock}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cook Time Filters */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cook Time</p>
          <div className="space-y-1">
            {COOK_TIME_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onCookTimeChange(option as CookTimeFilter)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  cookTimeFilter === option 
                    ? 'bg-orange-50 text-orange-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`flex items-center justify-center w-4 h-4 ${cookTimeFilter === option ? 'text-orange-500' : 'text-slate-300'}`}>
                  {ICONS.Flame}
                </div>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Filters */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dietary Preferences</p>
          <div className="space-y-1">
            {DIETARY_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onFilterChange(option as DietaryFilter)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  dietaryFilter === option 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${dietaryFilter === option ? 'bg-blue-500' : 'bg-slate-300'}`} />
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {isVoiceActive && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 text-xs text-emerald-700 text-center animate-pulse">
           Listening... say "Vegetarian", "Easy", "Under 30"
        </div>
      )}

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Snap a photo of your fridge and let AI decide dinner tonight.
          </p>
        </div>
      </div>
    </div>
  );
};
