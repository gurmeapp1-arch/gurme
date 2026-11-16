"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { StarInput } from "@/components/Stars";

// Yemekten sonra restoran "geldi" işaretlediyse müşteri puan ve yorum yazabilir
export default function ReviewBox({
  reservationId,
  restaurantName,
  onDone,
}: {
  reservationId: string;
  restaurantName: string;
  onDone: () => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1) return setError("Lütfen bir puan seç.");
    setBusy(true);
    const { error: err } = await supabase.rpc("submit_review", {
      p_reservation_id: reservationId,
      p_rating: rating,
      p_comment: comment.trim(),
    });
    setBusy(false);
    if (err) return setError(err.message);
    await onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-[#f7f3e8] p-4">
      <p className="font-semibold">{restaurantName} nasıldı?</p>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        className="input"
        rows={3}
        maxLength={500}
        placeholder="İstersen birkaç kelime yaz (isteğe bağlı)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <button className="btn btn-sm" disabled={busy}>
        {busy ? "Gönderiliyor..." : "Yorumu gönder"}
      </button>
      <p className="text-xs text-gray-600">
        Yorumun restoranın sayfasında adının ilk kısmıyla görünür.
      </p>
    </form>
  );
}
