"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { useAuth } from "@/components/AuthProvider";

type Restaurant = { id: string; name: string; district: string; approved: boolean };
type Slot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  capacity: number;
};
type Status = "confirmed" | "cancelled" | "attended" | "no_show";
type Reservation = {
  id: string;
  code: string;
  slot_id: string;
  party_size: number;
  reservation_name: string;
  phone: string;
  status: Status;
};

const STATUS_LABEL: Record<Status, string> = {
  confirmed: "Bekleniyor",
  cancelled: "İptal",
  attended: "Geldi",
  no_show: "Gelmedi",
};

const istDate = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const hm = (t: string) => t.slice(0, 5);
const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);
const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export default function RestoranPage() {
  const { user, profile, loading } = useAuth();
  const now = useNow();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    slot_date: "",
    start_time: "14:00",
    end_time: "17:30",
    discount_percent: "40",
    capacity: "20",
  });

  // Tarih alanına varsayılan olarak bugünü yaz (sayfa tarayıcıda açılınca)
  useEffect(() => {
    setForm((f) => (f.slot_date ? f : { ...f, slot_date: istDate(new Date()) }));
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data: r } = await supabase
      .from("restaurants")
      .select("id, name, district, approved")
      .eq("owner_id", user.id)
      .maybeSingle();
    const rest = r as Restaurant | null;
    setRestaurant(rest);
    if (!rest || !rest.approved) return;

    const from = istDate(new Date(Date.now() - 14 * 86400000));
    const { data: s } = await supabase
      .from("slots")
      .select("id, slot_date, start_time, end_time, discount_percent, capacity")
      .eq("restaurant_id", rest.id)
      .gte("slot_date", from)
      .order("slot_date")
      .order("start_time");
    const slotList = (s ?? []) as Slot[];
    setSlots(slotList);

    if (slotList.length === 0) {
      setReservations([]);
      return;
    }
    const { data: rv } = await supabase
      .from("reservations")
      .select("id, code, slot_id, party_size, reservation_name, phone, status")
      .in("slot_id", slotList.map((x) => x.id))
      .order("created_at");
    setReservations((rv ?? []) as Reservation[]);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!restaurant) return;

    const discount = Number(form.discount_percent);
    const capacity = Number(form.capacity);
    if (form.end_time <= form.start_time)
      return setMsg("Bitiş saati, başlangıç saatinden sonra olmalı.");
    if (!(discount >= 5 && discount <= 70))
      return setMsg("İndirim oranı %5 ile %70 arasında olmalı.");
    if (!(capacity >= 1)) return setMsg("Kontenjan en az 1 kişi olmalı.");
    if (toDate(form.slot_date, form.end_time) <= new Date())
      return setMsg("Geçmiş bir saat için slot açamazsın.");

    setBusy(true);
    const { error } = await supabase.from("slots").insert({
      restaurant_id: restaurant.id,
      slot_date: form.slot_date,
      start_time: form.start_time,
      end_time: form.end_time,
      discount_percent: discount,
      capacity,
    });
    setBusy(false);
    if (error) return setMsg("Slot açılamadı: " + error.message);
    await loadAll();
  }

  async function deleteSlot(id: string) {
    setMsg("");
    if (!confirm("Bu slot silinsin mi?")) return;
    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) setMsg("Rezervasyonu olan slot silinemez.");
    else loadAll();
  }

  async function mark(id: string, status: "attended" | "no_show") {
    setMsg("");
    const { error } = await supabase.rpc("mark_attendance", {
      p_id: id,
      p_status: status,
    });
    if (error) setMsg(error.message);
    else loadAll();
  }

  if (loading) return <p>Yükleniyor...</p>;
  if (!user)
    return (
      <p>
        Bu sayfayı görmek için <Link href="/giris" className="underline">giriş yap</Link>.
      </p>
    );
  if (profile && profile.role !== "restaurant")
    return <p>Bu sayfa sadece restoran hesapları içindir.</p>;
  if (!restaurant || !now) return <p>Yükleniyor...</p>;

  if (!restaurant.approved)
    return (
      <div className="card">
        <h1 className="text-2xl font-extrabold text-[#0a4430]">{restaurant.name}</h1>
        <p className="mt-3">
          Kaydın alındı ve yönetici onayı bekliyor. Onaylandığında bu sayfadan
          indirim slotu açabileceksin.
        </p>
      </div>
    );

  const upcoming = slots.filter((s) => toDate(s.slot_date, s.end_time) >= now);
  const past = slots
    .filter((s) => toDate(s.slot_date, s.end_time) < now)
    .reverse();

  const renderSlot = (s: Slot) => {
    const list = reservations.filter((r) => r.slot_id === s.id);
    const booked = list
      .filter((r) => r.status !== "cancelled")
      .reduce((n, r) => n + r.party_size, 0);
    const started = toDate(s.slot_date, s.start_time) <= now;

    return (
      <div key={s.id} className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bold">
              {fmtDate(s.slot_date)} · {hm(s.start_time)}–{hm(s.end_time)}
            </p>
            <p className="text-sm text-gray-600">
              Kontenjan: {booked}/{s.capacity} kişi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#ebb035] px-3 py-1 text-sm font-bold text-[#0a4430]">
              %{s.discount_percent} indirim
            </span>
            <button onClick={() => deleteSlot(s.id)} className="text-sm text-red-700 underline">
              Sil
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Henüz rezervasyon yok.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {list.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <span className="font-mono font-bold">{r.code}</span> · {r.reservation_name} ·{" "}
                  {r.party_size} kişi ·{" "}
                  <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#f7f3e8] px-2 py-0.5 font-semibold">
                    {STATUS_LABEL[r.status]}
                  </span>
                  {started && r.status !== "cancelled" && (
                    <>
                      <button
                        onClick={() => mark(r.id, "attended")}
                        className="btn btn-sm"
                        style={{ opacity: r.status === "attended" ? 1 : 0.6 }}
                      >
                        Geldi
                      </button>
                      <button
                        onClick={() => mark(r.id, "no_show")}
                        className="btn btn-sm"
                        style={{ background: "#9b2c2c", opacity: r.status === "no_show" ? 1 : 0.6 }}
                      >
                        Gelmedi
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a4430]">{restaurant.name}</h1>
        <p className="text-gray-600">{restaurant.district} · Restoran paneli</p>
      </div>

      <form onSubmit={createSlot} className="card space-y-4">
        <h2 className="text-xl font-bold">Yeni indirim slotu aç</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tarih</label>
            <input type="date" className="input" required min={istDate(now)}
              value={form.slot_date} onChange={(e) => set("slot_date", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Başlangıç</label>
              <input type="time" className="input" required value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)} />
            </div>
            <div>
              <label className="label">Bitiş</label>
              <input type="time" className="input" required value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">İndirim oranı (%)</label>
            <input type="number" className="input" required min={5} max={70}
              value={form.discount_percent} onChange={(e) => set("discount_percent", e.target.value)} />
          </div>
          <div>
            <label className="label">Kontenjan (kişi)</label>
            <input type="number" className="input" required min={1}
              value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
          </div>
        </div>
        <button className="btn btn-gold" disabled={busy}>
          {busy ? "Açılıyor..." : "Slotu aç"}
        </button>
        <p className="text-sm text-gray-600">
          Müşteri rezervasyon kodunu masada gösterir, indirimi sen kasada uygularsın.
        </p>
      </form>

      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Yaklaşan ve devam eden slotlar</h2>
        {upcoming.length === 0 && <p className="text-gray-600">Henüz açık slotun yok.</p>}
        {upcoming.map(renderSlot)}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Geçmiş slotlar (son 14 gün)</h2>
          {past.map(renderSlot)}
        </section>
      )}
    </div>
  );
}