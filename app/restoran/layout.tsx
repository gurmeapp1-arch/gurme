import RoleGuard from "@/components/RoleGuard";

// /restoran altındaki sayfaları sadece restoran hesapları görür
export default function RestoranLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["restaurant"]}>{children}</RoleGuard>;
}
