import React, { useState, useRef, useEffect } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { MenuItem, Order } from '../../types';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Clock, 
  Crown, 
  Star, 
  Bell, 
  ShoppingBag, 
  ChefHat, 
  Plus, 
  Check, 
  Bot, 
  ArrowRight,
  HelpCircle,
  Flame,
  Volume2
} from 'lucide-react';
import { 
  processCustomerQuery, 
  AIResponse, 
  AVAILABLE_QUESTION_PROMPTS 
} from '../../services/aiConciergeService';
import { getAssignedWaiter } from '../../utils/waiterAssignment';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenItemDetail?: (item: MenuItem) => void;
  onOpenOrderTracker?: () => void;
  onCallWaiterModal?: () => void;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  onOpenItemDetail,
  onOpenOrderTracker,
  onCallWaiterModal
}) => {
  const { 
    menuItems, 
    tableNumber, 
    addToCart, 
    showToast, 
    activeOrders, 
    currentTrackedOrder,
    callWaiter
  } = useKiosk();

  const assignedWaiter = getAssignedWaiter(tableNumber);
  const activeOrder: Order | null = currentTrackedOrder || activeOrders.find(o => o.tableNumber === tableNumber && o.status !== 'COMPLETED') || null;

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Initial welcome message
  const initialMessages: AIResponse[] = [
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `👑 **Namaste & Welcome to Table ${tableNumber}!**\n\nI am **Kio**, your dedicated AI dining assistant at Royal Ember.\n\nYou can ask me about our **Signature creations**, **Top-rated dishes (4.8★+)**, **Shop opening & closing hours**, dietary customizations, or table assistance. How may I assist you today?`,
      suggestedQuestions: [
        '👑 Which foods are your Signatures?',
        '⭐ Which foods have excellent rating?',
        '🕒 What is the shop opening and closing time?',
        '🌿 Show Pure Vegetarian specialties',
        '🔔 Call my assigned waiter'
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  const [messages, setMessages] = useState<AIResponse[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  if (!isOpen) return null;

  // Handle sending a message
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMessage: AIResponse = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Natural assistant thinking delay (350ms - 550ms)
    setTimeout(() => {
      const response = processCustomerQuery(
        query,
        menuItems,
        tableNumber,
        assignedWaiter.fullName,
        activeOrder
      );
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 450);
  };

  // Quick add item to cart from AI recommendation
  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item, 'Mild', [], 'Ordered via Kio AI', 1);
    setAddedItemIds(prev => ({ ...prev, [item.id]: true }));
    showToast(`✨ Added 1× ${item.name} (₹${item.price}) to cart!`);

    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [item.id]: false }));
    }, 2500);
  };

  // Execute AI action button
  const handleActionClick = (action: NonNullable<AIResponse['action']>) => {
    if (action.type === 'call_waiter') {
      callWaiter('Need Assistance');
      if (onCallWaiterModal) {
        onCallWaiterModal();
      } else {
        showToast(`🔔 Waiter ${assignedWaiter.fullName} alerted for Table ${tableNumber}!`);
      }
    } else if (action.type === 'track_order') {
      if (onOpenOrderTracker) {
        onClose();
        onOpenOrderTracker();
      }
    } else if (action.type === 'open_cart') {
      onClose();
    }
  };

  // Reset conversation to fresh start
  const handleResetChat = () => {
    setMessages(initialMessages);
    showToast('🔄 Kio conversation cleared.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl h-[88vh] max-h-[800px] bg-slate-900/95 text-slate-100 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] border border-amber-500/30 overflow-hidden flex flex-col relative backdrop-blur-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent blur-[2px]" />

        {/* 1. CHATBOX HEADER: Branded Name & Status */}
        <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* High-Tech AI Bot Avatar Badge */}
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 border border-violet-400/40">
                <Bot className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                {/* Official Chatbox Name */}
                <h3 className="font-display font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                  <span>Kio</span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 to-amber-500/20 text-amber-300 border border-amber-400/40">
                    AI Chatbox
                  </span>
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Table Assistant
                </span>
                <span>•</span>
                <span className="text-amber-300/90 font-medium text-[11px]">Table {tableNumber}</span>
                <span>•</span>
                <span className="text-slate-400 text-[11px]">Server: {assignedWaiter.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetChat}
              className="w-9 h-9 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5 active:scale-95"
              title="Clear & Restart Chat"
              aria-label="Clear Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer border border-white/5 active:scale-95"
              aria-label="Close Chatbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. PERSISTENT QUICK SHORTCUT CHIPS */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-white/[0.06] overflow-x-auto custom-scrollbar flex items-center gap-2 shrink-0 select-none">
          <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Quick:
          </span>
          <button
            type="button"
            onClick={() => handleSendMessage('Which foods are signature?')}
            className="px-2.5 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Crown className="w-3 h-3" /> Signature Foods
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Which foods have excellent rating?')}
            className="px-2.5 py-1 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Star className="w-3 h-3" /> Top Rated (4.8★+)
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('What is the shop opening and closing time?')}
            className="px-2.5 py-1 rounded-full bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Clock className="w-3 h-3" /> Shop Timings
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Show Pure Vegetarian specialties')}
            className="px-2.5 py-1 rounded-full bg-teal-400/10 hover:bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            🌿 Pure Veg
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('Recommend mild / non-spicy dishes for kids')}
            className="px-2.5 py-1 rounded-full bg-sky-400/10 hover:bg-sky-400/20 text-sky-300 border border-sky-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            🌶️ Mild for Kids
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage('How do I call my waiter?')}
            className="px-2.5 py-1 rounded-full bg-rose-400/10 hover:bg-rose-400/20 text-rose-300 border border-rose-400/30 text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
          >
            <Bell className="w-3 h-3" /> Call Waiter
          </button>
        </div>

        {/* 3. CHAT MESSAGES SCROLL AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20 border border-amber-300/40">
                    <Bot className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div 
                    className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-tr-xs shadow-md shadow-amber-500/20' 
                        : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-tl-xs shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-invert prose-xs max-w-none">
                      {msg.text.split('\n').map((line, idx) => {
                        // Custom minimal markdown parser for bold, lists, and emojis
                        if (line.startsWith('👑 ') || line.startsWith('⭐ ') || line.startsWith('🕒 ') || line.startsWith('🌿 ') || line.startsWith('🌶️ ') || line.startsWith('🔔 ') || line.startsWith('💳 ') || line.startsWith('🍳 ') || line.startsWith('📋 ') || line.startsWith('🌧️ ') || line.startsWith('🎉 ') || line.startsWith('💪 ') || line.startsWith('📶 ') || line.startsWith('📍 ')) {
                          return (
                            <h4 key={idx} className="font-display font-black text-amber-300 text-sm mb-1 mt-0.5">
                              {line.replace(/\*\*/g, '')}
                            </h4>
                          );
                        }
                        if (line.startsWith('• ')) {
                          return (
                            <div key={idx} className="flex items-start gap-1.5 my-0.5 text-xs">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{line.substring(2).replace(/\*\*(.*?)\*\*/g, '$1')}</span>
                            </div>
                          );
                        }
                        return (
                          <p key={idx} className="my-1">
                            {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                          </p>
                        );
                      })}
                    </div>

                    <div className={`text-[10px] mt-1.5 flex items-center justify-end ${isUser ? 'text-slate-900/70 font-bold' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* INTERACTIVE MENU ITEM CARDS (If response has dish recommendations) */}
                  {msg.highlightItems && msg.highlightItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 w-full">
                      {msg.highlightItems.map((item) => {
                        const isAdded = addedItemIds[item.id];
                        return (
                          <div 
                            key={item.id}
                            onClick={() => onOpenItemDetail && onOpenItemDetail(item)}
                            className="p-2.5 rounded-2xl bg-slate-850/80 hover:bg-slate-800 border border-white/[0.08] hover:border-amber-500/40 transition-all flex gap-3 group cursor-pointer shadow-sm relative overflow-hidden"
                          >
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 group-hover:scale-105 transition-transform" 
                            />
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <h5 className="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">
                                    {item.name}
                                  </h5>
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 text-[10px] font-black shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    <span>{item.rating}</span>
                                  </div>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-1.5">
                                <span className="font-mono font-bold text-xs text-amber-400">
                                  ₹{item.price}
                                </span>

                                <button
                                  type="button"
                                  onClick={(e) => handleQuickAdd(item, e)}
                                  className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                                    isAdded 
                                      ? 'bg-emerald-500 text-slate-950 font-black' 
                                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs'
                                  }`}
                                  title="Add to order"
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3 h-3 stroke-[3]" />
                                      <span>Add ₹{item.price}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ACTION TRIGGER BUTTON */}
                  {msg.action && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(msg.action!)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{msg.action.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  )}

                  {/* SUGGESTED FOLLOW-UP CHIPS */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="space-y-1.5 pt-1 w-full">
                      {msg.isFallback && (
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 block">
                          Suggested Available Questions:
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => handleSendMessage(q)}
                            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-400/30 text-[11px] font-medium transition-all cursor-pointer text-left active:scale-95 shadow-xs"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 items-center animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-800/90 border border-white/10 text-xs text-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] text-slate-400 ml-1 font-medium">Kio is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 4. CHAT INPUT BAR */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-950/90 border-t border-white/[0.08] flex items-center gap-2.5 shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Kio (e.g. Signature foods, top ratings, opening hours)..."
            className="flex-1 bg-slate-900 border border-white/10 focus:border-amber-400/60 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-400/40 transition-all"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 ${
              inputMessage.trim() 
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
            aria-label="Send message"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default AIChatModal;
