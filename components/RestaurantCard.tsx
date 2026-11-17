/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { RatingBadge } from "@/components/Stars";
import { hm, istDate, toDate } from "@/lib/time";
import type { PublicSlot } from "@/components/SlotCard";
import HeartButton from "@/components/HeartButton";

export type RestaurantGroup = {
  id: string;
  name: string;
  district: string;
  cover_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
  category: string | null;
  slots: PublicSlot[]; // saate göre sıralı
};

// Açık slotları restoran bazında toplar. Girdi: yalnızca henüz bitmemiş ve yeri olan slotlar.
export function groupByRestaurant(slots: PublicSlot[]): RestaurantGroup[] {
  const map = new Map<string, RestaurantGroup>();
  for (const s of slots) {
    let g = map.get(s.restaurant_id);
    if (!g) {
      g = {
        id: s.restaurant_id,
        name: s.restaurant_name,
        district: s.district,
        cover_url: s.cover_url,
        avg_rating: s.avg_rating,
        review_count: s.review_count,
        category: s.category ?? null,
        slots: [],
      };
      map.set(s.restaurant_id, g);
    }
    g.slots.push(s);
  }
  const start = (s: PublicSlot) => toDate(s.slot_date, s.start_time).getTime();
  const groups = [...map.values()];
  for (const g of groups) g.slots.sort((a, b) => start(a) - start(b));
  return groups.sort((a, b) => start(a.slots[0]) - start(b.slots[0]));
}

export function dayLabel(d: string, now: Date, long = false) {
  if (d === istDate(now)) return "Bugün";
  if (d === istDate(new Date(now.getTime() + 86400000))) return "Yarın";
  return new Date(`${d}T12:00:00+03:00`).toLocaleDateString("tr-TR", {
    weekday: long ? "long" : "short",
    day: "numeric",
    month: long ? "long" : "short",
    timeZone: "Europe/Istanbul",
  });
}

export default function RestaurantCard({
  group: g,
  now,
  href,
  favorite,
  onToggleFavorite,
}: {
  group: RestaurantGroup;
  now: Date;
  href: string;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const next = g.slots[0];
  const maxDiscount = Math.max(...g.slots.map((s) => s.discount_percent));
  const days = new Set(g.slots.map((s) => s.slot_date)).size;
  return (
    <Link
      href={href}
      className="overflow-hidden rounded-2xl bg-white text-gray-900 ring-1 ring-gray-200 transition hover:shadow-md"
    >
      <div className="relative h-40 bg-[#0a4430]">
        {g.cover_url ? (
          <img
            src={g.cover_url}
            alt={g.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img src="/img/pasta.webp" alt="" className="absolute inset-0 m-auto h-24 w-auto opacity-90" />
        )}
        {onToggleFavorite && (
          <HeartButton
            active={!!favorite}
            onToggle={onToggleFavorite}
            className="absolute right-3 top-3"
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">{g.name}</h3>
          <RatingBadge avg={g.avg_rating} count={g.review_count} />
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          {g.category ? `${g.category} · ` : ""}
          {g.district}
        </p>
        <p className="mt-3 text-sm text-gray-700">
          Sıradaki boş saat:{" "}
          <span className="font-semibold">
            {dayLabel(next.slot_date, now)} {hm(next.start_time)}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#dff3e6] px-3 py-1 text-sm font-bold text-[#0a4430]">
            %{maxDiscount} indirim
          </span>
          <span className="text-xs text-gray-500">
            {g.slots.length} saat · {days} gün
          </span>
        </div>
      </div>
    </Link>
  );
}
