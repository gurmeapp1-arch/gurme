/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { hm, istDate, lastVisibleDate, toDate } from "@/lib/time";
import { RatingBadge, Stars } from "@/components/Stars";
import { PageSpinner } from "@/components/RoleGuard";
import { dayLabel } from "@/components/RestaurantCard";
import type { PublicSlot } from "@/components/SlotCard";

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
};

function RestoranSayfasi() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const now = useNow();
  const [slots, setSlots] = useState<PublicSlot[] | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    // Listede bir gün filtresi seçiliyse o günle aç (?gun=2026-11-20)
    const g = new URLSearchParams(window.location.search).get("gun");
    if (g && /^\d{4}-\d{2}-\d{2}$/.test(g)) setDay(g);
    const from = istDate(new Date(Date.now() - 86400000));
    supabase
      .from("slots_public")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .gte("slot_date", from)
      .then(({ data }) => setSlots((data ?? []) as PublicSlot[]));
    supabase
      .from("reviews_public")
      .select("id, rating, comment, created_at, reviewer_name")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setReviews((data ?? []) as ReviewRow[]));
  }, [restaurantId]);

  if (!now || slots === null) return <PageSpinner />;

  const upcoming = slots
    .filter((s) => toDate(s.slot_date, s.end_time) >= now && s.slot_date <= lastVisibleDate(now))
    .sort(
      (a, b) =>
        toDate(a.slot_date, a.start_time).getTime() - toDate(b.slot_date, b.start_time).getTime()
    );

  if (slots.length === 0)
    return (
      <div className="card text-center">
        <p className="font-semibold">Bu restoran bulunamadı ya da şu an indirimi yok.</p>
        <Link href="/" className="btn btn-sm mt-3 inline-block">
          Tüm restoranlar
        </Link>
      </div>
    );

  const info = slots[0];
  const days = [...new Set(upcoming.map((s) => s.slot_date))];
  const selected = day && days.includes(day) ? day : days[0];
  const daySlots = upcoming.filter((s) => s.slot_date === selected);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/" className="text-sm text-gray-600 underline">
        ← Tüm restoranlar
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
        {info.cover_url && (
          <img src={info.cover_url} alt={info.restaurant_name} className="h-48 w-full object-cover" />
        )}
        <div className="p-5">
          <div className="flex items-center gap-3">
            {info.logo_url && (
              <img src={info.logo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">{info.restaurant_name}</h1>
              <p className="text-sm text-gray-500">
                {info.district}
                {info.address ? ` · ${info.address}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <RatingBadge avg={info.avg_rating} count={info.review_count} />
          </div>
          {info.description && <p className="mt-3 text-gray-700">{info.description}</p>}
        </div>
      </div>

      <section>
        <h2 className="text-xl font-extrabold text-gray-900">Gün ve saat seç</h2>
        {days.length === 0 ? (
          <p className="mt-2 text-gray-600">Şu an açık saat yok.</p>
        ) : (
          <>
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setDay(d)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ring-1 ${
                    d === selected
                      ? "bg-[#0a4430] text-white ring-[#0a4430]"
                      : "bg-white text-gray-800 ring-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {dayLabel(d, now)}
                </button>
              ))}
            </div>

            <ul className="mt-4 divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
              {daySlots.map((s) => {
                const full = s.remaining <= 0;
                const started = toDate(s.slot_date, s.start_time) <= now;
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-lg font-bold">
                        {hm(s.start_time)}–{hm(s.end_time)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {full
                          ? "Dolu"
                          : `${s.remaining} kişilik yer${started ? " · şu an açık" : ""}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-[#dff3e6] px-3 py-1 text-sm font-bold text-[#0a4430]">
                        %{s.discount_percent}
                      </span>
                      {full ? (
                        <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-400">
                          Dolu
                        </span>
                      ) : (
                        <Link href={`/rezervasyon/${s.id}`} className="btn btn-sm">
                          Seç
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {reviews.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-gray-900">Yorumlar</h2>
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
            {reviews.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <p className="font-semibold">{r.reviewer_name}</p>
                <Stars value={r.rating} />
                {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <RestoranSayfasi />
    </Suspense>
  );
}
