import BackButton from "@/components/BackButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım koşulları | Gurme",
};

// TASLAK: yayına almadan önce bir hukukçuya kontrol ettirin. [KÖŞELİ] alanları doldurun.
export default function KosullarPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-gray-800">
      <BackButton fallback="/" />
      <h1 className="text-3xl font-extrabold text-[#0a4430]">Kullanım koşulları</h1>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Gurme şu an pilot aşamasındadır. Bu koşullar pilot sürecinde geçerlidir ve değişebilir.
      </p>

      <section>
        <h2 className="text-lg font-bold">Gurme nedir?</h2>
        <p className="mt-1">
          Gurme, restoran ve kafelerin açtığı indirimli rezervasyon saatlerini müşterilerle buluşturan bir
          platformdur. Gurme bir restoran değildir; yemek sunmaz ve ödeme almaz. Hizmeti ilgili restoran
          verir.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Rezervasyon ve indirim</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Rezervasyon yaptığında sana bir rezervasyon kodu verilir. İndirimi hesap sırasında bu kodu söyleyerek alırsın.</li>
          <li>İndirim, restoranda ödeme sırasında restoran tarafından uygulanır. Ödeme Gurme üzerinden yapılmaz.</li>
          <li>İndirim oranı rezervasyon yaptığın anda belirlenir ve rezervasyonuna kilitlenir.</li>
          <li>Rezervasyon saatleri içinde istediğin zaman gelebilirsin. Kontenjan, rezervasyondaki kişi sayısı kadardır.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">İptal ve değişiklik</h2>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Rezervasyonunu, slot başlamadan en az 2 saat öncesine kadar iptal edebilir ve kişi sayısını değiştirebilirsin.</li>
          <li>Bu süreden sonra değişiklik için doğrudan restoranla iletişime geçmelisin.</li>
          <li>Restoranlar onaylanmış bir rezervasyonu tek taraflı iptal edemez.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Gelmeme ve kötüye kullanım</h2>
        <p className="mt-1">
          Rezervasyonuna gelmezsen restoran bunu kaydedebilir. Birden fazla kez gelmemen halinde yeni
          rezervasyon yapman geçici olarak engellenebilir. Aynı anda en fazla 2 aktif rezervasyonun
          olabilir. Sahte bilgi vermek, sistemi kötüye kullanmak ya da başkalarının hesabını kullanmak
          hesabının kapatılmasına yol açabilir.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Yorumlar</h2>
        <p className="mt-1">
          Yalnızca rezervasyonuna gelip restoranın &quot;geldi&quot; olarak işaretlemesinden sonra yorum
          yazabilirsin. Yorumunda ismini göstermeyi ya da anonim kalmayı seçebilirsin. Hakaret, kişisel
          veri, reklam ve gerçeğe aykırı içerik yasaktır; bu tür yorumlar kaldırılabilir.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Restoranlar için</h2>
        <p className="mt-1">
          Restoranlar, açtıkları slotlardaki indirimi, rezervasyon koduyla gelen müşteriye uygulamayı
          kabul eder. Hesaplar yönetici onayından sonra yayına alınır; Gurme uygun görmediği hesabı
          yayından kaldırabilir. Restoranlara özel ayrıntılar ayrıca yazılı olarak paylaşılır.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Sorumluluk</h2>
        <p className="mt-1">
          Gurme, restoranın sunduğu hizmetin, menü ve fiyatların, çalışma saatlerinin ve indirimin
          uygulanmasının sorumlusu değildir. Bir sorun olursa önce restoranla, sonra bizimle iletişime
          geçebilirsin; çözmek için elimizden geleni yaparız. Hizmette kesinti ya da hata olabilir;
          pilot süreçte hizmet &quot;olduğu gibi&quot; sunulur.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Kişisel veriler</h2>
        <p className="mt-1">
          Verilerinin nasıl işlendiğini{" "}
          <a href="/gizlilik" className="font-semibold underline">
            Gizlilik ve KVKK
          </a>{" "}
          metninde okuyabilirsin.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Değişiklikler ve iletişim</h2>
        <p className="mt-1">
          Bu koşulları zaman zaman güncelleyebiliriz; güncel hali bu sayfada yer alır. Sorular için:
          [İLETİŞİM E-POSTASI]. Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır; yetkili mahkemeler
          [ŞEHİR] mahkemeleri ve icra daireleridir.
        </p>
      </section>
    </article>
  );
}
