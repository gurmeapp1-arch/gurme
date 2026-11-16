"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useNow } from "@/lib/useNow";
import { isValidPhone } from "@/lib/roles";

type PublicSlot = {
  id: string;
  restaurant_name: string;
  district: string;
  address: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  remaining: number;
};

const hm = (t: string) => t.slice(0, 5);
const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);

function RezervasyonForm() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const now = useNow();

  const [slot, setSlot] = useState<PublicSlot | null | undefined>(undefined);
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("slots_public")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => setSlot((data as PublicSlot) ?? null));
  }, [id]);

  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.full_name);
      setPhone((p) => p || profile.phone || "");
    }
  }, [profile]);

  if (slot === undefined || loading || !now) return <p>Yükleniyor...</p>;
  if (slot === null) return <p>Bu slot bulunamadı.</p>;

  if (!user)
    return (
      <div className="card">
        <p>
          Rezervasyon yapmak için{" "}
          <Link href="/giris" className="font-semibold underline">giriş yap</Link> veya{" "}
          <Link href="/kayit" className="font-semibold underline">kayıt ol</Link>.
        </p>
      </div>
    );

  if (profile && profile.role !== "diner")
    return <p>Rezervasyon sadece müşteri hesaplarıyla yapılabilir.</p>;

  const ended = toDate(slot.slot_date, slot.end_time) < now;
  const maxParty = Math.max(1, Math.min(10, slot.remaining));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setError("");
    if (!name.trim()) return setError("Rezervasyon adını yazmalısın.");
    if (!isValidPhone(phone))
      return setError("Geçerli bir telefon numarası yaz (örn. 0532 123 45 67).");
    setBusy(true);
    const { error: err } = await supabase.rpc("book_reservation", {
      p_slot_id: slot.id,
      p_party_size: party,
      p_name: name.trim(),
      p_phone: phone.trim(),
    });
    setBusy(false);
    if (err) return setError(err.message);
    router.push("/rezervasyonlarim");
    router.refresh();
  }

  const dateText = new Date(`${slot.slot_date}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-[#0a4430]">{slot.restaurant_name}</h1>
        <p className="text-sm text-gray-600">
          {slot.district}
          {slot.address ? ` · ${slot.address}` : ""}
        </p>
        <p className="mt-3 font-semibold">
          {dateText} · {hm(slot.start_time)}–{hm(slot.end_time)}
        </p>
        <p className="mt-1">
          <span className="rounded-full bg-[#ebb035] px-3 py-1 font-bold text-[#0a4430]">
            %{slot.discount_percent} indirim
          </span>
        </p>
        <p className="mt-3 text-sm text-gray-600">
          Bu saatler içinde istediğin zaman gelebilirsin. İndirim, ödeme sırasında
          restoranda kodunla uygulanır.
        </p>
      </div>

      {ended || slot.remaining <= 0 ? (
        <p className="card">
          {ended ? "Bu slot sona erdi." : "Bu slotta yer kalmadı."}
        </p>
      ) : (
        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Kişi sayısı (en fazla {maxParty})</label>
            <select className="input" value={party}
              onChange={(e) => setParty(Number(e.target.value))}>
              {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} kişi</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Rezervasyon adı</label>
            <input className="input" required value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" type="tel" required value={phone}
              onChange={(e) => setPhone(e.target.value)} />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <button className="btn btn-gold w-full" disabled={busy}>
            {busy ? "Rezervasyon yapılıyor..." : "Rezervasyonu onayla"}
          </button>
          <p className="text-xs text-gray-600">
            Rezervasyona 2 saat kalana kadar ücretsiz iptal edebilirsin.
          </p>
        </form>
      )}
    </div>
  );
}
export default function RezervasyonPage() {
  return (
    <Suspense fallback={<p>Yükleniyor...</p>}>
      <RezervasyonForm />
    </Suspense>
  );
}