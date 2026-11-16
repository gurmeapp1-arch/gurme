"use client";

import { useEffect, useState } from "react";

// Şu anki saati sayfa tarayıcıda açıldıktan sonra verir, her dakika günceller.
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return now;
}