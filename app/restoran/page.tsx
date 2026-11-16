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

  const upcoming = slots.filter((s) => toDate(s.slot_date, s.end_time) >= now);
  const past = slots.filter((s) => toDate(s.slot_date, s.end_time) < now).reverse();

  const renderSlot = (s: Slot) => {
    const list = reservations.filter((r) => r.slot_id === s.id);
    const booked = list
      .filter((r) => r.status !== "cancelled")
      .reduce((n, r) => n + r.party_size, 0);
    const started = toDate(s.slot_date, s.start_time) <= now;

    return (
      <div key={s.id} className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bold">
              {fmtDate(s.slot_date)} · {hm(s.start_time)}–{hm(s.end_time)}
            </p>
            <p className="text-sm text-gray-600">
              Kontenjan: {booked}/{s.capacity} kişi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#ebb035] px-3 py-1 text-sm font-bold text-[#0a4430]">
              %{s.discount_percent} indirim
            </span>
            <button onClick={() => deleteSlot(s.id)} className="text-sm text-red-700 underline">
              Sil
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Henüz rezervasyon yok.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {list.map((r) => {
              const wa = toWhatsAppNumber(r.phone);
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <div>
                    <span className="font-mono font-bold">{r.code}</span> · {r.reservation_name} ·{" "}
                    {r.party_size} kişi ·{" "}
                    <a href={`tel:${r.phone}`} className="underline">
                      {r.phone}
                    </a>
                    {wa && (
                      <>
                        {" · "}
                        <a
                          href={whatsAppLink(wa, `Merhaba ${r.reservation_name}, Gurme üzerinden ${r.code} kodlu rezervasyonunuz için yazıyoruz.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          WhatsApp
                        </a>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f7f3e8] px-2 py-0.5 font-semibold">
                      {STATUS_LABEL[r.status]}
                    </span>
                    {started && r.status !== "cancelled" && (
                      <>
                        <button
                          onClick={() => mark(r.id, "attended")}
                          className="btn btn-sm"
                          style={{ opacity: r.status === "attended" ? 1 : 0.6 }}
                        >
                          Geldi
                        </button>
                        <button
                          onClick={() => mark(r.id, "no_show")}
                          className="btn btn-sm"
                          style={{
                            background: "#9b2c2c",
                            opacity: r.status === "no_show" ? 1 : 0.6,
                          }}
                        >
                          Gelmedi
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {restaurant.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.logo_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover shadow"
          />
        )}
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-[#0a4430]">
            {restaurant.name}
          </h1>
          <p className="flex flex-wrap items-center gap-2 text-gray-600">
            {restaurant.district} · Restoran paneli
            {rating && (
              <span className="inline-flex items-center gap-1 text-sm">
                <Stars value={rating.avg} /> {rating.avg.toFixed(1)} ({rating.count} yorum)
              </span>
            )}
          </p>
        </div>
      </div>

      {fresh.length > 0 && (
        <div className="rounded-2xl bg-[#ebb035] p-4 text-[#0a4430]" role="status">
          <p className="font-display text-xl font-extrabold">
            {fresh.length === 1 ? "Yeni rezervasyon geldi!" : `${fresh.length} yeni rezervasyon geldi!`}
          </p>
          <ul className="mt-1 text-sm font-semibold">
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
        <div className="card flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            Yeni rezervasyon gelince bildirim almak ister misin? Sayfa açıkken çalışır.
          </p>
          <button
            className="btn btn-sm"
            onClick={() => Notification.requestPermission().then(setNotifPerm)}
          >
            Bildirimleri aç
          </button>
        </div>
      )}

      <ProfileEditor restaurant={restaurant} onSaved={loadAll} />

      <SlotForm restaurantId={restaurant.id} existing={slots} onCreated={loadAll} />

      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Yaklaşan ve devam eden slotlar</h2>
        {upcoming.length === 0 && <p className="text-gray-600">Henüz açık slotun yok.</p>}
        {upcoming.map(renderSlot)}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Müşteri yorumları</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-600">
            Henüz yorum yok. Müşteri geldikten sonra &quot;Geldi&quot; işaretlersen yorum yazabilir.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card">
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

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Geçmiş slotlar (son 14 gün)</h2>
          {past.map(renderSlot)}
        </section>
      )}
    </div>
  );
}
