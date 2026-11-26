"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FreeAccountNote from "./FreeAccountNote";

/*
  Zeigt den Hinweis „Alles kostenlos, zum Speichern und Nutzen anmelden“ nur
  Besuchern ohne Anmeldung (26.11.2026). Angemeldete sehen nichts. Solange der
  Anmeldestatus nicht feststeht, bleibt die Stelle leer, damit der Hinweis bei
  Angemeldeten nicht kurz aufblitzt.
*/
export default function GuestNote({ className }: { className?: string }) {
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    let active = true;
    createClient()
      .auth.getSession()
      .then(({ data }) => { if (active) setGuest(!data.session); })
      .catch(() => { if (active) setGuest(true); });
    return () => { active = false; };
  }, []);

  return guest ? <FreeAccountNote className={className} /> : null;
}
