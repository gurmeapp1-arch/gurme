"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useNow } from "@/lib/useNow";
import { Stars } from "@/components/Stars";
import ReviewBox from "@/components/ReviewBox";
import { toWhatsAppNumber, whatsAppLink } from "@/lib/config";

type Status = "confirmed" | "cancelled" | "attended" | "no_show";
type Row = {
  id: string;
  code: string;
  party_size: number;
  reservation_name: string;
  status: Status;
  slot: {
    slot_date: string;
    start_time: string;
    end_time: string;
    discount_percent: number;
    restaurant: {
      name: string;
      district: string;
      address: string | null;
      phone: string | null;
    };
  };
};

const STATUS_LABEL: Record<Status, string> = {
  confirmed: "Onaylandı",
  cancelled: "İptal edildi",
  attended: "Tamamlandı",
  no_show: "Gelmedi",
};

const hm = (t: string) => t.slice(0, 5);
const toDate = (d: string, t: string) => new Date(`${d}T${hm(t)}:00+03:00`);
const fmtDate = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export default function RezervasyonlarimPage() {
  const { user, loading } = useAuth();
  const now = useNow();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [reviewed, setReviewed] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, code, party_size, reservation_name, status, slot:slots(slot_date, start_time, end_time, discount_percent, restaurant:restaurants(name, district, address, phone))"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setMsg("Liste yüklenemedi: " + error.message);
    setRows((data ?? []) as unknown as Row[]);

    // Hangi rezervasyonlara yorum yazılmış?
    const { data: rv } = await supabase
      .from("reviews")
      .select("reservation_id, rating")
      .eq("user_id", user.id);
    const map: Record<string, number> = {};
    for (const x of (rv ?? []) as { reservation_id: string; rating: number }[]) {
      map[x.reservation_id] = x.rating;
    }
    setReviewed(map);
  }, [user]);

  // Restoran "Geldi" işaretleyince yorum kutusu görünsün diye sayfa kendini yeniler
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function cancel(id: string) {
    setMsg("");
    if (!confirm("Rezervasyonu iptal etmek istediğine emin misin?")) return;
    const { error } = await supabase.rpc("cancel_reservation", { p_id: id });
    if (error) setMsg(error.message);
    else load();
  }

  if (loading) return <p>Yükleniyor...</p>;
  if (!user)
    return (
      <p>
        Rezervasyonlarını görmek için{" "}
        <Link href="/giris" className="underline">giriş yap</Link>.
      </p>
    );
  if (rows === null || !now) return <p>Yükleniyor...</p>;

  const upcoming = rows
    .filter((r) => r.status === "confirmed" && toDate(r.slot.slot_date, r.slot.end_time) >= now)
    .sort(
      (a, b) =>
        toDate(a.slot.slot_date, a.slot.start_time).getTime() -
        toDate(b.slot.slot_date, b.slot.start_time).getTime()
    );
  const past = rows.filter((r) => !upcoming.includes(r));

  const renderRow = (r: Row) => {
    const start = toDate(r.slot.slot_date, r.slot.start_time);
    const waNumber = toWhatsAppNumber(r.slot.restaurant.phone);
    const canCancel =
      r.status === "confirmed" && now.getTime() <= start.getTime() - 2 * 3600 * 1000;
    const tooLate =
      r.status === "confirmed" &&
      !canCancel &&
      toDate(r.slot.slot_date, r.slot.end_time) >= now;

    return (
      <div key={r.id} className="card space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">{r.slot.restaurant.name}</h2>
            <p className="text-sm text-gray-600">
              {r.slot.restaurant.district}
              {r.slot.restaurant.address ? ` · ${r.slot.restaurant.address}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-[#f7f3e8] px-3 py-1 text-sm font-semibold">
            {STATUS_LABEL[r.status]}
          </span>
        </div>

        <p className="font-semibold">
          {fmtDate(r.slot.slot_date)} · {hm(r.slot.start_time)}–{hm(r.slot.end_time)} ·{" "}
          {r.party_size} kişi · %{r.slot.discount_percent} indirim
        </p>
        <p className="text-sm text-gray-600">Rezervasyon adı: {r.reservation_name}</p>

        {r.status !== "cancelled" && (
          <div className="rounded-xl bg-[#0a4430] px-4 py-3 text-center">
            <p className="text-xs text-[#7db894]">Masada bu kodu göster</p>
            <p className="font-mono text-3xl font-extrabold tracking-widest text-[#ebb035]">
              {r.code}
            </p>
          </div>
        )}

        {r.status === "attended" &&
          (reviewed[r.id] ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Yorumun: <Stars value={reviewed[r.id]} /> Teşekkürler!
            </div>
          ) : (
            <ReviewBox
              reservationId={r.id}
              restaurantName={r.slot.restaurant.name}
              onDone={load}
            />
          ))}

        {(canCancel || (r.status === "confirmed" && waNumber)) && (
          <div className="flex flex-wrap gap-3 pt-1">
            {r.status === "confirmed" && waNumber && (
              <a
                href={whatsAppLink(
                  waNumber,
                  `Merhaba, Gurme üzerinden ${r.code} kodlu rezervasyon yaptım. ${r.reservation_name} adına, ${r.party_size} kişi, ${fmtDate(r.slot.slot_date)} ${hm(r.slot.start_time)}-${hm(r.slot.end_time)} saatleri arasında geleceğiz.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-4 py-2 text-sm font-semibold text-[#14664a] ring-1 ring-[#14664a] hover:bg-[#14664a] hover:text-white"
              >
                WhatsApp&apos;tan haber ver
              </a>
            )}
            {canCancel && (
              <button
                onClick={() => cancel(r.id)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-300 hover:bg-red-50"
              >
                Rezervasyonu iptal et
              </button>
            )}
          </div>
        )}
        {tooLate && (
          <p className="text-sm text-gray-600">
            Rezervasyona 2 saatten az kaldığı için iptal edilemez.
            {r.slot.restaurant.phone && (
              <>
                {" "}Restoranla iletişime geç:{" "}
                <a href={`tel:${r.slot.restaurant.phone}`} className="underline">
                  {r.slot.restaurant.phone}
                </a>
              </>
            )}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-extrabold text-[#0a4430]">Rezervasyonlarım</h1>

      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      {rows.length === 0 && (
        <p className="text-gray-600">
          Henüz rezervasyonun yok.{" "}
          <Link href="/" className="underline">İndirimli masalara göz at</Link>.
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Yaklaşan</h2>
          {upcoming.map(renderRow)}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Geçmiş ve iptal edilenler</h2>
          {past.map(renderRow)}
        </section>
      )}
    </div>
  );
}