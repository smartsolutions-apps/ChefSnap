import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ICONS } from '../constants';
import { db } from '../services/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; 

type Tab = 'history' | 'pantry';

const COMMON_STAPLES = [
  'Salt', 
  'Pepper', 
  'Olive Oil', 
  'Sugar', 
  'Flour', 
  'Garlic', 
  'Onions',
  'Rice',
  'Butter',
  'Eggs',
  'Milk',
  'Vegetable Oil'
];

export const ProfileView: React.FC = () => {
  const { user, userProfile, signInWithGoogle, logout, updatePantry } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('pantry');

  // Handle toggling staples (Add/Remove)
  const toggleStaple = async (item: string) => {
    if (!user || !userProfile) return;
    
    const exists = userProfile.pantry.includes(item);
    let newPantry = [...userProfile.pantry];

    if (exists) {
      newPantry = newPantry.filter(i => i !== item);
      // We could use arrayRemove here if we were manually managing state, 
      // but updatePantry handles both DB and State Sync cleanly.
    } else {
      newPantry.push(item);
      // Similarly, arrayUnion would be used here in a direct-DB approach.
    }

    await updatePantry(newPantry);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
          {ICONS.ChefHat}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Join ChefSnap</h2>
        <p className="text-slate-500 max-w-sm mb-8">
          Sign in to save your pantry staples, track your cooking history, and sync your favorites across devices.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          {/* Simple Google G Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.04-3.71 1.04-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-2xl">
              {user.displayName ? user.displayName[0] : 'U'}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{user.displayName}</h2>
            <p className="text-slate-500 text-sm">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={logout} 
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-200"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 mb-6 shrink-0">
        <button
          onClick={() => setActiveTab('pantry')}
          className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${
            activeTab === 'pantry' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          My Pantry
          {activeTab === 'pantry' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-bold tracking-wide transition-colors relative ${
            activeTab === 'history' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Cooking History
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'pantry' && (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    {ICONS.List}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">Common Staples</h3>
                    <p className="text-xs text-slate-500">Tap to toggle availability. These items are assumed 'in stock'.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {COMMON_STAPLES.map((staple) => {
                    const isActive = userProfile?.pantry.includes(staple);
                    return (
                      <button
                        key={staple}
                        onClick={() => toggleStaple(staple)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                          isActive 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200 transform scale-105' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-white'
                        }`}
                      >
                        <span>{staple}</span>
                        {isActive ? (
                           <div className="text-white">{ICONS.CheckCircle}</div>
                        ) : (
                           <div className="text-slate-300">{ICONS.Plus}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
             </div>

             {/* Dynamic List for other items */}
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/60">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span>Other Pantry Items</span>
                  <span className="text-xs font-normal text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                    {userProfile?.pantry.filter(p => !COMMON_STAPLES.includes(p)).length || 0}
                  </span>
                </h4>
                
                <div className="flex flex-wrap gap-2">
                  {userProfile?.pantry.filter(p => !COMMON_STAPLES.includes(p)).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleStaple(item)}
                      className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-lg text-sm transition-colors shadow-sm"
                    >
                      <span>{item}</span>
                      <div className="w-3 h-3 text-slate-300 group-hover:text-red-500">{ICONS.X}</div>
                    </button>
                  ))}
                  
                  {userProfile?.pantry.filter(p => !COMMON_STAPLES.includes(p)).length === 0 && (
                     <p className="text-sm text-slate-400 italic">No custom items added yet.</p>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 animate-fade-in border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
               {ICONS.Clock}
            </div>
            <p className="font-bold text-slate-600">No cooking history yet</p>
            <p className="text-sm">Complete a recipe in Cooking Mode to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
