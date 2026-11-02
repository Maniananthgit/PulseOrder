import React, { useState } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { Order } from '../../types';
import { 
  CheckCircle2, 
  Send, 
  X, 
  Clock, 
  Receipt,
  Sparkles,
  ArrowRight,
  Check,
  ShieldCheck,
  UtensilsCrossed
} from 'lucide-react';
import { getAssignedWaiter } from '../../utils/waiterAssignment';

interface DigitalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: () => void;
  onOpenFeedback: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ 
  order, 
  isOpen, 
  onClose, 
  onTrackOrder
}) => {
  const { t } = useKiosk();
  const [recipient, setRecipient] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const waiter = getAssignedWaiter(order.tableNumber);
  const isConfirmed = order.status !== 'NEW';

  const handleSendReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) return;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setRecipient('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-slate-900/95 text-slate-100 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-300 relative backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[2px]" />

        {/* CELEBRATORY SUCCESS HEADER */}
        <div className="bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-900 p-6 text-center relative shrink-0 border-b border-white/[0.08]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5 active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Concentric Pulsing Badge */}
          <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/30 opacity-75" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block mb-1">
            Payment Confirmed
          </span>
          <h3 className="text-2xl font-black font-display tracking-tight text-white mb-1.5">
            {t.paymentSuccessful}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Order routed to Kitchen Display System (KDS). Fresh preparation begins shortly!
          </p>

          <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] text-xs font-bold text-slate-200 border border-white/10">
            <span className="font-mono text-amber-400 font-black">#{order.orderNumber}</span>
            <span className="text-slate-500">•</span>
            <span className="font-black text-white">Table {order.tableNumber}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-mono">₹{order.total} Paid</span>
          </div>
        </div>

        {/* LUXURY PERFORATED DIGITAL RECEIPT VOUCHER */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Ticket Slip Container */}
          <div className="relative bg-slate-850/80 rounded-3xl p-5 border border-white/[0.08] shadow-inner space-y-4">
            
            {/* Restaurant Meta */}
            <div className="text-center pb-3 border-b border-dashed border-white/15">
              <h4 className="font-black text-base text-white font-display tracking-wide">
                Royal Ember Kiosk Bistro
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Table {order.tableNumber} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mode: {order.paymentMethod}
              </p>
              <span className="text-[10px] text-amber-400/80 font-mono block mt-1">
                Ref ID: {order.id.slice(0, 16).toUpperCase()}
              </span>
            </div>

            {/* Itemized Culinary Dishes */}
            <div className="space-y-2.5 text-xs">
              {order.items.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-slate-200">
                      {item.quantity}× {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Spice: {item.spiceLevel} {item.customizations.length > 0 && `• ${item.customizations.join(', ')}`}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Perforation Line */}
            <div className="relative my-4">
              <div className="border-t border-dashed border-white/20" />
            </div>

            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="text-slate-200 font-mono">₹{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.taxGst} (5%)</span>
                <span className="text-slate-200 font-mono">₹{order.tax}</span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between">
                  <span>Staff Gratuity / Tip</span>
                  <span className="text-slate-200 font-mono">₹{order.tip}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10 text-sm font-black text-white">
                <span>Total Settled</span>
                <span className="text-xl text-amber-400 font-display">
                  ₹{order.total}
                </span>
              </div>
            </div>

          </div>

          {/* SEND RECEIPT TO PHONE / EMAIL */}
          <div className="p-4 rounded-2xl bg-slate-850/50 border border-white/[0.08] space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
              Receive Digital Copy (SMS / WhatsApp / Email)
            </label>
            
            {sentSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-black text-center border border-emerald-500/30 animate-in fade-in">
                ✓ Receipt dispatched successfully to {recipient}!
              </div>
            ) : (
              <form onSubmit={handleSendReceipt} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter mobile number or email..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            )}
          </div>

          {/* ASSIGNED WAITER CONCIERGE CHIP */}
          <div className="p-3.5 rounded-2xl bg-slate-850/50 border border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md ${waiter.avatarBg} text-white border border-white/20`}>
                {waiter.initial}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Floor Concierge:
                  </span>
                  <span className="text-xs font-black text-white">
                    {waiter.fullName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {waiter.zone} • Table {order.tableNumber} Attendant
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              On Floor
            </span>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-white/[0.08] flex flex-col gap-2.5 shrink-0">
          
          {/* Status banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>
              {isConfirmed ? (
                <>Order confirmed in Kitchen! Moving to Preparing — <strong>Live Kitchen Progress</strong> is active.</>
              ) : (
                <>Ticket dispatched to Kitchen! Attendant: <strong>Waiter {waiter.name}</strong> • Live Kitchen Tracker is active.</>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-white/10 active:scale-95"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onTrackOrder();
              }}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-emerald-500/40"
            >
              <Clock className="w-4 h-4 text-slate-950" />
              <span>Live Kitchen Progress →</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DigitalReceiptModal;

