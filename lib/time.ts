// Türkiye saati (UTC+3, yaz saati uygulaması yok) ile tarih yardımcıları

export const istDate = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

export const hm = (t: string) => t.slice(0, 5);

export const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);

export const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

// "YYYY-MM-DD" tarihine gün ekler
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 0 = Pazar ... 6 = Cumartesi
export const weekdayOf = (date: string): number => new Date(`${date}T12:00:00Z`).getUTCDay();

export const WEEKDAYS = [
  { d: 1, label: "Pzt" },
  { d: 2, label: "Sal" },
  { d: 3, label: "Çar" },
  { d: 4, label: "Per" },
  { d: 5, label: "Cum" },
  { d: 6, label: "Cmt" },
  { d: 0, label: "Paz" },
];
