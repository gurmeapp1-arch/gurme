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
      className="mb-3 inline-flex min-h-[40px] items-center gap-1 rounded-lg pr-3 text-sm font-semibold text-[#0a4430] md:hidden"
      aria-label="Geri dön"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ←
      </span>
      Geri
    </button>
  );
}
