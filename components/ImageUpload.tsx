"use client";

import { useState } from "react";
import { uploadRestaurantImage } from "@/lib/image";

export default function ImageUpload({
  label,
  hint,
  value,
  kind,
  restaurantId,
  onSaved,
}: {
  label: string;
  hint?: string;
  value: string | null;
  kind: "cover" | "logo";
  restaurantId: string;
  onSaved: (url: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadRestaurantImage(restaurantId, kind, file);
      await onSaved(url);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  const round = kind === "logo";

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden bg-[#f1ecdc] text-3xl ${
            round ? "h-16 w-16 rounded-full" : "h-24 w-40 rounded-xl"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{round ? "🏪" : "🍽️"}</span>
          )}
        </div>
        <div>
          <label className="btn btn-sm inline-block cursor-pointer">
            {busy ? "Yükleniyor..." : value ? "Değiştir" : "Fotoğraf seç"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={pick}
              disabled={busy}
            />
          </label>
          {hint && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
        </div>
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
