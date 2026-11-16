"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import type { PublicSlot } from "@/components/SlotCard";
import RestaurantCard, { dayLabel, groupByRestaurant } from "@/components/RestaurantCard";

// Gün içi zaman dilimleri (saat olarak)
const PARTS = [
  { id: "ogle", label: "Öğle 11–15", from: 11, to: 15 },
  { id: "ikindi", label: "Öğleden sonra 15–18", from: 15, to: 18 },
  { id: "aksam", label: "Akşam 18 ve sonrası", from: 18, to: 29 },
];
const hourOf = (t: string) => Number(t.slice(0, 2)) + Number(t.slice(3, 5)) / 60;

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
  const [day, setDay] = useState("all");
  const [part, setPart] = useState("all");
  const [category, setCategory] = useState("all");

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
  // Gün ve saat filtresi için seçilebilecek günler (arama/semt filtresinden bağımsız)
  const dayOptions = now
    ? [
        ...new Set(
          slots
            .filter((s) => s.remaining > 0 && toDate(s.slot_date, s.end_time) >= now)
            .map((s) => s.slot_date)
        ),
      ]
        .sort()
        .slice(0, 8)
    : [];
  if (category !== "all") list = list.filter((s) => s.category === category);
  if (day !== "all") list = list.filter((s) => s.slot_date === day);
  const categoryOptions = [...new Set(slots.map((s) => s.category).filter(Boolean))] as string[];
  const win = PARTS.find((p) => p.id === part);
  if (win) list = list.filter((s) => hourOf(s.start_time) < win.to && hourOf(s.end_time) > win.from);

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

      {categoryOptions.length > 1 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["all", ...categoryOptions].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${
                c === category
                  ? "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
              }`}
            >
              {c === "all" ? "Hepsi" : c}
            </button>
          ))}
        </div>
      )}

      {now && dayOptions.length > 0 && (
        <div className="space-y-2">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {["all", ...dayOptions].map((d) => (
              <button
                key={d}
                onClick={() => setDay(d)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ring-1 ${
                  d === day
                    ? "bg-[#0a4430] text-white ring-[#0a4430]"
                    : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                {d === "all" ? "Tüm günler" : dayLabel(d, now)}
              </button>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {[{ id: "all", label: "Her saat" }, ...PARTS].map((p) => (
              <button
                key={p.id}
                onClick={() => setPart(p.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ring-1 ${
                  p.id === part
                    ? "bg-[#14664a] text-white ring-[#14664a]"
                    : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

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
            <RestaurantCard
              key={g.id}
              group={g}
              now={now!}
              href={`/rezervasyon/restoran/${g.id}${day !== "all" ? `?gun=${day}` : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
