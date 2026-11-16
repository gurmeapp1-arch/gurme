"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/sifre-yenile`,
    });
    setBusy(false);

    if (err) {
      if (err.message.toLowerCase().includes("rate limit"))
        return setError("Kısa sürede çok fazla istek yapıldı. Birkaç dakika bekleyip tekrar dene.");
      return setError("Bağlantı gönderilemedi: " + err.message);
    }
    // Hesap var mı yok mu belli etmemek için her durumda aynı mesaj
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display mb-6 text-4xl font-extrabold text-[#0a4430]">Şifremi unuttum</h1>

      {sent ? (
        <div className="card space-y-3">
          <p className="font-semibold">E-postanı kontrol et.</p>
          <p className="text-sm text-gray-700">
            Bu adrese kayıtlı bir hesap varsa şifre yenileme bağlantısı gönderdik. Bağlantıyı{" "}
            <strong>bu cihazdaki ve bu tarayıcıdaki</strong> e-postandan aç. Gelmediyse spam
            klasörüne bak.
          </p>
          <Link href="/giris" className="btn btn-sm inline-block">
            Girişe dön
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="card space-y-4">
          <p className="text-sm text-gray-700">
            Hesabının e-posta adresini yaz, sana şifreni yenileyebileceğin bir bağlantı gönderelim.
          </p>
          <div>
            <label className="label">E-posta</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button className="btn w-full" disabled={busy}>
            {busy ? "Gönderiliyor..." : "Bağlantı gönder"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href="/giris" className="font-semibold underline">
          Girişe dön
        </Link>
      </p>
    </div>
  );
}
