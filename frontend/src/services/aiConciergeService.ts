import { MenuItem, Order } from '../types';

export interface AIResponse {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  highlightItems?: MenuItem[];
  action?: {
    type: 'call_waiter' | 'track_order' | 'open_cart' | 'view_category';
    label: string;
    payload?: string;
  };
  suggestedQuestions?: string[];
  isFallback?: boolean;
  timestamp: string;
}

// Royal Ember Restaurant Operating Timings
export const RESTAURANT_HOURS = {
  name: 'Royal Ember Restaurant & Banquet',
  lunch: '11:30 AM – 03:30 PM',
  dinner: '06:30 PM – 11:30 PM',
  days: 'Monday to Sunday (All 7 Days Open)',
  lastOrderLunch: '03:00 PM',
  lastOrderDinner: '11:00 PM',
  tableReservation: 'Recommended for dinner after 8:00 PM',
  valetParking: 'Complimentary valet parking available at the main porch'
};

// Available domain questions shown when a query is completely unmatched
export const AVAILABLE_QUESTION_PROMPTS = [
  '👑 Which foods are your Signatures?',
  '⭐ Which foods have excellent rating (4.8★+)?',
  '🕒 What is the shop opening and closing time?',
  '🌿 Show Pure Vegetarian & Jain specialties',
  '🌶️ Recommend mild / non-spicy dishes for kids',
  '🍗 Best tandoori starters & platters',
  '🔔 How do I call my assigned waiter?',
  '💳 What payment methods are supported?'
];

// Helper to determine live kitchen operation status
export const getLiveRestaurantStatus = (): { isOpen: boolean; statusText: string; nextOpeningText: string } => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const lunchStart = 11 * 60 + 30; // 11:30 AM
  const lunchEnd = 15 * 60 + 30;   // 03:30 PM
  const dinnerStart = 18 * 60 + 30; // 06:30 PM
  const dinnerEnd = 23 * 60 + 30;  // 11:30 PM

  if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
    return {
      isOpen: true,
      statusText: '🟢 Currently Open for Lunch Dining',
      nextOpeningText: 'Lunch Service active until 03:30 PM (Dinner resumes at 06:30 PM)'
    };
  } else if (currentMinutes >= dinnerStart && currentMinutes < dinnerEnd) {
    return {
      isOpen: true,
      statusText: '🟢 Currently Open for Dinner Dining',
      nextOpeningText: 'Dinner Service active until 11:30 PM (Last kitchen order at 11:00 PM)'
    };
  } else if (currentMinutes < lunchStart) {
    return {
      isOpen: false,
      statusText: '🟡 Morning Prep in Progress',
      nextOpeningText: 'Doors open for Lunch Service today at 11:30 AM'
    };
  } else {
    return {
      isOpen: false,
      statusText: '🟡 Afternoon Kitchen Resupply & Cleanse',
      nextOpeningText: 'Doors open for Evening Dinner Service at 06:30 PM'
    };
  }
};

/**
 * Smart Local AI Engine for Royal Ember Kiosk
 */
