import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Recipe } from '../types';
import { ICONS } from '../constants';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToShoppingList: (items: string[], recipeTitle: string) => void;
  onRateRecipe: (title: string, rating: number) => void;
}

// Browser compatibility for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onClose, onAddToShoppingList, onRateRecipe }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [showIngredients, setShowIngredients] = useState(false);
  
  // Rating State
  const [userRating, setUserRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [isAnimatingRating, setIsAnimatingRating] = useState(false);

  // Image Viewer State
  const [showImage, setShowImage] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Refs to access latest state in event listeners/timers
  const currentStepRef = useRef(currentStep);
  const recognitionRef = useRef<any>(null);

  // Sync refs
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);

  // Speech Synthesis
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onend = () => setIsReading(false);
      utterance.onerror = () => setIsReading(false);
      setIsReading(true);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReading(false);
    }
  }, []);

  const toggleRead = () => {
    if (isReading) {
      stopSpeaking();
    } else {
      speak(recipe.steps[currentStep]);
    }
  };

  const handleNext = useCallback(() => {
    if (currentStepRef.current < recipe.steps.length - 1) {
      stopSpeaking();
      setCurrentStep(prev => prev + 1);
    }
  }, [recipe.steps.length, stopSpeaking]);

  const handlePrev = useCallback(() => {
    if (currentStepRef.current > 0) {
      stopSpeaking();
      setCurrentStep(prev => prev - 1);
    }
  }, [stopSpeaking]);

  const handleAddMissing = useCallback(() => {
    // Map missing items to strings for shopping list
    const items = recipe.missingIngredients.map(i => `${i.quantity} ${i.name}`.trim());
    onAddToShoppingList(items, recipe.title);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }, [onAddToShoppingList, recipe.missingIngredients, recipe.title]);

  // Voice Recognition Setup
  useEffect(() => {
    if (!SpeechRecognition) {
      setVoiceError('Voice control not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceActive(true);
      setVoiceError('');
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setVoiceError('Mic access denied');
      } else {
        setIsVoiceActive(false);
      }
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();
      console.log('Command:', transcript);

      if (transcript.includes('next')) {
        handleNext();
      } else if (transcript.includes('back') || transcript.includes('previous') || transcript.includes('prev')) {
        handlePrev();
      } else if (transcript.includes('read') || transcript.includes('repeat') || transcript.includes('speak')) {
        stopSpeaking();
        setTimeout(() => speak(recipe.steps[currentStepRef.current]), 100);
      } else if (transcript.includes('stop') || transcript.includes('quiet') || transcript.includes('hush')) {
        stopSpeaking();
      } else if (transcript.includes('add') && (transcript.includes('shop') || transcript.includes('list') || transcript.includes('missing'))) {
        handleAddMissing();
      } else if (transcript.includes('ingredient')) {
        setShowIngredients(true);
      } else if (transcript.includes('close ingredient') || transcript.includes('hide ingredient')) {
        setShowIngredients(false);
      } else if (transcript.includes('show photo') || transcript.includes('view image') || transcript.includes('open photo')) {
        if (recipe.imageUrl) setShowImage(true);
      } else if (transcript.includes('close photo') || transcript.includes('close image')) {
        setShowImage(false);
      }
    };

    recognitionRef.current = recognition;
    
    // Start automatically
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopSpeaking();
    };
  }, [recipe.steps, handleNext, handlePrev, speak, stopSpeaking, handleAddMissing, recipe.imageUrl]);

  const toggleVoiceControl = () => {
    if (!recognitionRef.current) return;
    
    if (isVoiceActive) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition", e);
      }
    }
  };

  const handleRating = (rating: number) => {
    if (isAnimatingRating) return;

    setUserRating(rating);
    setIsAnimatingRating(true);
    
    // Add visual delay before submitting to allow animation to play
    setTimeout(() => {
        setHasRated(true);
        onRateRecipe(recipe.title, rating);
        setIsAnimatingRating(false);
    }, 600);
  };

  // Image Pan/Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const newZoom = Math.min(Math.max(1, zoomLevel + (e.deltaY * -0.005)), 4);
    setZoomLevel(newZoom);
    if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panPosition.x, y: e.touches[0].clientY - panPosition.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoomLevel > 1 && e.touches.length === 1) {
      setPanPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
      setZoomLevel(prev => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPanPosition({x:0, y:0});
          return next;
      });
  };
  const handleResetZoom = () => {
      setZoomLevel(1);
      setPanPosition({x:0, y:0});
  };

  const progress = ((currentStep + 1) / recipe.steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top Bar */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          {ICONS.ArrowLeft}
        </button>
        <div className="text-center flex-1 mx-2 overflow-hidden flex flex-col items-center">
          <h3 className="font-bold text-slate-800 truncate w-full max-w-[200px] md:max-w-md">{recipe.title}</h3>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Step</span>
            <input
                type="number"
                min={1}
                max={recipe.steps.length}
                value={currentStep + 1}
                onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= recipe.steps.length) {
                        stopSpeaking();
                        setCurrentStep(val - 1);
                    }
                }}
                onClick={(e) => e.currentTarget.select()}
                className="w-10 text-center bg-slate-100 border border-slate-200 rounded py-0.5 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all appearance-none"
                aria-label="Jump to step"
            />
            <span>of {recipe.steps.length}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
            {recipe.imageUrl && (
                 <button
                 onClick={() => setShowImage(true)}
                 className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                 title="View Photo"
                 >
                 {ICONS.Image}
                 </button>
            )}
            
            <button
                onClick={() => setShowIngredients(!showIngredients)}
                className={`p-2 rounded-full transition-colors ${
                    showIngredients ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
                title="Ingredients"
            >
                {ICONS.List}
            </button>
            {/* Voice Indicator */}
            <button 
            onClick={toggleVoiceControl}
            className={`p-2 rounded-full transition-colors ${
                voiceError 
                ? 'bg-red-50 text-red-500'
                : isVoiceActive 
                    ? 'bg-emerald-50 text-emerald-700 animate-pulse' 
                    : 'bg-slate-50 text-slate-500'
            }`}
            title={voiceError || (isVoiceActive ? "Listening..." : "Voice Control Off")}
            >
            {ICONS.Mic}
            </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-100">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start text-center max-w-3xl mx-auto w-full relative">
        
        {/* Full Screen Image Viewer Overlay */}
        {showImage && recipe.imageUrl && (
            <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-fade-in">
                {/* Header */}
                <div className="p-4 flex justify-between items-center text-white z-10 shrink-0">
                    <h3 className="font-bold text-lg">{recipe.title}</h3>
                    <button onClick={() => setShowImage(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        {ICONS.X}
                    </button>
                </div>

                {/* Canvas */}
                <div 
                    className="flex-1 overflow-hidden flex items-center justify-center relative touch-none cursor-move"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                >
                    <img 
                        src={recipe.imageUrl} 
                        alt={recipe.title}
                        className="max-w-full max-h-full transition-transform duration-75 ease-linear origin-center"
                        style={{ 
                            transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                            cursor: zoomLevel > 1 ? 'grabbing' : 'default'
                        }}
                        draggable={false}
                    />
                </div>

                {/* Footer Controls */}
                <div className="p-6 flex justify-center items-center gap-6 z-10 shrink-0 pb-10 md:pb-6">
                    <button onClick={handleZoomOut} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" disabled={zoomLevel <= 1}>
                        {ICONS.ZoomOut}
                    </button>
                    <span className="text-white font-mono min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors" disabled={zoomLevel >= 4}>
                        {ICONS.ZoomIn}
                    </button>
                    <div className="w-px h-8 bg-white/20 mx-2"></div>
                    <button onClick={handleResetZoom} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors">
                        {ICONS.Reset}
                    </button>
                </div>
            </div>
        )}

        {/* Ingredients Overlay/Modal */}
        {showIngredients && (
             <div className="absolute inset-0 bg-white z-20 animate-fade-in p-6 overflow-y-auto">
                 <h2 className="text-2xl font-bold text-slate-800 mb-6 sticky top-0 bg-white pb-4 border-b">Ingredients</h2>
                 <ul className="space-y-4 text-left max-w-md mx-auto">
                     {recipe.ingredients.map((ing, idx) => (
                         <li key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                             <span className="font-medium text-slate-700">{ing.name}</span>
                             <span className="text-slate-500 text-sm bg-white px-2 py-1 rounded border border-slate-200">{ing.quantity}</span>
                         </li>
                     ))}
                 </ul>
                 {recipe.sourceUrl && (
                    <a 
                      href={recipe.sourceUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-6 flex items-center justify-center gap-2 text-emerald-600 hover:underline text-sm font-medium"
                    >
                      {ICONS.Link}
                      View Original Recipe Source
                    </a>
                 )}
                 <button 
                   onClick={() => setShowIngredients(false)}
                   className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-xl font-semibold shadow-lg mx-auto block"
                 >
                    Close Ingredients
                 </button>
             </div>
        )}

        <div className="mb-8 mt-10">
           <span className="inline-block bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full mb-4">
             STEP {currentStep + 1}
           </span>
           <h2 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
             {recipe.steps[currentStep]}
           </h2>
        </div>

        {/* Hints for voice commands */}
        {isVoiceActive && !showIngredients && !showImage && (
          <div className="mb-6 text-xs text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
            Try saying: "Next step", "Go back", "Read this", "Show photo"
          </div>
        )}

        {/* Missing Ingredients Context Warning (Only on Step 1) */}
        {currentStep === 0 && recipe.missingIngredients.length > 0 && !showIngredients && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl w-full max-w-md">
            <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center justify-center gap-2">
              Wait! You are missing items:
            </h4>
            <ul className="text-amber-700 text-sm mb-3">
              {recipe.missingIngredients.map((i, idx) => <li key={idx}>• {i.quantity} {i.name}</li>)}
            </ul>
            <button
              onClick={handleAddMissing}
              disabled={isAdded}
              className="w-full py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isAdded ? (
                <>
                  {ICONS.CheckCircle}
                  <span>Added to List</span>
                </>
              ) : (
                <>
                  {ICONS.Plus}
                  <span>Add Missing to Shopping List</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Rating Section (Visible on Last Step) */}
        {currentStep === recipe.steps.length - 1 && !showIngredients && (
           <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-sm animate-fade-in-up">
              <h3 className="font-bold text-slate-800 mb-4">How was this recipe?</h3>
              {hasRated ? (
                <div className="text-emerald-600 font-medium flex flex-col items-center animate-pulse">
                   {ICONS.CheckCircle}
                   <span className="mt-2">Thanks for your rating!</span>
                </div>
              ) : (
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      disabled={isAnimatingRating}
                      className={`transition-all duration-300 focus:outline-none ${
                        isAnimatingRating && userRating === star 
                            ? 'scale-125 rotate-12' // Pop effect for selected star
                            : isAnimatingRating && userRating > star
                                ? 'scale-110' 
                                : 'hover:scale-110'
                      }`}
                    >
                       <div className={`transition-colors duration-300 ${
                           userRating >= star 
                             ? 'text-amber-400 drop-shadow-sm' 
                             : 'text-slate-300'
                        } ${isAnimatingRating && userRating >= star ? 'drop-shadow-md filter' : ''}`}>
                         {userRating >= star ? ICONS.StarFilled : ICONS.Star}
                       </div>
                    </button>
                  ))}
                </div>
              )}
           </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="p-4 rounded-full bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 shadow-sm"
          >
            {ICONS.Prev}
          </button>

          <button
            onClick={toggleRead}
            className={`flex-1 max-w-xs py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isReading 
                ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105'
            }`}
          >
            {isReading ? (
              <>
                {ICONS.VolumeOff}
                <span>Stop Reading</span>
              </>
            ) : (
              <>
                {ICONS.VolumeOn}
                <span>Read Aloud</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === recipe.steps.length - 1}
            className="p-4 rounded-full bg-white border border-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 shadow-sm"
          >
            {ICONS.Next}
          </button>
        </div>
      </div>
    </div>
  );
};