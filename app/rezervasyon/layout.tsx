import RoleGuard from "@/components/RoleGuard";

// /rezervasyon/[id] sayfasını sadece müşteri hesapları görür
export default function RezervasyonLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["diner"]}>{children}</RoleGuard>;
}
