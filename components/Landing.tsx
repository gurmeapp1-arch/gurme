/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

// Süs amaçlı örnek teklifler. Gerçek restoran adı kullanılmıyor, sayfada "örnek görünüm" notu var.
const SAMPLES = [
  { emoji: "🍝", title: "Makarna Menüsü", time: "14:00–17:30", off: 40 },
  { emoji: "🍔", title: "Burger Menüsü", time: "15:00–18:00", off: 35 },
  { emoji: "🥗", title: "Salata Tabağı", time: "14:30–17:00", off: 30 },
  { emoji: "🍕", title: "Pizza Menüsü", time: "15:00–17:30", off: 45 },
  { emoji: "🥙", title: "Dürüm Menüsü", time: "14:00–16:30", off: 30 },
  { emoji: "🍰", title: "Tatlı ve Kahve", time: "16:00–18:00", off: 40 },
];

// Büyük ekranda ortadaki yazının etrafında yüzen kartların konumu
const FLOAT_POS: React.CSSProperties[] = [
  { left: "3%", top: "9%" },
  { left: "0%", top: "40%", animationDelay: "-2s" },
  { left: "6%", top: "72%", opacity: 0.5, animationDelay: "-4s" },
  { right: "3%", top: "7%", animationDelay: "-1s" },
  { right: "0%", top: "40%", animationDelay: "-3s" },
  { right: "6%", top: "72%", opacity: 0.5, animationDelay: "-5s" },
];

type Sample = (typeof SAMPLES)[number];

function MiniOffer({ s }: { s: Sample }) {
  return (
    <div className="mini-offer" aria-hidden="true">
      <div className="tile">{s.emoji}</div>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-bold">{s.title}</p>
        <p className="text-xs text-gray-500">
          {s.time} · %{s.off} indirim
        </p>
        <span className="fake-btn">Rezerve et</span>
      </div>
    </div>
  );
}

function Cta({
  href,
  children,
  gold,
}: {
  href: string;
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <Link href={href} className={`cta ${gold ? "cta-gold" : ""}`}>
      <span className="cta-label font-display">{children}</span>
      <span className="cta-arrow">→</span>
    </Link>
  );
}

const PROBLEMS = [
  {
    img: "/img/sorun-1.webp",
    w: 360,
    h: 375,
    text: "Restoranlar sakin saatlerde masaları boş bırakıyor.",
  },
  {
    img: "/img/sorun-2.webp",
    w: 360,
    h: 375,
    text: "Boş kapasite, sonradan geri alınamayan gelir demek.",
  },
  {
    img: "/img/sorun-3.webp",
    w: 360,
    h: 375,
    text: "Öğrenciler ve freelancerlar için dışarıda yemek pahalı.",
  },
];

const STEPS = [
  {
    img: "/img/adim-1.webp",
    w: 360,
    h: 300,
    title: "Bul ve rezerve et",
    text: "Sakin saatlerde açılan indirimli masaları gör, sana uyanı seç.",
  },
  {
    img: "/img/adim-2.webp",
    w: 360,
    h: 356,
    title: "Restoranda ye",
    text: "Seçtiğin saat aralığında git. Rezervasyon adın ve kodun hazır.",
  },
  {
    img: "/img/adim-3.webp",
    w: 360,
    h: 379,
    title: "Kodunla indirim",
    text: "Hesabı öderken kodunu göster, indirim kasada uygulanır.",
  },
];

