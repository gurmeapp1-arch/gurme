"use client";

import { useRouter } from "next/navigation";

// Telefonda sayfanın üstünde görünen geri düğmesi. Geçmiş yoksa verilen sayfaya gider.
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-[#0a4430] shadow-md ring-1 ring-gray-200 active:scale-95"
      aria-label="Geri dön"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 5l-7 7 7 7" />
      </svg>
    </button>
  );
}
