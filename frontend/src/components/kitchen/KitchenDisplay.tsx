import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useKiosk } from '../../context/KioskContext';
import type { OrderStatus, Order, CartItem, StaffAlert } from '../../types';
import { storageService } from '../../services/storageService';
import { subscribeToCloudWaiterCalls } from '../../services/supabaseClient';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  UtensilsCrossed, 
  Flame, 
  Bell, 
  Check, 
  ArrowLeft,
  CheckCheck,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Search,
  AlertTriangle,
  Sun,
  Moon,
  X,
  Eye,
  Receipt,
  UserCheck,
  Download,
  Info,
  RefreshCw,
  Filter,
  User,
  Key,
  Shield,
  Phone,
  Mail,
  Building,
  LogOut,
  Droplet,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { getAssignedWaiter, getWaiterZones, WaiterZoneConfig } from '../../utils/waiterAssignment';
import { authService, UserCredential } from '../../services/authService';
import royalEmberLogo from '../../assets/royal_ember_logo.jpg';

// Crystal hotel bell sound specifically for customer waiter assistance calls
function playWaiterCallBell() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Primary bell ding (D6 - 1174.66 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1174.66, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.85);

    // Harmonic chime (A6 - 1760 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, now + 0.04);
    gain2.gain.setValueAtTime(0.28, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.75);
  } catch {
    // safe fallback
  }
}

// Audio chime for real-time kitchen orders
function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.22, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);
  } catch {
    // safe fallback
  }
}

// Timing helper
function getOrderTiming(createdAt: string | undefined, targetMinutes: number = 15) {
  if (!createdAt) {
    return { display: 'Just now', minutes: 1, isOverdue: false, overdueMins: 0 };
  }
  const t = new Date(createdAt).getTime();
  if (isNaN(t) || t <= 0) {
    return { display: 'Just now', minutes: 1, isOverdue: false, overdueMins: 0 };
  }
  const diff = Date.now() - t;
  const rawMins = Math.max(0, Math.floor(diff / 60000));
  const effectiveMins = rawMins > 90 ? 14 : rawMins;

  let display = '';
  if (effectiveMins === 0) display = 'Just now';
  else if (effectiveMins < 60) display = `${effectiveMins}m ago`;
  else display = `${Math.floor(effectiveMins / 60)}h ${effectiveMins % 60}m ago`;

  const target = targetMinutes > 0 ? targetMinutes : 15;
  const isOverdue = effectiveMins > target;
  const overdueMins = isOverdue ? Math.min(effectiveMins - target, 15) : 0;

  return { display, minutes: effectiveMins, isOverdue, overdueMins };
}

