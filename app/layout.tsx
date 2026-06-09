import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Voxa — Speak Any Language, Live",
  description:
    "Real-time AI voice translation. Two people, two languages, one natural conversation.",
  openGraph: {
    title: "Voxa — Speak Any Language, Live",
    description:
      "Real-time AI voice translation. Two people, two languages, one natural conversation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="bg-[#05050A] text-white antialiased">{children}</body>
    </html>
  );
}