/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

const STEPS = [
  {
    img: "/img/adim-1.webp",
    w: 360,
    h: 300,
    title: "Masanı bul",
    text: "Restoranların sakin saatlerde açtığı indirimli masaları gör.",
  },
  {
    img: "/img/adim-2.webp",
    w: 360,
    h: 356,
    title: "Rezerve et",
    text: "Birkaç saniyede rezervasyon yap, kodunu al.",
  },
  {
    img: "/img/adim-3.webp",
    w: 360,
    h: 379,
    title: "İndirimini kullan",
    text: "Restoranda kodunu göster, indirim hesaba uygulanır.",
  },
];

const OWNER_POINTS = [
  { title: "Boş saatlerini doldur", text: "İndirimi sadece sakin saatlerine koyarsın, yoğun saatlerin etkilenmez." },
  { title: "Her şey tek ekranda", text: "Rezervasyon yapanın adı, kodu ve telefonu panelinde görünür." },
  { title: "Ödeme sistemi yok", text: "Para Gurme'den geçmez. İndirimi kasada kendin uygularsın." },
];

// Giriş yapmamış ziyaretçinin gördüğü sayfa: sade bir tanıtım
export default function Landing() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Açılış */}
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#0a4430] sm:text-5xl">
            Sakin saatlerde indirimli masa.
          </h1>
          <p className="mt-4 max-w-md text-lg text-gray-600">
            Restoranlar boş saatlerini indirimle açar, sen ucuza yersin. Ödeme yok, sadece
            rezervasyon.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/kayit" className="btn btn-gold px-6 py-3">
              Masa bul
            </Link>
            <Link
              href="/kayit"
              className="rounded-full px-6 py-3 font-bold text-[#0a4430] ring-2 ring-[#0a4430] hover:bg-[#0a4430] hover:text-white"
            >
              Restoranımı ekle
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">Pilot bölgeler: Hisarüstü · Beşiktaş · Kadıköy</p>
        </div>
        <div className="rounded-3xl bg-[#0a4430] px-6 py-8">
          <img
            src="/img/logo.webp"
            alt="Gurme"
            width={520}
            height={470}
            className="mx-auto h-56 w-auto sm:h-72"
          />
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section>
        <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Nasıl çalışır?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.img} className="rounded-2xl bg-[#0a4430] p-6 text-white">
              <img
                src={s.img}
                alt=""
                width={s.w}
                height={s.h}
                loading="lazy"
                className="mx-auto h-28 w-auto"
              />
              <p className="mt-4 text-sm font-semibold text-[#ebb035]">Adım {i + 1}</p>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-[#cfe8da]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Restoranlar için */}
      <section className="rounded-3xl bg-white p-6 ring-1 ring-gray-200 sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-[#14664a]">Restoran sahipleri için</p>
            <h2 className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Boş masalar gelire dönüşsün.
            </h2>
            <ul className="mt-6 space-y-4">
              {OWNER_POINTS.map((p) => (
                <li key={p.title}>
                  <p className="font-bold text-gray-900">{p.title}</p>
                  <p className="text-gray-600">{p.text}</p>
                </li>
              ))}
            </ul>
            <Link href="/kayit" className="btn mt-7 inline-block px-6 py-3">
              Restoranımı ekle
            </Link>
          </div>
          <img
            src="/img/restoran-musteri.webp"
            alt="Restoran ile müşteriyi buluşturan çizim"
            width={672}
            height={423}
            loading="lazy"
            className="w-full max-w-md justify-self-center rounded-2xl bg-[#0a4430] p-6"
          />
        </div>
      </section>

      {/* Kapanış */}
      <section className="rounded-3xl bg-[#0a4430] px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Masalar boş kalmasın.</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/kayit" className="btn btn-gold px-6 py-3">
            Ücretsiz kayıt ol
          </Link>
          <Link href="/giris" className="btn btn-outline px-6 py-3">
            Giriş yap
          </Link>
        </div>
      </section>
    </div>
  );
}
