"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { useAuth } from "@/components/AuthProvider";
import { PageSpinner } from "@/components/RoleGuard";
import { Stars } from "@/components/Stars";
import ProfileEditor from "@/components/restaurant/ProfileEditor";
import SlotForm from "@/components/restaurant/SlotForm";
import { fmtDate, fmtShort, hm, istDate, toDate } from "@/lib/time";
import { toWhatsAppNumber, whatsAppLink } from "@/lib/config";
import type { Reservation, Restaurant, Review, Slot, Status } from "@/lib/types";

const STATUS_LABEL: Record<Status, string> = {
  confirmed: "Bekleniyor",
  cancelled: "İptal",
  attended: "Geldi",
  no_show: "Gelmedi",
};

// Yeni rezervasyon geldiğinde kısa bir bip sesi (tarayıcı izin vermezse sessiz kalır)
function beep() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* sessiz geç */
  }
}

function announce(added: Reservation[]) {
  beep();
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const r = added[0];
    new Notification("Yeni rezervasyon", {
      body: `${r.reservation_name} · ${r.party_size} kişi · ${r.code}${
        added.length > 1 ? ` (+${added.length - 1} rezervasyon daha)` : ""
      }`,
    });
  }
}

export default function RestoranPage() {
  const { user } = useAuth();
  const now = useNow();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restLoaded, setRestLoaded] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null);
  const [msg, setMsg] = useState("");
  const [fresh, setFresh] = useState<Reservation[]>([]);
  const [notifPerm, setNotifPerm] = useState("unsupported");
  const seen = useRef<Set<string> | null>(null);
  const [tab, setTab] = useState<"rez" | "slot" | "profil">("rez");

  const loadAll = useCallback(async () => {
    if (!user) return;
    const { data: r } = await supabase
      .from("restaurants")
      .select("id, name, district, approved, address, phone, description, cover_url, logo_url")
      .eq("owner_id", user.id)
      .maybeSingle();
    const rest = r as Restaurant | null;
    setRestaurant(rest);
    setRestLoaded(true);
    if (!rest || !rest.approved) return;

    const from = istDate(new Date(Date.now() - 14 * 86400000));
    const { data: s } = await supabase
      .from("slots")
      .select("id, slot_date, start_time, end_time, discount_percent, capacity")
      .eq("restaurant_id", rest.id)
      .gte("slot_date", from)
      .order("slot_date")
      .order("start_time");
    const slotList = (s ?? []) as Slot[];
    setSlots(slotList);

    let rvList: Reservation[] = [];
    if (slotList.length > 0) {
      const { data: rv } = await supabase
        .from("reservations")
        .select("id, code, slot_id, party_size, reservation_name, phone, status")
        .in("slot_id", slotList.map((x) => x.id))
        .order("created_at");
      rvList = (rv ?? []) as Reservation[];
    }
    setReservations(rvList);

    // Yeni rezervasyon geldi mi? (ilk yüklemede sadece mevcutları kaydet)
    if (seen.current === null) {
      seen.current = new Set(rvList.map((x) => x.id));
    } else {
      const known = seen.current;
      const added = rvList.filter((x) => !known.has(x.id));
      if (added.length > 0) {
        added.forEach((x) => known.add(x.id));
        setFresh((f) => [...added, ...f]);
        announce(added);
      }
    }

    const [{ data: rt }, { data: rvw }] = await Promise.all([
      supabase
        .from("restaurant_ratings")
        .select("avg_rating, review_count")
        .eq("restaurant_id", rest.id)
        .maybeSingle(),
      supabase
        .from("reviews_public")
        .select("id, rating, comment, created_at, reviewer_name")
        .eq("restaurant_id", rest.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setRating(rt ? { avg: rt.avg_rating as number, count: rt.review_count as number } : null);
    setReviews((rvw ?? []) as Review[]);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Her 30 saniyede bir ve sekmeye dönünce yenile: yeni rezervasyonlar kendiliğinden gelir
  useEffect(() => {
    const t = setInterval(loadAll, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadAll]);

  useEffect(() => {
    setNotifPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  // Yeni rezervasyon varken sekme başlığında sayı görünsün
  useEffect(() => {
    if (fresh.length === 0) return;
    const prev = document.title;
    document.title = `(${fresh.length}) Yeni rezervasyon · Gurme`;
    return () => {
      document.title = prev;
    };
  }, [fresh.length]);

  async function deleteSlot(id: string) {
    setMsg("");
    if (!confirm("Bu slot silinsin mi?")) return;
    const { error } = await supabase.from("slots").delete().eq("id", id);
    if (error) setMsg("Rezervasyonu olan slot silinemez.");
    else loadAll();
  }

  async function mark(id: string, status: "attended" | "no_show") {
    setMsg("");
    const { error } = await supabase.rpc("mark_attendance", { p_id: id, p_status: status });
    if (error) setMsg(error.message);
    else loadAll();
  }

  if (!restaurant || !now) {
    if (restLoaded && !restaurant)
      return (
        <div className="card">
          <p className="font-semibold">Restoran kaydın bulunamadı.</p>
          <p className="mt-1 text-sm text-gray-600">
            Sayfayı yenile. Düzelmezse bize ulaş.
          </p>
        </div>
      );
    return <PageSpinner />;
  }

  if (!restaurant.approved)
    return (
      <div className="space-y-6">
        <div className="card">
          <h1 className="font-display text-3xl font-extrabold text-[#0a4430]">{restaurant.name}</h1>
          <p className="mt-3">
            Kaydın alındı ve yönetici onayı bekliyor. Onaylandığında bu sayfadan indirim slotu
            açabileceksin. Bu arada fotoğrafını ve tanıtım yazını hazırlayabilirsin.
          </p>
        </div>
        <ProfileEditor restaurant={restaurant} onSaved={loadAll} />
      </div>
    );

  const upcomingSlots = slots.filter((s) => toDate(s.slot_date, s.end_time) >= now);
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const startOf = (r: Reservation) => {
    const s = slotById.get(r.slot_id);
    return s ? toDate(s.slot_date, s.start_time).getTime() : 0;
  };
  const endOf = (r: Reservation) => {
    const s = slotById.get(r.slot_id);
    return s ? toDate(s.slot_date, s.end_time) : new Date(0);
  };
  const upcomingRes = reservations
    .filter((r) => r.status !== "cancelled" && endOf(r) >= now)
    .sort((a, b) => startOf(a) - startOf(b));
  const pastRes = reservations
    .filter((r) => endOf(r) < now || r.status === "cancelled")
    .sort((a, b) => startOf(b) - startOf(a));
  const upcomingPeople = upcomingRes.reduce((n, r) => n + r.party_size, 0);

  const renderRes = (r: Reservation) => {
    const s = slotById.get(r.slot_id);
    if (!s) return null;
    const wa = toWhatsAppNumber(r.phone);
    const started = toDate(s.slot_date, s.start_time) <= now;
    const cancelled = r.status === "cancelled";
    return (
      <li
        key={r.id}
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
          cancelled ? "opacity-50" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">
            {r.reservation_name} <span className="font-normal text-gray-500">· {r.party_size} kişi</span>
          </p>
          <p className="text-sm text-gray-500">
            {fmtDate(s.slot_date)} · {hm(s.start_time)}–{hm(s.end_time)} · %{s.discount_percent}
          </p>
          <p className="mt-0.5 text-sm">
            <a href={`tel:${r.phone}`} className="text-gray-700 underline">
              {r.phone}
            </a>
            {wa && (
              <>
                {" · "}
                <a
                  href={whatsAppLink(
                    wa,
                    `Merhaba ${r.reservation_name}, Gurme üzerinden ${r.code} kodlu rezervasyonunuz için yazıyoruz.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 underline"
                >
                  WhatsApp
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-sm font-bold tracking-wide">
            {r.code}
          </span>
          {cancelled || r.status === "attended" || r.status === "no_show" ? (
            <span className="text-sm font-semibold text-gray-600">{STATUS_LABEL[r.status]}</span>
          ) : null}
          {started && !cancelled && (
            <>
              <button
                onClick={() => mark(r.id, "attended")}
                className="btn btn-sm"
                style={{ opacity: r.status === "no_show" ? 0.5 : 1 }}
              >
                Geldi
              </button>
              <button
                onClick={() => mark(r.id, "no_show")}
                className="btn btn-sm"
                style={{ background: "#9b2c2c", opacity: r.status === "attended" ? 0.5 : 1 }}
              >
                Gelmedi
              </button>
            </>
          )}
        </div>
      </li>
    );
  };

  const tabs: { id: "rez" | "slot" | "profil"; label: string; badge?: number }[] = [
    { id: "rez", label: "Rezervasyonlar", badge: upcomingRes.length },
    { id: "slot", label: "İndirimlerim" },
    { id: "profil", label: "Profil" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.logo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
            {restaurant.name}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            {restaurant.district}
            {rating && (
              <span className="inline-flex items-center gap-1">
                <Stars value={rating.avg} /> {rating.avg.toFixed(1)} ({rating.count})
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold sm:text-base ${
              tab === t.id
                ? "border-[#0a4430] text-[#0a4430]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1.5 rounded-full bg-[#0a4430] px-2 py-0.5 text-xs text-white">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      {tab === "rez" && (
        <div className="space-y-5">
          {fresh.length > 0 && (
            <div className="rounded-xl border border-[#ebb035] bg-[#fff8e6] p-4" role="status">
              <p className="font-bold text-[#0a4430]">
                {fresh.length === 1
                  ? "Yeni rezervasyon geldi"
                  : `${fresh.length} yeni rezervasyon geldi`}
              </p>
              <ul className="mt-1 text-sm text-gray-700">
                {fresh.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    {r.code} · {r.reservation_name} · {r.party_size} kişi
                  </li>
                ))}
              </ul>
              <button onClick={() => setFresh([])} className="btn btn-sm mt-3">
                Tamam
              </button>
            </div>
          )}

          {notifPerm === "default" && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-gray-200">
              <p>Yeni rezervasyon gelince bildirim al (sayfa açıkken çalışır).</p>
              <button
                className="btn btn-sm"
                onClick={() => Notification.requestPermission().then(setNotifPerm)}
              >
                Bildirimleri aç
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
              <p className="text-2xl font-extrabold text-[#0a4430]">{upcomingRes.length}</p>
              <p className="text-xs text-gray-500">Yaklaşan rezervasyon</p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
              <p className="text-2xl font-extrabold text-[#0a4430]">{upcomingPeople}</p>
              <p className="text-xs text-gray-500">Beklenen kişi</p>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
              <p className="text-2xl font-extrabold text-[#0a4430]">{upcomingSlots.length}</p>
              <p className="text-xs text-gray-500">Açık indirim</p>
            </div>
          </div>

          <section>
            <h2 className="mb-2 font-bold text-gray-900">Yaklaşan rezervasyonlar</h2>
            {upcomingRes.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-center ring-1 ring-gray-200">
                <p className="text-gray-700">Henüz rezervasyon yok.</p>
                <button onClick={() => setTab("slot")} className="btn btn-sm mt-3">
                  İndirim aç
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
                {upcomingRes.map(renderRes)}
              </ul>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Müşteri kodunu masada gösterir, indirimi kasada sen uygularsın.
            </p>
          </section>

          {pastRes.length > 0 && (
            <details className="rounded-xl bg-white ring-1 ring-gray-200">
              <summary className="cursor-pointer px-4 py-3 font-semibold text-gray-700">
                Geçmiş rezervasyonlar ({pastRes.length})
              </summary>
              <ul className="divide-y divide-gray-100 border-t border-gray-100">
                {pastRes.map(renderRes)}
              </ul>
            </details>
          )}
        </div>
      )}

      {tab === "slot" && (
        <div className="space-y-5">
          <SlotForm restaurantId={restaurant.id} existing={slots} onCreated={loadAll} />

          <section>
            <h2 className="mb-2 font-bold text-gray-900">Açık indirimler</h2>
            {upcomingSlots.length === 0 ? (
              <p className="text-gray-600">Henüz açık indirimin yok.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
                {upcomingSlots.map((s) => {
                  const booked = reservations
                    .filter((r) => r.slot_id === s.id && r.status !== "cancelled")
                    .reduce((n, r) => n + r.party_size, 0);
                  return (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold">
                          {fmtDate(s.slot_date)} · {hm(s.start_time)}–{hm(s.end_time)}
                        </p>
                        <p className="text-sm text-gray-500">
                          %{s.discount_percent} indirim · {booked}/{s.capacity} kişi
                        </p>
                      </div>
                      <button
                        onClick={() => deleteSlot(s.id)}
                        className="text-sm text-red-700 underline"
                      >
                        Sil
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "profil" && (
        <div className="space-y-8">
          <ProfileEditor restaurant={restaurant} onSaved={loadAll} />

          <section>
            <h2 className="mb-2 font-bold text-gray-900">Müşteri yorumları</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-600">
                Henüz yorum yok. Müşteri geldikten sonra &quot;Geldi&quot; işaretlersen yorum yazabilir.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-xl bg-white ring-1 ring-gray-200">
                {reviews.map((r) => (
                  <li key={r.id} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{r.reviewer_name}</span>
                      <span className="text-xs text-gray-500">{fmtShort(r.created_at)}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
