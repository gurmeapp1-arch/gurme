// Doluluk çubuğu: boşken yeşil, dolmaya yaklaştıkça sarı, sonra kırmızı
export function fillColor(pct: number) {
  if (pct >= 80) return "#dc2626";
  if (pct >= 50) return "#f5a623";
  return "#16a34a";
}

export default function CapacityBar({
  booked,
  capacity,
  className = "",
}: {
  booked: number;
  capacity: number;
  className?: string;
}) {
  const pct = capacity > 0 ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full bg-gray-100 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={booked}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${Math.max(pct, booked > 0 ? 6 : 0)}%`, backgroundColor: fillColor(pct) }}
      />
    </div>
  );
}
