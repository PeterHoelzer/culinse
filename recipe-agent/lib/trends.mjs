/**
 * Scout-Signale (Plan §4) — alles legal/eigen, KEIN Scraping:
 *   1. Saisonkalender (Allgemeinwissen, Deutschland)
 *   2. Kuratierte Gericht-/Themenliste (eigene Planung)
 *   3. Korpus-Lücken (Kategorien, die noch fehlen)
 *   4. Optional: GSC-Queries als CSV in state/gsc.csv (Spalte "query") — Phase 4
 *
 * Scoring: +2 pro Saison-Treffer (max 3 gewertet), +1.5 wenn Kategorie im Korpus
 * fehlt, + Themen-Bonus. Deterministischer Tie-Break über den Slug.
 */
import fs from "fs";
import path from "path";
import { SEED_RECIPES, STATE_DIR } from "./env.mjs";

// Monat(e), in denen ein Produkt in DE Saison hat (1–12).
export const SEASON = {
  spargel: [4, 5, 6], rhabarber: [4, 5, 6], erdbeere: [5, 6, 7],
  zucchini: [6, 7, 8, 9, 10], gurke: [6, 7, 8, 9], tomate: [7, 8, 9, 10],
  paprika: [7, 8, 9, 10], aubergine: [7, 8, 9], wassermelone: [7, 8, 9],
  kirsche: [6, 7, 8], himbeere: [6, 7, 8], heidelbeere: [6, 7, 8, 9],
  aprikose: [7, 8], pfirsich: [7, 8, 9], mais: [8, 9, 10],
  buschbohne: [7, 8, 9], mangold: [6, 7, 8, 9, 10], fenchel: [6, 7, 8, 9, 10],
  brokkoli: [6, 7, 8, 9, 10], blumenkohl: [6, 7, 8, 9, 10], kohlrabi: [5, 6, 7, 8, 9, 10],
  erbse: [6, 7, 8], salatgurke: [6, 7, 8, 9], blattsalat: [5, 6, 7, 8, 9, 10],
  radieschen: [4, 5, 6, 7, 8, 9], fruehkartoffel: [6, 7, 8], "rote-bete": [7, 8, 9, 10, 11],
  spinat: [4, 5, 6, 9, 10, 11], pilze: [9, 10, 11], kuerbis: [9, 10, 11],
  apfel: [9, 10, 11], birne: [9, 10, 11], feldsalat: [1, 2, 3, 10, 11, 12],
  gruenkohl: [1, 2, 11, 12], rosenkohl: [1, 2, 3, 10, 11, 12], lauch: [1, 2, 3, 4, 8, 9, 10, 11, 12],
  baerlauch: [3, 4, 5], basilikum: [6, 7, 8, 9],
  wirsing: [1, 2, 10, 11, 12], rotkohl: [1, 2, 9, 10, 11, 12], weisskohl: [1, 2, 3, 9, 10, 11, 12],
  chicoree: [1, 2, 3, 11, 12], zwetschge: [8, 9, 10], knollensellerie: [1, 2, 9, 10, 11, 12],
  staudensellerie: [7, 8, 9, 10],
};

// Themen-Boni (eigene Strategie: schnelle Alltagsküche + pflanzlich zuerst).
export const TOPIC_BONUS = { schnell: 0.5, vegan: 0.5, vegetarisch: 0.3, "meal-prep": 0.4, grillen: 0.3 };

/**
 * Kuratierte Gerichteliste — die eigene Planung des Scouts.
 * category = grobe Korpus-Kategorie (für den Lücken-Bonus gegen vorhandene Tags).
 */
