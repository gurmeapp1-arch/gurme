// Restoran türleri (veritabanındaki kontrol listesiyle aynı olmalı)
export const CATEGORIES = ["Restoran", "Kafe", "Fast food", "Tatlı ve pastane", "Kahvaltı"] as const;
export type Category = (typeof CATEGORIES)[number];
