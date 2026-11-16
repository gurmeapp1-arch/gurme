"use client";

// Beklenmeyen bir hata olursa siyah/beyaz boş ekran yerine anlaşılır bir mesaj göster
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md text-center">
      <p className="text-lg font-bold">Bir şeyler ters gitti.</p>
      <p className="mt-1 text-sm text-gray-600">Sayfayı yeniden dene. Düzelmezse bize WhatsApp&apos;tan yaz.</p>
      <button onClick={reset} className="btn btn-sm mt-4">
        Tekrar dene
      </button>
    </div>
  );
}
