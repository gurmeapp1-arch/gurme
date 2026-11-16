import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Bul ve rezerve et",
    text: "Restoranların sakin saatlerinde açtığı indirimli masaları gör, sana uyanı seç.",
  },
  {
    n: "2",
    title: "Restoranda yemeğini ye",
    text: "Seçtiğin saat aralığında restorana git. Rezervasyon adın ve kodun hazır olur.",
  },
  {
    n: "3",
    title: "Kodunla indirimi uygula",
    text: "Hesabı öderken kodunu göster, indirim restoranın kasasında uygulanır.",
  },
];

// Giriş yapmamış ziyaretçinin gördüğü sayfa: restoran listesi yok, sadece tanıtım
export default function Landing() {
  return (
    <div className="space-y-10">
      <section className="hero px-6 py-12 sm:px-12 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-[#7db894]">
          Boş masa saatleri, dolu sofralar
        </p>
        <h1 className="mt-3 text-5xl font-extrabold text-[#ebb035] sm:text-6xl">Gurme</h1>
        <p className="mt-3 max-w-xl text-2xl font-bold sm:text-3xl">
          Her masa saati değerli olsun.
        </p>
        <p className="mt-2 max-w-xl text-lg text-[#9fd0b5]">
          Premium yemek, sakin saat fiyatı. Restoranlar boş saatlerini doldurur,
          sen sevdiğin yerlerde indirimle yemek yersin.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/kayit" className="btn btn-gold">
            Masa bul, kayıt ol
          </Link>
          <Link href="/giris" className="btn btn-outline">
            Giriş yap
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-extrabold text-[#0a4430]">Nasıl çalışır?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card">
              <div className="step-num">{s.n}</div>
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#0a4430]">Restoran sahibi misin?</h2>
          <p className="mt-1 text-sm text-gray-600">
            Boş saatlerine indirimli slot aç, yoğun akşam saatlerini indirime
            dahil etme. Gelen rezervasyonları tek ekrandan gör.
          </p>
        </div>
        <Link href="/kayit" className="btn shrink-0">
          Restoranını ekle
        </Link>
      </section>
    </div>
  );
}
