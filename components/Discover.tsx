"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import type { PublicSlot } from "@/components/SlotCard";
import RestaurantCard, { groupByRestaurant } from "@/components/RestaurantCard";

const DISTRICTS = ["Hisarüstü", "Beşiktaş", "Kadıköy", "Diğer"];

const istDate = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
const hm = (t: string) => t.slice(0, 5);
const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);

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
  }

  const ready = loaded && !!now;

  const restaurants = groupByRestaurant(list);

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

      {ready && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((g) => (
            <RestaurantCard key={g.id} group={g} now={now!} href={`/rezervasyon/restoran/${g.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
