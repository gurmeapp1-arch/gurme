import { supabase } from "./supabase";

export const BUCKET = "restaurant-images";

// Görseli tarayıcıda küçültür (uzun kenar en fazla maxSize) ve JPEG'e çevirir.
// Telefon fotoğrafları 5-10 MB olabilir, yüklemeden önce yaklaşık 200 KB'a iner.
export async function compressImage(file: File, maxSize = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Görsel işlenemedi.");
  ctx.fillStyle = "#ffffff"; // şeffaf PNG'lerde siyah zemin çıkmasın
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Görsel işlenemedi."))),
      "image/jpeg",
      quality
    )
  );
}

export async function uploadRestaurantImage(
  restaurantId: string,
  kind: "cover" | "logo",
  file: File
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Lütfen bir görsel dosyası seç.");

  let blob: Blob;
  try {
    blob = await compressImage(file, kind === "logo" ? 400 : 1280);
  } catch {
    throw new Error("Bu görsel açılamadı. JPG veya PNG formatında bir fotoğraf dene.");
  }

  // Dosya adında zaman damgası olduğu için eski önbellek görünmez
  const path = `${restaurantId}/${kind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("Yüklenemedi: " + error.message);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Eski dosyayı depodan siler (başarısız olursa sessizce geçer)
export async function removeImageByUrl(url: string | null | undefined) {
  if (!url) return;
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(url.slice(i + marker.length));
  await supabase.storage.from(BUCKET).remove([path]);
}
