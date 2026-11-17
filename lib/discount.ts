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
