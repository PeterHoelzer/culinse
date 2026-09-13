import { NextResponse } from "next/server";

// 13.09.2026: externe Provider entfernt — verhaltensbasierte Empfehlungen
// ("Für dich") kommen als Follow-up aus dem eigenen Korpus. Bis dahin bewusst
// leer; die ForYouSection blendet sich bei leerer Antwort einfach aus.
export async function GET() {
  return NextResponse.json({ recipes: [], basedOn: [] });
}
