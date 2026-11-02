import React, { useState, useMemo } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { MenuItem, Category } from '../../types';
import { 
  getLocalizedItemName, 
  getLocalizedItemDescription 
} from '../../utils/translations';
import { 
  Clock, 
  Flame, 
  Plus, 
  Minus,
  Search, 
  AlertCircle, 
  Leaf, 
  Drumstick,
  Crown,
  Tag,
  Activity,
  Gamepad2,
  ChevronRight,
  Bell,
  Star,
  Zap,
  Heart,
  Sparkles,
  Bot,
  MessageSquare
} from 'lucide-react';
import { PromoAdBanner } from './PromoAdBanner';
import { getAssignedWaiter } from '../../utils/waiterAssignment';
import CallWaiterModal from '../common/CallWaiterModal';

interface MenuScreenProps {
  onSelectItem: (item: MenuItem) => void;
  onOpenCart: () => void;
  onOpenOrderTracker?: () => void;
  onOpenEntertainment?: () => void;
  onOpenAIChat?: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ 
  onSelectItem, 
  onOpenCart: _onOpenCart,
  onOpenOrderTracker,
  onOpenEntertainment,
  onOpenAIChat
}) => {
  const { 
    menuItems, 
    cart, 
    addToCart,
    updateCartQuantity,
    tableNumber,
    language, 
    t, 
    mealTime,
    activeOrders,
    currentTrackedOrder,
    staffAlerts
  } = useKiosk();

  const [isCallWaiterOpen, setIsCallWaiterOpen] = useState(false);
  const [favoriteItemIds, setFavoriteItemIds] = useState<Record<string, boolean>>({});
  const assignedWaiter = getAssignedWaiter(tableNumber);

  const pendingAlertsForThisTable = staffAlerts.filter(
    (a) => a.tableNumber === tableNumber && a.status === 'PENDING'
  ).length;

  const activeTableOrder = useMemo(() => {
    if (currentTrackedOrder && currentTrackedOrder.status !== 'COMPLETED') {
      const match = activeOrders.find(o => o.id === currentTrackedOrder.id);
      return match || currentTrackedOrder;
    }
    return activeOrders.find(o => o.tableNumber === tableNumber && o.status !== 'COMPLETED') || null;
  }, [activeOrders, currentTrackedOrder, tableNumber]);

  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [ratingFilter, setRatingFilter] = useState<boolean>(false);
  const [fastPrepFilter, setFastPrepFilter] = useState<boolean>(false);

  // Clean, professional categories inspired by the reference mockup
  const categoriesList: { key: Category; label: string; icon: string }[] = [
    { key: 'All', label: 'All Items', icon: '🍽️' },
    { key: 'Starters', label: 'Starters', icon: '🍗' },
    { key: 'Main Course', label: 'Main Course', icon: '🍛' },
    { key: 'Breads & Rice', label: 'Breads & Rice', icon: '🍚' },
    { key: 'Beverages', label: 'Beverages', icon: '🍹' },
    { key: 'Desserts', label: 'Desserts', icon: '🍰' },
    { key: 'Combo', label: 'Chef Combos', icon: '🍱' },
    { key: 'Signature', label: 'Signature', icon: '👑' },
  ];

  const toggleFavorite = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteItemIds(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.customizationOptions && item.customizationOptions.length > 0) {
      onSelectItem(item);
    } else {
      addToCart(item, item.isSpicy ? 'Medium' : 'Mild', [], '', 1);
    }
  };

  const handleQuickQuantity = (item: MenuItem, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const existingInCart = cart.find(c => c.menuItemId === item.id);
    if (existingInCart) {
      updateCartQuantity(existingInCart.cartItemId, delta);
    } else if (delta > 0) {
      addToCart(item, item.isSpicy ? 'Medium' : 'Mild', [], '', 1);
    }
  };

  const filteredItems = useMemo(() => {
    const list = menuItems.filter((item) => {
      // 1. Time-based meal filtering
      if (item.mealTimes && item.mealTimes.length > 0) {
        if (!item.mealTimes.includes(mealTime)) {
          return false;
        }
      }

      // 2. Category / Mode filter
      if (selectedCategory === 'Combo') {
        if (!item.isCombo && item.category !== 'Combo') return false;
      } else {
        if (item.isCombo || item.category === 'Combo') return false;

        if (selectedCategory === 'Signature') {
          if (!item.isSignature) return false;
        } else if (selectedCategory !== 'All') {
          if (item.category !== selectedCategory) return false;
        }
      }

      // 3. Diet filter
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'non-veg' && item.isVeg) return false;

      // 4. Rating filter
      if (ratingFilter) {
        const ratingNum = item.rating || 4.7;
        if (ratingNum < 4.5) return false;
      }

      // 5. Fast prep filter
      if (fastPrepFilter) {
        if ((item.prepTimeMinutes || 20) > 15) return false;
      }

      // 6. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchTamil = (item.nameTamil || '').toLowerCase().includes(query);
        const matchHindi = (item.nameHindi || '').toLowerCase().includes(query);
        const matchTelugu = (item.nameTelugu || '').toLowerCase().includes(query);
        const matchSpanish = (item.nameSpanish || '').toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        return matchName || matchTamil || matchHindi || matchTelugu || matchSpanish || matchDesc;
      }

      return true;
    });

    // 7. Sort signatures first, then combos, then popularity
    return list.sort((a, b) => {
      if (a.isSignature && !b.isSignature) return -1;
      if (!a.isSignature && b.isSignature) return 1;
      if (a.isCombo && !b.isCombo) return -1;
      if (!a.isCombo && b.isCombo) return 1;
      return (b.orderedTodayCount || 0) - (a.orderedTodayCount || 0);
    });
  }, [menuItems, mealTime, selectedCategory, dietFilter, ratingFilter, fastPrepFilter, searchQuery]);

  return (
    <div className={`pb-28 transition-colors duration-300 ${
      mealTime === 'dinner' 
        ? 'bg-slate-950 text-white' 
        : 'bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
    }`}>
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-5 space-y-5">

        {/* 1. SLIM LUXURY DINING STATUS STRIP (Clean & Professional) */}
        <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {mealTime === 'morning' ? 'Sunrise Breakfast Service' : mealTime === 'lunch' ? 'Grand Afternoon Lunch Service' : 'Royal Evening Dinner Service'}
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
            <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-400">
              {mealTime === 'morning' ? t.morningHours : mealTime === 'lunch' ? t.lunchHours : `${t.dinnerHours} (Late Night Sizzlers)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Time-Synchronized Menu</span>
          </div>
        </div>

        {/* 2. PROMOTIONAL OFFER CARDS IN SLIDE BAR DESIGN */}
        <PromoAdBanner onSelectCategory={(cat) => setSelectedCategory(cat)} />

        {/* 3. CATEGORIES SECTION (Reference Image Style: Sleek Horizontal Cards) */}
        <section aria-label="Menu Categories" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-base">🌿</span>
              <h3 className="font-sans font-bold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                Categories
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View All Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Horizontal Rounded-2xl Cards */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
            {categoriesList.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const isComboBtn = cat.key === 'Combo';
              const isSignatureBtn = cat.key === 'Signature';

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-2xl flex items-center gap-2 shrink-0 transition-all duration-200 cursor-pointer border active:scale-95 shadow-xs relative ${
                    isActive
                      ? isSignatureBtn
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/35 font-black scale-105 ring-2 ring-amber-400/50'
                        : isComboBtn
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/35 font-black scale-105 ring-2 ring-emerald-400/50'
                        : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/25 font-black scale-102'
                      : isSignatureBtn
                      ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 text-amber-300 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-300 hover:scale-102 ring-1 ring-amber-400/30'
                      : isComboBtn
                      ? 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/50 text-emerald-300 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:scale-102 ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-amber-400/50 hover:text-amber-400'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
                    {cat.label}
                  </span>
                  {isSignatureBtn && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-wider border border-amber-400/40">
                      Top
                    </span>
                  )}
                  {isComboBtn && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-black uppercase tracking-wider border border-emerald-400/40">
                      Save ₹
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. CAPSULE SEARCH BAR & FILTER PILL CHIPS */}
        <section aria-label="Search and Filter Controls" className="space-y-3">
          
          {/* Capsule Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search for delicious dishes, curries, tandoors, biryanis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-20 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 shadow-xs transition-all"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full"
              >
                Clear
              </button>
            )}
          </div>

          {/* Horizontal Scrollable Filter Pill Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setDietFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 ${
                dietFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              All Items
            </button>

            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === 'veg' ? 'all' : 'veg')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 border ${
                dietFilter === 'veg'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <Leaf className="w-3.5 h-3.5 fill-emerald-500" />
              <span>{t.veg}</span>
            </button>

            <button
              type="button"
              onClick={() => setDietFilter(dietFilter === 'non-veg' ? 'all' : 'non-veg')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 border ${
                dietFilter === 'non-veg'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-rose-500/20'
                  : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <Drumstick className="w-3.5 h-3.5" />
              <span>{t.nonVeg}</span>
            </button>

            <button
              type="button"
              onClick={() => setRatingFilter(!ratingFilter)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 border ${
                ratingFilter
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20 font-black'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Over 4.5 ⭐</span>
            </button>

            <button
              type="button"
              onClick={() => setFastPrepFilter(!fastPrepFilter)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs active:scale-95 border ${
                fastPrepFilter
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-cyan-500/20 font-black'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-cyan-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              <span>Fast Prep (&lt;15m)</span>
            </button>
          </div>
        </section>

        {/* 5. POPULAR DISHES SECTION HEADER (Reference Image Style) */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
                Popular Dishes
              </h2>
              <span className="text-amber-500 font-bold text-lg">~</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Freshly prepared artisanal meals served straight to Table {tableNumber}
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
            {filteredItems.length} Dishes
          </span>
        </div>

        {/* 6. FOOD ITEMS GRID: CURRENT TREND MODERN CARDS (Exactly like Reference Image!) */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="font-display text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">
              No dishes found
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 max-w-sm mx-auto">
              Try adjusting your search query, dietary filter, or choose another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setDietFilter('all');
                setRatingFilter(false);
                setFastPrepFilter(false);
              }}
              className="px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors cursor-pointer shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredItems.map((item) => {
              const inCartItems = cart.filter((c) => c.menuItemId === item.id);
              const inCartCount = inCartItems.reduce((acc, c) => acc + c.quantity, 0);

              const localizedName = getLocalizedItemName(item, language);
              const localizedDesc = getLocalizedItemDescription(item, language);
              const itemRating = item.rating || (item.isSignature ? 4.9 : 4.8);
              const reviewCount = item.orderedTodayCount ? item.orderedTodayCount * 3 : 85;
              const isFav = !!favoriteItemIds[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => item.isAvailable && onSelectItem(item)}
                  className={`group relative rounded-3xl transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer border p-3.5 sm:p-4 ${
                    !item.isAvailable
                      ? 'opacity-65 border-slate-200 dark:border-slate-800 grayscale-[0.4] bg-white dark:bg-slate-900/60'
                      : item.isSignature
                      ? 'bg-gradient-to-b from-amber-950/30 via-slate-900/95 to-slate-950 border-2 border-amber-400/80 shadow-[0_6px_30px_rgba(245,158,11,0.22)] ring-1 ring-amber-400/40 hover:shadow-[0_12px_45px_rgba(245,158,11,0.35)] hover:-translate-y-2'
                      : item.isCombo
                      ? 'bg-gradient-to-b from-emerald-950/30 via-slate-900/95 to-slate-950 border-2 border-emerald-500/80 shadow-[0_6px_30px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40 hover:shadow-[0_12px_45px_rgba(16,185,129,0.3)] hover:-translate-y-2'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:shadow-xl hover:border-amber-400/50 hover:-translate-y-1.5'
                  }`}
                >
                  
                  {/* TOP FOOD PRESENTATION CONTAINER */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                    
                    {/* Food Image with Smooth Hover Zoom */}
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient Overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Top-Left: Authentic Veg / Non-Veg Indicator */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center p-0.5 border shadow-sm ${
                        item.isVeg 
                          ? 'bg-white border-emerald-600 text-emerald-600' 
                          : 'bg-white border-rose-600 text-rose-600'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                      </span>

                      {item.isSpicy && (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-xs">
                          <Flame className="w-3 h-3" />
                          <span>Spicy</span>
                        </span>
                      )}
                    </div>

                    {/* Top-Right: Favorite Heart Toggle + Prep Time */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
                        <Clock className="w-2.5 h-2.5 text-amber-300" />
                        <span>{item.prepTimeMinutes}m</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(item.id, e)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 ${
                          isFav 
                            ? 'bg-rose-500 text-white shadow-sm' 
                            : 'bg-black/40 hover:bg-black/60 text-white'
                        }`}
                        title="Add to Favorites"
                        aria-label="Add to Favorites"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    {/* Signature / Combo Bottom-Left Badge (Prominently Highlighted) */}
                    {item.isSignature && (
                      <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md shadow-amber-500/40 flex items-center gap-1.5 border border-amber-300">
                        <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                        <span>★ Royal Signature</span>
                      </div>
                    )}

                    {item.isCombo && (
                      <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-500/40 flex items-center gap-1.5 border border-emerald-300/60">
                        <Tag className="w-3.5 h-3.5 text-white" />
                        <span>🍱 Chef Combo Deal</span>
                      </div>
                    )}

                    {/* Sold out overlay if unavailable */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3.5 py-1 rounded-full bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg">
                          {t.soldOut}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DISH DETAILS SECTION (Current Trend Clean Layout) */}
                  <div className="pt-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Dish Title */}
                      <h3 className="font-sans font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-amber-400 transition-colors line-clamp-1 leading-snug">
                        {localizedName}
                      </h3>

                      {/* Star Rating & Reviews (Image Style: e.g. 4.8 (120)) */}
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                          {itemRating}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          ({reviewCount})
                        </span>
                      </div>

                      {/* Subtle Short Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1 font-normal">
                        {localizedDesc}
                      </p>
                    </div>

                    {/* BOTTOM ROW: BOLD PRICE ON LEFT, YELLOW CIRCULAR '+' BUTTON ON RIGHT */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                      
                      {/* Price Tag */}
                      <div className="flex flex-col">
                        <span className="font-sans font-extrabold text-lg sm:text-xl text-slate-950 dark:text-amber-400 leading-none">
                          ₹{item.price}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                          {item.calories} kcal
                        </span>
                      </div>

                      {/* Trending Yellow Circular '+' Button (or Quantity Modifier Pill when in Cart) */}
                      {item.isAvailable ? (
                        inCartCount > 0 ? (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25"
                          >
                            <button
                              type="button"
                              onClick={(e) => handleQuickQuantity(item, -1, e)}
                              className="w-6 h-6 rounded-full bg-white/70 hover:bg-white text-slate-950 flex items-center justify-center font-black active:scale-90 transition-transform cursor-pointer"
                              title="Decrease Quantity"
                              aria-label="Decrease Quantity"
                            >
                              <Minus className="w-3 h-3 stroke-[3]" />
                            </button>
                            <span className="text-xs font-black min-w-3 text-center">{inCartCount}</span>
                            <button
                              type="button"
                              onClick={(e) => handleQuickQuantity(item, 1, e)}
                              className="w-6 h-6 rounded-full bg-slate-950 hover:bg-slate-800 text-white flex items-center justify-center font-black active:scale-90 transition-transform cursor-pointer"
                              title="Increase Quantity"
                              aria-label="Increase Quantity"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(item, e)}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/30 hover:scale-108 active:scale-95 transition-all cursor-pointer group/btn"
                            title="Add to Cart"
                            aria-label={`Add ${item.name} to cart`}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover/btn:rotate-90 transition-transform duration-300" />
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                          Unavailable
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* 7. FLOATING QUICK ACTION DOCK (Show Only Bottom - "its perfect place") */}
      <aside aria-label="Quick Actions Dock" className="fixed bottom-6 right-6 z-40 flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-md border border-amber-500/30 shadow-[0_10px_35px_rgba(0,0,0,0.4)] animate-fade-in select-none">
        
        {/* Kio AI Chatbox Floating Launcher */}
        {onOpenAIChat && (
          <button
            type="button"
            onClick={onOpenAIChat}
            className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-500 text-white border border-white/30 shadow-[0_4px_25px_rgba(139,92,246,0.6)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Chat with Kio AI - Ask about Signatures, Ratings & Shop Timings"
            aria-label="Open Kio AI Chatbox"
          >
            {/* Ambient Pulse Glow */}
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-violet-500 to-amber-400 blur-xs opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />
            
            {/* High-Tech Robot Avatar Icon with Online Beacon */}
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white text-indigo-700 shadow-md shrink-0">
              <Bot className="w-4 h-4 stroke-[2.5]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            {/* Unmistakable AI Chatbox Label */}
            <div className="relative flex items-center gap-1.5 leading-none">
              <span className="font-black text-white text-xs tracking-wide">Kio</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-300/40">
                <MessageSquare className="w-2.5 h-2.5" />
                <span>AI Chat</span>
              </span>
            </div>
          </button>
        )}

        {/* Track Order Floating Button */}
        {onOpenOrderTracker && (
          <button
            type="button"
            onClick={onOpenOrderTracker}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
              activeTableOrder 
                ? 'bg-emerald-500 text-white animate-pulse shadow-emerald-500/40' 
                : 'bg-slate-800/80 hover:bg-slate-700 text-white'
            }`}
            title={activeTableOrder ? `Track Order #${activeTableOrder.orderNumber}` : 'Track Kitchen Order'}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-extrabold">Track Order</span>
            {activeTableOrder && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            )}
          </button>
        )}

        {/* Games & News Floating Button */}
        {onOpenEntertainment && (
          <button
            type="button"
            onClick={onOpenEntertainment}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Play Games & Read E-Papers"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-extrabold">Games &amp; News</span>
          </button>
        )}

        {/* Call Waiter Floating Button */}
        <button
          type="button"
          onClick={() => setIsCallWaiterOpen(true)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm ${
            pendingAlertsForThisTable > 0
              ? 'bg-rose-500 text-white animate-bounce shadow-rose-500/40'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
          }`}
          title={`Call waiter (${assignedWaiter.fullName}) to Table ${tableNumber}`}
        >
          <Bell className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-extrabold">Call Waiter</span>
        </button>

      </aside>

      {/* Call Waiter Modal */}
      <CallWaiterModal 
        isOpen={isCallWaiterOpen} 
        onClose={() => setIsCallWaiterOpen(false)} 
      />

    </div>
  );
};

export default MenuScreen;
