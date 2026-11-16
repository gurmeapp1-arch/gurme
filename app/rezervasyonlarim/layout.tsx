import RoleGuard from "@/components/RoleGuard";

// Rezervasyonlarım sayfasını sadece müşteri hesapları görür
export default function RezervasyonlarimLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["diner"]}>{children}</RoleGuard>;
}
