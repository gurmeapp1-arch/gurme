"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-[#0a4430] text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-2xl font-extrabold text-[#ebb035]">
          Gurme
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
          {profile?.role === "diner" && (
            <>
              <Link href="/">Restoranlar</Link>
              <Link href="/rezervasyonlarim">Rezervasyonlarım</Link>
            </>
          )}
          {profile?.role === "restaurant" && <Link href="/restoran">Panelim</Link>}
          {profile?.role === "admin" && <Link href="/admin">Yönetim</Link>}

          {!loading && !user && (
            <>
              <Link href="/giris">Giriş</Link>
              <Link href="/kayit" className="btn btn-gold btn-sm">
                Kayıt ol
              </Link>
            </>
          )}

          {user && (
            <>
              {profile && (
                <span className="text-[#7db894]">
                  {profile.full_name.split(" ")[0]}
                </span>
              )}
              <button onClick={handleSignOut} className="underline">
                Çıkış
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
