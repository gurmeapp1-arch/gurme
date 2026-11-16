"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { istDate, lastVisibleDate, toDate } from "@/lib/time";
import type { PublicSlot } from "@/components/SlotCard";
import RestaurantCard, { groupByRestaurant } from "@/components/RestaurantCard";

// Giriş yapmamış ziyaretçiye gerçek indirimleri gösterir. Karta tıklayınca giriş sayfasına gider.
export default function GuestOffers() {
  const now = useNow();
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);

  useEffect(() => {
    const from = istDate(new Date(Date.now() - 86400000));
    supabase
      .from("slots_public")
      .select("*")
      .gte("slot_date", from)
      .then(({ data }) => setSlots((data ?? []) as PublicSlot[]));
  }, []);

  if (!now || !slots) return null;

  const list = groupByRestaurant(
    slots.filter(
      (s) =>
        s.remaining > 0 &&
        toDate(s.slot_date, s.end_time) >= now &&
        s.slot_date <= lastVisibleDate(now)
    )
  ).slice(0, 12);

  if (list.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">İndirimli rezervasyonlar</h2>
      <p className="mt-1 text-gray-600">Beğendiğin birine dokun, giriş yapınca yerini ayıralım.</p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g) => (
          <RestaurantCard
            key={g.id}
            group={g}
            now={now}
            href={`/giris?next=${encodeURIComponent(`/rezervasyon/restoran/${g.id}`)}`}
          />
        ))}
      </div>
    </section>
  );
}
