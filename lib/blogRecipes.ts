import { createAdminClient } from "@/lib/supabase/admin";
import { isFamilyRecipe } from "@/lib/culinse";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { httpUrl } from "@/lib/userRecipeInput";

/*
  Rezepte unter den Ratgebern (27.11.2026).

  Culinse ist eine Rezeptplattform; die Ratgeber sollen Leser zu den Rezepten
  bringen. Bis dahin stand in keinem Ratgeber ein Link auf ein Rezept, obwohl
  Google die Ratgeber öfter zeigt als die Rezepte. Jeder Ratgeber nennt jetzt
  vier Rezepte, die zu seinem Thema passen.

  Alle Rezepte hier sind Kernrezepte (lib/coreRecipes.ts), also Seiten, die
  Suchmaschinen sehen. Auf Deutsch stehen wo möglich Familienrezepte vorn; die
  gibt es nur auf Deutsch, die englische Liste nennt dafür ein anderes Gericht.

  Titel und Bild holt die Seite aus der Datenbank. Der Titel in dieser Datei
  ist nur Lesehilfe und Ersatz, falls die Datenbank nicht antwortet.

  Rezept tauschen: Zeile ersetzen (die ID steht in der Adresse des Rezepts
  hinter "user_") und ausliefern. Neuer Ratgeber: Eintrag unter seinem Slug.
*/
type Pick = { id: string; title: string };

