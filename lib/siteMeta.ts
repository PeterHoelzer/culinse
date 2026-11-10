/*
  Kurzbeschreibung von Culinse je Sprache, für <meta name="description"> und
  Open Graph der Startseite und als Standard aller Seiten ohne eigene.

  Stand 10.11.2026: Culinse zeigt nur noch eigene Rezepte (die fremden Anbieter
  sind seit 13.09.2026 abgeklemmt). Die frühere Aussage "Millionen Rezepte von
  den besten Food-Seiten" stimmte nicht mehr und las sich wie eine Sammelseite.
  Die Zahl nennt die Gerichte je Sprache (10.11.2026: 3.188 nach Griechenland und Türkei);
  bei 4.000 Gerichten anpassen. Dieselbe Zahl steht in messages (pro.freeFeatures), in den
  beiden opengraph-image.tsx und in den Blogtexten.
*/
export const SITE_DESCRIPTION: Record<string, string> = {
  de: "Über 3.000 Rezepte aus aller Welt, redaktionell geprüft und mit Nährwerten. Stöbern und filtern nach Küche, Ernährung und Zutat. Alle Rezepte kostenlos.",
  en: "More than 3,000 recipes from around the world, editorially reviewed, with nutrition facts. Browse and filter by cuisine, diet and ingredient. All recipes free.",
  es: "Más de 3.000 recetas de todo el mundo, revisadas por nuestra redacción y con valores nutricionales. Explora y filtra por cocina, dieta e ingrediente. Todas las recetas gratis.",
  fr: "Plus de 3 000 recettes du monde entier, relues par notre rédaction, avec valeurs nutritionnelles. Explore et filtre par cuisine, régime et ingrédient. Toutes les recettes sont gratuites.",
  it: "Oltre 3.000 ricette da tutto il mondo, verificate dalla redazione e con valori nutrizionali. Esplora e filtra per cucina, dieta e ingrediente. Tutte le ricette sono gratuite.",
  pl: "Ponad 3000 przepisów z całego świata, sprawdzonych przez redakcję, z wartościami odżywczymi. Przeglądaj i filtruj według kuchni, diety i składnika. Wszystkie przepisy za darmo.",
  tr: "Dünyanın dört bir yanından 3.000'den fazla tarif, editör kontrolünden geçmiş ve besin değerleriyle. Mutfağa, beslenme şekline ve malzemeye göre keşfet ve filtrele. Tüm tarifler ücretsiz.",
  nl: "Meer dan 3.000 recepten uit de hele wereld, redactioneel gecontroleerd en met voedingswaarden. Blader en filter op keuken, voedingswijze en ingrediënt. Alle recepten gratis.",
  cs: "Více než 3 000 receptů z celého světa, redakčně ověřených a s nutričními hodnotami. Procházej a filtruj podle kuchyně, stravování a ingredience. Všechny recepty zdarma.",
  ru: "Более 3000 рецептов со всего мира, проверенных редакцией, с пищевой ценностью. Просматривай и фильтруй по кухне, типу питания и ингредиенту. Все рецепты бесплатны.",
  pt: "Mais de 3.000 receitas do mundo todo, revisadas pela nossa redação e com informação nutricional. Explore e filtre por cozinha, dieta e ingrediente. Todas as receitas grátis.",
  zh: "3000 多道来自世界各地的食谱，经编辑审核，附营养成分。可按菜系、饮食方式和食材浏览筛选。所有食谱免费。",
  ja: "世界各地のレシピ3,000品以上。編集部が確認し、栄養成分も掲載しています。料理ジャンル・食事スタイル・食材で探して絞り込めます。レシピはすべて無料。",
  id: "Lebih dari 3.000 resep dari seluruh dunia, diperiksa redaksi dan dilengkapi nilai gizi. Jelajahi dan saring menurut masakan, pola makan, dan bahan. Semua resep gratis.",
  vi: "Hơn 3.000 công thức từ khắp thế giới, được ban biên tập kiểm duyệt, kèm giá trị dinh dưỡng. Khám phá và lọc theo ẩm thực, chế độ ăn và nguyên liệu. Mọi công thức đều miễn phí.",
  bn: "সারা বিশ্বের ৩,০০০-এর বেশি রেসিপি, সম্পাদকীয়ভাবে যাচাই করা, পুষ্টিমান সহ। রান্নার ধরন, খাদ্যাভ্যাস ও উপকরণ অনুযায়ী খুঁজুন ও ফিল্টার করুন। সব রেসিপি বিনামূল্যে।",
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
