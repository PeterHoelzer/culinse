"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import SharedNavbar from "@/components/Navbar";
import NewsletterBanner from "@/components/NewsletterBanner";
import Hero from "./components/Hero";
import DiscoverSection from "./components/DiscoverSection";
import ForYouSection from "./components/ForYouSection";
import VideoSection from "./components/VideoSection";
import HowItWorks from "./components/HowItWorks";
import CTA from "./components/CTA";
import HomeFooter from "./components/HomeFooter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = () => {
    setActiveSearch(search);
    setCategory("All");
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <SharedNavbar />
      <main className="flex-1">
        <Hero search={search} setSearch={setSearch} onSearch={handleSearch} />
        <ForYouSection user={user} onLoaded={() => {}} />
        <DiscoverSection search={activeSearch} category={category} setCategory={setCategory} user={user} />
        <VideoSection />
        <HowItWorks />
        <NewsletterBanner />
        <CTA />
      </main>
      <HomeFooter />
    </>
  );
}
