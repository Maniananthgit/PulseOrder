import React, { useState, useEffect } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { 
  ShoppingBag, 
  Clock, 
  ArrowLeft,
  Sun,
  Moon,
  ConciergeBell,
  Sparkles
} from 'lucide-react';
import royalEmberLogo from '../../assets/royal_ember_logo.jpg';
import { getAssignedWaiter } from '../../utils/waiterAssignment';

interface HeaderProps {
  onBackToWelcome?: () => void;
  onOpenCart?: () => void;
  showBack?: boolean;
  onOpenTrackOrder?: () => void;
  onOpenEntertainment?: () => void;
  onCallWaiter?: () => void;
  onOpenAIChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onBackToWelcome, 
  onOpenCart, 
  showBack = false,
  onOpenAIChat
}) => {
  const { 
    tableNumber, 
    theme, 
    toggleTheme, 
    cartTotalQuantity, 
    cartGrandTotal, 
    t 
  } = useKiosk();

  const [currentTime, setCurrentTime] = useState<string>('');

  // Live dynamic clock updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const assignedWaiter = getAssignedWaiter(tableNumber);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_25px_rgba(0,0,0,0.3)] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3">
        
        {/* LEFT: Back Button, Luxury Brand Logo & Table Number */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          
          {showBack && onBackToWelcome && (
            <button
              type="button"
              onClick={onBackToWelcome}
              className="w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Return to Welcome Screen"
              aria-label="Return to Welcome Screen"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {/* Luxury Brand Lockup (Always Visible & Responsive) */}
          <div 
            onClick={onBackToWelcome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
            title="Royal Ember Restaurant & Banquet"
          >
            {/* Gold Crest Logo */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src={royalEmberLogo} 
                alt="Royal Ember Logo" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col leading-none">
              <h1 className="font-royal font-black text-sm sm:text-base md:text-lg tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 drop-shadow-sm whitespace-nowrap">
                Royal Ember
              </h1>
              <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.24em] text-amber-400/80 font-bold mt-0.5 whitespace-nowrap">
                Dining &amp; Banquet
              </p>
            </div>
          </div>

          {/* TABLE NUMBER CAPSULE (Ultra-refined luxury glass badge) */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300 shadow-sm select-none">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400/80">Table</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 leading-none">{tableNumber}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
          </div>

        </div>

        {/* RIGHT: Live Clock, Assigned Server, Cart & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Live Dynamic Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-300 font-mono text-xs shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTime || '--:--'}</span>
          </div>

          {/* Assigned Server Badge (Luxury Concierge Bell with Gold Name) */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-200 shadow-xs hover:border-amber-500/30 transition-colors">
            <ConciergeBell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hidden md:inline">Server:</span>
            <span className="text-xs font-black text-amber-300">{assignedWaiter.fullName}</span>
          </div>

          {/* Ember AI Concierge Trigger */}
          {onOpenAIChat && (
            <button
              type="button"
              onClick={onOpenAIChat}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
              title="Ask Ember AI Concierge (Signatures, Ratings, Timings)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-xs font-black tracking-wide">Ember AI</span>
            </button>
          )}

          {/* Cart Trigger Button (Vibrant Culinary Amber Pill with Always-Visible Label) */}
          {onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="font-black tracking-wide">{t.cart}</span>
              {cartTotalQuantity > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 text-xs font-black shadow-xs">
                  {cartTotalQuantity}
                </span>
              )}
              {cartGrandTotal > 0 && (
                <span className="text-xs font-black border-l border-slate-950/25 pl-1.5 hidden md:inline">
                  ₹{cartGrandTotal}
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle (Frosted Glass Button) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleTheme();
            }}
            className="w-9 h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;
