import RoleGuard from "@/components/RoleGuard";

// Profil sayfası müşteri hesapları içindir
export default function ProfilLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["diner"]}>{children}</RoleGuard>;
}
