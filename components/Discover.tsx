"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import SlotCard, { type PublicSlot } from "@/components/SlotCard";

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
    list = [...list].sort(
      (a, b) =>
        toDate(a.slot_date, a.start_time).getTime() - toDate(b.slot_date, b.start_time).getTime()
    );
  }

  const ready = loaded && !!now;

  // Güne göre grupla (liste zaten saate göre sıralı)
  const groups: [string, PublicSlot[]][] = [];
  for (const s of list) {
    const g = groups.find((x) => x[0] === s.slot_date);
    if (g) g[1].push(s);
    else groups.push([s.slot_date, [s]]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0a4430]">İndirimli masalar</h1>
        <p className="mt-1 text-gray-600">Beğendiğin masaya dokun, yerini ayır.</p>
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

      {ready &&
        groups.map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-3 text-xl font-extrabold text-gray-900">{dayLabel(day, now!)}</h2>
            <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
              {items.map((s) => (
                <SlotCard key={s.id} slot={s} now={now!} href={`/rezervasyon/${s.id}`} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
