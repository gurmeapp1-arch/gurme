export type Role = "diner" | "restaurant" | "admin";

// Her rolün giriş yaptıktan sonra gideceği ana sayfa
export const roleHome = (role: Role): string =>
  role === "restaurant" ? "/restoran" : role === "admin" ? "/admin" : "/";

export const ROLE_LABEL: Record<Role, string> = {
  diner: "Müşteri",
  restaurant: "Restoran",
  admin: "Yönetici",
};

// Telefon: en az 10 haneli rakam (05xx xxx xx xx, +90 ... gibi yazımlar kabul)
export const isValidPhone = (s: string): boolean => {
  const digits = s.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
};
