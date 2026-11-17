"use client";

import { useState } from "react";

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

// Seçilebilir yıldızlar: dokunup parmağı kaydırarak puan seçilir (1-5)
export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [active, setActive] = useState(false);

  function fromPointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const n = Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
    if (n !== value) onChange(n);
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label="Puan"
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={value || undefined}
      className="inline-flex w-full max-w-[260px] cursor-pointer select-none justify-between"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setActive(true);
        fromPointer(e);
      }}
      onPointerMove={(e) => active && fromPointer(e)}
      onPointerUp={() => setActive(false)}
      onPointerCancel={() => setActive(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(5, (value || 0) + 1));
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(1, (value || 2) - 1));
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          className="text-[44px] leading-none transition-transform"
          style={{
            color: n <= value ? "#e0a200" : "#d6d1c0",
            transform: active && n === value ? "scale(1.15)" : "scale(1)",
          }}
        >
          ★
        </span>
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