const PICKS_DE: Record<string, Pick[]> = {
  "schneiden-lernen-messerhaltung-schnitttechniken": [
    { id: "f162e228-94d9-4fe7-972a-a949ed0a7fc5", title: "Tomaten Gurken Salat" },
    { id: "fbd6f365-e549-4431-a7e7-6680bbe8204d", title: "Ratatouille nach provenzalischer Art" },
    { id: "f3401945-e868-4144-aeef-b435a21a6109", title: "Italienische Minestrone mit weißen Bohnen" },
    { id: "c5e8c079-7046-4b8b-a3ae-fdf28ac15864", title: "Taboulé — levantinischer Petersiliensalat" },
  ],
  "steak-braten-kerntemperatur-garstufen": [
    { id: "4bbb44cc-b941-4f74-b12c-04420894215a", title: "Flanksteak" },
    { id: "c2948bea-9799-488f-bc47-515242c214f1", title: "Schwäbischer Zwiebelrostbraten" },
    { id: "37cd2f10-740c-4c27-99d8-253c8c74dcca", title: "Zwiebelbutter" },
    { id: "6f902fdb-be99-4e9f-8716-e151e0259f82", title: "Chimichurri" },
  ],
  "messer-schaerfen-schneidebretter-kaufberatung": [
    { id: "396e634f-82df-4351-97ca-6228bb4705a3", title: "Thunfischtartar mit gebeiztem Eigelb" },
    { id: "0165015e-1d35-46f3-b321-38cf16650753", title: "Gebeizter Lachs mit Dill" },
    { id: "fbd6f365-e549-4431-a7e7-6680bbe8204d", title: "Ratatouille nach provenzalischer Art" },
    { id: "1da0124f-5f50-4423-844a-ca15ece25e2e", title: "Rinderrouladen" },
  ],
  "meal-prep-fuer-die-woche": [
    { id: "0b091f9b-ba7f-44af-ac6f-030144001398", title: "Linseneintopf nach Omas Art" },
    { id: "88ed51c2-7aea-4cc2-b6f7-2f55123677b2", title: "Klassisches Rindergulasch" },
    { id: "a36b3585-f624-4472-b30a-0123cd5974f2", title: "Spitzkohl-Eintopf" },
    { id: "9448f51c-f52b-4fd9-bf39-76aa5916de23", title: "Klassische Lasagne" },
  ],
  "beste-kostenlose-meal-planner-apps-2026": [
    { id: "ccb8230f-11db-46ff-9818-dec0d8c20227", title: "Spaghetti Bolognese" },
    { id: "16d2a2cf-bc83-42aa-abdf-6d6498889501", title: "Hähnchen-Kokos-Curry" },
    { id: "18b6d0d6-f629-4b9a-85cd-6acfef409799", title: "Paniertes Schweineschnitzel" },
    { id: "c5044b2f-e879-484a-bda7-4fc4cdb02225", title: "Käsespätzle" },
  ],
  "wochenmenuplan-mit-einkaufsliste": [
    { id: "a7e6a807-b0d9-47b0-a99c-6310f0b76e48", title: "Möhrengemüse mit Bratwurst" },
    { id: "eb401d7b-2542-4ba8-b203-18a3697c6451", title: "Klassische Spaghetti Carbonara" },
    { id: "e895d9e8-96d9-4981-b19c-933e203a2d67", title: "Hähnchen-Fajita-Pfanne" },
    { id: "c1cb77e4-c6f2-48c6-ab2d-a862889ae768", title: "Senfeier mit Kartoffeln" },
  ],
  "schnelle-abendessen-ideen-unter-30-minuten": [
    { id: "89ede64c-e949-4e0d-a055-31fa9fa14c08", title: "Spaghetti mit Gorgonzola-Schinken-Sauce" },
    { id: "ae50088f-14a7-4452-a761-b74ed0bee57b", title: "Lachs mit Honig-Senf-Kruste" },
    { id: "08fceedb-8a31-4e63-a497-ed62ba468104", title: "Krabben-Rührei" },
    { id: "c20d7639-1176-49b7-a2c9-4a369edee113", title: "Thai Gebratener Reis" },
  ],
  "was-koche-ich-heute-abend-ideen-fuer-die-woche": [
    { id: "494fa93f-f9a3-4fe6-abdc-322d04eb6029", title: "Schnitzel mit Champignons und Pommes" },
    { id: "cd9753d7-d3ef-4fe3-8a4b-313d77f0baea", title: "Rahmgeschnetzeltes mit Estragon" },
    { id: "6ce86488-87b2-4d4d-a749-d0b093ecfacd", title: "Bratkartoffeln mit Speck und Zwiebeln" },
    { id: "393a0c31-0d84-4db2-ba55-bd3626ac88b3", title: "Cremiges Butter Chicken" },
  ],
  "proteinreiche-mahlzeiten-muskelaufbau": [
    { id: "2f9180cd-6ee6-4712-b7ff-10af86ec207d", title: "Hähnchenbrust Jägerart" },
    { id: "fa22edc9-62ad-473b-92dc-7ccfbe5c0fd6", title: "Putenschnitzel paniert" },
    { id: "155767f0-daee-47c5-ab21-f1eb7bceecba", title: "Teriyaki-Lachs-Bowl" },
    { id: "fbbdce82-6705-42db-8741-b2c33a2e72c8", title: "Caesar Salad mit gebratenem Hähnchen" },
  ],
  "vegetarische-abendessen-ideen": [
    { id: "c5044b2f-e879-484a-bda7-4fc4cdb02225", title: "Käsespätzle" },
    { id: "593a28ae-c9c5-4c16-a127-887ad9b56d52", title: "Backkartoffel mit Kräuterquark" },
    { id: "93b5d3a3-f6b2-4f83-8235-89207896475c", title: "Spinatknödel" },
    { id: "300d7a6f-0153-458b-ac5e-b3d0d48c5834", title: "Shakshuka mit Paprika und Tomate" },
  ],
  "mediterrane-diaet-rezepte-anfaenger": [
    { id: "ec4c352a-fc9d-48d7-b799-f63e8fe987ec", title: "Griechischer Bauernsalat (Horiatiki)" },
    { id: "fbd6f365-e549-4431-a7e7-6680bbe8204d", title: "Ratatouille nach provenzalischer Art" },
    { id: "d37191fb-c4ca-4209-9547-9d0b8ec845db", title: "Hähnchen-Souvlaki mit Tzatziki" },
    { id: "25362207-cbf5-42a2-97a4-b21064497aa2", title: "Andalusische Gazpacho" },
  ],
  "guenstige-mahlzeiten-unter-5-euro": [
    { id: "a36b3585-f624-4472-b30a-0123cd5974f2", title: "Spitzkohl-Eintopf" },
    { id: "0b091f9b-ba7f-44af-ac6f-030144001398", title: "Linseneintopf nach Omas Art" },
    { id: "8dc6ab54-f2f1-4e38-9849-36478faea866", title: "Pellkartoffeln mit Kräuterquark" },
    { id: "c1cb77e4-c6f2-48c6-ab2d-a862889ae768", title: "Senfeier mit Kartoffeln" },
  ],
  "meal-prep-fuer-anfaenger": [
    { id: "8e62c5a9-9c2b-4c59-870c-7c0aa78fef11", title: "Spaghetti Bolognese" },
    { id: "acab26d2-fafd-42c2-a126-fcf1a1880888", title: "Burrito Bowl mit Hack" },
    { id: "6658746b-632f-4c51-aedd-b60b1ee6d862", title: "Overnight Oats mit Beeren" },
    { id: "f3401945-e868-4144-aeef-b435a21a6109", title: "Italienische Minestrone mit weißen Bohnen" },
  ],
  "schnelle-abendessen-rezepte-was-wirklich-funktioniert": [
    { id: "eb401d7b-2542-4ba8-b203-18a3697c6451", title: "Klassische Spaghetti Carbonara" },
    { id: "e895d9e8-96d9-4981-b19c-933e203a2d67", title: "Hähnchen-Fajita-Pfanne" },
    { id: "d07786fb-0659-49a4-858e-b8a9c54c4ecd", title: "Zitronen-Zucchini-Pasta mit Parmesan" },
    { id: "a8a230c7-f1fb-4707-8492-89becebaf0bb", title: "Gebratene Muscheln" },
  ],
  "einkaufsliste-fuer-die-woche-erstellen": [
    { id: "f2d755f2-4747-4db0-8fa6-4511bc92fe4a", title: "Lasagne" },
    { id: "aa101fe5-46f7-4c28-b94f-7926cb0da683", title: "Hühnersuppe" },
    { id: "18b6d0d6-f629-4b9a-85cd-6acfef409799", title: "Paniertes Schweineschnitzel" },
    { id: "8216a7a8-2581-4538-ab9a-343f2092fc33", title: "Kartoffel-Gemüse-Auflauf" },
  ],
  "guenstig-einkaufen-mit-wochenplan": [
    { id: "daaee5b2-75bd-47ef-b9bb-68cd0d8d6404", title: "Bauernfrühstück mit Räucherspeck" },
    { id: "b2a8ec20-5d73-4804-bbf4-5c327e0ddcf4", title: "Möhren-Untereinander mit Mettwurst" },
    { id: "34e1ee90-d123-4e8a-83ec-e8ef6fff7df0", title: "Blumenkohl mit Semmelbröseln" },
    { id: "87509a30-0bbb-49c7-8f5f-2f881019d70b", title: "Krautspätzle" },
  ],
  "familien-essensplan-wochenplanung": [
    { id: "6e4aff46-7c71-4af8-a21d-15ad55720e04", title: "Minifrikadellen" },
    { id: "ccb8230f-11db-46ff-9818-dec0d8c20227", title: "Spaghetti Bolognese" },
    { id: "276d5e08-cd69-41f4-af5e-7e6aa1c1f6e2", title: "Fischstäbchen selbst gemacht" },
    { id: "8216a7a8-2581-4538-ab9a-343f2092fc33", title: "Kartoffel-Gemüse-Auflauf" },
  ],
  "proteinreiches-fruehstueck": [
    { id: "08fceedb-8a31-4e63-a497-ed62ba468104", title: "Krabben-Rührei" },
    { id: "53c97554-0def-439c-99f2-affd4113390d", title: "Garnelenomlett vom Pekinger Nachtmarkt" },
    { id: "0e5e0c73-dc2e-4390-b589-f37d57f01190", title: "Fluffiges Kräuter-Omelett" },
    { id: "6658746b-632f-4c51-aedd-b60b1ee6d862", title: "Overnight Oats mit Beeren" },
  ],
  "sommer-meal-prep": [
    { id: "289f701d-ee51-4a57-a7d8-7a05ee96b56d", title: "Caprese-Nudelsalat mit Kirschtomaten und Mozzarella" },
    { id: "7c608159-5758-4ca3-89ff-d8b7ff32ad86", title: "Quinoa-Avocado-Salat mit Limetten-Dressing" },
    { id: "f93c6523-e106-4588-aba4-43cd4cb39da0", title: "Orientalischer Couscous-Salat mit Granatapfel" },
    { id: "d8d3b243-7024-40b1-8069-925b6c20736b", title: "Rote-Bete-Salat mit Belugalinsen" },
  ],
  "schnelle-grillbeilagen": [
    { id: "2c6735c4-39e5-4f43-9613-0f57539edd64", title: "Coleslaw" },
    { id: "d26b11d9-1c38-4a18-814a-ea78453a8262", title: "Gurkensalat" },
    { id: "bc2e8aed-5f0d-4499-9cf3-ba5855db3a32", title: "Zaziki" },
    { id: "2d6ac00d-8eeb-4585-b7d8-7549211b7c53", title: "Gegrillte gelbe Zucchini" },
  ],
  "rezepte-fuer-studenten": [
    { id: "91fe821a-b3c8-4d5c-94d5-ed05a816f83d", title: "Penne all'Arrabbiata" },
    { id: "c20d7639-1176-49b7-a2c9-4a369edee113", title: "Thai Gebratener Reis" },
    { id: "6ce86488-87b2-4d4d-a749-d0b093ecfacd", title: "Bratkartoffeln mit Speck und Zwiebeln" },
    { id: "c1cb77e4-c6f2-48c6-ab2d-a862889ae768", title: "Senfeier mit Kartoffeln" },
  ],
  "was-koche-ich-am-wochenende": [
    { id: "1da0124f-5f50-4423-844a-ca15ece25e2e", title: "Rinderrouladen" },
    { id: "e146b5f7-e62e-45d5-a534-425dc1be2498", title: "Rheinischer Sauerbraten" },
    { id: "9511a0d0-4c2d-457d-8642-c63833ada147", title: "Gulasch mit Waldpilzen und Sauerkraut" },
    { id: "35e2a480-5c2a-4f25-b46b-a5def6d8f50e", title: "Französische Zwiebelsuppe" },
  ],
  "vorratshaltung-speisekammer": [
    { id: "b8f170eb-aa9d-4bbb-acbe-d59423b3d91e", title: "Tomaten Sauce" },
    { id: "0b091f9b-ba7f-44af-ac6f-030144001398", title: "Linseneintopf nach Omas Art" },
    { id: "c3bac94f-d05e-40cf-83a8-5ae24441b032", title: "Orientalischer Kichererbsen-Eintopf mit Aprikosen" },
    { id: "ece4cabf-8b27-4fc9-856a-9ba1eac6b9c4", title: "Selbstgemachtes Knusper-Granola" },
  ],
  "meal-prep-zum-abnehmen": [
    { id: "bd491995-f948-40e0-a945-3e68b8df29a1", title: "Rauchiges Chili sin Carne" },
    { id: "668fb37c-d62d-4fd5-83d2-67da76a78a3e", title: "Grünkohl-Kartoffel-Eintopf" },
    { id: "ae50088f-14a7-4452-a761-b74ed0bee57b", title: "Lachs mit Honig-Senf-Kruste" },
    { id: "d8d3b243-7024-40b1-8069-925b6c20736b", title: "Rote-Bete-Salat mit Belugalinsen" },
  ],
  "proteinreiche-vegetarische-gerichte": [
    { id: "f8e25ebc-f2c3-4e72-ad3b-c2b44539ffc4", title: "Linsen-Bolognese mit Spaghetti" },
    { id: "eda61758-8847-432b-b2ba-5700c9eb6ade", title: "Frühlings-Frittata mit grünem Spargel und Ziegenkäse" },
    { id: "99ae5a4e-14c6-48ae-a418-2b2e732072ed", title: "Gemüse-Enchiladas" },
    { id: "cccd5ccf-1bd8-4347-99c6-f0f4f6c7084c", title: "Falafel-Bowl mit Tahini-Dressing" },
  ],
  "einfache-sommer-abendessen-ideen": [
    { id: "ea4f5370-5c9b-450f-acf0-e41b7cff6274", title: "One-Pot-Sommerpasta mit Zucchini und Kirschtomaten" },
    { id: "5df1dc0b-6dab-4453-9839-63bf0f80d73c", title: "Gegrillter Halloumi-Salat mit Honig-Zitronen-Dressing" },
    { id: "e66e749f-e9f6-40dc-81e9-8ecce0907b0a", title: "Gefüllte Zucchini mit Hackfleisch" },
    { id: "f162e228-94d9-4fe7-972a-a949ed0a7fc5", title: "Tomaten Gurken Salat" },
  ],
  "guenstige-gesunde-mahlzeiten": [
    { id: "4e307c32-cab4-4b2f-8edb-4e2cc701f8d7", title: "Klassischer Gemüseeintopf" },
    { id: "619fc52d-1c9e-411d-bb7a-7fc17e6eb084", title: "Kichererbsen-Spinat-Curry" },
    { id: "8dc6ab54-f2f1-4e38-9849-36478faea866", title: "Pellkartoffeln mit Kräuterquark" },
    { id: "b17812d5-999a-4a5d-9265-2fd964bb5142", title: "Rahmspinat mit Spiegelei und Salzkartoffeln" },
  ],
  "5-zutaten-abendessen": [
    { id: "72b33106-1422-4afc-9fb8-ba32e5395014", title: "Hähnchenteile aus dem Backofen" },
    { id: "4bbb44cc-b941-4f74-b12c-04420894215a", title: "Flanksteak" },
    { id: "eb401d7b-2542-4ba8-b203-18a3697c6451", title: "Klassische Spaghetti Carbonara" },
    { id: "593a28ae-c9c5-4c16-a127-887ad9b56d52", title: "Backkartoffel mit Kräuterquark" },
  ],
};

