import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK | Gurme",
};

// TASLAK: yayına almadan önce bir hukukçuya kontrol ettirin. [KÖŞELİ] alanları doldurun.
export default function GizlilikPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6 text-gray-800">
      <h1 className="text-3xl font-extrabold text-[#0a4430]">Gizlilik ve KVKK Aydınlatma Metni</h1>

      <section>
        <h2 className="text-lg font-bold">Veri sorumlusu</h2>
        <p className="mt-1">
          Gurme, [AD SOYAD] tarafından okul projesi kapsamında yürütülen bir pilot çalışmadır.
          İletişim: [İLETİŞİM E-POSTASI].
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Hangi verileri topluyoruz?</h2>
        <p className="mt-1">
          Ad soyad, telefon numarası, e-posta adresi, rezervasyon bilgileri (restoran, tarih, saat,
          kişi sayısı, rezervasyon adı ve kodu) ve isteğe bağlı olarak yazdığın yorum ve puan.
          Restoran hesaplarında ek olarak restoran adı, adres ve yüklenen görseller.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Neden kullanıyoruz?</h2>
        <p className="mt-1">
          Rezervasyon hizmetini sunmak, restoranın rezervasyonunu tanıyabilmesini sağlamak, hesabını
          yönetmek ve pilot çalışmanın kullanım istatistiklerini (kişisel olmayan, toplu rakamlar)
          çıkarmak için.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Kimlerle paylaşıyoruz?</h2>
        <p className="mt-1">
          Rezervasyon yaptığında adın, telefonun ve rezervasyon bilgilerin yalnızca ilgili restoranla
          paylaşılır. Yorumların restoran sayfasında adının ilk kısmıyla görünür. Verilerin
          satılmaz ve reklam amacıyla üçüncü kişilere verilmez. Hizmetin çalışması için altyapı
          sağlayıcıları (Supabase, Vercel) kullanılır; bu sağlayıcıların sunucuları yurt dışında
          olabilir.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Ne kadar saklıyoruz?</h2>
        <p className="mt-1">
          Hesabın açık olduğu sürece ve pilot çalışma boyunca. Pilot sona erdiğinde ya da talep
          ettiğinde verilerin silinir. [SAKLAMA SÜRESİNİ NETLEŞTİRİN]
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Haklarınız</h2>
        <p className="mt-1">
          KVKK madde 11 kapsamında verilerinin işlenip işlenmediğini öğrenme, düzeltilmesini veya
          silinmesini isteme ve itiraz etme haklarına sahipsin. Başvuru için [İLETİŞİM E-POSTASI]
          adresine yazabilirsin.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold">Pazarlama mesajı</h2>
        <p className="mt-1">
          Açık onayın olmadan reklam amaçlı e-posta, SMS veya WhatsApp mesajı göndermiyoruz.
        </p>
      </section>
    </article>
  );
}
