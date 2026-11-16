"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// Restoran adından kısa bir kaynak etiketi üretir (ör. "Kafe Mola" -> "kafe-mola")
function slugify(name: string) {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return name
    .toLowerCase()
    .replace(/[çğıöşü]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export default function QrCard({ restaurantName }: { restaurantName: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/?kaynak=${slugify(restaurantName) || "restoran"}` : "";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Tanıtım kartı</h2>
        <p className="text-sm text-gray-500">
          Yazdır, kasaya ve masalara koy. Okutan müşteri kayıt olur, hangi restorandan geldiği
          kaydedilir.
        </p>
      </div>

      <div className="print-area mx-auto max-w-sm rounded-2xl bg-white p-8 text-center ring-1 ring-gray-200">
        <p className="text-sm font-semibold text-[#14664a]">{restaurantName}</p>
        <h3 className="mt-1 text-2xl font-extrabold leading-tight text-[#0a4430]">
          İndirimli rezervasyon
        </h3>
        <p className="mt-2 text-gray-600">QR kodu okut, kayıt ol, yerini ayır.</p>
        <div className="mt-5 flex justify-center">
          {link ? (
            <QRCodeSVG value={link} size={200} level="M" />
          ) : (
            <div className="h-[200px] w-[200px]" />
          )}
        </div>
        <p className="mt-4 text-sm font-bold text-[#0a4430]">Gurme</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => window.print()} className="btn">
          Yazdır
        </button>
      </div>
      {link && <p className="break-all text-center text-xs text-gray-500">{link}</p>}
    </div>
  );
}