// Giriş yapmamış ziyaretçinin gördüğü sayfa: restoran listesi yok, sadece tanıtım
export default function Landing() {
  return (
    <div className="space-y-12">
      {/* ---------- Açılış ---------- */}
      <section className="hero-stage px-4 pb-10 pt-12 text-center sm:px-8 sm:pt-16">
        <h1 className="font-display text-[clamp(44px,9vw,104px)] font-extrabold leading-[0.95] text-[#0a4430]">
          sakin saat,
          <br />
          <span className="mark">gurme indirim!</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-700 sm:text-xl">
          Restoranların boş masa saatlerini, indirimli ve rahat bir sofraya çeviriyoruz.
        </p>

        {/* Büyük ekran: yüzen kartlar + ortada logo ve çağrı */}
        <div className="relative mx-auto mt-6 hidden h-[500px] max-w-6xl lg:block">
          {SAMPLES.map((s, i) => (
            <div key={s.title} className="float-card" style={FLOAT_POS[i]}>
              <MiniOffer s={s} />
            </div>
          ))}
          <div className="absolute inset-x-0 top-1/2 mx-auto w-[420px] -translate-y-1/2">
            <div className="rounded-3xl bg-[#0a4430] px-6 pb-4 pt-5">
              <img
                src="/img/logo.webp"
                alt="Gurme"
                width={520}
                height={470}
                className="mx-auto h-36 w-auto"
              />
            </div>
            <span className="mt-4 inline-block -rotate-1 bg-[#0a4430] px-4 py-1 text-sm font-extrabold tracking-widest text-[#ebb035]">
              PİLOT BAŞLADI
            </span>
            <p className="mt-3 text-lg text-gray-700">
              Hisarüstü, Beşiktaş ve Kadıköy&apos;de restoranların sakin saatlerinde
              indirimli masalar seni bekliyor.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-4">
              <Cta href="/kayit" gold>
                Masa bul
              </Cta>
            </div>
          </div>
        </div>

        {/* Küçük ekran: çağrı üstte, kartlar altta */}
        <div className="mt-8 lg:hidden">
          <img
            src="/img/pasta.webp"
            alt=""
            width={640}
            height={520}
            className="mx-auto h-32 w-auto"
          />
          <span className="mt-3 inline-block -rotate-1 bg-[#0a4430] px-4 py-1 text-sm font-extrabold tracking-widest text-[#ebb035]">
            PİLOT BAŞLADI
          </span>
          <p className="mx-auto mt-4 max-w-md text-gray-700">
            Hisarüstü, Beşiktaş ve Kadıköy&apos;de restoranların sakin saatlerinde
            indirimli masalar seni bekliyor.
          </p>
          <div className="mt-6 flex justify-center">
            <Cta href="/kayit" gold>
              Masa bul
            </Cta>
          </div>
          <div className="mt-8 grid place-items-center gap-3 sm:grid-cols-2">
            {SAMPLES.slice(0, 4).map((s) => (
              <MiniOffer key={s.title} s={s} />
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-500">Örnek görünüm</p>
      </section>

      {/* ---------- Sorun ---------- */}
      <section className="rounded-[32px] bg-[#0a4430] px-6 py-12 text-white">
        <h2 className="font-display text-center text-4xl font-extrabold sm:text-5xl">
          Boş masa saatleri <span className="text-[#ebb035]">pahalıya mal oluyor</span>
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.img} className="rounded-3xl bg-white/10 p-5 text-center">
              <img
                src={p.img}
                alt=""
                width={p.w}
                height={p.h}
                loading="lazy"
                className="mx-auto h-36 w-auto"
              />
              <p className="mt-3 text-lg font-semibold">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- İki taraf ---------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="split-card split-gold">
          <img
            src="/img/burak.webp"
            alt="Terasta telefonuna bakan, makarna yiyen genç bir müşteri"
            width={1000}
            height={747}
            loading="lazy"
            className="mx-auto h-52 w-full max-w-md rounded-3xl object-cover"
          />
          <h2 className="font-display mt-5 text-4xl font-extrabold sm:text-5xl">
            Yemek yiyenler için Gurme
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg">
            Sakin saatlerde açılan indirimli masaları bul, rezervasyonunu yap,
            kodunla indirimi uygula.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <div className="ticket flex gap-4">
              <div className="ticket-tile h-24 w-24 shrink-0 text-5xl">🍝</div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-tight">Makarna Menüsü</p>
                <p className="mt-1 text-sm text-gray-600">Beşiktaş · 14:00–17:30</p>
                <div className="ticket-btn mt-3">
                  <span>%40 indirim</span>
                  <span>Rezerve et</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Cta href="/kayit">Masa bul</Cta>
          </div>
        </div>

        <div className="split-card split-green">
          <img
            src="/img/gozde.webp"
            alt="Restoranının önünde gülümseyen kadın restoran sahibi"
            width={1000}
            height={747}
            loading="lazy"
            className="mx-auto h-52 w-full max-w-md rounded-3xl object-cover"
          />
          <h2 className="font-display mt-5 text-4xl font-extrabold text-[#ebb035] sm:text-5xl">
            Restoranlar için Gurme
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-[#cfe8da]">
            Boş saatlerine indirimli slot aç, yoğun akşam saatlerini indirime
            dahil etme, gelen rezervasyonları tek ekrandan gör.
          </p>

          <div className="mx-auto mt-8 max-w-md">
            <div className="ticket">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-bold leading-tight">Hafta içi sakin saat</p>
                  <p className="mt-1 text-sm text-gray-600">14:00–17:30 · 20 kişilik kontenjan</p>
                </div>
                <span className="discount">
                  %40<small>İNDİRİM</small>
                </span>
              </div>
              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-[#ece8d9]">
                  <div className="h-full w-[60%] rounded-full bg-[#ebb035]" />
                </div>
                <p className="mt-1 text-xs text-gray-600">12 / 20 kişi rezerve edildi</p>
              </div>
              <div className="ticket-btn mt-4">
                <span>Gelen rezervasyonlar</span>
                <span>Gör</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Cta href="/kayit" gold>
              Restoranını ekle
            </Cta>
          </div>
        </div>
      </section>

      {/* ---------- Tek platform, iki tarafa değer ---------- */}
      <section className="grid items-center gap-8 rounded-[32px] bg-[#0a4430] px-6 py-12 text-white lg:grid-cols-2 lg:px-12">
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Tek platform, <span className="text-[#ebb035]">iki tarafa da değer.</span>
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="font-display text-2xl font-bold text-[#ebb035]">Restoranlar</p>
              <p className="mt-1 text-[#cfe8da]">Sakin saatlerde masa devir hızını artırır.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="font-display text-2xl font-bold text-[#ebb035]">Müşteriler</p>
              <p className="mt-1 text-[#cfe8da]">İhtiyaç duyduklarında uygun fiyatlı yemek bulur.</p>
            </div>
          </div>
        </div>
        <img
          src="/img/restoran-musteri.webp"
          alt="Restoran ile müşteriyi telefon üzerinden buluşturan çizim"
          width={672}
          height={423}
          loading="lazy"
          className="mx-auto w-full max-w-md"
        />
      </section>

      {/* ---------- Nasıl çalışır ---------- */}
      <section>
        <h2 className="font-display text-center text-4xl font-extrabold text-[#0a4430]">
          Nasıl çalışır?
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.img} className="rounded-3xl bg-[#0a4430] p-6 text-center text-white">
              <img
                src={s.img}
                alt=""
                width={s.w}
                height={s.h}
                loading="lazy"
                className="mx-auto h-40 w-auto"
              />
              <h3 className="font-display mt-3 text-2xl font-bold text-[#ebb035]">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-[#cfe8da]">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Kapanış ---------- */}
      <section
        className="rounded-[32px] bg-cover bg-center px-6 py-14 text-center text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,68,48,0.86), rgba(10,68,48,0.9)), url(/img/ortam.webp)",
        }}
      >
        <h2 className="font-display text-4xl font-extrabold text-[#ebb035] sm:text-5xl">
          Masalar boş kalmasın.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[#cfe8da]">Pilot bölgelerimiz</p>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <span className="chip">Hisarüstü</span>
          <span className="chip">Beşiktaş</span>
          <span className="chip">Kadıköy</span>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Cta href="/kayit" gold>
            Hemen kayıt ol
          </Cta>
          <Cta href="/giris">Giriş yap</Cta>
        </div>
      </section>
    </div>
  );
}
