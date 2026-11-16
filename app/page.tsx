"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Landing from "@/components/Landing";
import Discover from "@/components/Discover";
import { PageSpinner } from "@/components/RoleGuard";
import { roleHome } from "@/lib/roles";

// Ana sayfa role göre değişir:
// misafir -> tanıtım, müşteri -> indirimli masalar, restoran/yönetici -> kendi paneline yönlenir
export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role !== "diner") router.replace(roleHome(profile.role));
  }, [profile, router]);

  if (loading) return <PageSpinner />;
  if (!user) return <Landing />;
  if (profile?.role === "diner") return <Discover />;
  return <PageSpinner />;
}
