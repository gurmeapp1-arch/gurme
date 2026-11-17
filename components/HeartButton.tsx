"use client";

// Favori kalbi. Kartın içindeyken tıklayınca sayfaya gitmesin diye olay durdurulur.
export default function HeartButton({
  active,
  onToggle,
  className = "",
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 text-xl shadow ${className}`}
      style={{ color: active ? "#d6336c" : "#6b7280" }}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
