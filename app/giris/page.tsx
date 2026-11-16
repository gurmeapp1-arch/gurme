"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { roleHome } from "@/lib/roles";

// Giriş sonrası dönülecek sayfa (?next=/rezervasyon/...). Sadece site içi yollar kabul edilir.
function safeNext(): string | null {
  try {
    const n = new URLSearchParams(window.location.search).get("next");
    return n && n.startsWith("/") && !n.startsWith("//") ? n : null;
  } catch {
    return null;
  }
}

export default function GirisPage() {
  const router = useRouter();
  const { profile } = useAuth();

  // Zaten giriş yapmış kişi giriş sayfasında kalmasın, kendi ana sayfasına gitsin
  useEffect(() => {
    if (profile) router.replace(profile.role === "diner" ? safeNext() ?? "/" : roleHome(profile.role));
  }, [profile, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [nextQuery, setNextQuery] = useState("");
  useEffect(() => {
    const n = safeNext();
    setNextQuery(n ? `?next=${encodeURIComponent(n)}` : "");
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) {
      setError(
        error.message.includes("Email not confirmed")
          ? "E-postanı henüz onaylamadın. Gelen kutunu kontrol et."
          : "E-posta veya şifre hatalı."
      );
      return;
    }

    router.push(safeNext() ?? "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display mb-6 text-4xl font-extrabold text-[#0a4430]">Giriş yap</h1>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">E-posta</label>
          <input className="input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Şifre</label>
          <input className="input" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-right text-sm">
            <Link href="/sifremi-unuttum" className="font-semibold underline">
              Şifremi unuttum
            </Link>
          </p>
        </div>

        {error &&<p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button className="btn w-full" disabled={busy}>
          {busy ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Hesabın yok mu?{" "}
        <Link href={`/kayit${nextQuery}`} className="font-semibold underline">Kayıt ol</Link>
      </p>
    </div>
  );
}
