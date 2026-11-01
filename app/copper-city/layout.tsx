import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Die Copper-City-Seiten liegen wie die Kernfusion-Seiten außerhalb des [locale]-Baums
// (feste URLs für App Store Connect), deshalb liefern sie html/body selbst.
export default function CopperCityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
