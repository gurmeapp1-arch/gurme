// Destek WhatsApp numarası: ülke koduyla, boşluksuz (örn. 905321234567).
// Vercel'de Settings > Environment Variables altına NEXT_PUBLIC_SUPPORT_WHATSAPP olarak eklenir.
// Boşsa destek düğmesi görünmez.
export const SUPPORT_WHATSAPP = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");

// Türkiye telefon numarasını wa.me biçimine çevirir (05xx..., 5xx..., +90 5xx...)
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) return d;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) return "90" + d;
  return null;
}

export const whatsAppLink = (number: string, text: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