export const DISHES = [
  { slug: "gazpacho-andaluz", de: "Gazpacho", en: "Andalusian Gazpacho", category: "kalte-suppe", topics: ["vegan", "schnell"], produce: ["tomate", "gurke", "paprika"], notes: "Klassische andalusische Gazpacho: rohe Sommergemüse fein püriert, gut gekühlt serviert. Kein Kochen (cook_time 0), Kühlzeit als Schritt mit Timer." },
  { slug: "zucchini-puffer-kraeuterquark", de: "Zucchini-Puffer mit Kräuterquark", en: "Zucchini Fritters with Herb Quark", category: "pfannengericht", topics: ["vegetarisch"], produce: ["zucchini"], notes: "Geraspelte Zucchini gut ausdrücken, goldbraun braten; frischer Kräuterquark als Dip." },
  { slug: "wassermelone-feta-salat", de: "Wassermelonen-Feta-Salat", en: "Watermelon Feta Salad", category: "salat", topics: ["vegetarisch", "schnell"], produce: ["wassermelone", "gurke"], notes: "Süß-salziger Sommersalat mit Minze und Limette, ohne Kochen." },
  { slug: "griechischer-bauernsalat", de: "Griechischer Bauernsalat", en: "Greek Village Salad", category: "salat", topics: ["vegetarisch", "schnell"], produce: ["tomate", "gurke", "paprika"], notes: "Horiatiki: grob geschnittenes Gemüse, Oliven, Feta am Stück, Oregano." },
  { slug: "caprese-nudelsalat", de: "Caprese-Nudelsalat", en: "Caprese Pasta Salad", category: "salat", topics: ["vegetarisch", "meal-prep"], produce: ["tomate", "basilikum"], notes: "Lauwarmer Nudelsalat mit Kirschtomaten, Mozzarella, Basilikum." },
  { slug: "ratatouille-provencale", de: "Ratatouille", en: "Ratatouille", category: "schmorgericht", topics: ["vegan"], produce: ["zucchini", "aubergine", "paprika", "tomate"], notes: "Provenzalisch geschmortes Sommergemüse, Kräuter der Provence." },
  { slug: "gefuellte-zucchini-hack", de: "Gefüllte Zucchini mit Hackfleisch", en: "Stuffed Zucchini with Ground Beef", category: "auflauf", topics: [], produce: ["zucchini", "tomate"], notes: "Ausgehöhlte Zucchinihälften mit Hack-Tomaten-Füllung, überbacken." },
  { slug: "haehnchen-souvlaki-tzatziki", de: "Hähnchen-Souvlaki mit Tzatziki", en: "Chicken Souvlaki with Tzatziki", category: "grillen", topics: ["grillen"], produce: ["gurke"], notes: "Marinierte Spieße (Zitrone, Oregano), dazu selbst gemachtes Tzatziki." },
  { slug: "taboule-bulgursalat", de: "Taboulé mit viel Petersilie", en: "Parsley Tabbouleh with Bulgur", category: "salat", topics: ["vegan", "meal-prep"], produce: ["tomate"], notes: "Levantinisch: Petersilie ist die Hauptzutat, Bulgur nur Beiwerk, Zitrone." },
  { slug: "erdbeer-spinat-salat", de: "Erdbeer-Spinat-Salat", en: "Strawberry Spinach Salad", category: "salat", topics: ["vegetarisch", "schnell"], produce: ["erdbeere", "spinat"], notes: "Babyspinat, Erdbeeren, geröstete Kerne, Balsamico-Dressing." },
  { slug: "kirsch-clafoutis", de: "Kirsch-Clafoutis", en: "Cherry Clafoutis", category: "dessert", topics: ["vegetarisch"], produce: ["kirsche"], notes: "Französischer Ofen-Klassiker: Kirschen in luftigem Eierteig." },
  { slug: "beeren-crumble", de: "Beeren-Crumble", en: "Mixed Berry Crumble", category: "dessert", topics: ["vegetarisch"], produce: ["himbeere", "heidelbeere"], notes: "Warme Beeren unter Butterstreuseln, dazu passt Vanilleeis." },
  { slug: "one-pot-sommerpasta", de: "One-Pot-Sommerpasta", en: "One-Pot Summer Pasta", category: "one-pot", topics: ["vegetarisch", "schnell"], produce: ["tomate", "zucchini", "basilikum"], notes: "Alles in einem Topf: Pasta gart direkt in der Tomaten-Gemüse-Basis." },
  { slug: "zitronen-zucchini-pasta", de: "Zitronen-Zucchini-Pasta", en: "Lemon Zucchini Pasta", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["zucchini", "basilikum"], notes: "Feine Zucchinistreifen, Zitronenabrieb, Parmesan — leicht und schnell." },
  { slug: "shakshuka-paprika-tomate", de: "Shakshuka", en: "Shakshuka", category: "fruehstueck", topics: ["vegetarisch"], produce: ["tomate", "paprika"], notes: "Pochierte Eier in würziger Paprika-Tomaten-Sauce, Kreuzkümmel, Koriander." },
  { slug: "haehnchen-fajita-pfanne", de: "Hähnchen-Fajita-Pfanne", en: "Chicken Fajita Skillet", category: "pfannengericht", topics: ["schnell"], produce: ["paprika"], notes: "Bunte Paprika und Hähnchenstreifen, Fajita-Gewürz, Limette; in Tortillas." },
  { slug: "kichererbsen-spinat-curry", de: "Kichererbsen-Spinat-Curry", en: "Chickpea Spinach Curry", category: "curry", topics: ["vegan", "meal-prep"], produce: ["spinat", "tomate"], notes: "Cremiges Curry mit Kokosmilch, Vorratszutaten, in 25 Minuten." },
  { slug: "tomaten-galette", de: "Tomaten-Galette", en: "Rustic Tomato Galette", category: "gebaeck", topics: ["vegetarisch"], produce: ["tomate", "basilikum"], notes: "Rustikaler Mürbeteig, frei geformt, bunte Tomaten, Senf-Crème-fraîche-Basis." },
  { slug: "mais-avocado-salat", de: "Mais-Avocado-Salat", en: "Corn Avocado Salad", category: "salat", topics: ["vegan", "schnell"], produce: ["mais", "tomate"], notes: "Gerösteter Mais, Avocado, Limette, Koriander — Beilage zum Grillen." },
  { slug: "brokkoli-mandel-pasta", de: "Brokkoli-Mandel-Pasta", en: "Broccoli Almond Pasta", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["brokkoli"], notes: "Brokkoli bissfest, geröstete Mandeln, Knoblauch, Zitrone, Chiliflocken." },
  { slug: "kuerbissuppe-ingwer", de: "Kürbissuppe mit Ingwer", en: "Ginger Pumpkin Soup", category: "suppe", topics: ["vegan"], produce: ["kuerbis"], notes: "Hokkaido mit Ingwer und Kokosmilch, geröstete Kürbiskerne." },
  { slug: "pilz-rahm-risotto", de: "Pilz-Risotto", en: "Creamy Mushroom Risotto", category: "risotto", topics: ["vegetarisch"], produce: ["pilze"], notes: "Cremiges Risotto mit braunen Champignons und Parmesan." },
  { slug: "gruenkohl-kartoffel-eintopf", de: "Grünkohl-Kartoffel-Eintopf", en: "Kale Potato Stew", category: "eintopf", topics: ["vegan", "meal-prep"], produce: ["gruenkohl"], notes: "Deftiger Wintereintopf, geräucherter Tofu oder Mettenden als Einlage." },
  { slug: "feldsalat-birne-walnuss", de: "Feldsalat mit Birne und Walnuss", en: "Lamb's Lettuce with Pear and Walnut", category: "salat", topics: ["vegetarisch", "schnell"], produce: ["feldsalat", "birne"], notes: "Klassischer Wintersalat mit Honig-Senf-Dressing." },
  { slug: "apfel-zimt-pfannkuchen", de: "Apfel-Zimt-Pfannkuchen", en: "Apple Cinnamon Pancakes", category: "fruehstueck", topics: ["vegetarisch"], produce: ["apfel"], notes: "Fluffige Pfannkuchen mit karamellisierten Apfelscheiben." },
  { slug: "spargel-zitronen-risotto", de: "Spargel-Zitronen-Risotto", en: "Asparagus Lemon Risotto", category: "risotto", topics: ["vegetarisch"], produce: ["spargel"], notes: "Grüner Spargel, Zitrone, Parmesan — Frühlingsklassiker." },
  { slug: "baerlauch-pesto-pasta", de: "Bärlauch-Pesto-Pasta", en: "Wild Garlic Pesto Pasta", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["baerlauch"], notes: "Frisches Bärlauchpesto mit Cashews und Parmesan." },
  { slug: "rote-bete-linsen-salat", de: "Rote-Bete-Linsen-Salat", en: "Beetroot Lentil Salad", category: "salat", topics: ["vegan", "meal-prep"], produce: ["rote-bete"], notes: "Erdige Bete, Belugalinsen, Balsamico, optional Ziegenkäse-Variante nennen." },

  // ── Suppen & Eintöpfe ──────────────────────────────────────────────────────
  { slug: "kartoffelsuppe-klassisch", de: "Klassische Kartoffelsuppe", en: "Creamy German Potato Soup", category: "suppe", topics: ["vegetarisch", "meal-prep"], produce: [], notes: "Cremig mit Majoran und Suppengrün; Würstchen-Einlage optional erwähnen." },
  { slug: "minestrone-italienisch", de: "Italienische Minestrone", en: "Italian Minestrone", category: "eintopf", topics: ["vegetarisch", "meal-prep"], produce: ["buschbohne", "tomate", "staudensellerie"], notes: "Buntes Gemüse, weiße Bohnen, kleine Pasta; Parmesan zum Servieren." },
  { slug: "franzoesische-zwiebelsuppe", de: "Französische Zwiebelsuppe", en: "French Onion Soup", category: "suppe", topics: [], produce: [], notes: "Lange geschmorte Zwiebeln, kräftige Brühe, gratinierter Käse-Crouton." },
  { slug: "suesskartoffel-erdnuss-suppe", de: "Süßkartoffel-Erdnuss-Suppe", en: "Sweet Potato Peanut Soup", category: "suppe", topics: ["vegan"], produce: [], notes: "Westafrikanisch inspiriert: Erdnussmus, Chili, Limette, Koriander." },
  { slug: "brokkoli-cheddar-suppe", de: "Brokkoli-Cheddar-Suppe", en: "Broccoli Cheddar Soup", category: "suppe", topics: ["vegetarisch"], produce: ["brokkoli"], notes: "Sämig gebunden, kräftiger Cheddar, Croutons als Topping." },
  { slug: "champignon-rahmsuppe", de: "Champignon-Rahmsuppe", en: "Creamy Mushroom Soup", category: "suppe", topics: ["vegetarisch", "schnell"], produce: [], notes: "Braune Champignons, Thymian, Schuss Weißwein; Zuchtpilze = ganzjährig." },
  { slug: "linseneintopf-omas-art", de: "Linseneintopf nach Omas Art", en: "Hearty German Lentil Stew", category: "eintopf", topics: ["meal-prep"], produce: ["lauch"], notes: "Tellerlinsen, Suppengrün, Kartoffeln, Spritzer Essig; klar vom Tomaten-Linsen-Rezept abgrenzen (keine Tomate, keine Kokosmilch)." },
  { slug: "erbsen-minz-suppe", de: "Erbsen-Minz-Suppe", en: "Pea and Mint Soup", category: "suppe", topics: ["vegetarisch", "schnell"], produce: ["erbse"], notes: "Leuchtend grün, in 20 Minuten; warm oder gekühlt servierbar." },
  { slug: "gemuese-miso-ramen", de: "Gemüse-Miso-Ramen", en: "Vegetable Miso Ramen", category: "suppe", topics: ["vegetarisch"], produce: ["lauch"], notes: "Miso-Brühe, Ramen-Nudeln, wachsweiches Ei, Sesam, Frühlingslauch." },
  { slug: "blumenkohl-kokos-suppe", de: "Blumenkohl-Kokos-Suppe", en: "Cauliflower Coconut Soup", category: "suppe", topics: ["vegan"], produce: ["blumenkohl"], notes: "Gerösteter Blumenkohl, Kokosmilch, Kurkuma, geröstete Kichererbsen als Topping." },
  { slug: "orientalischer-kichererbsen-eintopf", de: "Orientalischer Kichererbsen-Eintopf", en: "Moroccan-Style Chickpea Stew", category: "eintopf", topics: ["vegan", "meal-prep"], produce: ["tomate"], notes: "Ras el-Hanout, Aprikosen oder Rosinen, Zitrone, Koriander." },

  // ── Salate ─────────────────────────────────────────────────────────────────
  { slug: "salade-nicoise", de: "Salade Niçoise", en: "Salade Niçoise", category: "salat", topics: ["schnell"], produce: ["buschbohne", "tomate"], notes: "Thunfisch, grüne Bohnen, Ei, Oliven, Senf-Vinaigrette." },
  { slug: "quinoa-avocado-salat", de: "Quinoa-Avocado-Salat", en: "Quinoa Avocado Salad", category: "salat", topics: ["vegan", "meal-prep"], produce: ["tomate"], notes: "Limetten-Dressing, Kirschtomaten, Koriander; hält sich gut für Meal-Prep." },
  { slug: "schwaebischer-kartoffelsalat", de: "Schwäbischer Kartoffelsalat", en: "Swabian Potato Salad", category: "salat", topics: ["vegan"], produce: ["fruehkartoffel"], notes: "Mit warmer Essig-Öl-Brühe statt Mayonnaise, dünn gehobelte Kartoffeln." },
  { slug: "apfel-krautsalat", de: "Apfel-Krautsalat", en: "Apple Coleslaw", category: "salat", topics: ["vegetarisch", "schnell"], produce: ["weisskohl", "apfel"], notes: "Fein gehobelter Kohl, Apfel, Joghurt-Dressing; passt zum Grillen." },
  { slug: "orientalischer-couscous-salat", de: "Orientalischer Couscous-Salat", en: "Moroccan Couscous Salad", category: "salat", topics: ["vegan", "meal-prep"], produce: ["paprika"], notes: "Couscous, geröstete Paprika, Minze, Granatapfelkerne, Zitronen-Dressing." },
  { slug: "panzanella-brotsalat", de: "Panzanella — toskanischer Brotsalat", en: "Tuscan Panzanella", category: "salat", topics: ["vegan"], produce: ["tomate", "gurke", "basilikum"], notes: "Geröstetes Brot saugt Tomaten-Vinaigrette auf; Hochsommer-Klassiker." },
  { slug: "gegrillter-halloumi-salat", de: "Gegrillter Halloumi-Salat", en: "Grilled Halloumi Salad", category: "salat", topics: ["vegetarisch", "grillen", "schnell"], produce: ["blattsalat", "tomate"], notes: "Goldbraun gegrillter Halloumi auf Blattsalat, Honig-Zitronen-Dressing." },
  { slug: "caesar-salad-haehnchen", de: "Caesar Salad mit Hähnchen", en: "Chicken Caesar Salad", category: "salat", topics: ["schnell"], produce: ["blattsalat"], notes: "Römersalat, Parmesan-Dressing mit Sardellen, Croutons, gebratene Hähnchenbrust." },

  // ── Pasta ──────────────────────────────────────────────────────────────────
  { slug: "spaghetti-aglio-e-olio", de: "Spaghetti Aglio e Olio", en: "Spaghetti Aglio e Olio", category: "pasta", topics: ["vegan", "schnell"], produce: [], notes: "Nur Knoblauch, Olivenöl, Chili, Petersilie — Minimalismus, Technik zählt." },
  { slug: "penne-all-arrabbiata", de: "Penne all'Arrabbiata", en: "Penne all'Arrabbiata", category: "pasta", topics: ["vegan", "schnell"], produce: ["tomate"], notes: "Scharfe Tomatensauce mit Knoblauch und Chili, frische Petersilie." },
  { slug: "klassische-lasagne", de: "Klassische Lasagne", en: "Classic Beef Lasagna", category: "auflauf", topics: ["meal-prep"], produce: ["tomate"], notes: "Ragù, Béchamel, viel Zeit im Ofen; Sonntagsklassiker." },
  { slug: "spinat-ricotta-cannelloni", de: "Spinat-Ricotta-Cannelloni", en: "Spinach Ricotta Cannelloni", category: "auflauf", topics: ["vegetarisch"], produce: ["spinat"], notes: "Gefüllte Röhren in Tomatensauce, mit Mozzarella überbacken." },
  { slug: "pasta-pesto-genovese", de: "Pasta mit Pesto Genovese", en: "Pasta with Fresh Basil Pesto", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["basilikum"], notes: "Frisch gemörsertes Basilikum-Pesto mit Pinienkernen und Parmesan; klar vom Bärlauch-Pesto abgrenzen." },
  { slug: "tagliatelle-pilzrahm", de: "Tagliatelle in Pilzrahmsauce", en: "Tagliatelle in Creamy Mushroom Sauce", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["pilze"], notes: "Gemischte Pilze, Thymian, Sahne, Parmesan." },
  { slug: "gnocchi-salbei-butter", de: "Gnocchi in Salbeibutter", en: "Gnocchi in Sage Brown Butter", category: "pasta", topics: ["vegetarisch", "schnell"], produce: [], notes: "Nussige braune Butter, knusprige Salbeiblätter, Parmesan — 15 Minuten." },
  { slug: "spaghetti-bolognese", de: "Spaghetti Bolognese", en: "Spaghetti Bolognese", category: "pasta", topics: ["meal-prep"], produce: ["tomate"], notes: "Lange geschmortes Hack-Ragù mit Sellerie und Karotte; Familienklassiker." },
  { slug: "mac-and-cheese", de: "Cremige Mac and Cheese", en: "Creamy Mac and Cheese", category: "pasta", topics: ["vegetarisch"], produce: [], notes: "Käsesauce aus Cheddar und Gruyère, knusprige Brösel-Kruste." },

  // ── Curry & Asia ───────────────────────────────────────────────────────────
  { slug: "gelbes-gemuese-curry", de: "Gelbes Gemüse-Curry", en: "Yellow Vegetable Curry", category: "curry", topics: ["vegan", "schnell"], produce: ["blumenkohl", "paprika"], notes: "Gelbe Currypaste, Kokosmilch, buntes Gemüse; klar vom Hähnchen-Kokos-Curry abgrenzen." },
  { slug: "rotes-linsen-dal", de: "Rotes Linsen-Dal", en: "Red Lentil Dal", category: "curry", topics: ["vegan", "meal-prep"], produce: ["spinat"], notes: "Indisch: Kurkuma, Ingwer, Senfsaat-Tadka, Spinat — bewusst tomatenarm (Abgrenzung zur Tomaten-Linsen-Suppe)." },
  { slug: "thai-gebratener-reis", de: "Thai Gebratener Reis", en: "Thai Fried Rice", category: "pfannengericht", topics: ["schnell"], produce: ["erbse"], notes: "Kalter Jasminreis vom Vortag, Ei, Fischsauce, Limette." },
  { slug: "pad-thai-tofu", de: "Pad Thai mit Tofu", en: "Tofu Pad Thai", category: "pfannengericht", topics: ["vegetarisch"], produce: [], notes: "Reisnudeln, Tamarinde, Erdnüsse, Sojasprossen, Limette." },
  { slug: "butter-chicken", de: "Butter Chicken", en: "Indian Butter Chicken", category: "curry", topics: [], produce: ["tomate"], notes: "Cremige Tomaten-Butter-Sauce, Garam Masala, mariniertes Hähnchen; Naan dazu." },
  { slug: "teriyaki-lachs-bowl", de: "Teriyaki-Lachs-Bowl", en: "Teriyaki Salmon Bowl", category: "bowl", topics: ["schnell"], produce: ["gurke"], notes: "Glasierter Lachs, Reis, Edamame, Sesam; klar von der Honig-Senf-Kruste abgrenzen." },
  { slug: "palak-paneer", de: "Palak Paneer", en: "Palak Paneer", category: "curry", topics: ["vegetarisch"], produce: ["spinat"], notes: "Cremiges Spinat-Curry mit gebratenen Paneer-Würfeln." },

  // ── Bowls ──────────────────────────────────────────────────────────────────
  { slug: "buddha-bowl-erdnuss", de: "Buddha Bowl mit Erdnusssauce", en: "Peanut Buddha Bowl", category: "bowl", topics: ["vegan", "meal-prep"], produce: ["brokkoli"], notes: "Reis, geröstetes Gemüse, knuspriger Tofu, cremige Erdnusssauce; klar von der Falafel-Bowl abgrenzen." },
  { slug: "poke-bowl-lachs", de: "Poke Bowl mit Lachs", en: "Salmon Poke Bowl", category: "bowl", topics: ["schnell"], produce: ["gurke"], notes: "Roher marinierter Lachs, Sushireis, Avocado, Sesam-Soja-Dressing." },
  { slug: "burrito-bowl-hack", de: "Burrito Bowl mit Hack", en: "Beef Burrito Bowl", category: "bowl", topics: ["meal-prep"], produce: ["mais", "tomate"], notes: "Gewürztes Hack, Reis, schwarze Bohnen, Mais-Salsa, Limetten-Crème." },
  { slug: "hummus-gemuese-bowl", de: "Hummus-Bowl mit Ofengemüse", en: "Roasted Veggie Hummus Bowl", category: "bowl", topics: ["vegan"], produce: ["paprika", "zucchini"], notes: "Cremiger Hummus als Basis, geröstetes Gemüse, Za'atar; OHNE Falafel (Abgrenzung)." },

  // ── Aufläufe & Ofen ────────────────────────────────────────────────────────
  { slug: "moussaka", de: "Griechische Moussaka", en: "Greek Moussaka", category: "auflauf", topics: [], produce: ["aubergine", "tomate"], notes: "Auberginen, Hack-Tomaten-Schicht, Béchamelhaube." },
  { slug: "kartoffelgratin", de: "Kartoffelgratin", en: "Potato Gratin Dauphinois", category: "auflauf", topics: ["vegetarisch"], produce: [], notes: "Pur: Kartoffeln, Sahne, Knoblauch, Muskat — bewusst OHNE Gemüseeinlage (Abgrenzung zum Kartoffel-Gemüse-Auflauf)." },
  { slug: "shepherds-pie", de: "Shepherd's Pie", en: "Shepherd's Pie", category: "auflauf", topics: ["meal-prep"], produce: ["erbse"], notes: "Lamm- oder Rinderhack unter Kartoffelpüree-Haube, goldbraun gebacken." },
  { slug: "wirsing-hack-auflauf", de: "Wirsing-Hack-Auflauf", en: "Savoy Cabbage Beef Bake", category: "auflauf", topics: [], produce: ["wirsing"], notes: "Geschichteter Wirsing mit Hack, Käsekruste; deftiger Winterklassiker." },
  { slug: "gemuese-enchiladas", de: "Gemüse-Enchiladas", en: "Veggie Enchiladas", category: "auflauf", topics: ["vegetarisch"], produce: ["paprika", "mais"], notes: "Gefüllte Tortillas, Tomatensauce, überbackener Käse, Koriander." },
  { slug: "ofengemuese-mit-feta", de: "Ofengemüse mit Feta", en: "Sheet-Pan Vegetables with Feta", category: "ofengericht", topics: ["vegetarisch", "schnell"], produce: ["zucchini", "paprika", "tomate"], notes: "Ein Blech: buntes Gemüse, Feta am Stück mitgebacken, Honig-Thymian." },
  { slug: "schinken-nudel-gratin", de: "Schinken-Nudel-Gratin", en: "Ham and Pasta Bake", category: "auflauf", topics: ["schnell"], produce: ["erbse"], notes: "Familienküche: Nudeln, Schinkenwürfel, Erbsen, Käse-Béchamel." },
  { slug: "gefuellte-paprika", de: "Gefüllte Paprika mit Hack und Reis", en: "Stuffed Bell Peppers", category: "schmorgericht", topics: [], produce: ["paprika", "tomate"], notes: "In Tomatensauce geschmort; klar von den gefüllten Zucchini abgrenzen." },

  // ── Pfanne & schnelle Küche ────────────────────────────────────────────────
  { slug: "zuericher-geschnetzeltes", de: "Züricher Geschnetzeltes", en: "Zurich-Style Sliced Meat in Cream Sauce", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "Klassisch mit Kalb (Hähnchen-Alternative nennen), Champignon-Rahmsauce, Rösti dazu." },
  { slug: "bratkartoffeln-speck", de: "Bratkartoffeln mit Speck und Zwiebeln", en: "German Fried Potatoes with Bacon", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "Vorgekochte Kartoffeln, knuspriger Speck, goldene Zwiebeln, Majoran." },
  { slug: "elsaesser-flammkuchen", de: "Elsässer Flammkuchen", en: "Alsatian Tarte Flambée", category: "gebaeck", topics: ["schnell"], produce: [], notes: "Hauchdünner Teig, Schmand, Speck, Zwiebeln — sehr heißer Ofen." },
  { slug: "kaese-quesadillas", de: "Käse-Bohnen-Quesadillas", en: "Cheese and Bean Quesadillas", category: "pfannengericht", topics: ["vegetarisch", "schnell"], produce: ["mais"], notes: "Knusprig gebratene Tortillas, schwarze Bohnen, Mais, geschmolzener Käse." },
  { slug: "kraeuter-omelett", de: "Fluffiges Kräuter-Omelett", en: "Fluffy Herb Omelette", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Französische Technik: weich gestockt, frische Kräuter, 10 Minuten." },
  { slug: "knuspriger-sesam-tofu", de: "Knuspriger Sesam-Tofu", en: "Crispy Sesame Tofu", category: "pfannengericht", topics: ["vegan", "schnell"], produce: ["brokkoli"], notes: "In Stärke gewendet, süß-salzige Sesam-Glasur, Brokkoli, Reis." },

  // ── Grillen ────────────────────────────────────────────────────────────────
  { slug: "gegrillte-maiskolben", de: "Gegrillte Maiskolben mit Kräuterbutter", en: "Grilled Corn with Herb Butter", category: "grillen", topics: ["vegetarisch", "grillen", "schnell"], produce: ["mais"], notes: "Direkt gegrillt bis leicht verkohlt, selbst gemachte Kräuterbutter." },
  { slug: "cevapcici-mit-ajvar", de: "Ćevapčići mit Ajvar", en: "Ćevapčići with Ajvar", category: "grillen", topics: ["grillen"], produce: ["paprika"], notes: "Balkan-Hackröllchen, Ajvar, Zwiebeln, Fladenbrot." },
  { slug: "gemuese-grillspiesse", de: "Marinierte Gemüse-Grillspieße", en: "Marinated Veggie Skewers", category: "grillen", topics: ["vegan", "grillen"], produce: ["zucchini", "paprika"], notes: "Kräuter-Knoblauch-Marinade, Halloumi-Option nennen." },
  { slug: "klassischer-beef-burger", de: "Klassischer Beef Burger", en: "Classic Beef Burger", category: "grillen", topics: ["grillen"], produce: ["tomate"], notes: "Saftiges Patty, Burgersauce, karamellisierte Zwiebeln, Brioche-Bun." },

  // ── Frühstück ──────────────────────────────────────────────────────────────
  { slug: "bananen-pancakes", de: "Fluffige Bananen-Pancakes", en: "Fluffy Banana Pancakes", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Reife Bananen im Teig, Ahornsirup, gerösteten Nüssen." },
  { slug: "zimt-porridge", de: "Zimt-Porridge mit Apfel", en: "Cinnamon Apple Porridge", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: ["apfel"], notes: "Warm gekocht mit karamellisierten Apfelwürfeln — klar von den Overnight Oats abgrenzen (warm vs. kalt)." },
  { slug: "arme-ritter", de: "Arme Ritter", en: "Classic French Toast", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Altbackenes Brot in Ei-Milch, goldbraun gebraten, Zimtzucker." },
  { slug: "knusper-granola", de: "Selbstgemachtes Knusper-Granola", en: "Crunchy Homemade Granola", category: "fruehstueck", topics: ["vegan", "meal-prep"], produce: [], notes: "Große Cluster: Hafer, Nüsse, Ahornsirup; hält Wochen im Glas." },
  { slug: "chia-mango-pudding", de: "Chia-Pudding mit Mango", en: "Mango Chia Pudding", category: "fruehstueck", topics: ["vegan", "meal-prep"], produce: [], notes: "Über Nacht gequollen, Kokosmilch, Mango-Püree-Schicht." },

  // ── Dessert & Süßes ────────────────────────────────────────────────────────
  { slug: "kaiserschmarrn", de: "Kaiserschmarrn", en: "Austrian Kaiserschmarrn", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Zerrupfter fluffiger Pfannkuchen, karamellisiert, Rosinen, Puderzucker, Apfelmus." },
  { slug: "milchreis-zimt", de: "Milchreis mit Zimt und Zucker", en: "Creamy Rice Pudding", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Langsam gerührt, Vanille, Zimtzucker; warm oder kalt." },
  { slug: "zwetschgenkuchen", de: "Zwetschgenkuchen vom Blech", en: "German Plum Sheet Cake", category: "gebaeck", topics: ["vegetarisch"], produce: ["zwetschge"], notes: "Hefeteig, dicht belegte Zwetschgen, Zimtstreusel — Spätsommer." },
  { slug: "schoko-brownies", de: "Saftige Schoko-Brownies", en: "Fudgy Chocolate Brownies", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Innen fudgy, außen Knusperkruste, dunkle Schokolade." },
  { slug: "tiramisu-klassisch", de: "Klassisches Tiramisu", en: "Classic Tiramisu", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Espresso-getränkte Löffelbiskuits, Mascarpone-Creme, Kakao; ohne Backen." },
  { slug: "bratapfel-mandeln", de: "Bratapfel mit Mandeln", en: "Baked Apples with Almonds", category: "dessert", topics: ["vegetarisch"], produce: ["apfel"], notes: "Marzipan-Nuss-Füllung, Vanillesauce — Winter/Advent." },
  { slug: "apfelstrudel", de: "Wiener Apfelstrudel", en: "Viennese Apple Strudel", category: "gebaeck", topics: ["vegetarisch"], produce: ["apfel"], notes: "Hauchdünner Strudelteig, Zimt-Äpfel, Rosinen, Butterbrösel." },

  // ── Fisch ──────────────────────────────────────────────────────────────────
  { slug: "ofen-forelle-kraeuter", de: "Forelle aus dem Ofen mit Kräutern", en: "Herb-Baked Trout", category: "fisch", topics: [], produce: [], notes: "Ganze Forelle, Zitrone, Kräuterfüllung, in 25 Minuten." },
  { slug: "gambas-al-ajillo", de: "Gambas al Ajillo", en: "Spanish Garlic Prawns", category: "fisch", topics: ["schnell"], produce: [], notes: "In Knoblauch-Chili-Öl geschwenkt, Petersilie, Weißbrot zum Tunken." },
  { slug: "fisch-tacos", de: "Fisch-Tacos mit Limetten-Slaw", en: "Baja Fish Tacos", category: "fisch", topics: ["schnell"], produce: ["weisskohl"], notes: "Knusprig gebratener Weißfisch, Krautsalat, Limetten-Crème, Koriander." },
  { slug: "kabeljau-senfsauce", de: "Kabeljau in Senfsauce", en: "Cod in Mustard Cream Sauce", category: "fisch", topics: ["schnell"], produce: [], notes: "Norddeutsch: pochierter Kabeljau, helle Senfsauce, Salzkartoffeln — klar von der Lachs-Honig-Senf-Kruste abgrenzen." },

  // ── Fleisch-Klassiker ──────────────────────────────────────────────────────
  { slug: "koenigsberger-klopse", de: "Königsberger Klopse", en: "Königsberg Meatballs in Caper Sauce", category: "klassiker", topics: [], produce: [], notes: "Kalbs-/Rinderklopse in heller Kapernsauce, Salzkartoffeln, Rote Bete dazu." },
  { slug: "schnitzel-wiener-art", de: "Schnitzel Wiener Art", en: "Breaded Pork Schnitzel", category: "klassiker", topics: [], produce: [], notes: "Dünn geklopft, luftige Panade (souffliert), Zitrone; Schwein statt Kalb." },
  { slug: "kohlrouladen", de: "Kohlrouladen", en: "German Stuffed Cabbage Rolls", category: "schmorgericht", topics: ["meal-prep"], produce: ["weisskohl"], notes: "Hackfüllung, in Brühe geschmort, dunkle Sauce; Wintersonntag." },
  { slug: "klassische-frikadellen", de: "Klassische Frikadellen", en: "German Meat Patties", category: "klassiker", topics: ["schnell", "meal-prep"], produce: [], notes: "Saftig durch eingeweichtes Brötchen, Senf, Zwiebeln; kalt wie warm gut." },
  { slug: "knusprige-haehnchenschenkel", de: "Knusprige Ofen-Hähnchenschenkel", en: "Crispy Baked Chicken Thighs", category: "fleisch", topics: [], produce: [], notes: "Paprika-Knoblauch-Marinade, bei hoher Hitze knusprig gebacken." },
  { slug: "schweinebraten-dunkelbier", de: "Schweinebraten mit Dunkelbiersauce", en: "Bavarian Pork Roast in Dark Beer Sauce", category: "fleisch", topics: [], produce: [], notes: "Krustenbraten, Dunkelbier-Bratensauce, Knödel als Beilage nennen." },

  // ── Vegan Mains ────────────────────────────────────────────────────────────
  { slug: "linsen-bolognese", de: "Linsen-Bolognese", en: "Lentil Bolognese", category: "pasta", topics: ["vegan", "meal-prep"], produce: ["tomate", "staudensellerie"], notes: "Berglinsen, Sellerie, Karotte, lange geschmort — klar von Suppe UND Fleisch-Bolognese abgrenzen." },
  { slug: "blumenkohl-wings", de: "Knusprige Blumenkohl-Wings", en: "Crispy Cauliflower Wings", category: "ofengericht", topics: ["vegan"], produce: ["blumenkohl"], notes: "Im Teigmantel gebacken, BBQ-Glasur, Ranch-Dip (vegan)." },
  { slug: "gefuellte-suesskartoffel", de: "Gefüllte Süßkartoffel", en: "Loaded Sweet Potatoes", category: "ofengericht", topics: ["vegan", "schnell"], produce: [], notes: "Im Ofen gegart, Füllung aus schwarzen Bohnen, Avocado, Limetten-Crème." },
  { slug: "chili-sin-carne", de: "Chili sin Carne", en: "Chili sin Carne", category: "eintopf", topics: ["vegan", "meal-prep"], produce: ["paprika", "mais"], notes: "Sojagranulat oder Linsen, Kidneybohnen, Rauchpaprika, Kakao-Geheimzutat." },

  // ── Herbst & Winter ────────────────────────────────────────────────────────
  { slug: "geroesteter-rosenkohl", de: "Gerösteter Rosenkohl mit Honig", en: "Roasted Brussels Sprouts with Honey", category: "beilage", topics: ["vegetarisch", "schnell"], produce: ["rosenkohl"], notes: "Im Ofen geröstet bis karamellisiert, Honig-Senf-Glasur, geröstete Nüsse." },
  { slug: "schupfnudel-sauerkraut-pfanne", de: "Schupfnudel-Sauerkraut-Pfanne", en: "Schupfnudeln with Sauerkraut", category: "pfannengericht", topics: ["vegetarisch"], produce: [], notes: "Goldbraun gebratene Schupfnudeln, Sauerkraut, Speck-Option nennen." },
  { slug: "kaesespaetzle", de: "Allgäuer Käsespätzle", en: "German Cheese Spaetzle", category: "klassiker", topics: ["vegetarisch"], produce: [], notes: "Geschichtet mit Bergkäse, dunkle Röstzwiebeln obendrauf." },
  { slug: "semmelknoedel-pilzrahm", de: "Semmelknödel mit Pilzrahm", en: "Bread Dumplings in Mushroom Sauce", category: "klassiker", topics: ["vegetarisch"], produce: ["pilze"], notes: "Bayrisch: fluffige Knödel, cremige Waldpilz-Sauce, Petersilie." },
  { slug: "gebratene-maultaschen", de: "Gebratene Maultaschen mit Ei", en: "Pan-Fried Swabian Maultaschen", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "In Scheiben, mit Zwiebeln und verquirltem Ei gebraten; Kartoffelsalat dazu." },
  { slug: "chicoree-schinken-gratin", de: "Chicorée-Schinken-Gratin", en: "Braised Chicory Ham Gratin", category: "auflauf", topics: [], produce: ["chicoree"], notes: "In Schinken gewickelter Chicorée, Béchamel, gratiniert — belgischer Klassiker." },
  { slug: "apfel-rotkohl", de: "Klassischer Apfel-Rotkohl", en: "Braised Red Cabbage with Apples", category: "beilage", topics: ["vegan"], produce: ["rotkohl", "apfel"], notes: "Langsam geschmort mit Nelken, Lorbeer, Johannisbeergelee." },
  { slug: "sellerieschnitzel", de: "Sellerieschnitzel", en: "Crispy Celeriac Schnitzel", category: "klassiker", topics: ["vegetarisch"], produce: ["knollensellerie"], notes: "Dicke Selleriescheiben paniert und knusprig gebraten, Zitrone, Remoulade." },

  // ── Frühling ───────────────────────────────────────────────────────────────
  { slug: "fruehlings-frittata", de: "Frühlings-Frittata", en: "Spring Vegetable Frittata", category: "pfannengericht", topics: ["vegetarisch", "schnell"], produce: ["spargel", "erbse"], notes: "Grüner Spargel, Erbsen, Ziegenkäse, im Ofen gestockt." },
  { slug: "rhabarber-streuselkuchen", de: "Rhabarber-Streuselkuchen", en: "Rhubarb Crumble Cake", category: "gebaeck", topics: ["vegetarisch"], produce: ["rhabarber"], notes: "Säuerlicher Rhabarber unter Butterstreuseln, Rührteig-Boden." },
  { slug: "spargel-hollandaise", de: "Spargel mit Sauce Hollandaise", en: "White Asparagus with Hollandaise", category: "klassiker", topics: ["vegetarisch"], produce: ["spargel", "fruehkartoffel"], notes: "Weißer Spargel, selbst aufgeschlagene Hollandaise, neue Kartoffeln." },

  // ════════════════════════════════════════════════════════════════════════
  // Nachschub 15.07.2026 — Trend-Analyse (TikTok/Google 2026 + eigene GSC) +
  // fehlende Suchvolumen-Klassiker + Herbst-Saison. Quellen: High-Protein/
  // Cottage-Cheese = Megatrend 2026, Levante-Küche, virale Evergreens.
  // ════════════════════════════════════════════════════════════════════════

  // ── Viral / TikTok-Trends 2026 ──────────────────────────────────────────
  { slug: "marry-me-chicken", de: "Marry Me Chicken", en: "Marry Me Chicken", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "Virales Hähnchen in cremiger Sonnengetrocknete-Tomaten-Parmesan-Sauce; eine Pfanne, 30 Minuten." },
  { slug: "baked-feta-pasta", de: "Baked Feta Pasta", en: "Baked Feta Pasta", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["tomate"], notes: "Der TikTok-Klassiker: Feta-Block mit Kirschtomaten im Ofen geschmolzen, mit Pasta vermengt; klar abgrenzen von Ofengemüse mit Feta (hier Pasta-Gericht)." },
  { slug: "pasta-alla-vodka", de: "Pasta alla Vodka", en: "Penne alla Vodka", category: "pasta", topics: ["vegetarisch"], produce: [], notes: "Cremige Tomaten-Sahne-Sauce mit Schuss Wodka (Alkohol verkocht), Penne; von Arrabbiata durch Sahne-Cremigkeit abgegrenzt." },
  { slug: "birria-style-tacos", de: "Birria-Style Tacos", en: "Birria-Style Tacos", category: "schmorgericht", topics: [], produce: [], notes: "Geschmortes Rindfleisch in Chili-Consommé, Tacos in der Brühe knusprig gebraten, zum Dippen; Alltagsversion mit Schmorbraten." },
  { slug: "crispy-smashed-potatoes", de: "Knusprige Quetschkartoffeln", en: "Crispy Smashed Potatoes", category: "beilage", topics: ["vegan", "schnell"], produce: ["fruehkartoffel"], notes: "Gekochte kleine Kartoffeln flach gedrückt und im Ofen extra knusprig; Knoblauch-Kräuter-Öl; viral und simpel." },
  { slug: "whipped-feta-dip", de: "Whipped Feta mit Honig", en: "Whipped Feta Dip with Honey", category: "dip", topics: ["vegetarisch", "schnell"], produce: [], notes: "Luftig aufgeschlagener Feta mit Joghurt, Honig und Zitrone; Dip für Brot, Gemüse und Gegrilltes." },
  { slug: "cottage-cheese-flatbread", de: "Cottage-Cheese-Fladenbrot", en: "Cottage Cheese Flatbread", category: "gebaeck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Viraler High-Protein-Trend: Hüttenkäse-Ei-Teig als dünnes Fladenbrot gebacken, nach Wunsch belegt — 2026er Fladenbrot-Trend plus Protein." },
  { slug: "joghurt-tiramisu", de: "Joghurt-Tiramisu", en: "Yogurt Tiramisu", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Leichtes virales Tiramisu mit griechischem Joghurt statt Mascarpone, Kaffee und Keksschicht; klar vom klassischen Tiramisu abgegrenzt (leichter, ohne Ei)." },
  { slug: "dubai-schokoladen-dessert", de: "Dubai-Schokoladen-Dessert im Glas", en: "Dubai Chocolate Dessert Cups", category: "dessert", topics: ["vegetarisch"], produce: [], notes: "Der Pistazien-Engelshaar-Trend als Dessertglas: Schokocreme, Pistaziencreme, knusprige Kadayif-Fäden (ersatzweise geröstete Engelshaar-Nudeln)." },
  { slug: "asiatischer-gurkensalat", de: "Asiatischer Gurkensalat", en: "Smashed Cucumber Salad", category: "salat", topics: ["vegan", "schnell"], produce: ["salatgurke"], notes: "Viraler geklopfter Gurkensalat: Sojasauce, Reisessig, Sesamöl, Knoblauch, Chiliöl; in 10 Minuten." },
  { slug: "gochujang-nudeln", de: "Cremige Gochujang-Nudeln", en: "Creamy Gochujang Noodles", category: "pasta", topics: ["vegetarisch", "schnell"], produce: [], notes: "Koreanisch inspirierte 15-Minuten-Nudeln: Gochujang, Butter, etwas Sahne, Frühlingszwiebeln." },
  { slug: "onigiri-gefuellt", de: "Gefüllte Onigiri", en: "Stuffed Onigiri Rice Balls", category: "snack", topics: ["meal-prep"], produce: [], notes: "Japanische Reisbällchen mit Thunfisch-Mayo- oder Lachs-Füllung, Nori; Meal-Prep- und Bento-Trend." },

  // ── High Protein (Megatrend 2026, eigene GSC-Query) ─────────────────────
  { slug: "protein-pancakes", de: "Protein-Pancakes", en: "Protein Pancakes", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Fluffige Pancakes aus Quark, Eiern, Haferflocken und Proteinpulver-Option; über 30 g Protein pro Portion; von Bananen-Pancakes klar abgegrenzt (Protein-Fokus)." },
  { slug: "egg-muffins-spinat-feta", de: "Egg Muffins mit Spinat und Feta", en: "Spinach Feta Egg Muffins", category: "fruehstueck", topics: ["vegetarisch", "meal-prep"], produce: ["spinat"], notes: "Herzhafte Ei-Muffins aus der Form, 3–4 Tage haltbar; Meal-Prep-Frühstück mit viel Protein." },
  { slug: "haehnchen-gyros-bowl", de: "Hähnchen-Gyros-Bowl", en: "Chicken Gyros Bowl", category: "bowl", topics: ["meal-prep"], produce: ["salatgurke", "tomate"], notes: "Gyros-gewürztes Hähnchen, Reis, Tzatziki, Tomate-Gurke; High-Protein-Bowl, von Souvlaki (Spieße) und Buddha Bowl klar abgegrenzt." },
  { slug: "protein-overnight-oats", de: "Protein Overnight Oats", en: "Protein Overnight Oats", category: "fruehstueck", topics: ["vegetarisch", "meal-prep"], produce: [], notes: "Overnight Oats mit Skyr/Quark und Chia auf über 30 g Protein gebracht; drei Geschmacksvarianten in den Schritten." },
  { slug: "huettenkaese-power-bowl", de: "Herzhafte Hüttenkäse-Bowl", en: "Savory Cottage Cheese Bowl", category: "bowl", topics: ["vegetarisch", "schnell"], produce: ["salatgurke", "tomate", "radieschen"], notes: "Cottage-Cheese-Trend herzhaft: Hüttenkäse mit knackigem Gemüse, Kernen, Olivenöl und Zitrone; 5 Minuten, kein Kochen." },
  { slug: "tofu-scramble", de: "Tofu-Rührei", en: "Tofu Scramble", category: "fruehstueck", topics: ["vegan", "schnell"], produce: [], notes: "Veganes Rührei aus zerbröseltem Tofu mit Kurkuma und Kala Namak (Eiergeschmack); Gemüse nach Saison." },
  { slug: "chili-con-carne-klassisch", de: "Chili con Carne", en: "Classic Chili con Carne", category: "eintopf", topics: ["meal-prep"], produce: [], notes: "Der Klassiker mit Hack, Kidneybohnen, Mais und Kreuzkümmel; friert hervorragend ein; klar vom Chili sin Carne abgegrenzt (mit Fleisch)." },
  { slug: "haehnchen-teriyaki-meal-prep", de: "Hähnchen-Teriyaki mit Reis", en: "Teriyaki Chicken Meal Prep", category: "pfannengericht", topics: ["meal-prep", "schnell"], produce: ["brokkoli"], notes: "Glasierte Hähnchenwürfel in selbst gerührter Teriyaki-Sauce, Reis, Brokkoli; 4 Boxen; vom Teriyaki-Lachs klar abgegrenzt (Hähnchen, Meal-Prep-Fokus)." },
  { slug: "thunfisch-reis-bowl", de: "Thunfisch-Reis-Bowl", en: "Spicy Tuna Rice Bowl", category: "bowl", topics: ["schnell"], produce: ["salatgurke"], notes: "Deconstructed-Sushi-Trend: Reis, Dosenthunfisch mit Sriracha-Mayo, Gurke, Sesam, Nori; günstiges Protein in 15 Minuten." },
  { slug: "quark-kaiserschmarrn-protein", de: "Quark-Auflauf mit Beeren", en: "Baked Quark Casserole with Berries", category: "dessert", topics: ["vegetarisch"], produce: ["heidelbeere"], notes: "Luftiger Quarkauflauf mit Grieß und Beeren — Dessert oder süßes Hauptgericht mit ordentlich Protein; vom Kaiserschmarrn klar abgegrenzt (Quarkbasis, gebacken)." },
  { slug: "linsen-feta-pfanne", de: "Linsen-Feta-Pfanne", en: "Lentil Feta Skillet", category: "pfannengericht", topics: ["vegetarisch", "schnell", "meal-prep"], produce: ["tomate", "spinat"], notes: "Rote Linsen mit Tomate und Spinat, Feta obendrauf geschmolzen; pflanzliches Protein in 25 Minuten; vom Dal abgegrenzt (mediterran, Feta)." },

  // ── Fehlende Suchvolumen-Klassiker (DE + EN) ────────────────────────────
  { slug: "spaghetti-carbonara", de: "Spaghetti Carbonara", en: "Authentic Spaghetti Carbonara", category: "pasta", topics: ["schnell"], produce: [], notes: "Original römisch: nur Guanciale/Pancetta, Eigelb, Pecorino, Pfeffer — ohne Sahne; Technik gegen Gerinnen in den Schritten." },
  { slug: "rindergulasch-klassisch", de: "Rindergulasch", en: "Classic Beef Goulash", category: "schmorgericht", topics: ["meal-prep"], produce: [], notes: "Langsam geschmortes Rindergulasch mit viel Zwiebel und Paprikapulver; wird aufgewärmt noch besser." },
  { slug: "cremige-tomatensuppe", de: "Cremige Tomatensuppe", en: "Creamy Tomato Soup", category: "suppe", topics: ["vegetarisch", "schnell"], produce: ["tomate"], notes: "Aus gerösteten Tomaten oder Dosentomaten, Basilikum, Schuss Sahne; dazu Grilled-Cheese-Ecken als Serviertipp." },
  { slug: "kartoffelpuffer-apfelmus", de: "Kartoffelpuffer mit Apfelmus", en: "German Potato Pancakes with Applesauce", category: "pfannengericht", topics: ["vegetarisch"], produce: ["apfel"], notes: "Reibekuchen knusprig ausgebacken, selbst gerührtes Apfelmus; von Zucchini-Puffern klar abgegrenzt (Kartoffel, süße Beilage)." },
  { slug: "gyros-pfanne-zaziki", de: "Gyros-Pfanne mit Tzatziki", en: "Greek Gyros Skillet", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "Schweine- oder Hähnchen-Gyros aus der Pfanne mit Zwiebeln, dazu Tzatziki und Fladenbrot; vom Souvlaki (Spieße, Grill) abgegrenzt." },
  { slug: "pizza-margherita-selbstgemacht", de: "Pizza Margherita mit selbstgemachtem Teig", en: "Homemade Pizza Margherita", category: "gebaeck", topics: ["vegetarisch"], produce: ["basilikum", "tomate"], notes: "Übernacht-Teig für knusprigen Boden, San-Marzano-Sauce, Mozzarella, Basilikum; Ofen-Maximaltemperatur-Trick." },
  { slug: "rinderrouladen-klassisch", de: "Rinderrouladen", en: "German Beef Roulades", category: "schmorgericht", topics: [], produce: [], notes: "Klassisch gefüllt mit Senf, Speck, Gurke und Zwiebel, geschmort mit Rotweinsauce; Sonntagsessen-Klassiker mit hoher Suchnachfrage im Herbst/Winter." },
  { slug: "kaesekuchen-klassisch", de: "Klassischer Käsekuchen", en: "German Cheesecake (Käsekuchen)", category: "gebaeck", topics: ["vegetarisch"], produce: [], notes: "Quark-Käsekuchen mit Mürbeteigboden, der nicht einfällt — Wasserbad-frei, mit Ruhe-im-Ofen-Trick; Top-Suchvolumen-Klassiker." },
  { slug: "versunkener-apfelkuchen", de: "Versunkener Apfelkuchen", en: "German Sunken Apple Cake", category: "gebaeck", topics: ["vegetarisch"], produce: ["apfel"], notes: "Saftiger Rührteig mit eingeschnittenen Apfelvierteln; vom Apfelstrudel klar abgegrenzt (Kuchen, kein Strudelteig); Herbst-Klassiker." },
  { slug: "ofenlachs-mit-gemuese", de: "Ofenlachs mit Gemüse", en: "Sheet-Pan Salmon and Vegetables", category: "ofengericht", topics: ["schnell"], produce: ["brokkoli", "zucchini"], notes: "Lachsfilet und Gemüse auf einem Blech, Zitrone und Honig-Senf; 25 Minuten, ein Blech; vom Teriyaki-Lachs und der Forelle klar abgegrenzt." },
  { slug: "cremige-zucchinisuppe", de: "Cremige Zucchinisuppe", en: "Creamy Zucchini Soup", category: "suppe", topics: ["vegetarisch", "schnell"], produce: ["zucchini"], notes: "Für die Zucchini-Schwemme: cremig püriert mit Kartoffel und Frischkäse; warm oder kalt." },
  { slug: "ofenkartoffel-kraeuterquark", de: "Ofenkartoffel mit Kräuterquark", en: "Baked Potato with Herb Quark", category: "ofengericht", topics: ["vegetarisch"], produce: [], notes: "Große mehlige Kartoffeln mit knuspriger Schale, frischer Kräuterquark; Toppings-Baukasten in den Notizen." },
  { slug: "pfannkuchen-grundrezept", de: "Pfannkuchen — das Grundrezept", en: "German Pancakes (Pfannkuchen)", category: "fruehstueck", topics: ["vegetarisch", "schnell"], produce: [], notes: "Das gelingsichere Grundrezept süß und herzhaft; von Bananen- und Protein-Pancakes klar abgegrenzt (klassischer Eierteig, dünn)." },
  { slug: "belgische-waffeln", de: "Fluffige Waffeln", en: "Fluffy Belgian Waffles", category: "fruehstueck", topics: ["vegetarisch"], produce: [], notes: "Knusprig außen, fluffig innen; Grundteig plus Varianten (Buttermilch, Hefe)." },
  { slug: "erbsensuppe-deftig", de: "Deftige Erbsensuppe", en: "Hearty German Pea Soup", category: "eintopf", topics: ["meal-prep"], produce: [], notes: "Klassische Erbsensuppe aus getrockneten Schälerbsen mit Kartoffeln und Würstchen-Option; von der Erbsen-Minz-Suppe klar abgegrenzt (deftig, getrocknete Erbsen)." },
  { slug: "currywurst-sauce-selbstgemacht", de: "Currywurst mit selbstgemachter Sauce", en: "German Currywurst with Homemade Sauce", category: "pfannengericht", topics: ["schnell"], produce: [], notes: "Die Sauce ist der Star: Tomatenbasis mit Curry, geheimer Cola-Schuss optional; Imbiss-Klassiker zuhause." },
  { slug: "flammkuchen-elsaesser-vegetarisch", de: "Pilz-Flammkuchen mit Ziegenkäse", en: "Mushroom Goat Cheese Tarte Flambée", category: "gebaeck", topics: ["vegetarisch"], produce: ["pilze"], notes: "Herbstvariante des Flammkuchens: Champignons, Ziegenkäse, Honig, Thymian; vom Elsässer Original (Speck/Zwiebel) klar abgegrenzt." },

  // ── Herbst-Saison (September–November) ──────────────────────────────────
  { slug: "kuerbisrisotto-salbei", de: "Kürbisrisotto mit Salbei", en: "Pumpkin Risotto with Sage", category: "risotto", topics: ["vegetarisch"], produce: ["kuerbis"], notes: "Cremiges Risotto mit Hokkaido und brauner Salbeibutter; von Pilz- und Spargelrisotto klar abgegrenzt." },
  { slug: "gefuellter-kuerbis", de: "Gefüllter Kürbis aus dem Ofen", en: "Stuffed Roasted Pumpkin", category: "ofengericht", topics: ["vegetarisch"], produce: ["kuerbis"], notes: "Kleine Hokkaidos gefüllt mit Reis oder Couscous, Feta und Kernen; vegetarisches Herbst-Hauptgericht." },
  { slug: "kuerbis-kokos-curry", de: "Kürbis-Kokos-Curry", en: "Pumpkin Coconut Curry", category: "curry", topics: ["vegan"], produce: ["kuerbis"], notes: "Rotes Curry mit Hokkaido, Kokosmilch und Kichererbsen; von Kürbissuppe (Suppe) und gelbem Gemüse-Curry klar abgegrenzt." },
  { slug: "kuerbis-gnocchi-pfanne", de: "Kürbis-Gnocchi-Pfanne", en: "Pumpkin Gnocchi Skillet", category: "pfannengericht", topics: ["vegetarisch", "schnell"], produce: ["kuerbis", "spinat"], notes: "Gebratene Gnocchi mit Kürbiswürfeln, Spinat und Parmesan-Sahne; 25 Minuten; von Gnocchi in Salbeibutter abgegrenzt (Kürbis, cremig)." },
  { slug: "cremige-pilzpfanne", de: "Cremige Pilzpfanne", en: "Creamy Garlic Mushrooms", category: "pfannengericht", topics: ["vegetarisch", "schnell"], produce: ["pilze"], notes: "Gemischte Pilze in Knoblauch-Rahm, Petersilie; als Hauptgericht mit Baguette oder Beilage; von Tagliatelle-Pilzrahm (Pasta) und Semmelknödel-Pilzrahm abgegrenzt." },
  { slug: "ofen-suesskartoffel-pommes", de: "Süßkartoffel-Pommes aus dem Ofen", en: "Crispy Baked Sweet Potato Fries", category: "beilage", topics: ["vegan"], produce: [], notes: "Wirklich knusprig dank Stärke-Trick, dazu schneller Joghurt-Dip; stark gesuchte Beilage." },
  { slug: "rote-bete-suppe", de: "Rote-Bete-Suppe mit Meerrettich", en: "Beetroot Soup with Horseradish", category: "suppe", topics: ["vegetarisch"], produce: ["rote-bete"], notes: "Samtige Bete-Suppe, Meerrettich-Sahne-Topping; vom Rote-Bete-Linsen-Salat klar abgegrenzt (warme Suppe)." },
  { slug: "kaese-lauch-suppe", de: "Käse-Lauch-Suppe mit Hack", en: "Cheesy Leek Soup with Ground Beef", category: "suppe", topics: ["meal-prep"], produce: ["lauch"], notes: "Der Partysuppen-Klassiker: Hack, Lauch, Schmelzkäse; große Menge, hohe Suchnachfrage im Herbst/Winter." },
  { slug: "kohlrabi-schnitzel", de: "Kohlrabi-Schnitzel", en: "Breaded Kohlrabi Schnitzel", category: "pfannengericht", topics: ["vegetarisch"], produce: ["kohlrabi"], notes: "Panierte Kohlrabischeiben goldbraun gebraten; vom Sellerieschnitzel klar abgegrenzt (Kohlrabi, Sommer/Herbst-Saison)." },
  { slug: "zwetschgenknoedel", de: "Zwetschgenknödel", en: "Austrian Plum Dumplings", category: "dessert", topics: ["vegetarisch"], produce: ["zwetschge"], notes: "Kartoffelteig-Knödel mit ganzer Zwetschge, in Zimt-Bröseln gewälzt; vom Zwetschgenkuchen klar abgegrenzt (Knödel)." },
  { slug: "maispuffer-avocado-dip", de: "Maispuffer mit Avocado-Dip", en: "Sweetcorn Fritters with Avocado Dip", category: "pfannengericht", topics: ["vegetarisch", "schnell"], produce: ["mais"], notes: "Knusprige Puffer aus frischem oder Dosenmais, Limetten-Avocado-Dip; von Zucchini- und Kartoffelpuffern klar abgegrenzt (Mais)." },
  { slug: "apfel-zimtschnecken", de: "Apfel-Zimtschnecken", en: "Apple Cinnamon Rolls", category: "gebaeck", topics: ["vegetarisch"], produce: ["apfel"], notes: "Fluffige Hefeschnecken mit Apfel-Zimt-Füllung und Frischkäse-Glasur; Herbst-Backtrend." },
  { slug: "birnen-gorgonzola-pasta", de: "Birnen-Gorgonzola-Pasta", en: "Pear Gorgonzola Pasta", category: "pasta", topics: ["vegetarisch", "schnell"], produce: ["birne"], notes: "Süß-würzige Herbstpasta mit karamellisierter Birne, Gorgonzola-Sahne und Walnüssen; vom Feldsalat mit Birne abgegrenzt (warmes Hauptgericht)." },
  { slug: "flaedlesuppe", de: "Flädlesuppe", en: "German Pancake Soup (Flädlesuppe)", category: "suppe", topics: ["schnell"], produce: [], notes: "Schwäbischer Klassiker: dünne Pfannkuchenstreifen in kräftiger Brühe; ideale Resteverwertung für Pfannkuchen." },
  { slug: "wirsingrouladen-vegetarisch", de: "Vegetarische Wirsingrouladen", en: "Vegetarian Savoy Cabbage Rolls", category: "auflauf", topics: ["vegetarisch"], produce: ["wirsing"], notes: "Wirsingblätter mit Linsen-Reis-Füllung in Tomatensauce; von Kohlrouladen (Hack, Weißkohl) und Wirsing-Hack-Auflauf klar abgegrenzt." },

  // ── Levante & Plant Forward (Trend 2026) ────────────────────────────────
  { slug: "cremiger-hummus", de: "Cremiger Hummus — das Grundrezept", en: "Ultra-Creamy Hummus", category: "dip", topics: ["vegan", "meal-prep"], produce: [], notes: "Extra cremig durch geschälte Kichererbsen und Eiswasser-Trick; Basis plus zwei Toppings; Levante-Trend 2026." },
  { slug: "falafel-selbstgemacht", de: "Selbstgemachte Falafel", en: "Homemade Crispy Falafel", category: "pfannengericht", topics: ["vegan"], produce: [], notes: "Aus eingeweichten (nicht gekochten) Kichererbsen, außen knusprig, innen grün-kräuterig; Pfannen- statt Frittierversion." },
  { slug: "sabich-auberginen-bowl", de: "Sabich-Bowl mit gebratener Aubergine", en: "Sabich Bowl with Fried Eggplant", category: "bowl", topics: ["vegetarisch"], produce: ["aubergine"], notes: "Israelisches Streetfood als Bowl: Aubergine, Ei, Hummus, Tomaten-Gurken-Salat, Tahini und Amba-Option." },
  { slug: "mujadara-linsen-reis", de: "Mujadara — Linsen-Reis mit Röstzwiebeln", en: "Mujadara — Lentils and Rice with Crispy Onions", category: "one-pot", topics: ["vegan", "meal-prep"], produce: [], notes: "Levantinischer Klassiker aus Vorratszutaten: Linsen, Reis, tief goldene Röstzwiebeln; günstig und proteinreich." },
  { slug: "shawarma-blumenkohl-wrap", de: "Blumenkohl-Shawarma-Wrap", en: "Cauliflower Shawarma Wrap", category: "wrap", topics: ["vegan"], produce: ["blumenkohl"], notes: "Ofen-Blumenkohl in Shawarma-Gewürz im Fladenbrot mit Tahini; von Blumenkohl-Wings (Snack, BBQ-Sauce) klar abgegrenzt." },
  { slug: "tuerkischer-linsen-bulgur-eintopf", de: "Türkische Linsen-Bulgur-Suppe", en: "Turkish Lentil Bulgur Soup", category: "suppe", topics: ["vegan", "schnell"], produce: [], notes: "Ezogelin-Stil: rote Linsen, Bulgur, Paprikamark, Minze; von Dal (indisch) und Linseneintopf (deutsch) klar abgegrenzt." },

  // ── Schnelle Alltagsküche (Korpus-Lücken) ───────────────────────────────
  { slug: "wraps-selber-fuellen", de: "Hähnchen-Caesar-Wrap", en: "Chicken Caesar Wrap", category: "wrap", topics: ["schnell", "meal-prep"], produce: ["blattsalat"], notes: "Der Lunch-Klassiker zum Mitnehmen: Hähnchen, Caesar-Dressing, Römersalat, Parmesan; Roll-Technik gegen Aufweichen." },
  { slug: "gebackene-suesskartoffel-gefuellt", de: "Gefüllte Ofen-Süßkartoffel mit Kichererbsen", en: "Loaded Sweet Potato with Chickpeas", category: "ofengericht", topics: ["vegan"], produce: [], notes: "Weich gebackene Süßkartoffel mit Röst-Kichererbsen und Tahini; von der bestehenden gefüllten Süßkartoffel klar abgegrenzt (vegan, orientalisch)." },
  { slug: "tomate-mozzarella-haehnchen", de: "Überbackenes Tomate-Mozzarella-Hähnchen", en: "Caprese Stuffed Chicken", category: "ofengericht", topics: ["schnell"], produce: ["tomate", "basilikum"], notes: "Hähnchenbrust mit Tomate und Mozzarella überbacken, Balsamico-Glasur; Low-Carb-tauglich, dazu Salat oder Reis." },
  { slug: "spinat-feta-boerek", de: "Spinat-Feta-Börek", en: "Spinach Feta Börek", category: "gebaeck", topics: ["vegetarisch"], produce: ["spinat"], notes: "Knusprige Yufka-Rollen mit Spinat-Feta-Füllung; als Snack, Mezze oder mit Salat als Hauptgericht." },
  { slug: "one-pot-orzo-haehnchen", de: "One-Pot-Orzo mit Hähnchen und Zitrone", en: "One-Pot Lemon Chicken Orzo", category: "one-pot", topics: ["schnell"], produce: ["spinat"], notes: "Orzo gart direkt in Brühe mit Hähnchen, Zitrone und Spinat; ein Topf, 30 Minuten; von One-Pot-Sommerpasta klar abgegrenzt (Orzo, Hähnchen)." },
  { slug: "wuerzige-ramen-bowl", de: "Schnelle Ramen-Bowl mit Ei", en: "Quick Spicy Ramen Bowl", category: "suppe", topics: ["schnell"], produce: [], notes: "Aufgewertete Instant-Ramen: eigene Brühen-Würze, Sesam, marinierte Eier (Ajitama), Pak Choi oder Spinat; von Gemüse-Miso-Ramen abgegrenzt (schnell, Ei-Fokus)." },
];

/** Kategorien/Tags, die der Korpus schon abdeckt (aus Seed-Tags abgeleitet). */
export function corpusCategories() {
  const seed = JSON.parse(fs.readFileSync(SEED_RECIPES, "utf8"));
  const tags = new Set();
  for (const r of seed.recipes) for (const t of r.de?.tags || []) tags.add(t);
  return tags;
}

/** Optionale GSC-Queries (state/gsc.csv, Spalte 1) — Bonus, wenn Gericht dort auftaucht. */
export function gscQueries() {
  const f = path.join(STATE_DIR, "gsc.csv");
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, "utf8").split("\n").slice(1)
    .map((l) => l.split(",")[0]?.trim().toLowerCase()).filter(Boolean);
}

/** Alle Katalog-Gerichte für den Monat scoren (ohne Dedup — macht der Scout). */
export function scoreDishes(month = new Date().getMonth() + 1) {
  const covered = corpusCategories();
  const gsc = gscQueries();
  return DISHES.map((d) => {
    const seasonHits = (d.produce || []).filter((p) => SEASON[p]?.includes(month));
    let score = Math.min(seasonHits.length, 3) * 2;
    const reasons = [];
    if (seasonHits.length) reasons.push(`Saison im Monat ${month}: ${seasonHits.join(", ")}`);
    if (!covered.has(d.category)) { score += 1.5; reasons.push(`Korpus-Lücke: ${d.category}`); }
    for (const t of d.topics || []) {
      if (TOPIC_BONUS[t]) { score += TOPIC_BONUS[t]; reasons.push(`Thema: ${t}`); }
    }
    const gscHit = gsc.find((q) => q.includes(d.de.toLowerCase().split(" ")[0]));
    if (gscHit) { score += 2; reasons.push(`GSC-Suchanfrage: „${gscHit}"`); }
    return { ...d, month, seasonHits, score: +score.toFixed(2), reasons };
  }).sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}
