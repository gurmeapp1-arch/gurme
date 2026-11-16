"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-extrabold text-[#0a4430]">Giriş yap</h1>

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
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button className="btn w-full" disabled={busy}>
          {busy ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-semibold underline">Kayıt ol</Link>
      </p>
    </div>
  );
}
