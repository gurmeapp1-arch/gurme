// Basamaklı indirim yardımcıları
type Steps = { discount_percent: number; discount_far?: number | null; discount_mid?: number | null };

// Restoran tarafı: "%40 → %30 → %20" ya da sabitse "%20"
export function stepsText(s: Steps): string {
  const parts = [s.discount_far, s.discount_mid, s.discount_percent].filter(
    (x): x is number => typeof x === "number"
  );
  return parts.map((p) => `%${p}`).join(" → ");
}

// Müşteri tarafı: "Cmt 14:00 itibarıyla indirim: %30" (yoksa null)
export function nextChangeText(next: number | null | undefined, at: string | null | undefined) {
  if (next == null || !at) return null;
  const d = new Date(at);
  const label = d.toLocaleString("tr-TR", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
  return `${label} itibarıyla indirim: %${next}`;
}

const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

// Esnaf sadece başlangıç indirimini yazar, düşüşü biz hesaplarız: d → %75'i → %50'si.
// Slota kalan süreye göre: 48+ saat varsa 3 basamak, 24-48 saat varsa 2, daha azsa sabit.
export function autoSteps(d: number, hoursAway: number) {
  const mid = Math.min(d, r5(d * 0.75));
  const low = Math.min(mid, r5(d * 0.5));
  if (hoursAway > 48) return { far: d, mid, base: low };
  if (hoursAway > 24) return { far: null, mid: d, base: low };
  return { far: null, mid: null, base: d };
}
