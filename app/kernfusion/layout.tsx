import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Die Kernfusion-Seiten liegen außerhalb des [locale]-Baums (feste URLs für den App Store),
// deshalb liefern sie html/body selbst — im selben Stil wie das Locale-Layout.
export default function KernfusionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
