import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BesucherClient from "./BesucherClient";

// Besucher-Dashboard, nur für das Culinse-Konto. Nie indexieren.
export const metadata: Metadata = {
  title: "Besucher – Culinse Admin",
  robots: { index: false, follow: false },
};

export default function AdminBesucherPage() {
  return (
    <>
      <Navbar />
      <BesucherClient />
    </>
  );
}
