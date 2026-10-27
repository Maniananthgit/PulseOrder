import { MenuItem, Order, StaffAlert, Feedback } from '../types';
import { 
  INITIAL_MENU_ITEMS, 
  INITIAL_ORDERS, 
  INITIAL_STAFF_ALERTS, 
  INITIAL_FEEDBACK 
} from '../data/initialData';
import { 
  pushOrderToCloud, 
  updateCloudOrderStatus, 
  pushWaiterCallToCloud, 
  resolveWaiterCallInCloud,
  pushFeedbackToCloud 
} from './supabaseClient';

export const STORAGE_KEYS = {
  MENU_ITEMS: 'royal_ember_menu_items_v9',
  ORDERS: 'orderease_orders_v1',
  STAFF_ALERTS: 'orderease_staff_alerts_v1',
  FEEDBACK: 'orderease_feedback_v1',
  ACTIVE_TABLE: 'orderease_active_table_v1',
  LANGUAGE: 'orderease_language_v1',
  THEME: 'orderease_theme_v1',
  ACCESSIBILITY: 'orderease_accessibility_v1',
  LAST_ORDER_ID: 'orderease_last_order_id_v1',
};

const CHANNEL_NAME = 'orderease_kiosk_sync_channel';

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  // BroadcastChannel might fail in some restricted iframes
}

export interface SyncMessage {
  type: 
    | 'MENU_UPDATED'
    | 'ORDER_CREATED'
    | 'ORDER_UPDATED'
    | 'ALERT_CREATED'
    | 'ALERT_RESOLVED'
    | 'FEEDBACK_ADDED'
    | 'THEME_CHANGED'
    | 'LANGUAGE_CHANGED'
    | 'DATA_RESET';
  payload?: unknown;
}

