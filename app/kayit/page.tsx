"use client";

import { readSource } from "@/lib/source";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { isValidPhone, roleHome } from "@/lib/roles";

const DISTRICTS = ["Hisarüstü", "Beşiktaş", "Kadıköy", "Diğer"];

function translateError(msg: string) {
  if (msg.includes("already registered")) return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
  if (msg.includes("valid email") || msg.includes("invalid")) return "Geçerli bir e-posta adresi yaz.";
  if (msg.includes("rate limit")) return "Çok fazla deneme yapıldı, biraz sonra tekrar dene.";
  return "Kayıt yapılamadı: " + msg;
}

export default function KayitPage() {
  const router = useRouter();
  const { profile } = useAuth();

  // Zaten giriş yapmış kişi kayıt sayfasında kalmasın
  useEffect(() => {
    if (profile) router.replace(roleHome(profile.role));
  }, [profile, router]);

  const [role, setRole] = useState<"diner" | "restaurant">("diner");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    restaurant_name: "",
    district: "Hisarüstü",
    address: "",
  });
  const [kvkk, setKvkk] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!kvkk) return setError("Devam etmek için aydınlatma metnini onaylamalısın.");
    if (form.password.length < 6) return setError("Şifre en az 6 karakter olmalı.");
    if (!isValidPhone(form.phone))
      return setError("Geçerli bir telefon numarası yaz (örn. 0532 123 45 67).");
    if (role === "restaurant" && !form.restaurant_name.trim())
      return setError("Restoran adını yazmalısın.");

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          role,
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          restaurant_name: form.restaurant_name.trim(),
          district: form.district,
          address: form.address.trim(),
        },
      },
    });
    setBusy(false);

    if (error) return setError(translateError(error.message));

    if (!data.session) {
      setInfo("Kayıt alındı. E-postana gelen onay bağlantısına tıkla, sonra giriş yap.");
      return;
    }

    // Hangi bağlantıdan geldiğini kaydet (SQL yaması çalışmadıysa sessizce geçilir)
    const src = readSource();
    if (src && role === "diner") await supabase.rpc("set_signup_source", { p_source: src });

    router.push(role === "restaurant" ? "/restoran" : "/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-extrabold text-[#0a4430]">Kayıt ol</h1>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("diner")}
          className={`btn ${role === "diner" ? "" : "opacity-50"}`}
        >
          Yemek yiyeceğim
        </button>
        <button
          type="button"
          onClick={() => setRole("restaurant")}
          className={`btn ${role === "restaurant" ? "" : "opacity-50"}`}
        >
          Restoranım var
        </button>
      </div>

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Ad soyad</label>
          <input className="input" required value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)} />
        </div>
        <div>
          <label className="label">E-posta</label>
          <input className="input" type="email" required value={form.email}
            onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Şifre (en az 6 karakter)</label>
          <input className="input" type="password" required value={form.password}
            onChange={(e) => set("password", e.target.value)} />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" type="tel" required placeholder="05xx xxx xx xx"
            value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>

        {role === "restaurant" && (
          <>
            <div>
              <label className="label">Restoran adı</label>
              <input className="input" value={form.restaurant_name}
                onChange={(e) => set("restaurant_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Semt</label>
              <select className="input" value={form.district}
                onChange={(e) => set("district", e.target.value)}>
                {DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Adres</label>
              <input className="input" value={form.address}
                onChange={(e) => set("address", e.target.value)} />
            </div>
            <p className="rounded-lg bg-[#f7f3e8] p-3 text-sm">
              Restoran kaydın, yönetici onayından sonra yayına girer.
            </p>
          </>
        )}

        <details className="rounded-lg bg-[#f7f3e8] p-3 text-sm">
          <summary className="cursor-pointer font-semibold">
            KVKK Aydınlatma Metni (oku)
          </summary>
          <p className="mt-2">
            Gurme, rezervasyon hizmetini sunmak için ad soyad, telefon ve e-posta
            bilgilerini işler. Bilgilerin yalnızca rezervasyon yaptığın restoranla
            ve Gurme yönetimiyle paylaşılır, üçüncü kişilere satılmaz. Bu bir okul
            projesi kapsamında yürütülen pilot çalışmadır. Verilerinin silinmesi
            için bize başvurabilirsin.{" "}
            <Link href="/gizlilik" target="_blank" className="font-semibold underline">
              Tam metni oku
            </Link>
          </p>
        </details>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={kvkk}
            onChange={(e) => setKvkk(e.target.checked)} className="mt-1" />
          <span>Aydınlatma metnini okudum, kişisel verilerimin işlenmesini kabul ediyorum.</span>
        </label>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{info}</p>}

        <button className="btn w-full" disabled={busy}>
          {busy ? "Kaydediliyor..." : "Kayıt ol"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-semibold underline">Giriş yap</Link>
      </p>
    </div>
  );
}
