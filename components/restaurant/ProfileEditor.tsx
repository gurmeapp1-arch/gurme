"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { removeImageByUrl } from "@/lib/image";
import { isValidPhone } from "@/lib/roles";
import type { Restaurant } from "@/lib/types";
import ImageUpload from "@/components/ImageUpload";
import { CATEGORIES } from "@/lib/categories";

export default function ProfileEditor({
  restaurant,
  onSaved,
}: {
  restaurant: Restaurant;
  onSaved: () => Promise<void>;
}) {
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [phone, setPhone] = useState(restaurant.phone ?? "");
  const [address, setAddress] = useState(restaurant.address ?? "");
  const [category, setCategory] = useState(restaurant.category ?? "Restoran");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function saveImage(kind: "cover" | "logo", url: string) {
    const column = kind === "cover" ? "cover_url" : "logo_url";
    const old = kind === "cover" ? restaurant.cover_url : restaurant.logo_url;
    const { error } = await supabase
      .from("restaurants")
      .update({ [column]: url })
      .eq("id", restaurant.id);
    if (error) throw new Error("Kaydedilemedi: " + error.message);
    await removeImageByUrl(old);
    await onSaved();
  }

  async function saveText(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (phone.trim() && !isValidPhone(phone))
      return setMsg({ ok: false, text: "Geçerli bir telefon numarası yaz (örn. 0532 123 45 67)." });

    setBusy(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        description: description.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        category,
      })
      .eq("id", restaurant.id);
    setBusy(false);
    if (error) return setMsg({ ok: false, text: "Kaydedilemedi: " + error.message });
    setMsg({ ok: true, text: "Bilgilerin kaydedildi." });
    await onSaved();
  }

  const complete = !!restaurant.cover_url && !!restaurant.description;

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-xl font-bold">Restoran bilgilerim</h2>
        <p className="text-sm text-gray-600">
          {complete
            ? "Müşteriler seni bu bilgilerle görür."
            : "Fotoğraf ve tanıtım yazısı ekleyen restoranlar daha çok rezervasyon alır."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ImageUpload
          label="Kapak fotoğrafı"
          hint="Mekânından ya da en sevilen tabağından bir fotoğraf."
          kind="cover"
          restaurantId={restaurant.id}
          value={restaurant.cover_url}
          onSaved={(url) => saveImage("cover", url)}
        />
        <ImageUpload
          label="Logo"
          hint="Kare ve sade bir logo iyi görünür."
          kind="logo"
          restaurantId={restaurant.id}
          value={restaurant.logo_url}
          onSaved={(url) => saveImage("logo", url)}
        />
      </div>

      <form onSubmit={saveText} className="space-y-4">
        <div>
          <label className="label">Tür</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tanıtım yazısı</label>
          <textarea
            className="input"
            rows={3}
            maxLength={400}
            placeholder="Örn. Ev yapımı makarna ve taş fırın pizza. Hafta içi öğleden sonra sakin ve huzurlu."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-gray-500">{description.length}/400</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Telefon</label>
            <input
              className="input"
              type="tel"
              placeholder="05xx xxx xx xx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Müşteriler rezervasyon sonrası seninle WhatsApp&apos;tan iletişime geçebilir.
            </p>
          </div>
          <div>
            <label className="label">Adres</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
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

        <button className="btn" disabled={busy}>
          {busy ? "Kaydediliyor..." : "Bilgilerimi kaydet"}
        </button>
      </form>
    </section>
  );
}
