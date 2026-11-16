"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageSpinner } from "@/components/RoleGuard";

type State = "checking" | "ready" | "invalid" | "done";

export default function SifreYenilePage() {
  const router = useRouter();
  const [state, setState] = useState<State>("checking");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // E-postadaki bağlantıdan gelen kişi için geçici oturum açılır; açıldığını bekleriz
  useEffect(() => {
    let found = false;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        found = true;
        setState((s) => (s === "done" ? s : "ready"));
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        found = true;
        setState((s) => (s === "done" ? s : "ready"));
      }
    });
    const t = setTimeout(() => {
      if (!found) setState("invalid");
    }, 5000);
    return () => {
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (password !== again) return setError("İki şifre aynı değil.");

    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      return setError(
        err.message.includes("different from the old")
          ? "Yeni şifren eskisinden farklı olmalı."
          : "Şifre değiştirilemedi: " + err.message
      );
    }
    setState("done");
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  }

  if (state === "checking") return <PageSpinner />;

  if (state === "invalid")
    return (
      <div className="mx-auto max-w-md space-y-3 card">
        <h1 className="font-display text-3xl font-extrabold text-[#0a4430]">Bağlantı geçersiz</h1>
        <p className="text-sm text-gray-700">
          Bu bağlantının süresi dolmuş ya da başka bir cihazda açılmış olabilir. Şifre yenileme
          bağlantısını isteği yaptığın aynı cihaz ve tarayıcıda aç. İstersen yeni bir bağlantı iste.
        </p>
        <Link href="/sifremi-unuttum" className="btn btn-sm inline-block">
          Yeni bağlantı iste
        </Link>
      </div>
    );

  if (state === "done")
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-display text-2xl font-extrabold text-[#0a4430]">Şifren değişti!</p>
        <p className="mt-1 text-sm text-gray-600">Ana sayfaya yönlendiriliyorsun...</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display mb-6 text-4xl font-extrabold text-[#0a4430]">Yeni şifre belirle</h1>
      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Yeni şifre (en az 6 karakter)</label>
          <input
            className="input"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Yeni şifre (tekrar)</label>
          <input
            className="input"
            type="password"
            required
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button className="btn w-full" disabled={busy}>
          {busy ? "Kaydediliyor..." : "Şifreyi değiştir"}
        </button>
      </form>
    </div>
  );
}
