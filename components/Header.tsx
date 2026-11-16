"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { roleHome, ROLE_LABEL } from "@/lib/roles";

type NavItem = { href: string; label: string };

// Her rol sadece kendi menüsünü görür
function navFor(role: string | undefined): NavItem[] {
  if (role === "diner")
    return [
      { href: "/", label: "Masalar" },
      { href: "/rezervasyonlarim", label: "Rezervasyonlarım" },
    ];
  if (role === "restaurant") return [{ href: "/restoran", label: "Panelim" }];
  if (role === "admin") return [{ href: "/admin", label: "Yönetim" }];
  return [];
}

export default function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  const home = profile ? roleHome(profile.role) : "/";

  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href={home} className="text-2xl font-extrabold tracking-tight text-[#ebb035]">
          Gurme
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          {navFor(profile?.role).map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}

          {!loading && !user && (
            <>
              <Link href="/giris" className="nav-link">
                Giriş
              </Link>
              <Link href="/kayit" className="btn btn-gold btn-sm ml-1">
                Kayıt ol
              </Link>
            </>
          )}

          {user && profile && (
            <span className="ml-2 hidden items-center gap-2 text-[#7db894] sm:flex">
              {profile.full_name.split(" ")[0]}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                {ROLE_LABEL[profile.role]}
              </span>
            </span>
          )}

          {user && (
            <button onClick={handleSignOut} className="nav-link">
              Çıkış
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
