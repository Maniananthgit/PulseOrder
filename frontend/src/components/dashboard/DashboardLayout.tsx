import React, { useState, useEffect } from 'react';
import { useKiosk } from '../../context/KioskContext';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Tablet, 
  CreditCard, 
  BarChart3, 
  Users, 
  Store, 
  Bell, 
  ShieldCheck, 
  Settings, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Sun, 
  Moon, 
  ChefHat, 
  Crown, 
  Maximize2, 
  Building2, 
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  ScanFace
} from 'lucide-react';

export type DashboardTab = 
  | 'overview'
  | 'orders'
  | 'menu'
  | 'kiosks'
  | 'payments'
  | 'reports'
  | 'staff'
  | 'attendance'
  | 'branches'
  | 'notifications'
  | 'audit'
  | 'settings';

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

import { authService, UserCredential } from '../../services/authService';
import royalEmberLogo from '../../assets/royal_ember_logo.jpg';

export const SIDEBAR_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: 'Live', badgeColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200' },
  { id: 'menu', label: 'Menu Management', icon: UtensilsCrossed },
  { id: 'kiosks', label: 'Kiosk & Device Management', icon: Tablet, badge: '20', badgeColor: 'bg-slate-100 text-slate-600' },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'staff', label: 'Staff & Roles', icon: Users },
  { id: 'attendance', label: 'Employee Attendance', icon: ScanFace, badge: 'Live', badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  { id: 'branches', label: 'Branch Management', icon: Store },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: '3', badgeColor: 'bg-amber-50 text-amber-600 border border-amber-200' },
  { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface DashboardLayoutProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  searchQuery,
  onSearchChange,
  selectedBranch,
  onSelectBranch,
}) => {
  const { 
    setView, 
    theme, 
    toggleTheme, 
    activeOrders, 
    staffAlerts,
    showToast 
  } = useKiosk();

  const [currentUser, setCurrentUser] = useState<UserCredential | null>(() => authService.getCurrentUser());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dashboard_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('dashboard_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleUserChange = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener('auth_user_changed', handleUserChange);
    return () => window.removeEventListener('auth_user_changed', handleUserChange);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setView('kiosk');
    showToast('Logged out of Management session.');
  };

  const pendingOrdersCount = activeOrders.filter((o) => o.status !== 'COMPLETED').length;
  const pendingAlertsCount = staffAlerts.filter((a) => a.status === 'PENDING').length;

  const currentTabObj = SIDEBAR_NAV_ITEMS.find((item) => item.id === currentTab) || SIDEBAR_NAV_ITEMS[0];

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        
        {/* ========================================================= */}
        {/* LEFT SIDEBAR (Collapsible: w-72 or w-20 with icon mode)   */}
        {/* ========================================================= */}
        <aside 
          className={`fixed lg:sticky top-0 bottom-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 z-50 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          } ${
            isMobileSidebarOpen ? 'translate-x-0 shadow-2xl w-72' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Top Brand Logo Section */}
          <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center transition-all ${
            isSidebarCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div 
                onClick={isSidebarCollapsed ? toggleSidebarCollapse : undefined}
                className={`w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-amber-500/40 shadow-md shadow-amber-500/10 shrink-0 bg-slate-900 ${
                  isSidebarCollapsed ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                }`}
                title={isSidebarCollapsed ? "Click to expand sidebar" : "Royal Ember Official Brand"}
              >
                <img 
                  src={royalEmberLogo} 
                  alt="Royal Ember Brand Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-extrabold text-base tracking-tight font-display text-slate-900 dark:text-white truncate">
                      Royal Ember
                    </h1>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-200/50 dark:border-amber-800/50">
                      Official
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    Restaurant Admin Suite
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Toggle Button inside sidebar header */}
            {!isSidebarCollapsed && (
              <button 
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hidden lg:flex hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse Sidebar (Ctrl+B)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Close Button */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white lg:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (11 Required Options in Exact Order) */}
          <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 custom-scrollbar">
            {!isSidebarCollapsed && (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
                Main Navigation
              </div>
            )}

            {SIDEBAR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group text-left relative ${
                    isSidebarCollapsed 
                      ? 'justify-center p-3' 
                      : 'justify-between px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-100 dark:border-blue-900/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className={`p-1 rounded-lg transition-colors ${
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Collapsed indicator dot */}
                  {isSidebarCollapsed && item.badge && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Sidebar: User Profile & Quick Logout */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer"
                  title={`${currentUser?.name || 'Administrator'} (@${currentUser?.username || 'admin'})`}
                >
                  {(currentUser?.name || 'Administrator').split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {(currentUser?.name || 'Administrator').split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {currentUser?.name || 'System Administrator'}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>@{currentUser?.username || 'admin'} • {currentUser?.title || 'General Manager'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Log Out & Exit Management"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN APPLICATION COLUMN: TOP HEADER + PAGE CONTENT AREA  */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          
          {/* TOP HEADER BAR */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-4 shadow-xs">
            
            {/* Left: Hamburger + Desktop Sidebar Toggle + Page Title & Search */}
            <div className="flex items-center gap-3 sm:gap-3.5 flex-1 max-w-xl">
              {/* Mobile Drawer Button */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Open Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Toggle Button */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
                aria-label="Toggle Sidebar"
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>

              {/* Official Brand Logo in Top Header */}
              <div className="flex items-center gap-2.5 pr-2.5 border-r border-slate-200 dark:border-slate-800 shrink-0">
                <img 
                  src={royalEmberLogo} 
                  alt="Royal Ember Logo" 
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-amber-500/30 shadow-xs" 
                />
              </div>

              <div className="hidden sm:block shrink-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display tracking-tight leading-tight">
                  {currentTabObj.label}
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  <span>Management</span>
                  <span>/</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{currentTabObj.label}</span>
                </div>
              </div>

              {/* Search Bar matching Riday reference */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search orders, dishes, kiosks, staff..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Branch Selector Dropdown */}
              <div className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="max-w-[140px] truncate">{selectedBranch}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600 opacity-70" />
                </button>

                {isBranchDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Select Active Branch
                    </div>
                    {['Indiranagar Flagship', 'Whitefield Tech Park'].map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          onSelectBranch(b);
                          setIsBranchDropdownOpen(false);
                          showToast(`Switched active branch to ${b}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-colors cursor-pointer ${
                          selectedBranch === b 
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{b}</span>
                        {selectedBranch === b && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Station Switcher Quick Links */}
              <div className="hidden xl:flex items-center gap-1.5">
                <button
                  onClick={() => setView('kitchen')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 border border-amber-200/80 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open Kitchen Display System"
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                  <span>KDS Screen</span>
                </button>

                <button
                  onClick={() => setView('kiosk')}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open Customer Self-Ordering Kiosk"
                >
                  <Tablet className="w-3.5 h-3.5 text-blue-500" />
                  <span>Table Kiosk</span>
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreenToggle}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:flex cursor-pointer"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* Notifications Button with Unread Badge */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {pendingAlertsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                      <span className="font-bold text-slate-900 dark:text-white">Operational Alerts</span>
                      <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950">
                        {pendingAlertsCount} pending
                      </span>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {staffAlerts.slice(0, 4).map((alert) => (
                        <div key={alert.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              Table {alert.tableNumber} • {alert.type}
                            </div>
                            <div className="text-[10px] text-slate-600 dark:text-slate-400">
                              {alert.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        onSelectTab('notifications');
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full mt-2.5 py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                    >
                      View All Alerts →
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar & Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {currentUser?.name || 'Administrator'}
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">
                      @{currentUser?.username || 'admin'} ({currentUser?.role === 'kitchen' ? 'Kitchen KDS' : 'Management'})
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {(currentUser?.name || 'Administrator').split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1">
                    <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="font-bold text-slate-900 dark:text-white">{currentUser?.name || 'Administrator'}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">@{currentUser?.username || 'admin'}</div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">{currentUser?.title || 'General Manager'}</div>
                    </div>
                    <button
                      onClick={() => {
                        onSelectTab('staff');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>Manage User Credentials</span>
                    </button>
                    <button
                      onClick={() => {
                        onSelectTab('settings');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold cursor-pointer flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out of Station</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </header>

          {/* MAIN PAGE CONTENT WRAPPER */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>

        </div>

      </div>

    </div>
  );
};

export default DashboardLayout;
