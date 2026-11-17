"use client";

import { mapsLink } from "@/lib/maps";
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
  address: string | null;
  category: string | null;
  description: string | null;
  instagram: string | null;
  menu_url: string | null;
};
type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  restaurant: { name: string } | null;
};
type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  restaurant_name: string | null;
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
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [sources, setSources] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [tab, setTab] = useState<"stats" | "restaurants" | "reservations" | "reviews" | "users">("stats");

  const isAdmin = profile?.role === "admin";

  const load = useCallback(async () => {
    const [r, rv, d, sl] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, name, district, phone, approved, created_at, address, category, description, instagram, menu_url")
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

    // Yorumlar ve kayıt kaynakları ayrı yüklenir: SQL yaması eksikse sayfanın geri kalanı bozulmaz
    const rv2 = await supabase
      .from("reviews")
      .select("id, rating, comment, created_at, restaurant:restaurants(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    setReviews(rv2.error ? [] : ((rv2.data ?? []) as unknown as ReviewRow[]));

    const us = await supabase.rpc("admin_list_users");
    setUsers(us.error ? [] : ((us.data ?? []) as UserRow[]));

    const src = await supabase.from("profiles").select("signup_source").eq("role", "diner");
    if (!src.error) {
      const m: Record<string, number> = {};
      for (const x of (src.data ?? []) as { signup_source: string | null }[]) {
        const k = x.signup_source || "(belirsiz)";
        m[k] = (m[k] ?? 0) + 1;
      }
      setSources(m);
    }
  }, []);

  async function deleteUser(u: UserRow) {
    setMsg("");
    const what = u.restaurant_name
      ? `${u.email} (işletme: ${u.restaurant_name}). Bu işletmenin slotları, rezervasyonları ve yorumları da silinir`
      : `${u.email}. Bu kullanıcının rezervasyonları ve yorumları da silinir`;
    if (!confirm(`Silinecek: ${what}. Bu işlem geri alınamaz. Emin misin?`)) return;
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: u.id });
    if (error) setMsg(error.message);
    else load();
  }

  async function deleteReview(id: string) {
    setMsg("");
    if (!confirm("Bu yorum silinsin mi?")) return;
    const { error } = await supabase.rpc("delete_review", { p_id: id });
    if (error) setMsg(error.message);
    else load();
  }

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
        {tabBtn("reviews", `Yorumlar (${reviews.length})`)}
        {tabBtn("users", `Kullanıcılar (${users.length})`)}
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
            <h2 className="mb-3 text-xl font-bold">Kayıt kaynağı (müşteriler)</h2>
            <ul className="divide-y text-sm">
              {Object.entries(sources)
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => (
                  <li key={k} className="flex justify-between py-2">
                    <span className="font-semibold">{k}</span>
                    <span>{n} kişi</span>
                  </li>
                ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              QR ve gruplarda <code>?kaynak=isim</code> ekli bağlantı kullanırsan burada görünür.
            </p>
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
            <div key={r.id} className="card space-y-3">
             <div className="flex flex-wrap items-center justify-between gap-3">
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

             <details className="rounded-xl bg-gray-50 p-3" open={!r.approved}>
              <summary className="cursor-pointer text-sm font-semibold text-[#0a4430]">
                Başvuru bilgileri
              </summary>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex gap-3"><dt className="w-20 shrink-0 text-gray-500">Tür</dt><dd>{r.category ?? "—"}</dd></div>
                <div className="flex gap-3"><dt className="w-20 shrink-0 text-gray-500">Adres</dt><dd>{r.address ?? "—"}</dd></div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-gray-500">Telefon</dt>
                  <dd>
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="text-[#14664a] underline">{r.phone}</a>
                    ) : "—"}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-gray-500">Instagram</dt>
                  <dd>
                    {r.instagram ? (
                      <a href={`https://instagram.com/${r.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[#14664a] underline">
                        @{r.instagram}
                      </a>
                    ) : "—"}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-gray-500">Menü</dt>
                  <dd>
                    {r.menu_url ? (
                      <a href={r.menu_url} target="_blank" rel="noopener noreferrer" className="text-[#14664a] underline">Menüyü aç</a>
                    ) : "—"}
                  </dd>
                </div>
                {r.description && (
                  <div className="flex gap-3"><dt className="w-20 shrink-0 text-gray-500">Tanıtım</dt><dd>{r.description}</dd></div>
                )}
              </dl>
              <a
                href={mapsLink(r.name, r.district, r.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-[#14664a] underline"
              >
                Google Haritalar'da aç
              </a>
             </details>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-3">
          <input
            className="input"
            placeholder="Ad, e-posta ya da işletme ara"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
          {users.length === 0 && (
            <p className="text-gray-600">
              Liste boş ya da yüklenemedi. Veritabanı yamasının (patch_5) çalıştığından emin ol.
            </p>
          )}
          {users
            .filter((u) =>
              `${u.full_name ?? ""} ${u.email} ${u.restaurant_name ?? ""}`
                .toLocaleLowerCase("tr-TR")
                .includes(userQuery.trim().toLocaleLowerCase("tr-TR"))
            )
            .map((u) => (
              <div key={u.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {u.full_name || "(adsız)"}{" "}
                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal">
                      {u.role === "diner" ? "Müşteri" : u.role === "restaurant" ? "İşletme" : "Yönetici"}
                    </span>
                  </p>
                  <p className="break-all text-gray-600">{u.email}</p>
                  <p className="text-xs text-gray-500">
                    {u.restaurant_name ? `${u.restaurant_name} · ` : ""}
                    {u.phone ? `${u.phone} · ` : ""}Kayıt: {fmtDay(u.created_at.slice(0, 10))}
                  </p>
                </div>
                {u.role !== "admin" && (
                  <button onClick={() => deleteUser(u)} className="text-red-700 underline">
                    Sil
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-gray-600">Henüz yorum yok.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">
                  {r.restaurant?.name ?? "Restoran"} · {r.rating}/5
                </p>
                <p className="text-gray-700">{r.comment || "(yorum yazılmamış)"}</p>
                <p className="text-xs text-gray-500">{fmtDay(r.created_at.slice(0, 10))}</p>
              </div>
              <button onClick={() => deleteReview(r.id)} className="text-red-700 underline">
                Sil
              </button>
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