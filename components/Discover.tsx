"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";

type PublicSlot = {
  id: string;
  restaurant_name: string;
  district: string;
  address: string | null;
  description: string | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
  capacity: number;
  remaining: number;
};

const DISTRICTS = ["Hisarüstü", "Beşiktaş", "Kadıköy", "Diğer"];

const istDate = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const hm = (t: string) => t.slice(0, 5);
const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);

function dayLabel(d: string, now: Date) {
  if (d === istDate(now)) return "Bugün";
  if (d === istDate(new Date(now.getTime() + 86400000))) return "Yarın";
  return new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Sadece müşteri hesaplarının gördüğü keşif ekranı
export default function Discover() {
  const now = useNow();
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState<"time" | "discount">("time");
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Dünden itibaren olan slotları çek (saat dilimi farkı payı), listeyi sonra süzeriz
    const from = istDate(new Date(Date.now() - 86400000));
    supabase
      .from("slots_public")
      .select("*")
      .gte("slot_date", from)
      .then(({ data, error }) => {
        if (error) setError("Liste yüklenemedi: " + error.message);
        setSlots((data ?? []) as PublicSlot[]);
        setLoaded(true);
      });
  }, []);

  let list: PublicSlot[] = [];
  if (now) {
    list = slots.filter(
      (s) => s.remaining > 0 && toDate(s.slot_date, s.end_time) >= now
    );
    if (district !== "all") list = list.filter((s) => s.district === district);
    const q = query.trim().toLocaleLowerCase("tr-TR");
    if (q) list = list.filter((s) => s.restaurant_name.toLocaleLowerCase("tr-TR").includes(q));
    list = [...list].sort((a, b) =>
      sort === "discount"
        ? b.discount_percent - a.discount_percent
        : toDate(a.slot_date, a.start_time).getTime() -
          toDate(b.slot_date, b.start_time).getTime()
    );
  }

  const ready = loaded && !!now;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-[#0a4430]">İndirimli masalar</h1>
        <p className="mt-1 text-gray-600">
          Restoranların sakin saatlerinde açtığı indirimli masaları seç, rezervasyonunu yap.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          className="input"
          style={{ width: "auto", flex: "1 1 200px" }}
          placeholder="Restoran ara"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input"
          style={{ width: "auto" }}
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          aria-label="Semt"
        >
          <option value="all">Tüm semtler</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="input"
          style={{ width: "auto" }}
          value={sort}
          onChange={(e) => setSort(e.target.value as "time" | "discount")}
          aria-label="Sıralama"
        >
          <option value="time">En yakın saat</option>
          <option value="discount">En yüksek indirim</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!ready && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {ready && list.length === 0 && !error && (
        <div className="card text-center">
          <p className="font-semibold">Şu an uygun indirimli masa yok.</p>
          <p className="mt-1 text-sm text-gray-600">
            Filtreleri değiştir ya da daha sonra tekrar bak, restoranlar yeni slot açıyor.
          </p>
        </div>
      )}

      {ready && (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((s) => {
            const started = toDate(s.slot_date, s.start_time) <= now!;
            const full = Math.round(((s.capacity - s.remaining) / s.capacity) * 100);
            return (
              <div key={s.id} className="card card-hover flex flex-col gap-3" style={{ padding: 12 }}>
                <div className="ticket-tile relative h-28">
                  <span className="text-6xl">🍽️</span>
                  <div className="discount absolute right-3 top-3">
                    %{s.discount_percent}
                    <small>İNDİRİM</small>
                  </div>
                  {started && (
                    <span className="pill pill-live absolute left-3 top-3">Şu an açık</span>
                  )}
                </div>

                <div className="px-1">
                  <h2 className="font-display text-2xl font-bold leading-tight">
                    {s.restaurant_name}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-600">
                    {s.district}
                    {s.address ? ` · ${s.address}` : ""}
                  </p>
                  {s.description && <p className="mt-2 text-sm">{s.description}</p>}
                  <p className="mt-2 font-semibold">
                    {dayLabel(s.slot_date, now!)} · {hm(s.start_time)}–{hm(s.end_time)}
                  </p>
                </div>

                <div className="px-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#ece8d9]">
                    <div className="h-full rounded-full bg-[#ebb035]" style={{ width: `${full}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">Kalan kontenjan: {s.remaining} kişi</p>
                </div>

                <Link href={`/rezervasyon/${s.id}`} className="btn">
                  Rezervasyon yap
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
