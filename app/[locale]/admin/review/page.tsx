import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ReviewClient from "./ReviewClient";

// Admin-only (Rezept-Agent Phase 2) — nie indexieren.
export const metadata: Metadata = {
  title: "Rezept-Review – Culinse Admin",
  robots: { index: false, follow: false },
};

export default function AdminReviewPage() {
  return (
    <>
      <Navbar />
      <ReviewClient />
    </>
  );
}
