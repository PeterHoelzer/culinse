/*
  Kurzbeschreibung von Culinse je Sprache, für <meta name="description"> und
  Open Graph der Startseite und als Standard aller Seiten ohne eigene.

  Stand 10.11.2026: Culinse zeigt nur noch eigene Rezepte (die fremden Anbieter
  sind seit 13.09.2026 abgeklemmt). Die frühere Aussage "Millionen Rezepte von
  den besten Food-Seiten" stimmte nicht mehr und las sich wie eine Sammelseite.
  Die Zahl nennt die Gerichte je Sprache (11.11.2026: 4.389 nach Spanien, China und Frankreich);
  bei 5.000 Gerichten anpassen. Dieselbe Zahl steht in messages (pro.freeFeatures), in den
  beiden opengraph-image.tsx und in den Blogtexten.
*/
export const SITE_DESCRIPTION: Record<string, string> = {
  de: "Über 4.000 Rezepte aus aller Welt, redaktionell geprüft und mit Nährwerten. Stöbern und filtern nach Küche, Ernährung und Zutat. Alle Rezepte kostenlos.",
  en: "More than 4,000 recipes from around the world, editorially reviewed, with nutrition facts. Browse and filter by cuisine, diet and ingredient. All recipes free.",
  es: "Más de 4.000 recetas de todo el mundo, revisadas por nuestra redacción y con valores nutricionales. Explora y filtra por cocina, dieta e ingrediente. Todas las recetas gratis.",
  fr: "Plus de 4 000 recettes du monde entier, relues par notre rédaction, avec valeurs nutritionnelles. Explore et filtre par cuisine, régime et ingrédient. Toutes les recettes sont gratuites.",
  it: "Oltre 4.000 ricette da tutto il mondo, verificate dalla redazione e con valori nutrizionali. Esplora e filtra per cucina, dieta e ingrediente. Tutte le ricette sono gratuite.",
  pl: "Ponad 4000 przepisów z całego świata, sprawdzonych przez redakcję, z wartościami odżywczymi. Przeglądaj i filtruj według kuchni, diety i składnika. Wszystkie przepisy za darmo.",
  tr: "Dünyanın dört bir yanından 4.000'den fazla tarif, editör kontrolünden geçmiş ve besin değerleriyle. Mutfağa, beslenme şekline ve malzemeye göre keşfet ve filtrele. Tüm tarifler ücretsiz.",
  nl: "Meer dan 4.000 recepten uit de hele wereld, redactioneel gecontroleerd en met voedingswaarden. Blader en filter op keuken, voedingswijze en ingrediënt. Alle recepten gratis.",
  cs: "Více než 4 000 receptů z celého světa, redakčně ověřených a s nutričními hodnotami. Procházej a filtruj podle kuchyně, stravování a ingredience. Všechny recepty zdarma.",
  ru: "Более 4000 рецептов со всего мира, проверенных редакцией, с пищевой ценностью. Просматривай и фильтруй по кухне, типу питания и ингредиенту. Все рецепты бесплатны.",
  pt: "Mais de 4.000 receitas do mundo todo, revisadas pela nossa redação e com informação nutricional. Explore e filtre por cozinha, dieta e ingrediente. Todas as receitas grátis.",
  zh: "4000 多道来自世界各地的食谱，经编辑审核，附营养成分。可按菜系、饮食方式和食材浏览筛选。所有食谱免费。",
  ja: "世界各地のレシピ4,000品以上。編集部が確認し、栄養成分も掲載しています。料理ジャンル・食事スタイル・食材で探して絞り込めます。レシピはすべて無料。",
  id: "Lebih dari 4.000 resep dari seluruh dunia, diperiksa redaksi dan dilengkapi nilai gizi. Jelajahi dan saring menurut masakan, pola makan, dan bahan. Semua resep gratis.",
  vi: "Hơn 4.000 công thức từ khắp thế giới, được ban biên tập kiểm duyệt, kèm giá trị dinh dưỡng. Khám phá và lọc theo ẩm thực, chế độ ăn và nguyên liệu. Mọi công thức đều miễn phí.",
  bn: "সারা বিশ্বের ৪,০০০-এর বেশি রেসিপি, সম্পাদকীয়ভাবে যাচাই করা, পুষ্টিমান সহ। রান্নার ধরন, খাদ্যাভ্যাস ও উপকরণ অনুযায়ী খুঁজুন ও ফিল্টার করুন। সব রেসিপি বিনামূল্যে।",
};

