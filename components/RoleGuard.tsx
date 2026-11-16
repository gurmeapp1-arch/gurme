"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { roleHome, type Role } from "@/lib/roles";

export function PageSpinner() {
  return (
    <div className="flex justify-center py-20" role="status" aria-label="Yükleniyor">
      <div className="spinner" />
    </div>
  );
}

// Sadece izin verilen roller içeriği görür.
// Giriş yapmamış kişi giriş sayfasına, yanlış roldeki kişi kendi ana sayfasına yönlendirilir.
export default function RoleGuard({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const allowed = !!profile && roles.includes(profile.role);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/giris");
    else if (profile && !allowed) router.replace(roleHome(profile.role));
  }, [loading, user, profile, allowed, router]);

  if (allowed) return <>{children}</>;

  if (!loading && user && !profile)
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-semibold">Profil bilgilerin yüklenemedi.</p>
        <p className="mt-1 text-sm text-gray-600">
          Sayfayı yenile. Düzelmezse çıkış yapıp tekrar giriş yap.
        </p>
        <button onClick={() => signOut()} className="btn btn-sm mt-4">
          Çıkış yap
        </button>
      </div>
    );

  return <PageSpinner />;
}
