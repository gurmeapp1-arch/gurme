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
      className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-2xl font-bold text-[#0a4430] shadow-md ring-1 ring-gray-200 active:scale-95 md:hidden"
      aria-label="Geri dön"
    >
      <span aria-hidden="true" className="leading-none">
        ←
      </span>
    </button>
  );
}
