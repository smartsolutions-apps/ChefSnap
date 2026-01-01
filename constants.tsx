import React from 'react';
import { 
  ChefHat, 
  Camera, 
  List, 
  Utensils, 
  Leaf, 
  Flame, 
  Clock, 
  ArrowLeft,
  CheckCircle, 
  Plus, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart,
  Mic,
  Star,
  Share2,
  Heart,
  BookOpen,
  Search,
  Image,
  Link,
  X,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';

export const ICONS = {
  ChefHat: <ChefHat className="w-6 h-6" />,
  Camera: <Camera className="w-6 h-6" />,
  List: <List className="w-6 h-6" />,
  Utensils: <Utensils className="w-6 h-6" />,
  Leaf: <Leaf className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  ArrowLeft: <ArrowLeft className="w-5 h-5" />,
  CheckCircle: <CheckCircle className="w-5 h-5" />,
  Plus: <Plus className="w-5 h-5" />,
  VolumeOn: <Volume2 className="w-6 h-6" />,
  VolumeOff: <VolumeX className="w-6 h-6" />,
  Next: <ChevronRight className="w-6 h-6" />,
  Prev: <ChevronLeft className="w-6 h-6" />,
  Cart: <ShoppingCart className="w-6 h-6" />,
  Mic: <Mic className="w-5 h-5" />,
  Star: <Star className="w-4 h-4" />,
  StarFilled: <Star className="w-4 h-4 fill-current" />,
  Share: <Share2 className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  HeartFilled: <Heart className="w-5 h-5 fill-current text-rose-500" />,
  Book: <BookOpen className="w-6 h-6" />,
  Search: <Search className="w-5 h-5" />,
  Image: <Image className="w-6 h-6" />,
  Link: <Link className="w-5 h-5" />,
  X: <X className="w-6 h-6" />,
  Minus: <Minus className="w-6 h-6" />,
  ZoomIn: <ZoomIn className="w-6 h-6" />,
  ZoomOut: <ZoomOut className="w-6 h-6" />,
  Reset: <RotateCcw className="w-5 h-5" />,
  Trash: <Trash2 className="w-5 h-5" />,
  CheckSquare: <CheckSquare className="w-5 h-5" />,
  Square: <Square className="w-5 h-5" />
};

export const DIETARY_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Keto',
  'Gluten-Free',
  'Paleo'
];

export const PREP_TIME_OPTIONS = [
  'Any',
  '< 15 mins',
  '< 30 mins',
  '< 60 mins'
];

export const COOK_TIME_OPTIONS = [
  'Any',
  '< 15 mins',
  '< 30 mins',
  '< 60 mins'
];

export const DIFFICULTY_OPTIONS = [
  'Any',
  'Easy',
  'Medium',
  'Hard'
];