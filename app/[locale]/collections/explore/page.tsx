import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore Collections – Culinse",
  description: "Discover public recipe collections shared by the Culinse community.",
};

export default function ExplorePage() {
  return (
    <>
      <Navbar />
      <ExploreClient />
    </>
  );
}