export const storageService = {
  getMenuItems(): MenuItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_MENU_ITEMS.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage read failed', e);
    }
    this.saveMenuItems(INITIAL_MENU_ITEMS);
    return INITIAL_MENU_ITEMS;
  },

  saveMenuItems(items: MenuItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
      this.broadcast({ type: 'MENU_UPDATED', payload: items });
    } catch (e) {
      console.error(e);
    }
  },

  getOrders(): Order[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    this.saveOrders(INITIAL_ORDERS);
    return INITIAL_ORDERS;
  },

  saveOrders(orders: Order[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.broadcast({ type: 'ORDER_UPDATED', payload: orders });
    } catch (e) {
      console.error(e);
    }
  },

  addOrder(order: Order) {
    const orders = this.getOrders();
    const updated = [order, ...orders];
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.LAST_ORDER_ID, order.id);
      this.broadcast({ type: 'ORDER_CREATED', payload: order });
    } catch (e) {
      console.error(e);
    }
    // Asynchronous Cloud Sync to Supabase PostgreSQL
    pushOrderToCloud(order).catch((err) => console.warn('[Cloud Sync] Order push error:', err));
    return updated;
  },

  getLastOrderId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_ORDER_ID);
    } catch {
      return null;
    }
  },

  updateOrderStatus(orderId: string, status: Order['status']) {
    const orders = this.getOrders();
    let targetOrderNumber: number | null = null;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        targetOrderNumber = o.orderNumber;
        return { ...o, status, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    this.saveOrders(updated);
    if (targetOrderNumber) {
      updateCloudOrderStatus(targetOrderNumber, status).catch((err) => console.warn('[Cloud Sync] Status update error:', err));
    }
    return updated;
  },

  updateOrder(orderId: string, updates: Partial<Order>) {
    const orders = this.getOrders();
    const updated = orders.map((o) => 
      o.id === orderId 
        ? { ...o, ...updates, updatedAt: new Date().toISOString() } 
        : o
    );
    this.saveOrders(updated);
    return updated;
  },

  completeAllTableOrders(tableNumber: number) {
    const orders = this.getOrders();
    const updated = orders.map((o) => 
      o.tableNumber === tableNumber && o.status !== 'COMPLETED'
        ? { ...o, status: 'COMPLETED' as const, updatedAt: new Date().toISOString() }
        : o
    );
    this.saveOrders(updated);
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_ORDER_ID);
    } catch (e) {
      // safe ignore
    }
    return updated;
  },

  getStaffAlerts(): StaffAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF_ALERTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    this.saveStaffAlerts(INITIAL_STAFF_ALERTS);
    return INITIAL_STAFF_ALERTS;
  },

  saveStaffAlerts(alerts: StaffAlert[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF_ALERTS, JSON.stringify(alerts));
      this.broadcast({ type: 'ALERT_CREATED', payload: alerts });
    } catch (e) {
      console.error(e);
    }
  },

  addStaffAlert(alert: StaffAlert) {
    const alerts = this.getStaffAlerts();
    const updated = [alert, ...alerts];
    this.saveStaffAlerts(updated);
    // Cloud sync waiter request to Supabase
    pushWaiterCallToCloud(alert.tableNumber, alert.type).catch((err) => console.warn('[Cloud Sync] Waiter call error:', err));
    return updated;
  },

  resolveStaffAlert(id: string) {
    const alerts = this.getStaffAlerts();
    let targetAlert: StaffAlert | undefined;
    const updated = alerts.map((a) => {
      if (a.id === id) {
        targetAlert = a;
        return { ...a, status: 'RESOLVED' as const };
      }
      return a;
    });
    this.saveStaffAlerts(updated);
    this.broadcast({ type: 'ALERT_RESOLVED', payload: updated });
    if (targetAlert) {
      resolveWaiterCallInCloud(targetAlert.tableNumber, targetAlert.type).catch((err) => 
        console.warn('[Cloud Sync] Resolve alert cloud error:', err)
      );
    }
    return updated;
  },

  getFeedback(): Feedback[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn(e);
    }
    this.saveFeedback(INITIAL_FEEDBACK);
    return INITIAL_FEEDBACK;
  },

  saveFeedback(feedback: Feedback[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
      this.broadcast({ type: 'FEEDBACK_ADDED', payload: feedback });
    } catch (e) {
      console.error(e);
    }
  },

  addFeedback(item: Feedback) {
    const current = this.getFeedback();
    const updated = [item, ...current];
    this.saveFeedback(updated);
    // Cloud sync customer feedback to Supabase
    pushFeedbackToCloud(item).catch((err) => console.warn('[Cloud Sync] Feedback error:', err));
    return updated;
  },

  toggleItemAvailability(itemId: string) {
    const items = this.getMenuItems();
    const updated = items.map((i) => 
      i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i
    );
    this.saveMenuItems(updated);
    return updated;
  },

  getTheme(): 'light' | 'dark' {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.THEME);
      if (data === 'dark' || data === 'light') return data;
    } catch (e) {
      console.warn(e);
    }
    return 'light';
  },

  saveTheme(theme: 'light' | 'dark') {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'THEME_CHANGED', payload: theme });
      }
    } catch (e) {
      console.error(e);
    }
  },

  getLanguage(): string {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (data) return data;
    } catch (e) {
      console.warn(e);
    }
    return 'en';
  },

  saveLanguage(lang: string) {
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      this.broadcast({ type: 'LANGUAGE_CHANGED', payload: lang });
    } catch (e) {
      console.error(e);
    }
  },

  resetAllData() {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem(STORAGE_KEYS.STAFF_ALERTS, JSON.stringify(INITIAL_STAFF_ALERTS));
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(INITIAL_FEEDBACK));
      this.broadcast({ type: 'DATA_RESET' });
    } catch (e) {
      console.error(e);
    }
  },

  broadcast(message: SyncMessage) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(message);
      } catch (err) {
        console.warn('Broadcast failed', err);
      }
    }
    // Dispatch in the current window for same-tab / same-window instant reactivity
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('orderease_local_sync', { detail: message }));
      } catch {
        // ignore
      }
    }
  },

  subscribe(callback: (msg: SyncMessage) => void) {
    const channelHandler = (event: MessageEvent) => {
      if (event.data) {
        callback(event.data);
      }
    };

    const localSyncHandler = (event: Event) => {
      const custom = event as CustomEvent<SyncMessage>;
      if (custom.detail) {
        callback(custom.detail);
      }
    };

    const storageEventHandler = (event: StorageEvent) => {
      if (!event.key) return;
      try {
        if (event.key === STORAGE_KEYS.ORDERS) {
          callback({ type: 'ORDER_UPDATED', payload: event.newValue ? JSON.parse(event.newValue) : [] });
        } else if (event.key === STORAGE_KEYS.MENU_ITEMS) {
          callback({ type: 'MENU_UPDATED', payload: event.newValue ? JSON.parse(event.newValue) : [] });
        } else if (event.key === STORAGE_KEYS.STAFF_ALERTS) {
          callback({ type: 'ALERT_CREATED', payload: event.newValue ? JSON.parse(event.newValue) : [] });
        } else if (event.key === STORAGE_KEYS.FEEDBACK) {
          callback({ type: 'FEEDBACK_ADDED', payload: event.newValue ? JSON.parse(event.newValue) : [] });
        } else if (event.key === STORAGE_KEYS.THEME) {
          callback({ type: 'THEME_CHANGED', payload: event.newValue });
        } else if (event.key === STORAGE_KEYS.LANGUAGE) {
          callback({ type: 'LANGUAGE_CHANGED', payload: event.newValue });
        }
      } catch (err) {
        console.warn('Storage event parse error', err);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', channelHandler);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('orderease_local_sync', localSyncHandler);
      window.addEventListener('storage', storageEventHandler);
    }

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', channelHandler);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('orderease_local_sync', localSyncHandler);
        window.removeEventListener('storage', storageEventHandler);
      }
    };
  }
};
