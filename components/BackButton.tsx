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
      className="fixed bottom-28 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#0a4430] text-2xl font-bold text-white shadow-lg ring-1 ring-white/20 active:scale-95 md:hidden"
      aria-label="Geri dön"
    >
      <span aria-hidden="true" className="leading-none">
        ←
      </span>
    </button>
  );
}