export const processCustomerQuery = (
  rawQuery: string,
  menuItems: MenuItem[],
  tableNumber: number,
  assignedWaiterName: string,
  activeOrder: Order | null
): AIResponse => {
  const query = rawQuery.trim().toLowerCase();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. SIGNATURE FOODS QUERY
  const isSignatureQuery = 
    query.includes('signature') || 
    query.includes('special') || 
    query.includes('famous') || 
    query.includes('chef special') || 
    query.includes('must try') || 
    query.includes('popular dish') ||
    query.includes('what to eat');

  if (isSignatureQuery) {
    const signatureItems = menuItems.filter(i => i.isSignature && i.isAvailable);
    const topSignatures = signatureItems.length > 0 ? signatureItems.slice(0, 4) : menuItems.slice(0, 4);

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `👑 **Royal Ember Signature Creations**\n\nOur Master Chef handcrafts these signature delicacies using heritage slow-tandoor roasting and rich aromatic gravies. Here are our crowned specialties for Table ${tableNumber}:`,
      highlightItems: topSignatures,
      suggestedQuestions: [
        '⭐ Which foods have highest rating?',
        '🌿 Show Veg Signature dishes only',
        '🕒 What are your shop timings?'
      ],
      timestamp
    };
  }

  // 2. EXCELLENT RATING FOODS QUERY
  const isRatingQuery = 
    query.includes('rating') || 
    query.includes('excellent') || 
    query.includes('highest rated') || 
    query.includes('top rated') || 
    query.includes('best food') || 
    query.includes('best dish') || 
    query.includes('5 star') || 
    query.includes('review') || 
    query.includes('delicious');

  if (isRatingQuery) {
    // Sort items by rating descending
    const ratedItems = [...menuItems]
      .filter(i => i.isAvailable && i.rating >= 4.7)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4);

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `⭐ **Top-Rated Culinary Masterpieces (4.8★ - 5.0★)**\n\nThese dishes consistently receive rave reviews from Royal Ember guests for exceptional taste, plating, and authenticity:`,
      highlightItems: ratedItems,
      suggestedQuestions: [
        '👑 Which foods are signature?',
        '🕒 What time does the restaurant close?',
        '🌶️ Are any of these mild for children?'
      ],
      timestamp
    };
  }

  // 3. RESTAURANT TIMINGS / OPEN & CLOSE TIME QUERY
  const isTimingQuery = 
    query.includes('time') || 
    query.includes('timing') || 
    query.includes('open') || 
    query.includes('close') || 
    query.includes('hour') || 
    query.includes('schedule') || 
    query.includes('when do you') || 
    query.includes('working hours') || 
    query.includes('shop time');

  if (isTimingQuery) {
    const status = getLiveRestaurantStatus();
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🕒 **Royal Ember Operating Hours**\n\n` +
        `• **Lunch Service:** ${RESTAURANT_HOURS.lunch}\n` +
        `• **Dinner Service:** ${RESTAURANT_HOURS.dinner}\n` +
        `• **Operating Days:** ${RESTAURANT_HOURS.days}\n` +
        `• **Last Kiosk Order:** 03:00 PM (Lunch) / 11:00 PM (Dinner)\n\n` +
        `**Live Status:** ${status.statusText}\n_${status.nextOpeningText}_\n\n` +
        `Complimentary valet parking and table-side concierge assistance are available throughout dining hours.`,
      suggestedQuestions: [
        '👑 Which foods are your Signatures?',
        '⭐ What are your top rated foods?',
        '🔔 Call waiter to table'
      ],
      timestamp
    };
  }

  // 4. VEGETARIAN / JAIN / VEGAN QUERY
  const isVegQuery = 
    query.includes('veg') || 
    query.includes('vegetarian') || 
    query.includes('jain') || 
    query.includes('vegan') || 
    query.includes('plant') || 
    query.includes('paneer') || 
    query.includes('dal');

  if (isVegQuery) {
    const vegItems = menuItems.filter(i => i.isVeg && i.isAvailable).slice(0, 4);
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🌿 **Pure Vegetarian & Sattvic Delights**\n\nAll our vegetarian dishes are cooked in a dedicated vegetarian cookware line using farm-fresh dairy and stone-ground spices. Here are our top vegetarian picks:`,
      highlightItems: vegItems,
      suggestedQuestions: [
        '👑 Show Signature Dishes',
        '⭐ What are the top rated veg items?',
        '🌶️ Can we customize spice level?'
      ],
      timestamp
    };
  }

  // 5. SPICE / MILD / KIDS FOOD QUERY
  const isSpiceQuery = 
    query.includes('mild') || 
    query.includes('kid') || 
    query.includes('children') || 
    query.includes('not spicy') || 
    query.includes('less spice') || 
    query.includes('sweet') || 
    query.includes('spicy') || 
    query.includes('hot');

  if (isSpiceQuery) {
    const mildItems = menuItems
      .filter(i => !i.isSpicy && i.isAvailable)
      .slice(0, 4);

    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🌶️ **Spice Customization & Gentle Flavors**\n\nAt Royal Ember, every dish can be customized to your preferred heat: **Mild**, **Medium**, **Hot**, or **Extra Hot**!\n\nFor children and guests who prefer mild, creamy indulgence without intense chili heat, we recommend:`,
      highlightItems: mildItems.length > 0 ? mildItems : menuItems.slice(0, 3),
      suggestedQuestions: [
        '👑 Which foods are your Signatures?',
        '⭐ Top rated foods',
        '🕒 What are your shop timings?'
      ],
      timestamp
    };
  }

  // 6. CALL WAITER / SERVICE ASSISTANCE QUERY
  const isWaiterQuery = 
    query.includes('waiter') || 
    query.includes('server') || 
    query.includes('call') || 
    query.includes('service') || 
    query.includes('water') || 
    query.includes('bill') || 
    query.includes('help') || 
    query.includes('spoon') || 
    query.includes('napkin') || 
    query.includes('clean');

  if (isWaiterQuery) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🔔 **Dedicated Concierge for Table ${tableNumber}**\n\nYour assigned floor attendant is **${assignedWaiterName}**. You can summon assistance immediately using the button below or by tapping the floating Call Waiter button on your kiosk screen:`,
      action: {
        type: 'call_waiter',
        label: `🔔 Call Waiter ${assignedWaiterName} to Table ${tableNumber}`
      },
      suggestedQuestions: [
        '👑 Which foods are signature?',
        '⭐ Which foods have highest rating?',
        '🕒 What are your shop timings?'
      ],
      timestamp
    };
  }

  // 7. TRACK ORDER / ACTIVE ORDER STATUS QUERY
  const isTrackQuery = 
    query.includes('track') || 
    query.includes('my order') || 
    query.includes('status') || 
    query.includes('food ready') || 
    query.includes('kitchen') || 
    query.includes('where is my food') || 
    query.includes('delay');

  if (isTrackQuery) {
    if (activeOrder) {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `🍳 **Live Kitchen Status for Table ${tableNumber}**\n\n• **Order Number:** #${activeOrder.orderNumber}\n• **Status:** ${activeOrder.status}\n• **Estimated Prep Window:** ${activeOrder.estimatedPrepTime || 12} mins\n• **Attendant:** Waiter ${assignedWaiterName}\n\nClick below to open the Live Kitchen Radar tracker:`,
        action: {
          type: 'track_order',
          label: '📡 Open Live Kitchen Tracker'
        },
        suggestedQuestions: [
          '👑 What should I order next?',
          '🕒 What time does the restaurant close?'
        ],
        timestamp
      };
    } else {
      return {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `📋 **No Active Orders in Kitchen**\n\nTable ${tableNumber} currently has no pending kitchen tickets. You can explore our menu, add items to your cart, and place your order directly through this screen!`,
        action: {
          type: 'open_cart',
          label: '🛒 View Order / Cart'
        },
        suggestedQuestions: [
          '👑 Which foods are your Signatures?',
          '⭐ Top rated foods (4.8★+)',
          '🕒 What are your shop timings?'
        ],
        timestamp
      };
    }
  }

  // 8. PAYMENT & BILLING QUERY
  const isPaymentQuery = 
    query.includes('pay') || 
    query.includes('payment') || 
    query.includes('upi') || 
    query.includes('card') || 
    query.includes('cash') || 
    query.includes('google pay') || 
    query.includes('phonepe') || 
    query.includes('split');

  if (isPaymentQuery) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `💳 **Accepted Payment Methods at Royal Ember**\n\n` +
        `• **UPI Direct:** Scan & pay via Google Pay, PhonePe, Paytm, or BHIM.\n` +
        `• **Cards:** Visa, Mastercard, RuPay, and American Express accepted.\n` +
        `• **Cash / Split Bill:** You can pay cash at reception or split bills with your party.\n` +
        `• **Digital Tax Invoicing:** Instant GST receipt sent via WhatsApp/SMS.`,
      suggestedQuestions: [
        '👑 Which foods are signature?',
        '🕒 What are your shop timings?',
        '🔔 Call waiter for bill assistance'
      ],
      timestamp
    };
  }

  // 9. OUTSIDE QUESTIONS WITH RELATED DINING MEANING
  // e.g. Weather / Rain / Cold
  if (query.includes('weather') || query.includes('rain') || query.includes('cold') || query.includes('hot outside')) {
    const hotDishes = menuItems.filter(i => i.isSpicy || i.category === 'Starters').slice(0, 3);
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🌧️ **Perfect Weather for Warm Royal Ember Dining!**\n\nWhatever the weather outside, our dining hall is climate-controlled and our tandoor is roaring! For cozy comfort, nothing beats our piping hot clay-oven kebabs, steaming Garlic Butter Naan, and rich Makhani gravies:`,
      highlightItems: hotDishes,
      suggestedQuestions: [
        '👑 Show Signature Dishes',
        '⭐ Top rated dishes',
        '🕒 Restaurant open and close time'
      ],
      timestamp
    };
  }

  // e.g. Celebration / Birthday / Anniversary / Party
  if (query.includes('birthday') || query.includes('anniversary') || query.includes('celebrat') || query.includes('party')) {
    const desserts = menuItems.filter(i => i.category === 'Desserts').slice(0, 3);
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `🎉 **Happy Celebration from Royal Ember!**\n\nWe love celebrating milestones with our guests! If you're celebrating a birthday or anniversary at Table ${tableNumber}, notify Waiter ${assignedWaiterName} and our team will arrange a celebratory sparkle presentation with our compliments!\n\nHere are our celebratory luxury desserts:`,
      highlightItems: desserts,
      action: {
        type: 'call_waiter',
        label: `🔔 Call Waiter ${assignedWaiterName} for Celebration`
      },
      suggestedQuestions: [
        '👑 What are your signature main courses?',
        '⭐ Highest rated dishes',
        '🕒 What are your shop timings?'
      ],
      timestamp
    };
  }

  // e.g. Fitness / Protein / Diet / Gym / Healthy
  if (query.includes('protein') || query.includes('gym') || query.includes('diet') || query.includes('healthy') || query.includes('weight') || query.includes('calorie')) {
    const highProtein = menuItems.filter(i => i.calories < 450 || i.category === 'Starters').slice(0, 3);
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `💪 **Nutritious & High-Protein Selections**\n\nEating healthy at Royal Ember is effortless! Our clay-oven tandoori grills are cooked with minimal oil and packed with pure protein and fresh herbs. Here are top recommendations for high-protein, balanced dining:`,
      highlightItems: highProtein,
      suggestedQuestions: [
        '👑 Show Signature Tandoori items',
        '⭐ Top rated foods',
        '🕒 Operating hours'
      ],
      timestamp
    };
  }

  // e.g. Wi-Fi / Internet
  if (query.includes('wifi') || query.includes('wi-fi') || query.includes('internet') || query.includes('password')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `📶 **Complimentary Guest Wi-Fi**\n\n• **Network Name (SSID):** \`RoyalEmber_Guest_5G\`\n• **Password:** \`EmberDining2026\`\n• **Speed:** High-Speed Fiber for entertainment, music, and social check-ins.\n\nFeel free to connect all your party devices during your meal!`,
      suggestedQuestions: [
        '👑 Which foods are signature?',
        '⭐ Top rated foods',
        '🕒 What are your shop timings?'
      ],
      timestamp
    };
  }

  // e.g. Parking / Location / Address / Directions
  if (query.includes('park') || query.includes('car') || query.includes('valet') || query.includes('location') || query.includes('address') || query.includes('where are you')) {
    return {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: `📍 **Location & Valet Parking**\n\n• **Location:** Royal Ember Grand Floor, Fine Dining & Banquet.\n• **Valet Service:** 100% complimentary valet parking available at our main portico entrance.\n• **Retrieval:** Hand your valet token to Waiter ${assignedWaiterName} when requesting your bill so your vehicle is ready at the porch.`,
      suggestedQuestions: [
        '🕒 What are your opening & closing hours?',
        '👑 Show Signature Dishes',
        '⭐ Highest rated foods'
      ],
      timestamp
    };
  }

  // 10. UNMATCHED / OUTSIDE QUESTION (FALLBACK)
  // Per requirement: "incase nothing match meaning show this type questions available only"
  return {
    id: `ai-${Date.now()}`,
    sender: 'ai',
    text: `👑 **Welcome to Kio AI**\n\nI am **Kio**, your dedicated Royal Ember dining assistant for Table ${tableNumber}. I specialize in our culinary creations, signature dishes, customer ratings, ingredients, and restaurant operations.\n\nI can only answer questions related to our restaurant and services. Here are the questions I can help you with:`,
    isFallback: true,
    suggestedQuestions: AVAILABLE_QUESTION_PROMPTS,
    timestamp
  };
};
