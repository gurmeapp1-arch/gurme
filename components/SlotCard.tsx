/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { RatingBadge } from "@/components/Stars";
import { hm, toDate } from "@/lib/time";

export type PublicSlot = {
  id: string;
  restaurant_id: string;
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
  cover_url: string | null;
  logo_url: string | null;
  avg_rating: number | null;
  review_count: number | null;
  category?: string | null;
  hours?: string | null;
  instagram?: string | null;
  menu_url?: string | null;
};

// Masa kartı: hem giriş yapmış müşteri listesinde hem karşılama sayfasında kullanılır
export default function SlotCard({
  slot: s,
  now,
  href,
  showDay,
}: {
  slot: PublicSlot;
  now: Date;
  href: string;
  showDay?: string;
}) {
  const started = toDate(s.slot_date, s.start_time) <= now;
  return (
    <Link
      href={href}
      className="w-72 shrink-0 snap-start overflow-hidden rounded-2xl bg-white text-gray-900 ring-1 ring-gray-200 transition hover:shadow-md"
    >
      <div className="relative h-40 bg-[#0a4430]">
        {s.cover_url ? (
          <img
            src={s.cover_url}
            alt={s.restaurant_name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img src="/img/pasta.webp" alt="" className="absolute inset-0 m-auto h-24 w-auto opacity-90" />
        )}
        {started && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#14664a]">
            Şu an açık
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">{s.restaurant_name}</h3>
          <RatingBadge avg={s.avg_rating} count={s.review_count} />
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{s.district}</p>
        <p className="mt-3 text-sm font-semibold">
          {showDay ? `${showDay} · ` : ""}
          {hm(s.start_time)}–{hm(s.end_time)} · {s.remaining} kişilik yer
        </p>
        <span className="mt-3 inline-block rounded-full bg-[#dff3e6] px-3 py-1 text-sm font-bold text-[#0a4430]">
          %{s.discount_percent} indirim
        </span>
      </div>
    </Link>
  );
}
