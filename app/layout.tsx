import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import SupportButton from "@/components/SupportButton";
import SourceCapture from "@/components/SourceCapture";
import Link from "next/link";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

// Başlıklar için sıcak, yemek markalarına yakışan bir font (Türkçe karakterler latin-ext içinde)
const display = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gurme | İndirimli rezervasyon",
  description: "İndirimli restoran rezervasyonu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} ${display.variable} flex min-h-screen flex-col`}>
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="px-4 py-6 text-center text-xs text-gray-500">
            Gurme · Okul projesi kapsamında yürütülen pilot çalışma ·{" "}
            <Link href="/gizlilik" className="underline">
              Gizlilik ve KVKK
            </Link>
          </footer>
          <SupportButton />
          <SourceCapture />
        </AuthProvider>
      </body>
    </html>
  );
}
