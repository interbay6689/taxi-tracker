import { Trip } from "@/hooks/database/types";

/**
 * מפת aliases של מקורות הזמנה - מיפוי משמות שונים לשם אחיד
 */
export const ORDER_SOURCE_ALIASES: Record<string, string> = {
  'get': 'גט',
  'GetTaxi': 'גט',
  'casual': 'מזדמן',
  'dahari': 'דהרי',
  'yango': 'יאנגו',
  'station': 'תחנה'
};

/**
 * נרמול שם מקור הזמנה לפי aliases
 */
export function normalizeOrderSource(source: string): string {
  return ORDER_SOURCE_ALIASES[source] || source;
}

/**
 * קבלת רשימת כל מקורות ההזמנה הייחודיים מרשימת נסיעות
 * @param trips - מערך נסיעות
 * @returns מערך של מקורות הזמנה ייחודיים (מנורמלים)
 */
export function getUniqueOrderSources(trips: Trip[]): string[] {
  const sources = new Set<string>();
  
  trips.forEach(trip => {
    if (trip.order_source) {
      const normalized = normalizeOrderSource(trip.order_source);
      sources.add(normalized);
    }
  });
  
  return Array.from(sources).sort();
}

/**
 * קבלת תווית להצגה של מקור הזמנה
 */
export function getOrderSourceDisplayLabel(source: string): string {
  const normalized = normalizeOrderSource(source);
  
  const displayLabels: Record<string, string> = {
    'גט': '🚖 גט',
    'דהרי': '🚕 דהרי',
    'מזדמן': '👋 מזדמן',
    'יאנגו': '🚗 יאנגו',
    'תחנה': '📍 תחנה',
  };
  
  return displayLabels[normalized] || `📋 ${normalized}`;
}

/**
 * קבלת אייקון למקור הזמנה
 */
export function getOrderSourceIcon(source: string): string {
  const normalized = normalizeOrderSource(source);
  
  const icons: Record<string, string> = {
    'גט': '🚖',
    'דהרי': '🚕',
    'מזדמן': '👋',
    'יאנגו': '🚗',
    'תחנה': '📍',
  };
  
  return icons[normalized] || '📋';
}

/**
 * קיבוץ נסיעות לפי מקור הזמנה מנורמל
 */
export function groupTripsByOrderSource(trips: Trip[]): Map<string, Trip[]> {
  const grouped = new Map<string, Trip[]>();
  
  trips.forEach(trip => {
    const normalized = normalizeOrderSource(trip.order_source);
    if (!grouped.has(normalized)) {
      grouped.set(normalized, []);
    }
    grouped.get(normalized)!.push(trip);
  });
  
  return grouped;
}

/**
 * קבלת צבע למקור הזמנה (לגרפים)
 */
export function getOrderSourceColor(source: string, index: number): string {
  const normalized = normalizeOrderSource(source);
  
  const colors: Record<string, string> = {
    'גט': 'hsl(220, 70%, 50%)',
    'דהרי': 'hsl(280, 70%, 50%)',
    'מזדמן': 'hsl(160, 70%, 50%)',
    'יאנגו': 'hsl(30, 70%, 50%)',
    'תחנה': 'hsl(340, 70%, 50%)',
  };
  
  return colors[normalized] || `hsl(${(index * 360) / 8}, 70%, 50%)`;
}