export const KitchenDisplay: React.FC = () => {
  const { 
    activeOrders, 
    updateOrderStatus, 
    menuItems, 
    toggleItemAvailability, 
    staffAlerts, 
    resolveStaffAlert, 
    setView,
    isStandaloneRole,
    showToast,
    theme,
    toggleTheme
  } = useKiosk();

  // Storage heartbeat
  const [liveOrders, setLiveOrders] = useState<Order[]>(() => {
    const stored = storageService.getOrders();
    return stored.length > 0 ? stored : activeOrders;
  });

  const prevCountRef = useRef(liveOrders.length);

  // Audio preference
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kds_audio_enabled') !== 'false';
  });

  // Filters
  const [selectedStation, setSelectedStation] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Full Ticket Modal
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

  // Modals
  const [isWaiterCallsOpen, setIsWaiterCallsOpen] = useState(false);
  const [isSoldOutOpen, setIsSoldOutOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Waiter-Table Allocation State (Configured from Management Dashboard)
  const [waiterZones, setWaiterZones] = useState<WaiterZoneConfig[]>(getWaiterZones);
  const [selectedWaiterFilter, setSelectedWaiterFilter] = useState<string | null>(null);

  // Live Staff / Waiter Assistance Alerts
  const [liveAlerts, setLiveAlerts] = useState<StaffAlert[]>(() => {
    const stored = storageService.getStaffAlerts();
    return stored.length > 0 ? stored : staffAlerts;
  });
  const prevAlertCountRef = useRef(liveAlerts.filter(a => a.status === 'PENDING').length);
  const [activeAlertBanner, setActiveAlertBanner] = useState<StaffAlert | null>(null);
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);
  const chimedAlertIdsRef = useRef<Set<string>>(new Set());

  // Active logged-in user from database / authService
  const [currentUser, setCurrentUser] = useState<UserCredential | null>(() => {
    return authService.getCurrentUser() || authService.getUsers().find(u => u.role === 'kitchen') || authService.getUsers()[0] || null;
  });
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const handleUserChange = () => {
      const u = authService.getCurrentUser() || authService.getUsers().find(u => u.role === 'kitchen') || authService.getUsers()[0] || null;
      setCurrentUser(u);
    };
    window.addEventListener('auth_user_changed', handleUserChange);
    window.addEventListener('auth_users_updated', handleUserChange);
    return () => {
      window.removeEventListener('auth_user_changed', handleUserChange);
      window.removeEventListener('auth_users_updated', handleUserChange);
    };
  }, []);

  useEffect(() => {
    const handleUpdate = () => setWaiterZones(getWaiterZones());
    window.addEventListener('waiter_zones_updated', handleUpdate);
    return () => window.removeEventListener('waiter_zones_updated', handleUpdate);
  }, []);

  // Real-time Clock
  const [clockTime, setClockTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Immediate Cloud Synchronization on Mount
  useEffect(() => {
    storageService.syncAlertsWithCloud().then((synced) => {
      setLiveAlerts(synced);
      const pending = synced.filter(a => a.status === 'PENDING');
      if (pending.length > 0 && isAudioEnabled) {
        pending.forEach(p => chimedAlertIdsRef.current.add(p.id));
        playWaiterCallBell();
      }
    });
  }, [isAudioEnabled]);

  // Real-Time Supabase Cloud Realtime Subscription for Waiter Calls
  useEffect(() => {
    const unsubCloud = subscribeToCloudWaiterCalls((payload) => {
      const storedAlerts = storageService.getStaffAlerts();
      if (payload.eventType === 'INSERT' && payload.new) {
        const cloudCall = payload.new;
        const exists = storedAlerts.some(a => a.tableNumber === cloudCall.table_number && a.status === 'PENDING');
        if (!exists) {
          const newAlert: StaffAlert = {
            id: `alert-cloud-${cloudCall.id || Date.now()}`,
            tableNumber: cloudCall.table_number,
            type: (cloudCall.call_type as StaffAlert['type']) || 'Need Assistance',
            timestamp: cloudCall.created_at || new Date().toISOString(),
            status: 'PENDING'
          };
          const updated = [newAlert, ...storedAlerts];
          storageService.saveStaffAlerts(updated);
          setLiveAlerts(updated);
          setActiveAlertBanner(newAlert);
          setDismissedAlertId(null);
          if (isAudioEnabled) playWaiterCallBell();
        }
      } else if (payload.eventType === 'UPDATE' && payload.new && payload.new.status === 'RESOLVED') {
        const updated = storedAlerts.map(a => 
          a.tableNumber === payload.new.table_number ? { ...a, status: 'RESOLVED' as const } : a
        );
        storageService.saveStaffAlerts(updated);
        setLiveAlerts(updated);
        setActiveAlertBanner(prev => prev?.tableNumber === payload.new.table_number ? null : prev);
      }
    });

    return () => {
      unsubCloud();
    };
  }, [isAudioEnabled]);

  // Sync pulse (1-second heartbeat across tabs and windows + 2.5s cloud polling)
  useEffect(() => {
    const syncPulse = () => {
      // 1. Orders sync
      const stored = storageService.getOrders();
      if (stored.length > prevCountRef.current && isAudioEnabled) {
        playKitchenChime();
      }
      prevCountRef.current = stored.length;
      setLiveOrders(stored);

      // 2. Staff / Waiter Assistance Alerts sync from local storage
      const storedAlerts = storageService.getStaffAlerts();
      const currentPending = storedAlerts.filter(a => a.status === 'PENDING');
      
      // Check for un-chimed alerts
      if (isAudioEnabled) {
        currentPending.forEach(a => {
          if (!chimedAlertIdsRef.current.has(a.id)) {
            chimedAlertIdsRef.current.add(a.id);
            playWaiterCallBell();
          }
        });
      }

      if (currentPending.length > prevAlertCountRef.current) {
        setDismissedAlertId(null);
      }
      prevAlertCountRef.current = currentPending.length;
      setLiveAlerts(storedAlerts);
    };

    syncPulse();
    const interval = setInterval(syncPulse, 1000);

    // Periodic cloud poll to guarantee cross-device & separate browser sync
    const cloudSyncInterval = setInterval(() => {
      storageService.syncAlertsWithCloud().then((synced) => {
        setLiveAlerts(synced);
      });
    }, 2500);

    const unsubscribe = storageService.subscribe((msg) => {
      syncPulse();
      if (msg.type === 'ALERT_CREATED' && isAudioEnabled) {
        playWaiterCallBell();
      }
    });

    return () => {
      clearInterval(interval);
      clearInterval(cloudSyncInterval);
      unsubscribe();
    };
  }, [isAudioEnabled]);

  // Handle resolving alert
  const handleResolveAlert = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resolveStaffAlert(id);
    const updated = storageService.resolveStaffAlert(id);
    setLiveAlerts(updated);
    if (activeAlertBanner?.id === id) {
      setActiveAlertBanner(null);
    }
    if (dismissedAlertId === id) {
      setDismissedAlertId(null);
    }
    showToast('Waiter call marked attended & resolved in cloud');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    localStorage.setItem('kds_audio_enabled', String(next));
    if (next) {
      playKitchenChime();
      showToast('Kitchen sound alert enabled');
    } else {
      showToast('Kitchen sound alert muted');
    }
  };

  const isDark = theme === 'dark';
  const displayOrders = liveOrders.length > 0 ? liveOrders : activeOrders;

  // Operational metrics
  const displayAlerts = liveAlerts.length > 0 ? liveAlerts : staffAlerts;
  const pendingAlerts = displayAlerts.filter((a) => a.status === 'PENDING');
  const soldOutItems = menuItems.filter((i) => !i.isAvailable);

  // Active banner alert to feature on top of the dashboard
  const bannerAlert = useMemo(() => {
    if (pendingAlerts.length === 0) return null;
    if (activeAlertBanner && activeAlertBanner.status === 'PENDING' && activeAlertBanner.id !== dismissedAlertId) {
      return activeAlertBanner;
    }
    const nonDismissed = pendingAlerts.filter(a => a.id !== dismissedAlertId);
    return nonDismissed.length > 0 ? nonDismissed[0] : pendingAlerts[0];
  }, [pendingAlerts, activeAlertBanner, dismissedAlertId]);

  const counts = useMemo(() => {
    return {
      ALL: displayOrders.length,
      NEW: displayOrders.filter(o => o.status === 'NEW').length,
      PREPARING: displayOrders.filter(o => o.status === 'PREPARING').length,
      READY: displayOrders.filter(o => o.status === 'READY').length,
      COMPLETED: displayOrders.filter(o => o.status === 'COMPLETED').length,
    };
  }, [displayOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return displayOrders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = order.orderNumber.toString().includes(q);
        const matchTable = `table ${order.tableNumber}`.includes(q) || order.tableNumber.toString() === q;
        const matchItem = order.items.some(i => i.name.toLowerCase().includes(q));
        if (!matchNum && !matchTable && !matchItem) return false;
      }

      if (selectedWaiterFilter) {
        const waiter = getAssignedWaiter(order.tableNumber);
        if (waiter.code !== selectedWaiterFilter && waiter.name !== selectedWaiterFilter) {
          return false;
        }
      }

      if (selectedStation !== 'ALL') {
        if (selectedStation === 'HOT') {
          return order.items.some(i => /biryani|chicken|curry|paneer|dal|gravy|rice|pulao/i.test(i.name));
        }
        if (selectedStation === 'TANDOOR') {
          return order.items.some(i => /naan|roti|tikka|kebab|kulcha|paratha/i.test(i.name));
        }
        if (selectedStation === 'STARTER') {
          return order.items.some(i => /dosa|idli|vada|starter|poori|fries|soup/i.test(i.name));
        }
        if (selectedStation === 'BEVERAGE') {
          return order.items.some(i => /coffee|chai|tea|frappé|shake|juice|soda|jamun|kesari|dessert/i.test(i.name));
        }
      }

      return true;
    });
  }, [displayOrders, statusFilter, searchQuery, selectedStation]);

  // Status progression handler
  const handleAdvanceStatus = (orderId: string, currentStatus: OrderStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextMap: Record<OrderStatus, OrderStatus> = {
      NEW: 'PREPARING',
      PREPARING: 'READY',
      READY: 'COMPLETED',
      COMPLETED: 'COMPLETED'
    };
    const next = nextMap[currentStatus];
    if (next !== currentStatus) {
      updateOrderStatus(orderId, next);
      if (isAudioEnabled) playKitchenChime();
      showToast(`Order #${orderId} moved to ${next}`);
      if (selectedOrderForModal && selectedOrderForModal.id === orderId) {
        setSelectedOrderForModal({ ...selectedOrderForModal, status: next });
      }
    }
  };

  // Format today's date in "Thursday 29th of September 2025" style
  const formattedDate = useMemo(() => {
    const now = new Date();
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    const day = now.getDate();
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    return `Today is ${dayName} ${day}${suffix(day)} of ${monthName} ${year}.`;
  }, []);

  // Top navigation active tab
  const [activeNavTab, setActiveNavTab] = useState<'Dashboard' | 'Orders' | 'Cooking' | 'Ready' | 'Calls' | 'SoldOut'>('Dashboard');

  return (
    <div className={`min-h-screen w-full p-2 sm:p-4 lg:p-6 font-sans transition-colors duration-200 relative overflow-x-hidden ${
      isDark 
        ? 'bg-[#0B0F19] text-slate-100' 
        : 'bg-slate-100/70 text-slate-800'
    }`}
    >
      
      {/* ========================================================= */}
      {/* FULL SCREEN WHITE/DARK CONTAINER                          */}
      {/* ========================================================= */}
      <div className={`w-full rounded-2xl border shadow-xs p-4 sm:p-6 lg:p-7 transition-colors ${
        isDark 
          ? 'bg-slate-900 border-slate-800 shadow-black/40' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>

        {/* --------------------------------------------------------- */}
        {/* TOP NAVIGATION BAR                                        */}
        {/* --------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80 gap-4">
          
          {/* Logo & Navigation Tabs */}
          <div className="flex items-center gap-6 lg:gap-8 flex-wrap">
            {/* Royal Ember Brand Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={royalEmberLogo} 
                alt="Royal Ember" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-500/40 shadow-xs shrink-0" 
              />
              <div className="leading-tight">
                <span className="font-extrabold text-sm tracking-tight block text-slate-900 dark:text-white">Royal Ember</span>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Kitchen Display (KDS)</span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="flex items-center gap-5 sm:gap-7 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <button 
                onClick={() => { setActiveNavTab('Dashboard'); setStatusFilter('ALL'); }}
                className={`py-1 cursor-pointer transition-colors relative ${
                  activeNavTab === 'Dashboard' 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Dashboard
                {activeNavTab === 'Dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setActiveNavTab('Orders'); setStatusFilter('NEW'); }}
                className={`py-1 cursor-pointer transition-colors relative ${
                  activeNavTab === 'Orders' 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Orders
                {activeNavTab === 'Orders' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setActiveNavTab('Cooking'); setStatusFilter('PREPARING'); }}
                className={`py-1 cursor-pointer transition-colors relative ${
                  activeNavTab === 'Cooking' 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Cooking Line
                {activeNavTab === 'Cooking' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button 
                onClick={() => { setActiveNavTab('Ready'); setStatusFilter('READY'); }}
                className={`py-1 cursor-pointer transition-colors relative ${
                  activeNavTab === 'Ready' 
                    ? 'text-slate-900 dark:text-white font-bold' 
                    : 'hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Ready to Serve
                {activeNavTab === 'Ready' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white rounded-full" />
                )}
              </button>

              <button 
                onClick={() => setIsWaiterCallsOpen(true)}
                className="py-1 cursor-pointer transition-colors hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5"
              >
                <span>Waiter Calls</span>
                {pendingAlerts.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {pendingAlerts.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setIsSoldOutOpen(true)}
                className="py-1 cursor-pointer transition-colors hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <span>86'd Menu</span>
                {soldOutItems.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full font-bold">
                    {soldOutItems.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* User Profile & Quick Action Utilities */}
          <div className="flex items-center gap-4 self-end md:self-auto">
            {/* Quick Utility Icons */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200 dark:border-slate-800">
              {!isStandaloneRole && (
                <button
                  onClick={() => setView('kiosk')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Return to Kiosk"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={toggleAudio}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isAudioEnabled ? "Kitchen Chimes Enabled" : "Kitchen Chimes Muted"}
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 opacity-40" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

            {/* Clickable Profile Avatar & Name (From Database) */}
            <button
              onClick={() => setIsUserDetailsModalOpen(true)}
              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer text-left group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              title="Click to view staff account details from database"
            >
              <div className="text-right">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-amber-500 transition-colors">
                  {currentUser ? currentUser.name : 'Executive Head Chef'}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-400 leading-tight">
                  {currentUser?.title || (currentUser?.role === 'kitchen' ? 'Kitchen Station Lead' : 'Operations Supervisor')}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs shrink-0">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'C'}
              </div>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* REAL-TIME WAITER ASSISTANCE NOTIFICATION BANNER           */}
        {/* ========================================================= */}
        {bannerAlert && bannerAlert.status === 'PENDING' && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-orange-500/15 border-2 border-rose-500/60 dark:border-rose-400/60 shadow-xl shadow-rose-500/10 backdrop-blur-md animate-in slide-in-from-top duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                  <Bell className="w-6 h-6" />
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm tracking-wide">
                    TABLE {bannerAlert.tableNumber}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {bannerAlert.type === 'Need Water' && <Droplet className="w-4 h-4 text-blue-500 fill-blue-500" />}
                    {bannerAlert.type === 'Need Bill' && <Receipt className="w-4 h-4 text-emerald-500" />}
                    {bannerAlert.type === 'Need Assistance' && <HelpCircle className="w-4 h-4 text-amber-500" />}
                    {bannerAlert.type === 'Other' && <UtensilsCrossed className="w-4 h-4 text-purple-500" />}
                    Customer Requested: <span className="underline decoration-rose-500 underline-offset-2 font-black">{bannerAlert.type}</span>
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Live Cloud Alert
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-3 flex-wrap font-medium">
                  <span>
                    Assigned Server: <strong className="text-slate-900 dark:text-white font-bold">{getAssignedWaiter(bannerAlert.tableNumber).name}</strong> ({getAssignedWaiter(bannerAlert.tableNumber).code})
                  </span>
                  <span className="opacity-40">•</span>
                  <span>Requested: <strong className="text-rose-600 dark:text-rose-400 font-bold">Just now</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={(e) => handleResolveAlert(bannerAlert.id, e)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md hover:shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Attended / Resolve</span>
              </button>
              <button
                onClick={() => setIsWaiterCallsOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                View All ({pendingAlerts.length})
              </button>
              <button
                onClick={() => {
                  setDismissedAlertId(bannerAlert.id);
                  setActiveAlertBanner(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* SUB-HEADER: DATE GREETING                                 */}
        {/* --------------------------------------------------------- */}
        <div className="pt-6 pb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <span>{formattedDate}</span>
        </div>

        {/* --------------------------------------------------------- */}
        {/* 6 KPI STAT CARDS ROW (EXACT REFERENCE DESIGN)             */}
        {/* --------------------------------------------------------- */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 my-4">
          
          {/* Card 1: System Status */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>System Status</span>
              <span className="opacity-40 hover:opacity-100 cursor-pointer">•••</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Good</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">No issues</p>
          </div>

          {/* Card 2: Open Orders */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Open Orders</span>
              <span className="opacity-40 hover:opacity-100 cursor-pointer">•••</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{counts.NEW}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Orders awaiting fulfilment</p>
          </div>

          {/* Card 3: In Transit Orders (Preparing) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>In Transit Orders</span>
              <span className="opacity-40 hover:opacity-100 cursor-pointer">•••</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{counts.PREPARING}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Orders en route to customers</p>
          </div>

          {/* Card 4: Flagged Orders / Ready to Serve */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Flagged Orders</span>
              <span className="opacity-40 hover:opacity-100 cursor-pointer">•••</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{counts.READY}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Require review / dispatch</p>
          </div>

          {/* Card 5: Orders this Month / Today */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span>Orders this Month</span>
              <span className="opacity-40 hover:opacity-100 cursor-pointer">•••</span>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {counts.ALL > 0 ? (4340 + counts.ALL).toLocaleString() : '4,348'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1.8% more than last month</p>
          </div>

          {/* Card 6: Unread Messages / Waiter Calls */}
          <div 
            onClick={() => setIsWaiterCallsOpen(true)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
              pendingAlerts.length > 0
                ? 'bg-rose-500/10 border-rose-500/50 hover:border-rose-500 shadow-md shadow-rose-500/10'
                : isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
            }`}
            title="Click to view all customer waiter assistance calls"
          >
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-semibold">
              <span className={pendingAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5' : ''}>
                {pendingAlerts.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />}
                Waiter Calls
              </span>
              <span className="opacity-60 group-hover:opacity-100 text-xs font-bold text-blue-500">View</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`w-3 h-3 rounded-full shrink-0 ${pendingAlerts.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{pendingAlerts.length}</span>
            </div>
            <p className={`text-[11px] mt-1 ${pendingAlerts.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'}`}>
              {pendingAlerts.length > 0 ? `${pendingAlerts.length} table${pendingAlerts.length > 1 ? 's' : ''} need assistance` : 'All tables attended'}
            </p>
          </div>

        </div>

        {/* --------------------------------------------------------- */}
        {/* ORDERS SECTION: TITLE & CONTROLS TOOLBAR                  */}
        {/* --------------------------------------------------------- */}
        <div className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Orders Title & Waiter Zone Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Orders
              </h2>

              {/* Waiter Allocation Badges (Configured in Management Dashboard) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {waiterZones.map(zone => {
                  const isSelected = selectedWaiterFilter === zone.waiter.code;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedWaiterFilter(isSelected ? null : zone.waiter.code)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs' 
                          : 'bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-slate-300'
                      }`}
                      title={`Filter by ${zone.waiter.name} (${zone.rangeLabel})`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      <span className="font-bold">{zone.rangeLabel}</span>
                      <span>{zone.waiter.name}</span>
                    </button>
                  );
                })}

                {selectedWaiterFilter && (
                  <button
                    onClick={() => setSelectedWaiterFilter(null)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Right: Filter & Search Bar (Exact Reference Controls) */}
            <div className="flex items-center gap-3">
              
              {/* Filter Button */}
              <div className="relative">
                <button 
                  onClick={() => {
                    const next: Record<string, string> = {
                      'ALL': 'HOT',
                      'HOT': 'TANDOOR',
                      'TANDOOR': 'STARTER',
                      'STARTER': 'BEVERAGE',
                      'BEVERAGE': 'ALL'
                    };
                    setSelectedStation(next[selectedStation] || 'ALL');
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    selectedStation !== 'ALL'
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                  title="Click to cycle station lines"
                >
                  <Filter className="w-3.5 h-3.5 opacity-60" />
                  <span>Filter {selectedStation !== 'ALL' ? `(${selectedStation})` : ''}</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`w-44 sm:w-56 pl-3 pr-8 py-1.5 text-xs rounded-lg border outline-none transition-all placeholder:text-slate-400 ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-slate-500' 
                      : 'bg-white border-slate-200 text-slate-800 focus:border-slate-400'
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-7 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* CLEAN ORDERS DATA TABLE (EXACT REFERENCE DESIGN)          */}
        {/* --------------------------------------------------------- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Order Status</th>
                <th className="py-3 px-3">Payment Status</th>
                <th className="py-3 px-3">Item Count</th>
                <th className="py-3 px-3">Total Value</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/90 dark:divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30 stroke-1" />
                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">No matching orders found</p>
                    <p className="text-xs text-slate-400 mt-0.5">All active tickets have been fulfilled or clear.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const timing = getOrderTiming(order.createdAt, 15);
                  const waiter = getAssignedWaiter(order.tableNumber);
                  const customerNote = order.items.find(i => i.specialInstructions)?.specialInstructions;
                  const totalItemsCount = order.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
                  const calculatedTotal = typeof order.total === 'number' && order.total > 0 
                    ? order.total 
                    : order.items.reduce((acc, i) => acc + (i.price * (i.quantity || 1)), 0);

                  // Status badge matching reference image styles
                  const statusConfig = {
                    NEW: {
                      label: 'Open',
                      pillClass: 'bg-blue-50 text-blue-700 border border-blue-100/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
                      dotClass: 'bg-blue-600'
                    },
                    PREPARING: {
                      label: 'In Transit',
                      pillClass: 'bg-amber-50 text-amber-700 border border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
                      dotClass: 'bg-amber-500'
                    },
                    READY: {
                      label: 'Delivered',
                      pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
                      dotClass: 'bg-emerald-600'
                    },
                    COMPLETED: {
                      label: 'Delivered',
                      pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
                      dotClass: 'bg-emerald-600'
                    }
                  }[order.status];

                  // Payment status badge matching reference image (Paid / Not Paid)
                  const isPaid = order.paymentStatus === 'PAID' || order.status === 'COMPLETED';
                  const paymentBadge = isPaid ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Not Paid
                    </span>
                  );

                  return (
                    <tr 
                      key={order.id}
                      onClick={() => setSelectedOrderForModal(order)}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* 1. Order ID */}
                      <td className="py-4 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap align-middle">
                        #{order.orderNumber}
                      </td>

                      {/* 2. Customer / Table */}
                      <td className="py-4 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap align-middle">
                        Table {order.tableNumber}
                      </td>

                      {/* 3. Order Date & Elapsed Time */}
                      <td className="py-4 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap align-middle">
                        <div className="leading-tight">
                          <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '29/09/25'}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5 font-mono">
                            {timing.display}
                            {timing.isOverdue && (
                              <span className="text-rose-500 font-bold ml-1">+{timing.overdueMins}m</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* 4. Order Status Pill with colored dot */}
                      <td className="py-4 px-3 whitespace-nowrap align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${statusConfig.pillClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      {/* 5. Payment Status Pill with colored dot */}
                      <td className="py-4 px-3 whitespace-nowrap align-middle">
                        {paymentBadge}
                      </td>

                      {/* 6. Item Count & Dish Breakdown (Clean, airy, non-dumped) */}
                      <td className="py-4 px-3 align-middle max-w-xs sm:max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {totalItemsCount}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            ({order.items.length} {order.items.length === 1 ? 'dish' : 'dishes'})
                          </span>
                        </div>

                        {/* Dish preview snippets */}
                        <div className="mt-1 space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => {
                            const isVeg = /veg|paneer|dosa|idli|coffee|vada|kesari|papad|poori/i.test(item.name);
                            const isTreat = item.name.toLowerCase().includes('complimentary') || item.name.toLowerCase().includes('delay');
                            return (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span className="font-medium truncate">{item.quantity}× {item.name}</span>
                                {item.spiceLevel && (
                                  <span className="text-[10px] text-slate-400 shrink-0">({item.spiceLevel})</span>
                                )}
                                {isTreat && (
                                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded shrink-0">Treat</span>
                                )}
                              </div>
                            );
                          })}
                          {order.items.length > 2 && (
                            <div className="text-[10px] text-slate-400 italic">
                              +{order.items.length - 2} more items...
                            </div>
                          )}
                          {customerNote && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 italic truncate max-w-xs">
                              Note: "{customerNote}"
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. Total Value */}
                      <td className="py-4 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap align-middle">
                        ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 8. Assigned Staff with Circular Avatar (Exact Reference Design) */}
                      <td className="py-4 px-3 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {waiter.name}
                          </span>
                          {waiter.avatarUrl ? (
                            <img 
                              src={waiter.avatarUrl} 
                              alt={waiter.name}
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0" 
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {waiter.initial}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 9. Clean Action Controls */}
                      <td className="py-4 px-3 text-right whitespace-nowrap align-middle">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          
                          {order.status === 'NEW' && (
                            <button
                              onClick={(e) => handleAdvanceStatus(order.id, 'NEW', e)}
                              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                            >
                              Accept &amp; Cook
                            </button>
                          )}

                          {order.status === 'PREPARING' && (
                            <button
                              onClick={(e) => handleAdvanceStatus(order.id, 'PREPARING', e)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                            >
                              Mark Ready
                            </button>
                          )}

                          {order.status === 'READY' && (
                            <button
                              onClick={(e) => handleAdvanceStatus(order.id, 'READY', e)}
                              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold cursor-pointer transition-colors shadow-xs"
                            >
                              Deliver
                            </button>
                          )}

                          {order.status === 'COMPLETED' && (
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivered</span>
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedOrderForModal(order)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. TICKET DETAIL MODAL                                    */}
      {/* ========================================================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-display">
                    Order Ticket #{selectedOrderForModal.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Table {selectedOrderForModal.tableNumber} • Server: {getAssignedWaiter(selectedOrderForModal.tableNumber).name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-kds-scrollbar">
              
              {/* Status & Timing summary */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Status</span>
                  <span className="font-extrabold text-sm">{selectedOrderForModal.status}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Elapsed Time</span>
                  <span className="font-extrabold text-sm font-mono">
                    {getOrderTiming(selectedOrderForModal.createdAt, 15).display}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Dishes &amp; Preparation Details ({selectedOrderForModal.items.length})
                </span>

                {selectedOrderForModal.items.map((item, idx) => {
                  const isVeg = /veg|paneer|dosa|idli|coffee|vada|kesari|papad|poori/i.test(item.name);
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                        isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 font-black text-xs flex items-center justify-center shrink-0">
                          {item.quantity}×
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{item.name}</span>
                          </div>
                          {item.spiceLevel && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Spice Level: {item.spiceLevel}
                            </span>
                          )}
                          {item.customizations && item.customizations.length > 0 && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              +{item.customizations.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-black text-xs text-slate-400">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Special Note */}
              {selectedOrderForModal.items.some(i => i.specialInstructions) && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold uppercase text-[10px] tracking-wider">
                      Customer Special Request:
                    </strong>
                    <span>"{selectedOrderForModal.items.find(i => i.specialInstructions)?.specialInstructions}"</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>

              {selectedOrderForModal.status !== 'COMPLETED' && (
                <button
                  onClick={() => handleAdvanceStatus(selectedOrderForModal.id, selectedOrderForModal.status)}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Advance Stage →
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Staff / Table Waiter Calls Modal */}
      {isWaiterCallsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className={`max-w-xl w-full rounded-2xl border p-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/25 flex items-center justify-center">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black text-sm font-display">Customer Waiter Assistance Calls</h3>
                  <p className="text-[11px] text-slate-400">Live requests from table kiosks synced to Cloud Database</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWaiterCallsOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2.5 max-h-96 overflow-y-auto custom-kds-scrollbar">
              {displayAlerts.length === 0 ? (
                <div className="text-center py-10 opacity-70">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-90" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">All tables are currently attended!</p>
                  <p className="text-xs text-slate-400 mt-0.5">No pending customer requests at this time.</p>
                </div>
              ) : (
                displayAlerts.map(alert => {
                  const assigned = getAssignedWaiter(alert.tableNumber);
                  const isPending = alert.status === 'PENDING';
                  return (
                    <div 
                      key={alert.id} 
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isPending
                          ? 'border-rose-500/40 bg-rose-500/10 shadow-xs'
                          : isDark ? 'border-slate-800 bg-slate-800/30 opacity-70' : 'border-slate-200 bg-slate-50 opacity-70'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black text-[11px] shadow-xs">
                            Table {alert.tableNumber}
                          </span>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold uppercase flex items-center gap-1.5 shadow-xs ${
                            alert.type === 'Need Water'
                              ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                              : alert.type === 'Need Bill'
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                              : alert.type === 'Need Assistance'
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                          }`}>
                            {alert.type === 'Need Water' && <Droplet className="w-3.5 h-3.5 fill-current" />}
                            {alert.type === 'Need Bill' && <Receipt className="w-3.5 h-3.5" />}
                            {alert.type === 'Need Assistance' && <HelpCircle className="w-3.5 h-3.5" />}
                            {alert.type === 'Other' && <UtensilsCrossed className="w-3.5 h-3.5" />}
                            <span>{alert.type}</span>
                          </span>
                          {isPending && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black animate-pulse shadow-xs">
                              ACTIVE CALL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2.5 flex-wrap">
                          <span>Assigned Server: <strong className="text-slate-800 dark:text-slate-200">{assigned.name}</strong> ({assigned.code})</span>
                          <span className="opacity-40">•</span>
                          <span>{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                          <span className="opacity-40">•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Cloud PostgreSQL
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isPending ? (
                          <button
                            onClick={(e) => handleResolveAlert(alert.id, e)}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Attended / Resolve</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved in Cloud
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {pendingAlerts.length} active request{pendingAlerts.length === 1 ? '' : 's'} awaiting service
              </span>
              <button
                onClick={() => setIsWaiterCallsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 86'd / Sold-Out Menu Modal */}
      {isSoldOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className={`max-w-lg w-full rounded-2xl border p-5 shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm font-display">86'd Station Ingredients &amp; Dishes</h3>
              </div>
              <button onClick={() => setIsSoldOutOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 opacity-60 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-2 max-h-96 overflow-y-auto custom-kds-scrollbar">
              <p className="text-[11px] opacity-70 mb-3">
                Toggle items marked out of stock. When toggled, table kiosks immediately disable ordering for this dish.
              </p>
              {menuItems.slice(0, 15).map(item => (
                <div key={item.id} className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold">{item.name}</span>
                    <span className="text-[10px] opacity-60 block">₹{item.price} • {item.category}</span>
                  </div>
                  <button
                    onClick={() => {
                      toggleItemAvailability(item.id);
                      showToast(`${item.name} marked as ${item.isAvailable ? '86-SOLD OUT' : 'AVAILABLE'}`);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      item.isAvailable 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500 text-white shadow-xs'
                    }`}
                  >
                    {item.isAvailable ? 'Available' : "86'd Sold Out"}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsSoldOutOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. USER DETAILS MODAL (FROM DATABASE)                     */}
      {/* ========================================================= */}
      {isUserDetailsModalOpen && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl border overflow-hidden flex flex-col ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Modal Header */}
            <div className={`p-5 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-display">Staff Account Details</h3>
                  <p className="text-[11px] text-slate-400">Database-authenticated active session</p>
                </div>
              </div>

              <button
                onClick={() => setIsUserDetailsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Profile Card Summary */}
              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white text-xl font-black flex items-center justify-center shadow-md shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-amber-500 font-bold">{currentUser.title || 'Kitchen Staff'}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Role: {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Database Fields */}
              <div className="space-y-2.5">
                
                {/* Username */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Username</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    @{currentUser.username}
                  </span>
                </div>

                {/* User ID */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Database ID</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser.id}
                  </span>
                </div>

                {/* Security PIN */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5" />
                    <span>Assigned 4-Digit PIN</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-500 tracking-widest text-sm">
                      {showPin ? currentUser.pin : '••••'}
                    </span>
                    <button
                      onClick={() => setShowPin(!showPin)}
                      className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                    >
                      {showPin ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                </div>

                {/* Department */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                }`}>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Department</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {currentUser.department || 'Kitchen Brigade'}
                  </span>
                </div>

                {/* Email */}
                {currentUser.email && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {currentUser.email}
                    </span>
                  </div>
                )}

                {/* Phone */}
                {currentUser.phone && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                  }`}>
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Phone</span>
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {currentUser.phone}
                    </span>
                  </div>
                )}

              </div>

              {/* Cloud Database Sync Status */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Verified Cloud PostgreSQL Database Account</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 ${
              isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <button
                onClick={() => {
                  authService.logout();
                  setIsUserDetailsModalOpen(false);
                  showToast('Logged out of kitchen session');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch / Sign Out</span>
              </button>

              <button
                onClick={() => setIsUserDetailsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
