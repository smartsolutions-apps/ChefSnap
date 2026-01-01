import React from 'react';
import { ShoppingListItem } from '../types';
import { ICONS } from '../constants';

interface ShoppingListProps {
  items: ShoppingListItem[];
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onToggleItem, onRemoveItem, onClear }) => {
  // Group items by recipe title
  const groupedItems = items.reduce((acc, item) => {
    const key = item.recipeTitle || 'General Items';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  // Sort logic: Recipes with unacquired items first, then by name
  const sortedGroupKeys = Object.keys(groupedItems).sort((a, b) => {
    const aPending = groupedItems[a].some(i => !i.acquired);
    const bPending = groupedItems[b].some(i => !i.acquired);
    if (aPending === bPending) return a.localeCompare(b);
    return aPending ? -1 : 1;
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          {ICONS.Cart}
          <span>Shopping List</span>
        </h2>
        {items.length > 0 && (
          <button 
            onClick={onClear}
            className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            {ICONS.Cart}
          </div>
          <p className="text-lg">Your list is empty</p>
          <p className="text-sm mt-1">Add missing ingredients from cooking mode</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-6 pb-20">
          {sortedGroupKeys.map((groupTitle) => {
            const groupItems = groupedItems[groupTitle];
            const allAcquired = groupItems.every(i => i.acquired);

            return (
              <div key={groupTitle} className={`bg-white rounded-2xl shadow-sm border ${allAcquired ? 'border-slate-100 opacity-70' : 'border-slate-200'} overflow-hidden transition-all duration-300`}>
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className={`font-bold text-sm uppercase tracking-wide ${allAcquired ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                    {groupTitle}
                  </h3>
                  {allAcquired && <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">{ICONS.CheckCircle} Done</span>}
                </div>
                
                <div className="divide-y divide-slate-100">
                  {groupItems.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => onToggleItem(item.id)}
                      className={`p-4 flex items-center justify-between group cursor-pointer transition-colors ${
                        item.acquired ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`transition-colors duration-300 ${item.acquired ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-400'}`}>
                          {item.acquired ? ICONS.CheckSquare : ICONS.Square}
                        </div>
                        <span className={`font-medium transition-all duration-300 ${
                          item.acquired ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                          {item.name}
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50"
                        title="Remove item"
                      >
                        {ICONS.Trash}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};