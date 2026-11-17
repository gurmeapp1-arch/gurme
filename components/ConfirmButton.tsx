"use client";

import { useState } from "react";

// Tarayıcının confirm() penceresi yerine sayfa içinde "Emin misin?" sorar.
// (Telefonlarda ve uygulama içi tarayıcılarda açılır pencereler bazen hiç çıkmıyor.)
export default function ConfirmButton({
  label,
  question,
  confirmLabel = "Evet",
  onConfirm,
  className = "",
}: {
  label: string;
  question: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="font-semibold">{question}</span>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="rounded-full bg-red-600 px-3 py-1.5 font-semibold text-white"
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="px-1 text-gray-600 underline">
        Vazgeç
      </button>
    </span>
  );
}
