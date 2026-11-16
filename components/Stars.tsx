"use client";

// Sadece gösterim: ★★★★☆
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span
      className="inline-flex text-[#e0a200]"
      style={{ fontSize: size, letterSpacing: 1 }}
      role="img"
      aria-label={`5 üzerinden ${value}`}
    >
      {"★".repeat(full)}
      <span className="text-[#d6d1c0]">{"★".repeat(5 - full)}</span>
    </span>
  );
}

// Seçilebilir yıldızlar
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Puan">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} yıldız`}
          onClick={() => onChange(n)}
          className="text-3xl leading-none"
          style={{ color: n <= value ? "#e0a200" : "#d6d1c0" }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Ortalama puan + yorum sayısı
export function RatingBadge({
  avg,
  count,
}: {
  avg: number | null | undefined;
  count: number | null | undefined;
}) {
  if (!avg || !count) return <span className="text-xs text-gray-500">Henüz yorum yok</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold">
      <span className="text-[#e0a200]">★</span>
      {avg.toFixed(1)}
      <span className="font-normal text-gray-500">({count})</span>
    </span>
  );
}
