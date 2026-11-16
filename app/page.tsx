"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { useAuth } from "@/components/AuthProvider";

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

export default function Home() {
  const { user, loading } = useAuth();
  const now = useNow();
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState<"time" | "discount">("time");

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
    list = [...list].sort((a, b) =>
      sort === "discount"
        ? b.discount_percent - a.discount_percent
        : toDate(a.slot_date, a.start_time).getTime() -
          toDate(b.slot_date, b.start_time).getTime()
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[#0a4430] px-8 py-10 text-white">
        <h1 className="text-4xl font-extrabold text-[#ebb035]">Gurme</h1>
        <p className="mt-2 text-2xl font-bold">Her masa saati değerli olsun.</p>
        <p className="mt-1 text-[#7db894]">
          Restoranların sakin saatlerinde %30-50 indirimli masalar.
        </p>
        {!loading && !user && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/kayit" className="btn btn-gold">Kayıt ol</Link>
            <Link href="/giris" className="btn" style={{ background: "#14664a" }}>
              Giriş yap
            </Link>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <select className="input" style={{ width: "auto" }} value={district}
          onChange={(e) => setDistrict(e.target.value)}>
          <option value="all">Tüm semtler</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="input" style={{ width: "auto" }} value={sort}
          onChange={(e) => setSort(e.target.value as "time" | "discount")}>
          <option value="time">En yakın saat</option>
          <option value="discount">En yüksek indirim</option>
        </select>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {(!loaded || !now) && <p>Yükleniyor...</p>}
      {loaded && now && list.length === 0 && !error && (
        <p className="text-gray-600">Şu an uygun indirimli masa yok. Daha sonra tekrar bak.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {now &&
          list.map((s) => {
            const started = toDate(s.slot_date, s.start_time) <= now;
            return (
              <div key={s.id} className="card flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{s.restaurant_name}</h2>
                    <p className="text-sm text-gray-600">
                      {s.district}
                      {s.address ? ` · ${s.address}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#ebb035] px-3 py-1 font-bold text-[#0a4430]">
                    %{s.discount_percent}
                  </span>
                </div>
                {s.description && <p className="text-sm">{s.description}</p>}
                <p className="font-semibold">
                  {dayLabel(s.slot_date, now)} · {hm(s.start_time)}–{hm(s.end_time)}
                  {started && <span className="ml-2 text-sm text-green-700">Şu an açık</span>}
                </p>
                <p className="text-sm text-gray-600">Kalan kontenjan: {s.remaining} kişi</p>
                <Link href={`/rezervasyon/${s.id}`} className="btn mt-2">
                  Rezervasyon yap
                </Link>
              </div>
            );
          })}
      </div>
    </div>
  );
}