const PICKS_EN: Record<string, Pick[]> = {
  "knife-skills-how-to-cut-like-a-chef": [
    { id: "13e415de-aba9-41c6-838e-10fa7cd5648c", title: "Provençal-Style Ratatouille" },
    { id: "2033bc65-e24f-4688-928e-de7753f680cf", title: "Italian Minestrone with White Beans" },
    { id: "1d137c6f-cf96-4465-aa14-b79cb7632cb0", title: "Tabbouleh — Levantine Parsley Salad" },
    { id: "ee94fcbf-b44c-4557-a51d-4dae3d4f47b3", title: "Classic Vegetable Stew" },
  ],
  "steak-doneness-temperatures-guide": [
    { id: "8a9d2747-1ad6-4f5a-bd86-b92f68e2ebe0", title: "Schwäbischer Zwiebelrostbraten (Swabian steak with fried onions)" },
    { id: "fd3c5f07-8d03-4cfb-b26f-cd06bbc21120", title: "Duck Breast Cooked Pink" },
    { id: "877eed88-40b9-42d5-9dc9-21008939e97a", title: "Roe venison medallions with chanterelles" },
    { id: "73f3c263-67de-4e19-a0be-04f708e2230a", title: "Venison Medallions with Juniper Cream Sauce" },
  ],
  "kitchen-knives-sharpening-cutting-boards-guide": [
    { id: "13e415de-aba9-41c6-838e-10fa7cd5648c", title: "Provençal-Style Ratatouille" },
    { id: "8c3c761d-7fce-437a-b0f5-a6a41feb46fc", title: "Rinderrouladen (German beef roulades)" },
    { id: "cf69e38c-bce6-4e0e-ad6b-a8a6edbaa5df", title: "Salade Niçoise with Mustard Vinaigrette" },
    { id: "1d137c6f-cf96-4465-aa14-b79cb7632cb0", title: "Tabbouleh — Levantine Parsley Salad" },
  ],
  "how-to-meal-prep-for-the-week": [
    { id: "61effdec-bf2a-409c-9af9-d2b0b308014a", title: "Grandma-Style Lentil Stew" },
    { id: "40221a1a-741c-4d13-9d42-826cf1f49f82", title: "Classic Beef Goulash" },
    { id: "326980c3-42a2-400b-9ade-55ace46dc55d", title: "Smoky Chili sin Carne" },
    { id: "4c8602ba-b208-4f55-aa1b-00be73ce5d01", title: "Classic Beef Lasagna" },
  ],
  "best-free-meal-planner-apps-2026": [
    { id: "0034e843-466d-4c54-bb32-59e06511fd2e", title: "Spaghetti Bolognese" },
    { id: "1845a436-c22f-4391-a3b6-b0951a49c727", title: "Chicken Coconut Curry" },
    { id: "2ec78399-179a-4524-a7af-d02f5010acf3", title: "Breaded pork schnitzel" },
    { id: "13f4a6f7-e190-4e28-a713-975bb2a080d5", title: "Cheese Spaetzle" },
  ],
  "weekly-meal-plan-with-shopping-list": [
    { id: "36803e3f-cbdd-4851-8875-4565c6063724", title: "Classic Spaghetti Carbonara" },
    { id: "d1fc1775-f96b-472c-84dd-199df005982b", title: "Chicken Fajita Skillet" },
    { id: "65b1f2c0-d5d1-46f5-9321-d4e70342609d", title: "Eggs in mustard sauce with potatoes" },
    { id: "39eaf4f8-5985-4745-a597-25898954edd1", title: "Salmon with Honey Mustard Crust" },
  ],
  "easy-dinner-ideas-for-busy-weeknights": [
    { id: "39eaf4f8-5985-4745-a597-25898954edd1", title: "Salmon with Honey Mustard Crust" },
    { id: "27168c23-03af-42ba-9891-a9f77197b790", title: "Krabben-Rührei (scrambled eggs with North Sea shrimp)" },
    { id: "757852e8-661b-4e2d-b654-79a78c32f111", title: "Thai Fried Rice" },
    { id: "0989d36e-0fbb-4786-aef5-f0ff040c2e74", title: "Chickpea Spinach Curry" },
  ],
  "what-should-i-cook-tonight": [
    { id: "d6d506e6-7a1a-4df6-9db7-e7496f0704d0", title: "Fried Potatoes with Bacon and Onions" },
    { id: "f467af2c-551f-4ed1-949b-ef80c950170b", title: "Creamy Butter Chicken" },
    { id: "647b41e9-2f1a-44f1-965a-fa86ddd7aab3", title: "One-Pot Summer Pasta with Zucchini and Cherry Tomatoes" },
    { id: "9c0db8d1-cee1-4d5b-97b8-2eedd59e9752", title: "Schnitzel Holstein" },
  ],
  "high-protein-meals-for-muscle-building": [
    { id: "3434d7b3-54ed-4d2b-b4fe-1f7cd834ea08", title: "Chicken Breast Jägerart (hunter-style, in mushroom cream sauce)" },
    { id: "8f27c2a6-02c5-41b8-b73a-58028a3fa0c9", title: "Breaded turkey escalopes" },
    { id: "510fdc31-69de-440c-b3eb-6f153cecdb6a", title: "Teriyaki Salmon Bowl" },
    { id: "59c68976-6918-484f-99ac-126fd1323fd5", title: "Chicken Caesar Salad" },
  ],
  "vegetarian-dinner-ideas-easy-recipes": [
    { id: "13f4a6f7-e190-4e28-a713-975bb2a080d5", title: "Cheese Spaetzle" },
    { id: "d8370731-450a-42d4-9a59-bde7f7a869f2", title: "Spinatknödel (Bavarian Spinach Dumplings)" },
    { id: "c797488e-14ec-4ae3-bfa1-029af53ab794", title: "Shakshuka with Bell Pepper and Tomato" },
    { id: "f2ab1333-22cb-402c-a430-674da7c0c9e1", title: "Crispy Celeriac Schnitzel" },
  ],
  "mediterranean-diet-recipes-beginners": [
    { id: "93ca1d66-c9c9-4bfd-9219-eb32fdcea073", title: "Greek Village Salad (Horiatiki)" },
    { id: "13e415de-aba9-41c6-838e-10fa7cd5648c", title: "Provençal-Style Ratatouille" },
    { id: "9c20efff-a3d9-4f2c-b442-296309030cdf", title: "Chicken Souvlaki with Tzatziki" },
    { id: "ca59a99c-3df9-49ca-8717-a5e9e5462d37", title: "Andalusian Gazpacho" },
  ],
  "budget-meals-under-5-euros": [
    { id: "61effdec-bf2a-409c-9af9-d2b0b308014a", title: "Grandma-Style Lentil Stew" },
    { id: "4c1d16ba-f460-4c8e-8208-6a4af96c981d", title: "Pellkartoffeln mit Kräuterquark (potatoes in their skins with herb quark)" },
    { id: "65b1f2c0-d5d1-46f5-9321-d4e70342609d", title: "Eggs in mustard sauce with potatoes" },
    { id: "49b85846-43b8-4615-9e63-3dfb0f563995", title: "Rheinischer Möhreneintopf (Rhineland carrot and potato stew)" },
  ],
  "meal-prep-for-beginners": [
    { id: "0034e843-466d-4c54-bb32-59e06511fd2e", title: "Spaghetti Bolognese" },
    { id: "fae754a2-ccc4-4aed-aefd-103da431aa4c", title: "Beef Burrito Bowl" },
    { id: "fc5521f9-dc36-4e1f-833c-775fbb5fc25f", title: "Overnight Oats with Berries" },
    { id: "2033bc65-e24f-4688-928e-de7753f680cf", title: "Italian Minestrone with White Beans" },
  ],
  "quick-dinner-recipes-under-30-minutes": [
    { id: "36803e3f-cbdd-4851-8875-4565c6063724", title: "Classic Spaghetti Carbonara" },
    { id: "d1fc1775-f96b-472c-84dd-199df005982b", title: "Chicken Fajita Skillet" },
    { id: "a3cb70ce-67ec-4311-be57-7a29ac2db896", title: "Lemon Zucchini Pasta with Parmesan" },
    { id: "9d3b2b35-fa66-43cb-920c-6e2167484117", title: "Baja Fish Tacos with Lime Slaw" },
  ],
  "weekly-grocery-list-from-meal-plan": [
    { id: "4c8602ba-b208-4f55-aa1b-00be73ce5d01", title: "Classic Beef Lasagna" },
    { id: "2ec78399-179a-4524-a7af-d02f5010acf3", title: "Breaded pork schnitzel" },
    { id: "4f975669-100e-4b95-bc27-544d83f8817e", title: "Potato and Vegetable Bake" },
    { id: "3fadc47b-8072-4c9e-bf68-18c81d1556f9", title: "Penne all'Arrabbiata" },
  ],
  "meal-planning-on-a-budget": [
    { id: "532d9fe2-ae95-4978-8660-9f61f55ac6e4", title: "German Farmer's Breakfast with Smoked Bacon" },
    { id: "638070c2-bd91-464b-943c-8db787b1e0da", title: "Möhren-Untereinander (Carrot and Potato Mash) with Mettwurst" },
    { id: "9584b1d3-96a5-4a26-aafa-5b3d96da5af7", title: "Cauliflower with Buttered Breadcrumbs" },
    { id: "cd5cadbd-bd39-4319-aa4e-b99d1962e4c0", title: "Krautspätzle (Spätzle with braised cabbage)" },
  ],
  "family-meal-planning": [
    { id: "eee49ed0-bf04-47b2-b92d-c14e1312e60d", title: "Homemade Fish Fingers" },
    { id: "4f975669-100e-4b95-bc27-544d83f8817e", title: "Potato and Vegetable Bake" },
    { id: "f3050f99-7b04-431c-980b-edf0eaf1957b", title: "Ham and Pasta Bake" },
    { id: "0034e843-466d-4c54-bb32-59e06511fd2e", title: "Spaghetti Bolognese" },
  ],
  "high-protein-breakfast": [
    { id: "27168c23-03af-42ba-9891-a9f77197b790", title: "Krabben-Rührei (scrambled eggs with North Sea shrimp)" },
    { id: "06dd1db8-da7f-42f1-9f7a-244c48e1b29d", title: "Fluffy Herb Omelette" },
    { id: "fc5521f9-dc36-4e1f-833c-775fbb5fc25f", title: "Overnight Oats with Berries" },
    { id: "c797488e-14ec-4ae3-bfa1-029af53ab794", title: "Shakshuka with Bell Pepper and Tomato" },
  ],
  "summer-meal-prep": [
    { id: "6a65143f-c7d3-4c50-a73a-312f74de50e7", title: "Caprese Pasta Salad with Cherry Tomatoes and Mozzarella" },
    { id: "d55d0094-c77e-4bfa-89fa-230516f94ca8", title: "Quinoa Avocado Salad with Lime Dressing" },
    { id: "854dc4ae-e143-4c58-a137-2807689591fc", title: "Moroccan Couscous Salad with Pomegranate" },
    { id: "2ec773ce-7f88-4eb5-8703-0898dbfcedac", title: "Beetroot Salad with Beluga Lentils" },
  ],
  "easy-bbq-side-dishes": [
    { id: "4a25b74a-5e1a-4368-a45f-413df03b7af1", title: "Charred Corn and Avocado Salad with Lime" },
    { id: "b6d8aa55-6600-4644-83e4-125ff00ab360", title: "Apple Coleslaw" },
    { id: "3025474f-92d6-4afb-9a08-e25570ba00eb", title: "Grilled Halloumi Salad with Honey-Lemon Dressing" },
    { id: "d66b0037-1ad9-43b5-8b02-24565bbd454e", title: "Marinated Veggie Skewers with Herb-Garlic Marinade" },
  ],
  "easy-student-recipes": [
    { id: "3fadc47b-8072-4c9e-bf68-18c81d1556f9", title: "Penne all'Arrabbiata" },
    { id: "757852e8-661b-4e2d-b654-79a78c32f111", title: "Thai Fried Rice" },
    { id: "d6d506e6-7a1a-4df6-9db7-e7496f0704d0", title: "Fried Potatoes with Bacon and Onions" },
    { id: "65b1f2c0-d5d1-46f5-9321-d4e70342609d", title: "Eggs in mustard sauce with potatoes" },
  ],
  "what-to-cook-on-the-weekend": [
    { id: "8c3c761d-7fce-437a-b0f5-a6a41feb46fc", title: "Rinderrouladen (German beef roulades)" },
    { id: "a9d231b8-1d61-471e-b1a7-e0d76889d8bf", title: "Rheinischer Sauerbraten (Rhineland marinated pot roast)" },
    { id: "40221a1a-741c-4d13-9d42-826cf1f49f82", title: "Classic Beef Goulash" },
    { id: "bfae89c2-fca9-4ac6-98a3-f5efacaa140e", title: "Braised beef pot roast" },
  ],
  "how-to-stock-a-pantry": [
    { id: "61effdec-bf2a-409c-9af9-d2b0b308014a", title: "Grandma-Style Lentil Stew" },
    { id: "f27850ad-71c0-4549-b970-24cdf9d0044f", title: "Moroccan-Style Chickpea Stew with Apricots" },
    { id: "c7709c4d-0d08-46e3-87e4-0855fa3951f0", title: "Crunchy Homemade Granola" },
    { id: "3fadc47b-8072-4c9e-bf68-18c81d1556f9", title: "Penne all'Arrabbiata" },
  ],
  "meal-prep-for-weight-loss": [
    { id: "326980c3-42a2-400b-9ade-55ace46dc55d", title: "Smoky Chili sin Carne" },
    { id: "ff4e4313-bcc3-4557-9251-0907f360c353", title: "Kale and Potato Stew" },
    { id: "39eaf4f8-5985-4745-a597-25898954edd1", title: "Salmon with Honey Mustard Crust" },
    { id: "2ec773ce-7f88-4eb5-8703-0898dbfcedac", title: "Beetroot Salad with Beluga Lentils" },
  ],
  "high-protein-vegetarian-meals": [
    { id: "e7565a12-b2a1-4fc4-a0a4-c58537740a5a", title: "Lentil Bolognese with Spaghetti" },
    { id: "73540573-1cb7-49d2-bf64-52c8298f4f17", title: "Spring Frittata with Green Asparagus and Goat Cheese" },
    { id: "4a01dd4c-9dd6-42a0-bc79-5f302b4d0dbd", title: "Veggie Enchiladas" },
    { id: "29eebbc7-d722-4e44-9dd1-a8bc906f771c", title: "Falafel Bowl with Tahini Dressing" },
  ],
  "easy-summer-dinner-ideas": [
    { id: "647b41e9-2f1a-44f1-965a-fa86ddd7aab3", title: "One-Pot Summer Pasta with Zucchini and Cherry Tomatoes" },
    { id: "3025474f-92d6-4afb-9a08-e25570ba00eb", title: "Grilled Halloumi Salad with Honey-Lemon Dressing" },
    { id: "711e607c-2f01-4153-b2be-c054b942e745", title: "Stuffed Zucchini with Ground Beef" },
    { id: "68393f9e-7247-478f-90c2-3c40d9056943", title: "Watermelon Feta Salad with Mint and Lime" },
  ],
  "cheap-healthy-meals": [
    { id: "ee94fcbf-b44c-4557-a51d-4dae3d4f47b3", title: "Classic Vegetable Stew" },
    { id: "0989d36e-0fbb-4786-aef5-f0ff040c2e74", title: "Chickpea Spinach Curry" },
    { id: "4c1d16ba-f460-4c8e-8208-6a4af96c981d", title: "Pellkartoffeln mit Kräuterquark (potatoes in their skins with herb quark)" },
    { id: "b8ac465b-10b6-4df1-89b2-053d87b33b39", title: "Creamed spinach with fried egg and boiled potatoes" },
  ],
  "5-ingredient-dinners": [
    { id: "36803e3f-cbdd-4851-8875-4565c6063724", title: "Classic Spaghetti Carbonara" },
    { id: "39eaf4f8-5985-4745-a597-25898954edd1", title: "Salmon with Honey Mustard Crust" },
    { id: "630e679f-49ce-480e-b82f-17cafd0338bd", title: "Pasta with Fresh Basil Pesto" },
    { id: "d6d506e6-7a1a-4df6-9db7-e7496f0704d0", title: "Fried Potatoes with Bacon and Onions" },
  ],
};