export function siteDescription(locale: string): string {
  return SITE_DESCRIPTION[locale] ?? SITE_DESCRIPTION.en;
}

/*
  Seitentitel einer Rezeptseite. Vorher stand in 14 Sprachen das englische
  Wort "Recipe" hinter dem Rezeptnamen. Die Form folgt dem, was in der
  jeweiligen Sprache als Suchanfrage üblich ist.
*/
const RECIPE_TITLE: Record<string, (title: string) => string> = {
  en: (t) => `${t} Recipe`,
  de: (t) => `${t} Rezept`,
  es: (t) => `Receta de ${t}`,
  fr: (t) => `${t} : la recette`,
  it: (t) => `Ricetta ${t}`,
  pl: (t) => `${t} – przepis`,
  tr: (t) => `${t} Tarifi`,
  nl: (t) => `${t} – recept`,
  cs: (t) => `${t} – recept`,
  ru: (t) => `${t} – рецепт`,
  pt: (t) => `Receita de ${t}`,
  zh: (t) => `${t}的做法`,
  ja: (t) => `${t}のレシピ`,
  id: (t) => `Resep ${t}`,
  vi: (t) => `Cách làm ${t}`,
  bn: (t) => `${t} রেসিপি`,
};

export function recipePageTitle(locale: string, title: string): string {
  return (RECIPE_TITLE[locale] ?? RECIPE_TITLE.en)(title);
}

/*
  Titel und Beschreibung für Suchergebnisse (12.11.2026).

  Google zeigt etwa 60 Zeichen Titel. Die Rezeptnamen tragen oft eine lange
  Erklärung hinter dem Gedankenstrich; samt Sprachzusatz und " | Culinse" lag
  der Median bei rund 70 Zeichen, das Suchwort "Rezept" stand am abgeschnittenen
  Ende. Darum stufenweise kürzen: erst die Marke weglassen, dann die Erklärung.
*/
const TITLE_MAX = 60;
const BRAND = " | Culinse";

// Chinesische, japanische und koreanische Zeichen sind etwa doppelt so breit.
function displayWidth(text: string): number {
  return Array.from(text).reduce((sum, ch) => sum + (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
}

/** Titel einer Rezeptseite; `absolute` heißt: ohne den Zusatz " | Culinse" aus dem Layout. */
export function recipeSeoTitle(locale: string, title: string, main: string): { text: string; absolute: boolean } {
  const full = recipePageTitle(locale, title);
  if (displayWidth(full + BRAND) <= TITLE_MAX) return { text: full, absolute: false };
  if (displayWidth(full) <= TITLE_MAX) return { text: full, absolute: true };
  const short = recipePageTitle(locale, main);
  return { text: short, absolute: displayWidth(short + BRAND) > TITLE_MAX };
}

/**
  Kürzt einen Text für die Beschreibung: erster Absatz, höchstens `max` Zeichen,
  Schnitt am Satzende, sonst an der Wortgrenze mit Auslassungszeichen. Vorher
  endeten Beschreibungen mitten im Wort.
*/
export function clipDescription(text: string, max = 155): string {
  const first = text.replace(/<[^>]+>/g, "").split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("？"), cut.lastIndexOf("।"));
  if (sentence >= max * 0.5) return cut.slice(0, sentence + 1).trim();
  const word = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("、"), cut.lastIndexOf("，"));
  return `${(word >= max * 0.5 ? cut.slice(0, word) : cut.slice(0, max - 1)).replace(/[\s,;:、，–—-]+$/, "")}…`;
}

