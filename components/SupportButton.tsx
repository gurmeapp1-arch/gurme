import { SUPPORT_WHATSAPP, whatsAppLink } from "@/lib/config";

// Sol alttaki WhatsApp destek düğmesi. Numara tanımlı değilse hiç görünmez.
export default function SupportButton() {
  if (!SUPPORT_WHATSAPP) return null;

  return (
    <a
      href={whatsAppLink(SUPPORT_WHATSAPP, "Merhaba, Gurme hakkında yardım almak istiyorum.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile destek al"
      className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 font-bold text-white shadow-lg transition hover:scale-105"
    >
      <span className="text-xl" aria-hidden="true">
        💬
      </span>
      <span className="hidden sm:inline">Yardım</span>
    </a>
  );
}
