import type { Metadata } from "next";
import { Inter, Baloo_2 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import SupportButton from "@/components/SupportButton";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

// Başlıklar için yuvarlak, oyuncu bir font (Türkçe karakterler latin-ext içinde)
const display = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gurme | Her masa saati değerli",
  description: "Boş masa saatlerinde indirimli restoran rezervasyonu.",
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
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="px-4 py-6 text-center text-xs text-gray-500">
            Gurme · Okul projesi kapsamında yürütülen pilot çalışma
          </footer>
          <SupportButton />
        </AuthProvider>
      </body>
    </html>
  );
}
