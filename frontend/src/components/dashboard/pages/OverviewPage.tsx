import React, { useState } from 'react';
import { useKiosk } from '../../../context/KioskContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  UtensilsCrossed, 
  ShoppingBag, 
  Users, 
  Star, 
  ArrowUpRight, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  ScanFace
} from 'lucide-react';
import type { DashboardTab } from '../DashboardLayout';

interface OverviewPageProps {
  onNavigateTab: (tab: DashboardTab) => void;
  selectedBranch: string;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ 
  onNavigateTab,
  selectedBranch 
}) => {
  const { 
    menuItems, 
    activeOrders, 
    feedbacks, 
    staffAlerts, 
    updateOrderStatus 
  } = useKiosk();

  const [revenueRange, setRevenueRange] = useState<'day' | 'week' | 'month'>('month');

  // Realistic revenue chart points
  const revenueChartPoints = [
    { label: 'Jan', value: 85, revenue: '₹3,40,000' },
    { label: 'Feb', value: 92, revenue: '₹3,68,000' },
    { label: 'Mar', value: 88, revenue: '₹3,52,000' },
    { label: 'Apr', value: 110, revenue: '₹4,40,000' },
    { label: 'May', value: 135, revenue: '₹5,40,000' },
    { label: 'Jun', value: 162, revenue: '₹6,48,000' },
    { label: 'Jul', value: 180, revenue: '₹7,20,000' },
  ];

  const maxChartVal = Math.max(...revenueChartPoints.map(p => p.value));

  // Compute live counts
  const totalMenuCount = menuItems.length || 325;
  const totalActiveOrders = activeOrders.filter(o => o.status !== 'COMPLETED').length;
  const completedOrdersCount = activeOrders.filter(o => o.status === 'COMPLETED').length;

  const avgRating = (
    feedbacks.reduce((acc, f) => acc + f.rating, 0) / (feedbacks.length || 1)
  ).toFixed(1);

  // Trending food items with real photos from catalog
  const trendingDishes = [
    {
      rank: '#1',
      name: 'Butter Chicken Makhani',
      category: 'Main Course',
      price: 320,
      salesCount: 158,
      share: '20%',
      isPositive: true,
      image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80',
    },
    {
      rank: '#2',
      name: 'Paneer Tikka Clay Oven',
      category: 'Starters',
      price: 280,
      salesCount: 118,
      share: '15%',
      isPositive: true,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=400&q=80',
    },
    {
      rank: '#3',
      name: 'Veg Dum Royal Biryani',
      category: 'Rice & Breads',
      price: 240,
      salesCount: 258,
      share: '24%',
      isPositive: true,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
    },
    {
      rank: '#4',
      name: 'Crispy Masala Dosa',
      category: 'Breakfast / Tiffin',
      price: 160,
      salesCount: 185,
      share: '18%',
      isPositive: true,
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80',
    },
    {
      rank: '#5',
      name: 'Cold Coffee Frappé',
      category: 'Beverages',
      price: 140,
      salesCount: 215,
      share: '21%',
      isPositive: true,
      image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* 1. TOP 4 KPI CARDS (Matching Riday Template Structure)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Total Menu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Total Menu
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              {totalMenuCount}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>6 Active Categories</span>
            </div>
          </div>

          {/* Circular Graphic like Riday reference */}
          <div className="w-14 h-14 rounded-full border-4 border-amber-100 dark:border-amber-950/60 border-t-amber-500 border-r-amber-500 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Total Revenue
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              ₹4,25,800
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18.4% vs last week</span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-full border-4 border-emerald-100 dark:border-emerald-950/60 border-t-emerald-500 border-r-emerald-500 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 font-black text-lg font-mono">₹</span>
          </div>
        </div>

        {/* KPI 3: Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Total Orders
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              415
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>+28 orders today</span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-full border-4 border-blue-100 dark:border-blue-950/60 border-t-blue-500 border-r-blue-500 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* KPI 4: Total Diners / Customers */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
              Total Customers
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">
              985
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>4.8 ★ Satisfaction</span>
            </div>
          </div>

          <div className="w-14 h-14 rounded-full border-4 border-purple-100 dark:border-purple-950/60 border-t-purple-500 border-r-purple-500 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN SECTION: MAIN CONTENT (LEFT) + METRIC STACK (RIGHT) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Trending Items & Revenue Overview (Spans 2-3 cols) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* PANEL A: Trending Items (Food Cards matching Riday) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                      Trending Items
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Top 5 dishes by table kiosk customer orders
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('menu')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Menu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {trendingDishes.map((dish) => (
                    <div 
                      key={dish.rank} 
                      className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-5">
                          {dish.rank}
                        </span>
                        
                        {/* Food Image */}
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs group-hover:scale-105 transition-transform" 
                        />

                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {dish.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                              ₹{dish.price}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              • {dish.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mini sparkline indicator */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-900 dark:text-white font-display">
                          {dish.salesCount}
                        </div>
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          <span>Sales ({dish.share})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PANEL B: Revenue Overview (Interactive Line/Step Chart) */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                      Revenue Overview
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Monthly gross revenue trajectory
                    </p>
                  </div>

                  {/* Range pills */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[10px] font-bold">
                    {(['day', 'week', 'month'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRevenueRange(r)}
                        className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                          revenueRange === r
                            ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-xs font-extrabold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Line / Area Graph */}
                <div className="h-56 relative flex flex-col justify-end pt-4 pb-2">
                  
                  {/* Subtle Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                    <div className="border-b border-slate-400 w-full" />
                  </div>

                  {/* SVG Chart Line */}
                  <svg className="w-full h-40 overflow-visible" viewBox="0 0 700 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Area */}
                    <path
                      d="M 0 160 L 0 90 L 100 80 L 200 85 L 300 65 L 400 45 L 500 25 L 700 10 L 700 160 Z"
                      fill="url(#revenueGrad)"
                    />

                    {/* Step line matching Riday reference */}
                    <path
                      d="M 0 90 L 100 90 L 100 80 L 200 80 L 200 85 L 300 85 L 300 65 L 400 65 L 400 45 L 500 45 L 500 25 L 600 25 L 600 10 L 700 10"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Data Points */}
                    {[[100, 80], [300, 65], [500, 25], [700, 10]].map(([cx, cy], i) => (
                      <circle 
                        key={i} 
                        cx={cx} 
                        cy={cy} 
                        r="4.5" 
                        fill="#ffffff" 
                        stroke="#2563eb" 
                        strokeWidth="3" 
                        className="hover:scale-150 transition-transform"
                      />
                    ))}
                  </svg>

                  {/* Horizontal Month Labels */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {revenueChartPoints.map((p) => (
                      <span key={p.label}>{p.label}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-950 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Peak Month: <strong>July (₹7.20L)</strong></span>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400">+22% YoY</span>
                </div>
              </div>
            </div>

          </div>

          {/* PANEL C: Recent Orders Table */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white font-display">
                  Recent Orders
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Live dining transactions across all tables
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pl-2">Order #</th>
                    <th className="pb-3">Table</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Payment</th>
                    <th className="pb-3 text-right pr-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeOrders.slice(0, 5).map((order) => {
                    const statusColors = {
                      NEW: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900',
                      PREPARING: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900',
                      READY: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-900',
                      COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
                    };

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-slate-900 dark:text-white">
                          #{order.orderNumber}
                        </td>
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                          Table {order.tableNumber}
                        </td>
                        <td className="py-3 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                          {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="py-3 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-900 dark:text-white font-display">
                          ₹{order.total}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-[10px] font-bold">
                            {order.paymentMethod || 'UPI'} Paid
                          </span>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => onNavigateTab('orders')}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Riday Style Mini-Stat Stack (Spans 1 col) */}
        <div className="space-y-6">
          
          {/* Right Card 1: Total Sale */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Sale
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                  +12.4%
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                ₹25,490
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                6 total active orders right now
              </p>
            </div>

            {/* Emerald Mini Sparkline */}
            <div className="pt-4">
              <svg className="w-full h-10" viewBox="0 0 100 25">
                <path
                  d="M0 20 Q 25 5, 50 15 T 100 5"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <button
                onClick={() => onNavigateTab('reports')}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              >
                View Full Sales Report
              </button>
            </div>
          </div>

          {/* Right Card 2: Total Sessions / Active Tables */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Sessions
                </span>
                <span className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">
                845
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                4 visitors ordering right now
              </p>
            </div>

            {/* Blue Mini Sparkline */}
            <div className="pt-4">
              <svg className="w-full h-10" viewBox="0 0 100 25">
                <path
                  d="M0 18 Q 30 22, 60 8 T 100 12"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <button
                onClick={() => onNavigateTab('kiosks')}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-900 transition-colors cursor-pointer"
              >
                See Live Kiosks
              </button>
            </div>
          </div>

          {/* Right Card 3: Customer Retention Rate */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Customer Rate
              </span>
              <span className="text-xs font-extrabold text-slate-900 dark:text-white font-display">
                5.12%
              </span>
            </div>

            {/* Progress split bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex my-3">
              <div style={{ width: '64%' }} className="bg-blue-600 h-full" title="64% Returning Diners" />
              <div style={{ width: '36%' }} className="bg-amber-500 h-full" title="36% First Time Diners" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Returning (64%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>First Time (36%)</span>
              </span>
            </div>
          </div>

          {/* Right Card 4: Operational Action Alerts */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white font-display">
                Operational Alerts
              </span>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Table 8 • Delay Notice (+5m)</span>
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  Comp item auto-credited to diner receipt.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>All 20 Kiosks Online</span>
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                  Battery level average 94% • Zero dropped pings.
                </div>
              </div>
            </div>
          </div>

          {/* Right Card 5: Staff Attendance Live Widget */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white font-display flex items-center gap-1.5">
                <ScanFace className="w-4 h-4 text-amber-500" />
                <span>Live Staff Attendance</span>
              </span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                92% On Duty
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Present Today:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">11 Staff</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Late Arrivals:</span>
                <span className="font-bold text-amber-500 font-mono">1 Staff</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Biometric Sync:</span>
                <span className="font-bold text-emerald-500 flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Realtime
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="w-full mt-3 py-2 text-center text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Open Attendance Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default OverviewPage;
