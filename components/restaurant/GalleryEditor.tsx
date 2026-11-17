"use client";

import { useCallback, useEffect, useState } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import { supabase } from "@/lib/supabase";
import { removeImageByUrl, uploadRestaurantImage } from "@/lib/image";

const MAX = 8;
type Photo = { id: string; url: string };

// İşletmenin galeri fotoğraflarını ekleme ve silme (en fazla 8)
export default function GalleryEditor({ restaurantId }: { restaurantId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("restaurant_photos")
      .select("id, url")
      .eq("restaurant_id", restaurantId)
      .order("created_at");
    if (!err) setPhotos((data ?? []) as Photo[]);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError("");
    setBusy(true);
    try {
      let count = photos.length;
      for (const f of files) {
        if (count >= MAX) {
          setError(`En fazla ${MAX} fotoğraf ekleyebilirsin.`);
          break;
        }
        const url = await uploadRestaurantImage(restaurantId, "gallery", f);
        const { error: err } = await supabase
          .from("restaurant_photos")
          .insert({ restaurant_id: restaurantId, url });
        if (err) {
          await removeImageByUrl(url);
          throw new Error(err.message);
        }
        count++;
      }
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Yüklenemedi.");
    } finally {
      setBusy(false);
      await load();
    }
  }

  async function remove(p: Photo) {
    const { error: err } = await supabase.from("restaurant_photos").delete().eq("id", p.id);
    if (err) return setError(err.message);
    await removeImageByUrl(p.url);
    await load();
  }

  return (
    <div>
      <span className="label">
        Galeri ({photos.length}/{MAX})
      </span>
      <p className="mb-2 text-xs text-gray-600">
        Mekân, tabaklar, menü gibi fotoğraflar. Müşteriler restoran sayfanda yana kaydırarak görür.
      </p>
      <div className="flex flex-wrap gap-3">
        {photos.map((p) => (
          <div key={p.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-24 w-32 rounded-lg object-cover" />
            <div className="absolute right-1 top-1 rounded-full bg-black/70 px-1 py-0.5 text-white">
              <ConfirmButton
                label="✕"
                question="Silinsin mi?"
                confirmLabel="Sil"
                onConfirm={() => remove(p)}
                className="grid h-7 w-7 place-items-center text-sm"
              />
            </div>
          </div>
        ))}
        {photos.length < MAX && (
          <label className="grid h-24 w-32 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-gray-600">
            {busy ? "Yükleniyor..." : "+ Fotoğraf ekle"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={add}
              disabled={busy}
            />
          </label>
        )}
      </div>
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
