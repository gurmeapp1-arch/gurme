/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import GuestOffers from "@/components/GuestOffers";

const STEPS = [
  { n: "1", title: "Masanı seç", text: "Gün, saat ve indirim oranı baştan belli." },
  { n: "2", title: "Yerini ayır", text: "Adını ve kaç kişi olduğunu yaz, kodun hazır." },
  { n: "3", title: "Kodu göster", text: "Hesap öderken kodu söyle, indirim uygulansın." },
];

// Giriş yapmamış ziyaretçinin gördüğü sayfa: kısa, sakin, yemeğe odaklı
export default function Landing() {
  return (
    <div className="space-y-14 sm:space-y-16">
      <section className="grid items-center gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="text-sm font-medium text-[#14664a]">Hisarüstü · Beşiktaş · Kadıköy</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
            Boş kalan masalar, senin için indirimde.
          </h1>
          <p className="mt-4 max-w-lg text-lg text-gray-600">
            Ders arası, öğleden sonra, akşam öncesi. Restoranlar sakin saatlerinde indirimli masa
            açıyor, sen yerini ayırıp yemeğe gidiyorsun.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link href="/kayit" className="btn px-6 py-3">
              Ücretsiz kayıt ol
            </Link>
            <Link href="/giris" className="font-semibold text-[#0a4430] underline underline-offset-4">
              Giriş yap
            </Link>
          </div>
        </div>
        <img
          src="/img/ortam.webp"
          alt="Dolu bir restoran salonu"
          width={1600}
          height={893}
          className="hidden h-72 w-full rounded-xl object-cover lg:col-span-2 lg:block"
        />
      </section>

      <GuestOffers />

      <section>
        <h2 className="text-2xl font-extrabold text-gray-900">Nasıl çalışıyor?</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t-2 border-gray-900 pt-3">
              <p className="text-sm font-semibold text-gray-500">{s.n}</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">{s.title}</h3>
              <p className="mt-1 text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-gray-600">
          Siteye ödeme yapmıyorsun. İndirim, restoranda hesabı öderken uygulanıyor.
        </p>
      </section>
    </div>
  );
}
