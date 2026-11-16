/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import GuestOffers from "@/components/GuestOffers";

const STEPS = [
  {
    img: "/img/adim-1.webp",
    w: 360,
    h: 300,
    title: "Masanı bul",
    text: "Yakınındaki restoranların indirimli saatlerini gör.",
  },
  {
    img: "/img/adim-2.webp",
    w: 360,
    h: 356,
    title: "Rezerve et",
    text: "Birkaç saniyede yerini ayır, kodunu al.",
  },
  {
    img: "/img/adim-3.webp",
    w: 360,
    h: 379,
    title: "Afiyetle ye",
    text: "Kodunu göster, indirim hesaba uygulanır.",
  },
];

const PERKS = [
  { title: "Daha uygun fiyat", text: "Restoranların sakin saatlerinde indirimli yersin." },
  { title: "Rahat bir masa", text: "Kalabalık olmayan saatlerde sakince oturursun." },
  { title: "Ödeme yok", text: "Siteye para ödemezsin. İndirim restoranda hesapta uygulanır." },
];

// Giriş yapmamış ziyaretçinin gördüğü sayfa: müşteriye yönelik, iştah açan bir giriş
export default function Landing() {
  return (
    <div className="space-y-14 sm:space-y-20">
      {/* Açılış: fotoğraf üstünde büyük mesaj */}
      <section
        className="-mt-8 overflow-hidden rounded-b-[32px] bg-cover bg-center px-6 py-16 text-center text-white sm:py-24"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,68,48,0.72), rgba(10,68,48,0.82)), url(/img/ortam.webp)",
        }}
      >
        <img
          src="/img/pasta.webp"
          alt=""
          width={640}
          height={520}
          className="mx-auto h-24 w-auto sm:h-32"
        />
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Sevdiğin yerde,{" "}
          <span className="text-[#ebb035]">indirimli</span> bir sofra.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[#e3f2ea] sm:text-xl">
          Restoranların sakin saatlerinde masanı ayır, daha uygun fiyata doyur.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/kayit" className="btn btn-gold px-8 py-3.5 text-lg">
            Masaları gör
          </Link>
          <Link href="/giris" className="btn btn-outline px-8 py-3.5 text-lg">
            Giriş yap
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          <span className="chip">Hisarüstü</span>
          <span className="chip">Beşiktaş</span>
          <span className="chip">Kadıköy</span>
        </div>
      </section>

      <GuestOffers />

      {/* Nasıl çalışır */}
      <section>
        <h2 className="text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
          3 adımda indirimli yemek
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.img} className="rounded-2xl bg-[#0a4430] p-6 text-center text-white">
              <img
                src={s.img}
                alt=""
                width={s.w}
                height={s.h}
                loading="lazy"
                className="mx-auto h-28 w-auto"
              />
              <p className="mt-4 text-sm font-semibold text-[#ebb035]">Adım {i + 1}</p>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-[#cfe8da]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Neden Gurme */}
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <img
          src="/img/burak.webp"
          alt="Terasta telefonuna bakan, yemek yiyen genç bir müşteri"
          width={1000}
          height={747}
          loading="lazy"
          className="w-full rounded-3xl object-cover"
        />
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Dışarıda yemek pahalı olmak zorunda değil.
          </h2>
          <ul className="mt-6 space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0a4430] text-sm font-bold text-[#ebb035]"
                >
                  ✓
                </span>
                <div>
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="text-gray-600">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/kayit" className="btn btn-gold mt-7 inline-block px-8 py-3.5 text-lg">
            Hemen başla
          </Link>
        </div>
      </section>

      {/* Kapanış */}
      <section className="rounded-3xl bg-[#0a4430] px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Bugün nerede yiyoruz?</h2>
        <p className="mt-2 text-[#cfe8da]">Ücretsiz kayıt ol, indirimli masaları gör.</p>
        <div className="mt-6">
          <Link href="/kayit" className="btn btn-gold px-8 py-3.5 text-lg">
            Kayıt ol
          </Link>
        </div>
      </section>
    </div>
  );
}
