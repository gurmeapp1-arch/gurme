"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { istDate, toDate } from "@/lib/time";
import SlotCard, { type PublicSlot } from "@/components/SlotCard";

function dayLabel(d: string, now: Date) {
  if (d === istDate(now)) return "Bugün";
  if (d === istDate(new Date(now.getTime() + 86400000))) return "Yarın";
  return new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

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

  const list = slots
    .filter((s) => s.remaining > 0 && toDate(s.slot_date, s.end_time) >= now)
    .sort(
      (a, b) =>
        toDate(a.slot_date, a.start_time).getTime() - toDate(b.slot_date, b.start_time).getTime()
    )
    .slice(0, 12);

  if (list.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">İndirimli rezervasyonlar</h2>
      <p className="mt-1 text-gray-600">Beğendiğin birine dokun, giriş yapınca yerini ayıralım.</p>
      <div className="-mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {list.map((s) => (
          <SlotCard
            key={s.id}
            slot={s}
            now={now}
            showDay={dayLabel(s.slot_date, now)}
            href={`/giris?next=${encodeURIComponent(`/rezervasyon/${s.id}`)}`}
          />
        ))}
      </div>
    </section>
  );
}
