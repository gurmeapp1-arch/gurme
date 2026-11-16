const FAQ = [
  {
    q: "Gurme'yi kullanmak ücretli mi?",
    a: "Hayır. Kayıt olmak ve rezervasyon yapmak ücretsiz. Siteye hiçbir ödeme yapmıyorsun.",
  },
  {
    q: "İndirimi nasıl alıyorum?",
    a: "Rezervasyon yapınca sana bir kod (örneğin GRM-4821) veriliyor. Restoranda hesabı öderken bu kodu söylüyorsun, indirim hesaba uygulanıyor.",
  },
  {
    q: "Rezervasyonumu iptal edebilir miyim?",
    a: "Evet. Başlangıç saatine 2 saat kalana kadar Rezervasyonlarım sayfasından iptal edebilirsin. Daha geç kaldıysan restoranı arayıp haber verebilirsin. Gelemeyeceksen iptal etmen, yerin başkasına kalması için önemli.",
  },
  {
    q: "Seçtiğim saat aralığının başladığında da rezervasyon yapabilir miyim?",
    a: "Evet. Kontenjan doluysa ya da restoran kapattıysa görünmez, aksi halde saat aralığı bitene kadar rezervasyon yapabilirsin.",
  },
  {
    q: "Kaç kişilik rezervasyon yapabilirim?",
    a: "Rezervasyon sırasında kaç kişi geleceğini yazıyorsun. Kalan yer sayısı her kartta görünüyor.",
  },
  {
    q: "Restoranla nasıl iletişime geçerim?",
    a: "Rezervasyonlarım sayfasında restoranın telefonu ve WhatsApp bağlantısı var. Geç kalacaksan ya da bir sorun olursa oradan yazabilirsin.",
  },
  {
    q: "Yorum yazabilir miyim?",
    a: "Restoranda yemek yedikten sonra, restoran seni \"geldi\" olarak işaretleyince Rezervasyonlarım sayfasında puan ve yorum kutusu açılıyor.",
  },
  {
    q: "Bilgilerim güvende mi?",
    a: "Adın ve telefonun yalnızca rezervasyon yaptığın restoranla paylaşılır, üçüncü kişilere verilmez. Ayrıntılar Gizlilik ve KVKK sayfasında.",
  },
];

export default function Faq() {
  return (
    <section>
      <h2 className="text-2xl font-extrabold text-gray-900">Sık sorulan sorular</h2>
      <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900">
              {f.q}
              <span
                aria-hidden="true"
                className="text-xl text-gray-400 transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 max-w-2xl text-gray-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
