import { Trip } from "@/hooks/useDatabase";

/**
 * מפת aliases של אמצעי תשלום - מיפוי משמות שונים לשם אחיד
 * שים לב: קובץ זה מטפל רק באמצעי תשלום, לא במקורות הזמנה
 */
export const PAYMENT_METHOD_ALIASES: Record<string, string> = {
  'cash': 'מזומן',
  'card': 'אשראי',
  'כרטיס': 'אשראי'
};

/**
 * נרמול שם אמצעי תשלום לפי aliases
 */
export function normalizePaymentMethod(method: string): string {
  return PAYMENT_METHOD_ALIASES[method] || method;
}

/**
 * קבלת רשימת כל אמצעי התשלום הייחודיים מרשימת נסיעות
 * @param trips - מערך נסיעות
 * @returns מערך של אמצעי תשלום ייחודיים (מנורמלים)
 */
export function getUniquePaymentMethods(trips: Trip[]): string[] {
  const methods = new Set<string>();
  
  trips.forEach(trip => {
    if (trip.payment_method) {
      const normalized = normalizePaymentMethod(trip.payment_method);
      methods.add(normalized);
    }
  });
  
  return Array.from(methods).sort();
}

/**
 * קבלת תווית להצגה של אמצעי תשלום
 */
export function getPaymentMethodDisplayLabel(method: string): string {
  const normalized = normalizePaymentMethod(method);
  
  const displayLabels: Record<string, string> = {
    'מזומן': '💵 מזומן',
    'אשראי': '💳 אשראי',
    'דהרי': '🚖 דהרי',
    'ביט': '📱 ביט',
    'גט': '📲 גט',
  };
  
  return displayLabels[normalized] || `💰 ${normalized}`;
}

/**
 * קבלת אייקון לאמצעי תשלום
 */
export function getPaymentMethodIcon(method: string): string {
  const normalized = normalizePaymentMethod(method);
  
  const icons: Record<string, string> = {
    'מזומן': '💵',
    'אשראי': '💳',
    'דהרי': '🚖',
    'ביט': '📱',
    'גט': '📲',
  };
  
  return icons[normalized] || '💰';
}

/**
 * קיבוץ נסיעות לפי אמצעי תשלום מנורמל
 */
export function groupTripsByPaymentMethod(trips: Trip[]): Map<string, Trip[]> {
  const grouped = new Map<string, Trip[]>();
  
  trips.forEach(trip => {
    const normalized = normalizePaymentMethod(trip.payment_method);
    if (!grouped.has(normalized)) {
      grouped.set(normalized, []);
    }
    grouped.get(normalized)!.push(trip);
  });
  
  return grouped;
}
