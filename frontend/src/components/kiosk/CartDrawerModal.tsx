import React, { useState } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Flame, 
  ArrowUpDown, 
  Check, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  ListOrdered, 
  Sparkles,
  Utensils
} from 'lucide-react';
import { getSpicePrice, getCustomizationCleanLabel, getCustomizationPrice } from '../../utils/pricingUtils';

interface CartDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawerModal: React.FC<CartDrawerModalProps> = ({ 
  isOpen, 
  onClose, 
  onProceedToCheckout 
}) => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    reorderCart, 
    cartSubtotal, 
    cartTax, 
    cartGrandTotal, 
    t, 
    tableNumber 
  } = useKiosk();

  const [isArrangeMode, setIsArrangeMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Move item up or down in priority
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cart.length) return;

    const newCart = [...cart];
    const [movedItem] = newCart.splice(index, 1);
    newCart.splice(targetIndex, 0, movedItem);
    reorderCart(newCart);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newCart = [...cart];
      const [draggedItem] = newCart.splice(draggedIndex, 1);
      newCart.splice(dropIndex, 0, draggedItem);
      reorderCart(newCart);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-md h-full bg-slate-900/95 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-white/10 backdrop-blur-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Left Edge Glow */}
        <div className="absolute top-1/4 bottom-1/4 left-0 w-1 bg-gradient-to-b from-transparent via-amber-400 to-transparent blur-[2px]" />

        {/* DRAWER HEADER */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 text-amber-400 flex items-center justify-center font-bold border border-amber-400/30 shadow-inner">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Table {tableNumber}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400 font-semibold">
                  {cart.reduce((a, b) => a + b.quantity, 0)} Items
                </span>
              </div>
              <h3 className="font-black text-lg text-white font-display mt-0.5 tracking-tight">
                Your Dining Tray
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SERVING PRIORITY & REARRANGE BANNER */}
        {cart.length > 0 && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-400/30 shadow-sm shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-amber-300 uppercase tracking-wider">
                      Serving Sequence
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950">
                      1st, 2nd, 3rd...
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    {isArrangeMode ? (
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Tap arrows to re-order course priority!
                      </span>
                    ) : (
                      'Decide which course arrives first to your table.'
                    )}
                  </p>
                </div>
              </div>

              {cart.length > 1 && (
                <button
                  onClick={() => setIsArrangeMode(!isArrangeMode)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md ${
                    isArrangeMode
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400 animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  {isArrangeMode ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Done</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>Arrange</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* CART ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500 border border-white/5">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {t.emptyCart}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mb-6">
                Your dining tray is waiting for mouth-watering dishes.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                {t.exploreMenu}
              </button>
            </div>
          ) : (
            cart.map((item, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <div
                  key={item.cartItemId}
                  draggable={isArrangeMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative p-3.5 rounded-2xl transition-all duration-200 flex items-center gap-3 border ${
                    dragOverIndex === index
                      ? 'border-2 border-dashed border-amber-400 bg-amber-950/40 scale-102 shadow-lg z-10'
                      : draggedIndex === index
                      ? 'opacity-60 scale-95 border-amber-400 bg-slate-800'
                      : isArrangeMode
                      ? `bg-slate-800/95 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/30 ${
                          index % 2 === 0 ? 'animate-jiggle-shake' : 'animate-jiggle-shake-alt'
                        } cursor-grab active:cursor-grabbing select-none`
                      : 'bg-slate-850/60 hover:bg-slate-850/90 border-white/[0.08]'
                  }`}
                >
                  {/* Circled Sequence Badge */}
                  <div className="flex flex-col items-center justify-center shrink-0 w-8">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-sm ${
                        isFirst 
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40' 
                          : isSecond 
                          ? 'bg-blue-500 text-white ring-2 ring-blue-400/40' 
                          : isThird 
                          ? 'bg-teal-500 text-slate-950 ring-2 ring-teal-400/40' 
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="text-[9px] font-black uppercase text-slate-400 mt-0.5 tracking-tighter">
                      {isFirst ? '1st' : isSecond ? '2nd' : isThird ? '3rd' : `${index + 1}th`}
                    </span>
                  </div>

                  {/* Item Thumbnail */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 shadow-xs"
                  />

                  {/* Dish Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <h4 className="font-black text-sm text-white truncate block">
                        {item.name}
                      </h4>
                      <div className="text-right shrink-0">
                        <span className="font-black text-sm text-amber-400 font-display">
                          ₹{item.price * item.quantity}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-slate-400 font-medium font-mono">
                            (₹{item.price} ea)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        <span>{item.spiceLevel}</span>
                        {getSpicePrice(item.spiceLevel) > 0 && (
                          <span className="text-[10px] opacity-80">(+₹{getSpicePrice(item.spiceLevel)})</span>
                        )}
                      </span>
                      {item.customizations.map((c) => {
                        const optPrice = getCustomizationPrice(c);
                        const optLabel = getCustomizationCleanLabel(c);
                        return (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium flex items-center gap-1 border border-white/5">
                            <span>{optLabel}</span>
                            {optPrice > 0 && (
                              <span className="text-[10px] text-amber-400 font-bold">+₹{optPrice}</span>
                            )}
                          </span>
                        );
                      })}
                      {item.specialInstructions && (
                        <span className="italic text-slate-400 block w-full text-[10px]">
                          "{item.specialInstructions}"
                        </span>
                      )}
                    </div>

                    {/* Stepper Controls */}
                    <div className="flex items-center justify-between">
                      {!isArrangeMode ? (
                        <>
                          <div className="flex items-center bg-slate-800 rounded-xl border border-white/10 p-0.5 shadow-inner">
                            <button
                              onClick={() => updateCartQuantity(item.cartItemId, -1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-7 text-center font-black text-xs text-white font-mono">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.cartItemId, 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-white/10">
                          <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-amber-400" />
                            <span>Shift Course</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={index === 0}
                              onClick={() => moveItem(index, 'up')}
                              className="w-7 h-7 rounded-lg bg-slate-700 text-white border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-amber-400 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Move earlier"
                            >
                              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                            </button>
                            <button
                              disabled={index === cart.length - 1}
                              onClick={() => moveItem(index, 'down')}
                              className="w-7 h-7 rounded-lg bg-slate-700 text-white border border-white/10 flex items-center justify-center disabled:opacity-20 hover:bg-amber-400 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Move later"
                            >
                              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DRAWER FOOTER SUMMARY */}
        {cart.length > 0 && (
          <div className="p-5 bg-slate-850/90 border-t border-white/[0.08] space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-slate-200 font-mono">₹{cartSubtotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>{t.taxGst} (5%)</span>
                <span className="font-semibold text-slate-200 font-mono">₹{cartTax}</span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-white pt-2 border-t border-white/10">
                <span>{t.total}</span>
                <span className="text-2xl text-amber-400 font-display">₹{cartGrandTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onClose}
                className="py-3 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-bold text-slate-200 transition-colors cursor-pointer active:scale-95"
              >
                + Add Dishes
              </button>
              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.proceedToCheckout}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawerModal;
