import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

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
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="px-4 py-6 text-center text-xs text-gray-500">
            Gurme · Okul projesi kapsamında yürütülen pilot çalışma
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
