import RoleGuard from "@/components/RoleGuard";

// /admin altındaki sayfaları sadece yönetici görür
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard roles={["admin"]}>{children}</RoleGuard>;
}
