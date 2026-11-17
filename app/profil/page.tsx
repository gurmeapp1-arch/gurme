"use client";

import { useEffect, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { isValidPhone } from "@/lib/roles";

type Msg = { ok: boolean; text: string } | null;

export default function ProfilPage() {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<Msg>(null);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (name.trim().length < 2) return setMsg({ ok: false, text: "Ad soyadını yaz." });
    if (phone.trim() && !isValidPhone(phone))
      return setMsg({ ok: false, text: "Geçerli bir telefon numarası yaz (örn. 0532 123 45 67)." });

    setBusy(true);
    const { error } = await supabase.rpc("update_my_profile", {
      p_full_name: name.trim(),
      p_phone: phone.trim(),
    });
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: "Kaydedilemedi: " + error.message });
    }
    // Üst menüdeki adın da güncellenmesi için oturum bilgisini tazele
    await supabase.auth.updateUser({ data: { full_name: name.trim(), phone: phone.trim() } });
    setBusy(false);
    setMsg({ ok: true, text: "Bilgilerin kaydedildi." });
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.length < 6) return setPwMsg({ ok: false, text: "Şifre en az 6 karakter olmalı." });
    if (pw !== pw2) return setPwMsg({ ok: false, text: "İki şifre aynı değil." });
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error)
      return setPwMsg({
        ok: false,
        text: error.message.includes("different from the old")
          ? "Yeni şifren eskisinden farklı olmalı."
          : "Şifre değiştirilemedi: " + error.message,
      });
    setPw("");
    setPw2("");
    setPwMsg({ ok: true, text: "Şifren değişti." });
  }

  const box = (m: Msg) =>
    m && (
      <p
        className={`rounded-lg p-3 text-sm ${
          m.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
        }`}
      >
        {m.text}
      </p>
    );

  return (
    <div className="mx-auto max-w-md space-y-6">
      <BackButton fallback="/" />
      <h1 className="text-3xl font-extrabold text-[#0a4430]">Profilim</h1>

      <form onSubmit={saveProfile} className="card space-y-4">
        <div>
          <label className="label">E-posta</label>
          <input className="input" value={user?.email ?? ""} disabled />
          <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez.</p>
        </div>
        <div>
          <label className="label">Ad soyad</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input
            className="input"
            type="tel"
            placeholder="05xx xxx xx xx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Rezervasyon yaparken otomatik dolsun diye kaydedilir.
          </p>
        </div>
        {box(msg)}
        <button className="btn w-full" disabled={busy}>
          {busy ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      <form onSubmit={savePassword} className="card space-y-4">
        <h2 className="text-lg font-bold">Şifre değiştir</h2>
        <div>
          <label className="label">Yeni şifre (en az 6 karakter)</label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Yeni şifre (tekrar)</label>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </div>
        {box(pwMsg)}
        <button className="btn w-full" disabled={pwBusy}>
          {pwBusy ? "Kaydediliyor..." : "Şifreyi değiştir"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Hesabını silmek ya da verilerin hakkında soru sormak için{" "}
        <Link href="/gizlilik" className="underline">
          Gizlilik ve KVKK
        </Link>{" "}
        sayfasına bak.
      </p>
    </div>
  );
}
