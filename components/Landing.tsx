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

const STEPS = [
  { n: "1", emoji: "🔎", title: "Bul ve rezerve et", text: "Sakin saatlerde açılan indirimli masaları gör, sana uyanı seç." },
  { n: "2", emoji: "🍽️", title: "Restoranda ye", text: "Seçtiğin saat aralığında git. Rezervasyon adın ve kodun hazır." },
  { n: "3", emoji: "🎟️", title: "Kodunla indirim", text: "Hesabı öderken kodunu göster, indirim kasada uygulanır." },
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

        {/* Büyük ekran: yüzen kartlar + ortada çağrı */}
        <div className="relative mx-auto mt-6 hidden h-[430px] max-w-6xl lg:block">
          {SAMPLES.map((s, i) => (
            <div key={s.title} className="float-card" style={FLOAT_POS[i]}>
              <MiniOffer s={s} />
            </div>
          ))}
          <div className="absolute inset-x-0 top-1/2 mx-auto w-[420px] -translate-y-1/2">
            <span className="inline-block -rotate-1 bg-[#0a4430] px-4 py-1 text-sm font-extrabold tracking-widest text-[#ebb035]">
              PİLOT BAŞLADI
            </span>
            <p className="font-display mt-3 text-5xl font-extrabold leading-none text-[#0a4430]">
              Gurme Yayında
            </p>
            <p className="mt-4 text-lg text-gray-700">
              Hisarüstü, Beşiktaş ve Kadıköy&apos;de restoranların sakin saatlerinde
              indirimli masalar seni bekliyor.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Cta href="/kayit" gold>
                Masa bul
              </Cta>
            </div>
          </div>
        </div>

        {/* Küçük ekran: kartlar altta, çağrı üstte */}
        <div className="mt-8 lg:hidden">
          <span className="inline-block -rotate-1 bg-[#0a4430] px-4 py-1 text-sm font-extrabold tracking-widest text-[#ebb035]">
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

      {/* ---------- İki taraf ---------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="split-card split-gold">
          <div className="text-5xl">🍽️</div>
          <h2 className="font-display mt-2 text-4xl font-extrabold sm:text-5xl">
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
          <div className="text-5xl">🏪</div>
          <h2 className="font-display mt-2 text-4xl font-extrabold text-[#ebb035] sm:text-5xl">
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

      {/* ---------- Nasıl çalışır ---------- */}
      <section>
        <h2 className="font-display text-center text-4xl font-extrabold text-[#0a4430]">
          Nasıl çalışır?
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card text-center">
              <div className="text-4xl">{s.emoji}</div>
              <h3 className="font-display mt-2 text-2xl font-bold">
                {s.n}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Bölgeler ve kapanış ---------- */}
      <section className="rounded-[32px] bg-[#0a4430] px-6 py-12 text-center text-white">
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
