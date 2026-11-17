"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNow } from "@/lib/useNow";
import { addDays, hm, istDate, toDate, weekdayOf, WEEKDAYS } from "@/lib/time";
import type { Slot } from "@/lib/types";

const MAX_SLOTS = 400;

export default function SlotForm({
  restaurantId,
  existing,
  onCreated,
}: {
  restaurantId: string;
  existing: Slot[];
  onCreated: () => Promise<void>;
}) {
  const now = useNow();
  const [form, setForm] = useState({
    slot_date: "",
    start_time: "14:00",
    end_time: "17:30",
    discount_percent: "40",
    capacity: "20",
  });
  const [steps, setSteps] = useState(false);
  const [far, setFar] = useState("60");
  const [mid, setMid] = useState("50");
  const [repeat, setRepeat] = useState(false);
  const [days, setDays] = useState<number[]>([]);
  const [weeks, setWeeks] = useState("4");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Tarih alanına varsayılan olarak bugünü yaz (sayfa tarayıcıda açılınca)
  useEffect(() => {
    setForm((f) => (f.slot_date ? f : { ...f, slot_date: istDate(new Date()) }));
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function toggleRepeat(on: boolean) {
    setRepeat(on);
    // Tekrar açılınca seçili tarihin haftanın günü otomatik işaretlensin
    if (on && days.length === 0 && form.slot_date) setDays([weekdayOf(form.slot_date)]);
  }

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const discount = Number(form.discount_percent);
    const capacity = Number(form.capacity);
    if (form.end_time <= form.start_time)
      return setMsg({ ok: false, text: "Bitiş saati, başlangıç saatinden sonra olmalı." });
    if (!(discount >= 5 && discount <= 70))
      return setMsg({ ok: false, text: "İndirim oranı %5 ile %70 arasında olmalı." });
    const farN = Number(far);
    const midN = Number(mid);
    if (steps) {
      if (!(farN >= 5 && farN <= 70 && midN >= 5 && midN <= 70))
        return setMsg({ ok: false, text: "Basamak indirimleri %5 ile %70 arasında olmalı." });
      if (!(farN >= midN && midN >= discount))
        return setMsg({
          ok: false,
          text: "İndirim zamanla azalmalı: 2+ gün önce ≥ 1-2 gün önce ≥ son 24 saat.",
        });
    }
    if (!(capacity >= 1)) return setMsg({ ok: false, text: "Kontenjan en az 1 kişi olmalı." });
    if (repeat && days.length === 0)
      return setMsg({ ok: false, text: "Tekrar için en az bir gün seç." });

    // Hangi tarihlerde slot açılacak?
    let dates: string[] = [form.slot_date];
    if (repeat) {
      const total = Number(weeks) * 7;
      dates = [];
      for (let i = 0; i < total; i++) {
        const d = addDays(form.slot_date, i);
        if (days.includes(weekdayOf(d))) dates.push(d);
      }
    }

    // Geçmiş olanları ve zaten var olanları ayıkla
    const nowDate = new Date();
    const exists = new Set(existing.map((s) => `${s.slot_date}|${hm(s.start_time)}`));
    let past = 0;
    let dup = 0;
    const rows = [];
    for (const d of dates) {
      if (toDate(d, form.end_time) <= nowDate) {
        past++;
        continue;
      }
      if (exists.has(`${d}|${form.start_time}`)) {
        dup++;
        continue;
      }
      rows.push({
        restaurant_id: restaurantId,
        slot_date: d,
        start_time: form.start_time,
        end_time: form.end_time,
        discount_percent: discount,
        discount_far: steps ? farN : null,
        discount_mid: steps ? midN : null,
        capacity,
      });
    }

    if (rows.length === 0)
      return setMsg({
        ok: false,
        text: dup > 0 ? "Bu saatlerde zaten slotun var." : "Geçmiş bir saat için slot açamazsın.",
      });
    if (rows.length > MAX_SLOTS)
      return setMsg({ ok: false, text: `Tek seferde en fazla ${MAX_SLOTS} slot açılabilir.` });

    setBusy(true);
    const { error } = await supabase.from("slots").insert(rows);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "Slot açılamadı: " + error.message });

    const notes = [dup ? `${dup} tanesi zaten vardı` : "", past ? `${past} tanesi geçmişte kaldı` : ""]
      .filter(Boolean)
      .join(", ");
    setMsg({
      ok: true,
      text: `${rows.length} slot açıldı${notes ? " (" + notes + ")" : ""}.`,
    });
    await onCreated();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-gray-200">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Yeni indirim aç</h2>
        <p className="text-sm text-gray-500">Sakin saatini seç, indirim oranını yaz. Müşteriler hemen görür.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{repeat ? "Başlangıç tarihi" : "Tarih"}</label>
          <input
            type="date"
            className="input"
            required
            min={now ? istDate(now) : undefined}
            value={form.slot_date}
            onChange={(e) => set("slot_date", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Başlangıç</label>
            <input
              type="time"
              className="input"
              required
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Bitiş</label>
            <input
              type="time"
              className="input"
              required
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">{steps ? "Son 24 saatte indirim (%)" : "İndirim oranı (%)"}</label>
          <input
            type="number"
            className="input"
            required
            min={5}
            max={70}
            value={form.discount_percent}
            onChange={(e) => set("discount_percent", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Kaç kişilik yer?</label>
          <input
            type="number"
            className="input"
            required
            min={1}
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={steps}
            onChange={(e) => {
              setSteps(e.target.checked);
              if (e.target.checked) {
                const b = Number(form.discount_percent) || 20;
                setMid(String(Math.min(70, b + 10)));
                setFar(String(Math.min(70, b + 20)));
              }
            }}
          />
          İndirim zamanla azalsın
        </label>
        {steps && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">2+ gün önce (%)</label>
                <input type="number" className="input" min={5} max={70} value={far}
                  onChange={(e) => setFar(e.target.value)} />
              </div>
              <div>
                <label className="label">1-2 gün önce (%)</label>
                <input type="number" className="input" min={5} max={70} value={mid}
                  onChange={(e) => setMid(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Müşteri erken ayırırsa daha yüksek indirim alır. Rezervasyon anındaki indirim o müşteriye
              kilitlenir. Örnek: %{far || "?"} → %{mid || "?"} → %{form.discount_percent || "?"}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input type="checkbox" checked={repeat} onChange={(e) => toggleRepeat(e.target.checked)} />
          Her hafta tekrarla
        </label>
        {repeat && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="label">Hangi günler?</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((w) => (
                  <button
                    key={w.d}
                    type="button"
                    onClick={() => toggleDay(w.d)}
                    aria-pressed={days.includes(w.d)}
                    className="rounded-full px-4 py-1.5 text-sm font-bold"
                    style={{
                      background: days.includes(w.d) ? "#0a4430" : "#fff",
                      color: days.includes(w.d) ? "#fff" : "#0a4430",
                      boxShadow: "inset 0 0 0 1.5px #0a4430",
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Kaç hafta boyunca?</label>
              <select
                className="input"
                style={{ width: "auto" }}
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
              >
                {[1, 2, 4, 8, 12, 26, 52].map((n) => (
                  <option key={n} value={n}>
                    {n} hafta
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-600">
              Seçtiğin tarihten itibaren, seçili günlerde aynı saat ve indirimle slotlar açılır. Zaten
              olan ve geçmişte kalanlar atlanır.
            </p>
          </div>
        )}
      </div>

      {msg && (
        <p
          className={`rounded-lg p-3 text-sm ${
            msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </p>
      )}

      <button className="btn btn-gold" disabled={busy}>
        {busy ? "Açılıyor..." : "İndirimi yayınla"}
      </button>
    </form>
  );
}
