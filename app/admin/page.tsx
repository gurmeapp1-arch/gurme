"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Status = "confirmed" | "cancelled" | "attended" | "no_show";
type Rest = {
  id: string;
  name: string;
  district: string;
  phone: string | null;
  approved: boolean;
  created_at: string;
};
type Row = {
  id: string;
  code: string;
  party_size: number;
  reservation_name: string;
  phone: string;
  status: Status;
  created_at: string;
  slot: {
    slot_date: string;
    start_time: string;
    end_time: string;
    discount_percent: number;
    restaurant: { id: string; name: string };
  };
};

const STATUS_LABEL: Record<Status, string> = {
  confirmed: "Bekleniyor",
  cancelled: "İptal",
  attended: "Geldi",
  no_show: "Gelmedi",
};

const hm = (t: string) => t.slice(0, 5);
const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="text-3xl font-extrabold text-[#0a4430]">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const [restaurants, setRestaurants] = useState<Rest[] | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [dinerCount, setDinerCount] = useState(0);
  const [slotCount, setSlotCount] = useState(0);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"stats" | "restaurants" | "reservations">("stats");

  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const [r, rv, d, sl] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, district, phone, approved, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("reservations")
        .select(
          "id, code, party_size, reservation_name, phone, status, created_at, slot:slots(slot_date, start_time, end_time, discount_percent, restaurant:restaurants(id, name))"
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "diner"),
      supabase.from("slots").select("id", { count: "exact", head: true }),
    ]);
    if (r.error) setMsg("Restoranlar yüklenemedi: " + r.error.message);
    if (rv.error) setMsg("Rezervasyonlar yüklenemedi: " + rv.error.message);
    setRestaurants((r.data ?? []) as Rest[]);
    setRows((rv.data ?? []) as unknown as Row[]);
    setDinerCount(d.count ?? 0);
    setSlotCount(sl.count ?? 0);
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function setApproved(id: string, approved: boolean) {
    setMsg("");
    const { error } = await supabase.rpc("approve_restaurant", {
      p_id: id,
      p_approved: approved,
    });
    if (error) setMsg(error.message);
    else load();
  }

  async function cancel(id: string) {
    setMsg("");
    if (!confirm("Bu rezervasyon iptal edilsin mi?")) return;
    const { error } = await supabase.rpc("cancel_reservation", { p_id: id });
    if (error) setMsg(error.message);
    else load();
  }

  function downloadCsv() {
    const header = ["Kod", "Restoran", "Tarih", "Saat", "Kişi", "İndirim %", "Durum", "Oluşturulma"];
    const lines = rows.map((r) => [
      r.code,
      r.slot.restaurant.name,
      r.slot.slot_date,
      `${hm(r.slot.start_time)}-${hm(r.slot.end_time)}`,
      r.party_size,
      r.slot.discount_percent,
      STATUS_LABEL[r.status],
      r.created_at,
    ]);
    const csv = [header, ...lines]
      .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gurme-rezervasyonlar.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <p>Yükleniyor...</p>;
  if (!user)
    return (
      <p>
        Bu sayfayı görmek için <Link href="/giris" className="underline">giriş yap</Link>.
      </p>
    );
  if (profile && !isAdmin) return <p>Bu sayfa sadece yönetici içindir.</p>;
  if (restaurants === null) return <p>Yükleniyor...</p>;

  const cnt = (s: Status) => rows.filter((r) => r.status === s).length;
  const attended = cnt("attended");
  const noShow = cnt("no_show");
  const cancelled = cnt("cancelled");
  const rate = (a: number, n: number) =>
    a + n > 0 ? `%${Math.round((n / (a + n)) * 100)}` : "-";
  const guests = rows
    .filter((r) => r.status !== "cancelled")
    .reduce((n, r) => n + r.party_size, 0);
  const pending = restaurants.filter((r) => !r.approved).length;
  const sortedRestaurants = [...restaurants].sort(
    (a, b) => Number(a.approved) - Number(b.approved)
  );

  const tabBtn = (key: typeof tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      className="btn btn-sm"
      style={{ opacity: tab === key ? 1 : 0.5 }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-[#0a4430]">Yönetim</h1>

      <div className="flex flex-wrap gap-2">
        {tabBtn("stats", "Özet")}
        {tabBtn("restaurants", `Restoranlar${pending ? ` (${pending} onay bekliyor)` : ""}`)}
        {tabBtn("reservations", "Rezervasyonlar")}
      </div>

      {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}

      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Toplam rezervasyon" value={rows.length} />
            <Stat label="Toplam kişi (iptaller hariç)" value={guests} />
            <Stat label="Gelmeme oranı" value={rate(attended, noShow)} />
            <Stat label="İptal edilen" value={cancelled} />
            <Stat label="Onaylı restoran" value={restaurants.length - pending} />
            <Stat label="Müşteri sayısı" value={dinerCount} />
            <Stat label="Açılan slot" value={slotCount} />
            <Stat label="Henüz işaretlenmemiş" value={cnt("confirmed")} />
          </div>

          <div className="card">
            <h2 className="mb-3 text-xl font-bold">Restoran başına</h2>
            <ul className="divide-y text-sm">
              {restaurants.map((r) => {
                const mine = rows.filter((x) => x.slot.restaurant.id === r.id);
                const a = mine.filter((x) => x.status === "attended").length;
                const n = mine.filter((x) => x.status === "no_show").length;
                const active = mine.filter((x) => x.status !== "cancelled").length;
                return (
                  <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span className="font-semibold">{r.name}</span>
                    <span>
                      {active} rezervasyon · {a} geldi · {n} gelmedi · gelmeme {rate(a, n)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {tab === "restaurants" && (
        <div className="space-y-3">
          {sortedRestaurants.length === 0 && <p className="text-gray-600">Henüz restoran yok.</p>}
          {sortedRestaurants.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{r.name}</p>
                <p className="text-sm text-gray-600">
                  {r.district}
                  {r.phone ? ` · ${r.phone}` : ""} · Kayıt: {fmtDay(r.created_at.slice(0, 10))}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ background: r.approved ? "#dcfce7" : "#fef3c7" }}
                >
                  {r.approved ? "Yayında" : "Onay bekliyor"}
                </span>
                {r.approved ? (
                  <button onClick={() => setApproved(r.id, false)} className="text-sm text-red-700 underline">
                    Askıya al
                  </button>
                ) : (
                  <button onClick={() => setApproved(r.id, true)} className="btn btn-gold btn-sm">
                    Onayla
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "reservations" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-600">{rows.length} rezervasyon</p>
            <button onClick={downloadCsv} className="btn btn-sm">
              CSV indir (Excel için)
            </button>
          </div>
          {rows.length === 0 && <p className="text-gray-600">Henüz rezervasyon yok.</p>}
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p>
                  <span className="font-mono font-bold">{r.code}</span> ·{" "}
                  <span className="font-semibold">{r.slot.restaurant.name}</span>
                </p>
                <p className="text-gray-600">
                  {fmtDay(r.slot.slot_date)} · {hm(r.slot.start_time)}–{hm(r.slot.end_time)} ·{" "}
                  {r.party_size} kişi · %{r.slot.discount_percent}
                </p>
                <p className="text-gray-600">
                  {r.reservation_name} ·{" "}
                  <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#f7f3e8] px-3 py-1 font-semibold">
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === "confirmed" && (
                  <button onClick={() => cancel(r.id)} className="text-red-700 underline">
                    İptal et
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}