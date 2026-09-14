import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BilderClient from "./BilderClient";

// Admin-Werkzeug (Bilder-Werkstatt für Papa) — nie indexieren.
export const metadata: Metadata = {
  title: "Bilder-Werkstatt – Culinse Admin",
  robots: { index: false, follow: false },
};

export default function AdminBilderPage() {
  return (
    <>
      <Navbar />
      <BilderClient />
    </>
  );
}
