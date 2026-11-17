"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

// Müşterinin favori restoran kimlikleri ve ekleme/çıkarma işlemi
export function useFavorites() {
  const { user, profile } = useAuth();
  const enabled = !!user && profile?.role === "diner";
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !user) {
      setIds(new Set());
      return;
    }
    supabase
      .from("favorites")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error) setIds(new Set((data ?? []).map((r: { restaurant_id: string }) => r.restaurant_id)));
      });
  }, [enabled, user]);

  const toggle = useCallback(
    async (restaurantId: string) => {
      if (!user) return;
      const has = ids.has(restaurantId);
      // Önce ekranda değiştir, hata olursa geri al
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(restaurantId);
        else next.add(restaurantId);
        return next;
      });
      const { error } = has
        ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("restaurant_id", restaurantId)
        : await supabase.from("favorites").insert({ user_id: user.id, restaurant_id: restaurantId });
      if (error) {
        setIds((prev) => {
          const next = new Set(prev);
          if (has) next.add(restaurantId);
          else next.delete(restaurantId);
          return next;
        });
      }
    },
    [user, ids]
  );

  return { enabled, ids, toggle };
}