export type BlogRecipe = {
  id: string;
  title: string;
  image: string | null;
  imagePosition: string | null;
  /** Vorbereiten und Garen zusammen, in Minuten. */
  minutes: number | null;
  family: boolean;
};

type Row = {
  id: string;
  user_id: string | null;
  title: string;
  image_url: string | null;
  image_position: string | null;
  prep_time: number | null;
  cook_time: number | null;
};

/** Rezepte zu einem Ratgeber, in der Reihenfolge dieser Datei. Rezepte, die nicht mehr öffentlich sind, fallen heraus. */
export async function loadBlogRecipes(locale: string, slug: string): Promise<BlogRecipe[]> {
  const picks = (locale === "de" ? PICKS_DE : PICKS_EN)[slug] ?? [];
  if (!picks.length) return [];
  // Ohne Datenbank bleiben die Links stehen, nur ohne Bild und Zeit.
  const fallback: BlogRecipe[] = picks.map((p) => ({ ...p, image: null, imagePosition: null, minutes: null, family: false }));
  try {
    const { data, error } = await createAdminClient()
      .from("user_recipes")
      .select("id, user_id, title, image_url, image_position, prep_time, cook_time")
      .eq("is_public", true)
      .in("id", picks.map((p) => p.id));
    if (error || !data) return fallback;
    const rows = new Map((data as Row[]).map((r) => [r.id, r]));
    return picks.flatMap((p) => {
      const r = rows.get(p.id);
      if (!r) return [];
      const minutes = (r.prep_time ?? 0) + (r.cook_time ?? 0);
      return [
        {
          id: r.id,
          title: r.title,
          image: optimizedImageUrl(httpUrl(r.image_url), 640),
          imagePosition: r.image_position,
          minutes: minutes > 0 ? minutes : null,
          family: isFamilyRecipe(r.user_id),
        },
      ];
    });
  } catch {
    return fallback;
  }
}

/** Zeitangabe für die Karte: "45 Min.", "2 Std. 20 Min.", "4 Tage" (Beizen, Einlegen). */
export function recipeDuration(minutes: number, locale: string): string {
  const de = locale === "de";
  if (minutes >= 2880) {
    const days = Math.round(minutes / 1440);
    return de ? `${days} Tage` : `${days} days`;
  }
  if (minutes < 60) return de ? `${minutes} Min.` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (de) return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
