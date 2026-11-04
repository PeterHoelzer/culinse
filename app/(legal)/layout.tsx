import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// /impressum, /datenschutz und /support liegen außerhalb des [locale]-Baums
// (feste URLs für die Apps und App Store Connect), deshalb liefern sie html/body selbst.
export default function LegalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
