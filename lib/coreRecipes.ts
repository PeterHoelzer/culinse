/*
  Kernrezepte: die Rezepte, die Suchmaschinen sehen (Entscheidung Peter, 27.11.2026).

  Für Besucher gibt es weiter alle Rezepte. Für Suchmaschinen zählt vorerst nur
  ein Kern. Grund: Google hat von über 8.800 eingereichten Rezeptseiten rund 100
  aufgenommen, alle aus Juni und Juli 2026, und AdSense hat die Website am
  20.11.2026 wegen „Minderwertige Inhalte“ abgelehnt. Suchmaschinen sollen die
  Website an ihren besten Rezepten messen, nicht an der Menge.

  Zum Kern gehören:
  - alle Familienrezepte (selbst gekocht; Konto der Familie, lib/culinse.ts).
    Sie stehen nicht in der Liste unten, neue kommen von selbst dazu.
  - die Gerichte der Liste unten, je mit ihrer deutschen und englischen Fassung.

  An dieser Datei hängen:
  - das robots-Feld der Rezeptseite (app/[locale]/recipe/[id]/page.tsx): alle
    anderen Rezepte tragen "noindex, follow". robots.txt sperrt sie bewusst
    nicht, sonst könnte Google das "noindex" nicht lesen.
  - die Rezept-Sitemaps (app/recipe-sitemap/sitemap.ts): nur Kernrezepte.

  Gericht aufnehmen: Zeile mit der deutschen und der englischen ID ergänzen
  (die ID steht in der Adresse hinter "user_") und ausliefern.
  Alles zurückholen: CORE_ONLY auf false setzen und ausliefern.
*/
export const CORE_ONLY = true;

/** Je Gericht: ID der deutschen Fassung, ID der englischen Fassung. */
const CORE_DISHES: readonly (readonly [de: string, en: string])[] = [
  // Schon bei Google bekannt (80)
  ["25362207-cbf5-42a2-97a4-b21064497aa2", "ca59a99c-3df9-49ca-8717-a5e9e5462d37"], // Andalusische Gazpacho
  ["6b13389a-9421-4a85-ae5a-c97d40f43c6b", "b6d8aa55-6600-4644-83e4-125ff00ab360"], // Apfel-Krautsalat
  ["fb6c51da-2a2e-49e5-a301-b7bff050342b", "5073d61d-28ac-40cf-ae37-4fe685740de2"], // Arme Ritter
  ["7ad40323-0b85-41ff-96fb-ebb26bf11cb6", "b33df132-9b41-4734-a72a-92949e4fdd17"], // Beeren-Crumble mit Butterstreuseln
  ["d2b9bc29-a896-44ff-abe6-58919ed82851", "6113f0f9-cd1e-486e-80a4-32b6f6e2a32a"], // Blumenkohl-Kokos-Suppe
  ["3b8a7ab1-04e7-4bbf-9646-aed57e665f87", "b394dd82-0efe-44cd-bebd-228e2e763dee"], // Bratapfel mit Mandeln
  ["6ce86488-87b2-4d4d-a749-d0b093ecfacd", "d6d506e6-7a1a-4df6-9db7-e7496f0704d0"], // Bratkartoffeln mit Speck und Zwiebeln
  ["30f1d808-554f-4c0e-a2ab-a0e8af33d2a9", "88bc604e-0653-4b34-af08-db3076d664a8"], // Brokkoli-Cheddar-Suppe
  ["37420681-2bc0-45c3-8c87-f8f33f5e8ae3", "c0d278a8-ae6d-42c5-b96a-8c4dbcc864e9"], // Brokkoli-Mandel-Pasta
  ["acab26d2-fafd-42c2-a126-fcf1a1880888", "fae754a2-ccc4-4aed-aefd-103da431aa4c"], // Burrito Bowl mit Hack
  ["fbbdce82-6705-42db-8741-b2c33a2e72c8", "59c68976-6918-484f-99ac-126fd1323fd5"], // Caesar Salad mit gebratenem Hähnchen
  ["289f701d-ee51-4a57-a7d8-7a05ee96b56d", "6a65143f-c7d3-4c50-a73a-312f74de50e7"], // Caprese-Nudelsalat mit Kirschtomaten und Mozzarella
  ["90ddf41e-7c03-4e04-9803-96b85bb761db", "843eeb0e-63f6-40ce-89c8-dd8fe7246e0f"], // Chia-Pudding mit Mango
  ["393a0c31-0d84-4db2-ba55-bd3626ac88b3", "f467af2c-551f-4ed1-949b-ef80c950170b"], // Cremiges Butter Chicken
  ["51319099-e7f8-4f8b-9d1e-1b9d9c69083f", "4b8c41e5-e6cd-404a-a0da-49a5439c1321"], // Elsässer Flammkuchen
  ["b2ae3403-ff13-49ac-99e0-4ddbe9adb7c8", "c4dda3ad-6cf9-4fa4-aed3-6dace3b054d6"], // Erbsen-Minz-Suppe
  ["64200638-0772-4948-98e2-3ee1475532d4", "1bbcc157-6f65-4003-adaf-8cf98859c50e"], // Erdbeer-Spinat-Salat mit gerösteten Kernen
  ["cccd5ccf-1bd8-4347-99c6-f0f4f6c7084c", "29eebbc7-d722-4e44-9dd1-a8bc906f771c"], // Falafel-Bowl mit Tahini-Dressing
  ["7f63e463-01d2-4584-b3ff-b78d5ab10e8b", "f0ab81c2-6b3a-4b19-8803-ea1b9ce5d240"], // Feldsalat mit Birne und Walnuss
  ["943c8a4a-7c44-4d66-a508-bd8549ef5710", "9d3b2b35-fa66-43cb-920c-6e2167484117"], // Fisch-Tacos mit Limetten-Slaw
  ["0e5e0c73-dc2e-4390-b589-f37d57f01190", "06dd1db8-da7f-42f1-9f7a-244c48e1b29d"], // Fluffiges Kräuter-Omelett
  ["eda61758-8847-432b-b2ba-5700c9eb6ade", "73540573-1cb7-49d2-bf64-52c8298f4f17"], // Frühlings-Frittata mit grünem Spargel und Ziegenkäse
  ["e66e749f-e9f6-40dc-81e9-8ecce0907b0a", "711e607c-2f01-4153-b2be-c054b942e745"], // Gefüllte Zucchini mit Hackfleisch
  ["5df1dc0b-6dab-4453-9839-63bf0f80d73c", "3025474f-92d6-4afb-9a08-e25570ba00eb"], // Gegrillter Halloumi-Salat mit Honig-Zitronen-Dressing
  ["d2899e19-a8d8-49a4-b76c-412b26112e32", "6c8a7560-1e53-4e49-90f7-df2f635a979b"], // Gelbes Gemüse-Curry mit Kokosmilch
  ["99ae5a4e-14c6-48ae-a418-2b2e732072ed", "4a01dd4c-9dd6-42a0-bc79-5f302b4d0dbd"], // Gemüse-Enchiladas
  ["e6435489-df68-4042-b5ef-ed4b79e0ee98", "4a25b74a-5e1a-4368-a45f-413df03b7af1"], // Gerösteter Mais-Avocado-Salat mit Limette
  ["127aa852-16f7-4ddd-9db3-ee4b53017c90", "8ad731e6-4ec6-437f-9c81-0faa2ce7381f"], // Gerösteter Rosenkohl mit Honig
  ["10860879-bf50-4d9c-a595-2074dfb95df6", "cce613ad-9219-4df5-802f-bd9bb6d02005"], // Griechische Moussaka
  ["ec4c352a-fc9d-48d7-b799-f63e8fe987ec", "93ca1d66-c9c9-4bfd-9219-eb32fdcea073"], // Griechischer Bauernsalat (Horiatiki)
  ["668fb37c-d62d-4fd5-83d2-67da76a78a3e", "ff4e4313-bcc3-4557-9251-0907f360c353"], // Grünkohl-Kartoffel-Eintopf
  ["e9b2c57e-0fa7-4311-95d4-a12a354faaf0", "3b8d0615-ab8e-4363-8733-47af9f478bb6"], // Hummus-Bowl mit Za'atar-Ofengemüse
  ["e895d9e8-96d9-4981-b19c-933e203a2d67", "d1fc1775-f96b-472c-84dd-199df005982b"], // Hähnchen-Fajita-Pfanne
  ["16d2a2cf-bc83-42aa-abdf-6d6498889501", "1845a436-c22f-4391-a3b6-b0951a49c727"], // Hähnchen-Kokos-Curry
  ["d37191fb-c4ca-4209-9547-9d0b8ec845db", "9c20efff-a3d9-4f2c-b442-296309030cdf"], // Hähnchen-Souvlaki mit Tzatziki
  ["f3401945-e868-4144-aeef-b435a21a6109", "2033bc65-e24f-4688-928e-de7753f680cf"], // Italienische Minestrone mit weißen Bohnen
  ["8e7d3f8e-caa3-4c32-acf0-6655a9982e72", "748cde6e-9865-444c-823b-7af4be61e343"], // Kabeljau in Senfsauce
  ["8216a7a8-2581-4538-ab9a-343f2092fc33", "4f975669-100e-4b95-bc27-544d83f8817e"], // Kartoffel-Gemüse-Auflauf
  ["619fc52d-1c9e-411d-bb7a-7fc17e6eb084", "0989d36e-0fbb-4786-aef5-f0ff040c2e74"], // Kichererbsen-Spinat-Curry
  ["9448f51c-f52b-4fd9-bf39-76aa5916de23", "4c8602ba-b208-4f55-aa1b-00be73ce5d01"], // Klassische Lasagne
  ["eb401d7b-2542-4ba8-b203-18a3697c6451", "36803e3f-cbdd-4851-8875-4565c6063724"], // Klassische Spaghetti Carbonara
  ["a625b6d1-505c-49f3-8e8b-427918a04b90", "17dca339-e47e-414a-9e0b-3bb3a8cee851"], // Klassischer Apfel-Rotkohl
  ["4c1ba409-d9ce-4c12-b978-ed9bba786f87", "6df25af5-e880-422e-bbe2-e7d6aa1666e0"], // Klassischer Beef Burger
  ["88ed51c2-7aea-4cc2-b6f7-2f55123677b2", "40221a1a-741c-4d13-9d42-826cf1f49f82"], // Klassisches Rindergulasch
  ["e77c2ec5-8bfd-4d91-9600-635ef80ca41a", "88ce9bf6-8489-4005-9aad-b324c1febde2"], // Knusprige Blumenkohl-Wings
  ["ae50088f-14a7-4452-a761-b74ed0bee57b", "39eaf4f8-5985-4745-a597-25898954edd1"], // Lachs mit Honig-Senf-Kruste
  ["f8e25ebc-f2c3-4e72-ad3b-c2b44539ffc4", "e7565a12-b2a1-4fc4-a0a4-c58537740a5a"], // Linsen-Bolognese mit Spaghetti
  ["0b091f9b-ba7f-44af-ac6f-030144001398", "61effdec-bf2a-409c-9af9-d2b0b308014a"], // Linseneintopf nach Omas Art
  ["880a6e48-4fd0-4a87-9d36-03f70aaae8fa", "d66b0037-1ad9-43b5-8b02-24565bbd454e"], // Marinierte Gemüse-Grillspieße mit Kräuter-Knoblauch-Marinade
  ["85a73f8d-9be7-456d-87c1-49b3990e55a2", "c983f695-c169-4dd1-b2ba-710dc2340630"], // Ofengemüse mit gebackenem Feta und Honig-Thymian
  ["ea4f5370-5c9b-450f-acf0-e41b7cff6274", "647b41e9-2f1a-44f1-965a-fa86ddd7aab3"], // One-Pot-Sommerpasta mit Zucchini und Kirschtomaten
  ["f93c6523-e106-4588-aba4-43cd4cb39da0", "854dc4ae-e143-4c58-a137-2807689591fc"], // Orientalischer Couscous-Salat mit Granatapfel
  ["c3bac94f-d05e-40cf-83a8-5ae24441b032", "f27850ad-71c0-4549-b970-24cdf9d0044f"], // Orientalischer Kichererbsen-Eintopf mit Aprikosen
  ["6658746b-632f-4c51-aedd-b60b1ee6d862", "fc5521f9-dc36-4e1f-833c-775fbb5fc25f"], // Overnight Oats mit Beeren
  ["0460cf3c-9ef7-4a85-bdb9-bd359fd1c0f1", "186f4317-3cec-46e4-a660-cc47223eb1b9"], // Panzanella — toskanischer Brotsalat
  ["bd1ddfe6-c60c-4122-a1c3-1ed3d4dab456", "630e679f-49ce-480e-b82f-17cafd0338bd"], // Pasta mit Pesto Genovese
  ["91fe821a-b3c8-4d5c-94d5-ed05a816f83d", "3fadc47b-8072-4c9e-bf68-18c81d1556f9"], // Penne all'Arrabbiata
  ["7c608159-5758-4ca3-89ff-d8b7ff32ad86", "d55d0094-c77e-4bfa-89fa-230516f94ca8"], // Quinoa-Avocado-Salat mit Limetten-Dressing
  ["fbd6f365-e549-4431-a7e7-6680bbe8204d", "13e415de-aba9-41c6-838e-10fa7cd5648c"], // Ratatouille nach provenzalischer Art
  ["bd491995-f948-40e0-a945-3e68b8df29a1", "326980c3-42a2-400b-9ade-55ace46dc55d"], // Rauchiges Chili sin Carne
  ["d8d3b243-7024-40b1-8069-925b6c20736b", "2ec773ce-7f88-4eb5-8703-0898dbfcedac"], // Rote-Bete-Salat mit Belugalinsen
  ["59ad1d5e-f9b5-4bee-9e0e-b4aea1fb8226", "50c51107-d527-44c8-98aa-5387777fcda3"], // Rustikale Tomaten-Galette
  ["1926c425-9183-41c9-888a-d2da4b041c35", "cf69e38c-bce6-4e0e-ad6b-a8a6edbaa5df"], // Salade Niçoise mit Senf-Vinaigrette
  ["154a871a-67af-4ba6-b654-db7f79365959", "f3050f99-7b04-431c-980b-edf0eaf1957b"], // Schinken-Nudel-Gratin
  ["ece4cabf-8b27-4fc9-856a-9ba1eac6b9c4", "c7709c4d-0d08-46e3-87e4-0855fa3951f0"], // Selbstgemachtes Knusper-Granola
  ["38e580a7-05e1-40b7-9b68-13c581349db3", "f2ab1333-22cb-402c-a430-674da7c0c9e1"], // Sellerieschnitzel
  ["300d7a6f-0153-458b-ac5e-b3d0d48c5834", "c797488e-14ec-4ae3-bfa1-029af53ab794"], // Shakshuka mit Paprika und Tomate
  ["13a339f2-5374-45ea-bc01-693ecd40dfa9", "f11dde0a-dfa7-48bc-8cd0-226f18e5bb7e"], // Shepherd's Pie
  ["8e62c5a9-9c2b-4c59-870c-7c0aa78fef11", "0034e843-466d-4c54-bb32-59e06511fd2e"], // Spaghetti Bolognese
  ["87088ded-7214-44a8-a073-fa7026355622", "5ecd7056-9744-44c6-b1b3-e146033f08cd"], // Spargel mit Sauce Hollandaise
  ["c5e8c079-7046-4b8b-a3ae-fdf28ac15864", "1d137c6f-cf96-4465-aa14-b79cb7632cb0"], // Taboulé — levantinischer Petersiliensalat
  ["155767f0-daee-47c5-ab21-f1eb7bceecba", "510fdc31-69de-440c-b3eb-6f153cecdb6a"], // Teriyaki-Lachs-Bowl
  ["c20d7639-1176-49b7-a2c9-4a369edee113", "757852e8-661b-4e2d-b654-79a78c32f111"], // Thai Gebratener Reis
  ["5af51c20-c533-428d-a3f8-5d94571e953f", "68393f9e-7247-478f-90c2-3c40d9056943"], // Wassermelonen-Feta-Salat mit Minze und Limette
  ["8e655c2b-1935-4040-b776-c045e24a6e08", "32274907-89c5-41e8-b1f5-1b0d2c262888"], // Wiener Apfelstrudel
  ["9c4abe20-aeb7-49b7-8bde-f3d21c2e7d3b", "3b9e35e6-c168-4cdc-82b7-6989255d34fc"], // Wirsing-Hack-Auflauf
  ["5914d010-6cd0-422f-9d53-473e92cd03ba", "7667c6a3-f363-414c-8760-cc79f12e7c74"], // Zimt-Porridge mit Apfel
  ["d07786fb-0659-49a4-858e-b8a9c54c4ecd", "a3cb70ce-67ec-4311-be57-7a29ac2db896"], // Zitronen-Zucchini-Pasta mit Parmesan
  ["426b9f35-d63a-4ee0-9ed1-5712245ea5a9", "cf062461-da4e-478e-bf1d-4fcea3926c5e"], // Zucchini-Puffer mit Kräuterquark
  ["6a07a510-d980-4da9-956a-72d04cbc95eb", "86bc2a6b-cdc0-4e89-ac97-b027302c9ad3"], // Ćevapčići mit Ajvar
  // Deutsche Hauptgerichte mit Fleisch, Wild und Geflügel (77)
  ["cab006d0-f592-4f05-b4f7-45e6247e8511", "b9cd4582-39bc-4508-bfd5-f23871af8e2e"], // Altmärkischer Tiegelbraten
  ["daaee5b2-75bd-47ef-b9bb-68cd0d8d6404", "532d9fe2-ae95-4978-8660-9f61f55ac6e4"], // Bauernfrühstück mit Räucherspeck
  ["7586708a-8dd9-49c2-8ada-ab06b00c86ba", "31244847-1de8-466a-93a4-8986f56725f5"], // Bayerische Ente mit Blaukraut
  ["ff5f1ca8-b623-425c-940b-edb1386899dd", "9f5b01f2-4b7f-4a48-b8e0-1268e5fce0ff"], // Bayerische Schweinshaxe
  ["9c5e2720-aa4a-4aab-831c-bd6e57c61af5", "fb1fdd7c-6d6c-485a-8e42-aeac2f6a653f"], // Birnen, Bohnen und Speck nach Hamburger Art
  ["f4df9731-deda-42d8-b3f6-c18bea066534", "bbada943-1e5e-4369-97a8-fd5f5a5078b1"], // Bratwurst mit Sauerkraut und Kartoffelpüree
  ["09b1fa0b-0d27-4e12-ad68-ede8cee8d078", "e4d0df25-2f90-4ff4-a1f0-db4398047d51"], // Bremer Kükenragout
  ["0d8d32ba-1bfb-4f0e-8fb6-43421affa123", "d0b0de7f-fa77-4f1c-9cee-4ffa7951e64e"], // Buchweizenpfannkuchen mit Speck
  ["6a705170-3fec-4474-83bf-150d3070681b", "e3cfd0b7-3c20-4712-95c5-b47a19035a56"], // Dicke Bohnen mit Speck
  ["cb2588fe-e27d-4324-b7f6-9b4ac1eb4bbf", "933a9c80-326b-4ad9-ae2b-ffe295be0b3b"], // Eisbein mit Sauerkraut und Erbspüree
  ["bea7f20a-1a5e-41c7-a1b7-b7ef2c688601", "b78d3ca9-fd26-433a-8b80-9b502d048f15"], // Ente mit Backobstfüllung nach Holsteiner Art
  ["6558cf68-595e-4054-b440-a604d3a2245c", "fd3c5f07-8d03-4cfb-b26f-cd06bbc21120"], // Entenbrust rosa gebraten
  ["dda51bd2-95f8-4c0d-a9ea-53354f50c70d", "90b5527f-7309-460f-b646-508d224494c1"], // Fasan im Speckmantel
  ["c60af780-4f81-4451-88d1-fceeaf83ea6b", "90c5b80e-7164-4e1a-9233-d85b77e07fcd"], // Fleischfondue mit drei Saucen
  ["ee85f958-c118-4b12-9450-ab6a8dc1787c", "5c15131d-5e17-490c-a464-981823405798"], // Frankfurter Rippchen mit Kraut
  ["343fe403-05ea-4d21-a277-86c142d1ee3e", "19e173d4-093f-4248-b2d6-94279f292667"], // Fränkischer Sauerbraten
  ["ae1d853c-18cb-4399-9dd4-d31da4a970ff", "0db46651-2c00-482d-905d-5d6ef979b128"], // Graupeneintopf mit Rindfleisch
  ["4117af6e-9bea-4d46-890a-d880723283fd", "64b6e585-0837-4a50-bad3-b7c3654e3380"], // Gänsekeulen mit Thüringer Klößen
  ["8c25e7b0-c0ae-425b-a9cb-3bdafedbd8b6", "560c4e74-c511-4d2f-acb8-3ca2986eedc4"], // Hamburger Stubenküken vom Blech
  ["07cb2e6c-833f-4d68-a062-c93d765b1340", "43377f45-ea2f-4589-9ad9-0755492f7f3c"], // Hasenpfeffer
  ["42c69921-1c26-4e42-b433-7203df56d6ce", "281cbb8e-e628-4f05-a03e-16517e4f0320"], // Heidschnuckenbraten
  ["f45347a5-d9b8-4ad1-bd57-cdb10c1486f3", "592df358-6884-4ab1-a2aa-e032074495f8"], // Hirschbraten in Rotweinsauce
  ["1ae60d33-1580-43a0-a021-879d5d005081", "abc9fe31-25f2-4020-869a-0981934ea17c"], // Hirschgulasch mit Preiselbeeren
  ["c7e0bc1e-9278-4cb9-af2b-1ac845259834", "73f3c263-67de-4e19-a0be-04f708e2230a"], // Hirschmedaillons mit Wacholderrahmsauce
  ["793c3de7-aad0-4027-9c7e-69cd7a9f2819", "36475509-511b-4512-8b81-694d616c13b3"], // Hirschrouladen
  ["37cc2f04-66d6-48c3-a1a3-0375f1935f04", "f251f2dd-888b-4f3a-927b-2c879287eac2"], // Hoorische mit Specksoße
  ["e9242f2a-f0e9-45ad-85f2-6f6c595b46f0", "21ca33f1-4228-40b5-87da-ad977cfd523b"], // Hähnchen aus dem Tontopf
  ["73922899-da63-4814-a328-0942192b2888", "ff84df48-0709-474b-907d-daa4d1679683"], // Hähnchen in Altbiersauce
  ["0ee9153a-b360-4c06-8d67-8429fc0345f6", "5015d022-b8a0-4ff6-882b-f232d30802f3"], // Hähnchen in Apfelweinsauce
  ["8595497e-8513-4b25-a911-3583ea0741dc", "f223ca69-3ff0-438e-876e-6f53fdb87318"], // Hähnchen in Rieslingsauce
  ["2f9180cd-6ee6-4712-b7ff-10af86ec207d", "3434d7b3-54ed-4d2b-b4fe-1f7cd834ea08"], // Hähnchenbrust Jägerart
  ["f35fff8f-4731-4253-b391-0e8c31d3337e", "b93c55d4-5b01-4d22-afa0-1a87837bf1d2"], // Hähnchenkeulen in Senfsauce
  ["71e3496e-fb7d-459f-a26d-5835c578b1a8", "b5f9efe7-7090-444a-ade1-cabe0a4bfe32"], // Hähnchenleber Berliner Art
  ["9b65884b-5eff-4ecf-a5b9-2b837ee59047", "71b81846-92c9-4d63-91a5-b1637677821b"], // Jägerschnitzel nach DDR-Art
  ["baa3e8c0-d394-4089-a354-a10992b6e589", "bce4cabc-537f-4b1d-b2c7-7be7a32635c9"], // Kalbsbraten mit Rahmsauce
  ["7201231d-8a60-4a35-86b0-f91a4fc5d093", "0f79e367-037d-48ae-86c0-bc40d0a65e42"], // Kalbshaxe aus dem Ofen
  ["06e059ab-028b-47f4-8ead-0918fd196dbd", "1e5e4926-f0b8-4d46-9384-dd3ab17778ba"], // Kalbsleber Berliner Art
  ["bd66edd8-1f5f-411a-a156-5aa98d32eb46", "9e5e6951-6f59-4466-a3e8-01b99769b9ea"], // Kaninchen in Senfsauce
  ["548022c6-7076-48c5-ab41-187eec6c1750", "f6352967-a8fa-4d7f-a751-ba5f216807e1"], // Kasslerbraten mit Sauerkraut
  ["05836eb6-315f-4a96-a603-b1984e952732", "7ed7b20f-e748-4580-8a03-7a8231ff9843"], // Lammkeule mit grünen Bohnen
  ["2b8f1cf3-9764-410f-bd6f-788160b96a5b", "e44ca456-1de5-41f4-9e2a-d14a254843ae"], // Leberkäse mit Spiegelei und Kartoffelsalat
  ["8a2934d0-d6e0-4a07-afa5-a2f944209791", "28cf6ed3-5651-4583-96ed-4ad484a42109"], // Martinsgans nach rheinischer Art
  ["cee80e40-90e1-46e7-bbfe-6d9718a99795", "1adeee07-a80d-4a25-a040-91e0b3f84af2"], // Mecklenburger Gänsebraten mit Backobstfüllung
  ["d2caec3e-cc97-4e12-8f1b-ea5c1aaecc2e", "3b4229aa-3282-47e3-82ee-4e5856105fdc"], // Mecklenburger Rippenbraten
  ["9d1f4dea-72dd-405b-92ab-acbc1b647b44", "a14b7bd6-dbd5-4ada-b1e7-3d2895feea95"], // Mutzbraten nach Thüringer Art
  ["b2a8ec20-5d73-4804-bbf4-5c327e0ddcf4", "638070c2-bd91-464b-943c-8db787b1e0da"], // Möhren-Untereinander mit Mettwurst
  ["b74b37ee-bfb0-4b6a-a3cb-859ea0fd9a57", "f1d786aa-934a-425c-ac9c-a3c5e75aa2c3"], // Ochsenschwanzragout
  ["1e25f29a-494d-42b7-81f8-329310ea3c3f", "1804077e-ee14-4901-a33a-10f61ebc8308"], // Ostfriesischer Snirtjebraten
  ["18b6d0d6-f629-4b9a-85cd-6acfef409799", "2ec78399-179a-4524-a7af-d02f5010acf3"], // Paniertes Schweineschnitzel
  ["c0cd7873-913b-4e7b-9f9f-0ce4e6d40999", "46aee478-d9a6-4ebd-88e9-9090c459a59f"], // Pfälzer Fleischknepp mit Meerrettichsoße
  ["57b56959-7b35-4d28-97aa-d2cae2d2716f", "d64a9b45-db08-4a41-87b9-22849a0f60f3"], // Pfälzer Leberknödel mit Sauerkraut und Kartoffelpüree
  ["95f106b3-1b75-4d8b-bb9e-91008f95dafb", "13f7cf66-59c5-465a-aaed-326c5fed579c"], // Putenoberkeule aus dem Ofen
  ["e6c4c44e-b4cd-4ef5-b1c0-26e6a2269911", "365b15c5-19b1-4d2a-a9ff-735dbe1a4a29"], // Putenrollbraten mit Backpflaumenfüllung
  ["fa22edc9-62ad-473b-92dc-7ccfbe5c0fd6", "8f27c2a6-02c5-41b8-b73a-58028a3fa0c9"], // Putenschnitzel paniert
  ["55a15915-8798-452c-9aa1-1e46e175df2f", "ea96d98d-8bf7-4dc7-8357-7739f9cbebe2"], // Ragout fin vom Huhn
  ["caaa64f4-8a45-4786-bda9-c287911d387a", "c4f68d43-da32-4e0b-9c56-e6776eb8feec"], // Rebhühner auf Weinkraut
  ["6ac0c288-8066-49c7-b5dc-4e9bb32f7b2f", "b0773e4d-1210-44f1-bf32-d48936efcab0"], // Rehkeule in Rotwein geschmort
  ["1367bb49-84f2-49af-a93b-d865f2a76d60", "877eed88-40b9-42d5-9dc9-21008939e97a"], // Rehmedaillons mit Pfifferlingen
  ["7d36a842-4b5f-4252-a5f2-8220bc10e275", "87ee931d-9d27-449b-b539-7d62d8da76ed"], // Rehragout mit Spätzle
  ["7070a132-5312-4eb7-8356-038511c84f19", "d479f14a-5265-4034-80bf-f7bbd47eb612"], // Rehrücken Baden-Baden
  ["e146b5f7-e62e-45d5-a534-425dc1be2498", "a9d231b8-1d61-471e-b1a7-e0d76889d8bf"], // Rheinischer Sauerbraten
  ["1da0124f-5f50-4423-844a-ca15ece25e2e", "8c3c761d-7fce-437a-b0f5-a6a41feb46fc"], // Rinderrouladen
  ["d590219a-7660-457e-bffd-8a941cdceac1", "bfae89c2-fca9-4ac6-98a3-f5efacaa140e"], // Rinderschmorbraten
  ["8c522695-8d07-4934-9654-b272afd99fee", "fb4377e7-9262-469d-af7c-59a58dd2d606"], // Rindfleisch mit Meerrettichsauce
  ["9ddc46b0-31db-4d2a-bf77-2df4438655db", "6200adc2-2c1c-46a1-9368-8ce272a2fbf1"], // Schinken im Brotteig
  ["2bf13594-3ae6-43de-88ec-9594e977842b", "9c0db8d1-cee1-4d5b-97b8-2eedd59e9752"], // Schnitzel Holstein
  ["0f2e61d9-9e12-40cf-878f-de2a56880d3e", "463e1698-aed2-46d7-aac6-42cead0558a7"], // Schnitzel mit Grüner Soße
  ["8c3a2b9d-3368-4caf-bfbc-55889df09c7d", "2cfc9d08-fb1f-4d6d-be37-7c528edde3d1"], // Schwenkbraten
  ["c2948bea-9799-488f-bc47-515242c214f1", "8a9d2747-1ad6-4f5a-bd86-b92f68e2ebe0"], // Schwäbischer Zwiebelrostbraten
  ["c936683d-9fca-480c-8090-48314b3f6afe", "81402ff1-42ff-4743-bfc5-ecbad5862c6b"], // Spießbraten nach Idar-Obersteiner Art
  ["97ca1f1d-342c-470a-b754-08186e5d0827", "f0bdce6c-61a0-4470-98a4-500c714d380b"], // Sächsisches Gänseklein mit Backpflaumen
  ["7062203a-fd34-498b-a9f7-2d51e37f974f", "0969cd1f-9586-4344-964f-52f58d649351"], // Tote Oma – Grützwurst mit Sauerkraut
  ["4ec013bf-904e-4028-a985-84c5dd09f60b", "fd7c1f0a-1bcd-404a-ad7b-992914874948"], // Westfälisches Blindhuhn
  ["c23ad603-f20a-410c-ab61-efafc7d0dbc4", "ae466123-1db9-4535-82a4-f7e1b3357ab5"], // Wildente mit Rotkohl
  ["34a98ad8-7cc3-430a-bbb6-7116971848ed", "4286c487-6deb-40f7-8c13-646b43db1ae7"], // Wildhackbällchen mit Preiselbeersauce
  ["a61bd100-cb5b-43c3-a803-a7ee7582e280", "9c7bbe66-938e-4fbb-9390-938e2d63193f"], // Wildschweinbraten in Rotweinsauce
  ["2b280349-e1ba-4db5-b379-5a2c4f6f8000", "d7a5790a-db1c-43dd-9554-abe54ff3928d"], // Wildschweingulasch mit Steinpilzen
  // Übrige deutsche Hauptgerichte (88)
  ["3acdd805-7397-4707-bef8-42d4ebd5e495", "01548646-9d7f-4e8b-b611-b2b860ba5347"], // Aal grün
  ["54406d9a-c318-4f96-b71c-8cc517af95c5", "5033d72a-2a77-4243-9491-fafef5dfe2ba"], // Bachsaibling mit Kräuterfüllung
  ["517e855f-f56a-454a-be35-21dc3e06a793", "02f83121-72a6-4d41-9723-da77f194bcfa"], // Backfisch in Bierteig
  ["d529f4d9-0abf-4fbe-b21d-407b70f93e1f", "02045081-54c0-4ec8-96a8-ddd4154ee1e8"], // Badisches Schäufele mit Kartoffelsalat
  ["e5f01a5e-fcdf-4cdd-ab73-de9ea5d6ff8e", "293eac62-bda2-4907-95df-7b43b434b402"], // Bayerische Dampfnudeln mit Vanillesauce
  ["32b4cfc9-234c-49b3-8416-e62e49c8c6ae", "b10ed96f-b2d6-4ca9-bfc1-fa48b24ba002"], // Bayerisches Backhendl
  ["30c3200c-f048-431e-a93c-3764910985da", "dadd5f05-6ece-4e9a-b8bb-76bcaeba0122"], // Bayerisches Wiesn-Hendl
  ["f8aaec88-0bc7-4ebf-b134-f90f94cdf0fa", "8b91218b-61bc-4727-b85b-e363dfa6106c"], // Blaue Zipfel
  ["34e1ee90-d123-4e8a-83ec-e8ef6fff7df0", "9584b1d3-96a5-4a26-aafa-5b3d96da5af7"], // Blumenkohl mit Semmelbröseln
  ["3a7c72ec-1133-42bd-a1a1-b7ce43b0cba9", "28f1536b-a6c0-497c-bdaf-15f3394ba161"], // Bodenseefelchen mit Kapern
  ["ed764756-5463-4923-b825-f3e679dae073", "b27d1c3a-6631-4069-bed8-5d54525f99dd"], // Bratheringe
  ["47130611-6e79-47c5-990d-412e49a55452", "6cecaec1-4e26-4288-a88e-f43bfad8b757"], // Bremer Knipp mit Bratkartoffeln
  ["8385655c-2f18-4db9-80e7-220794ac6372", "365ff2d4-ccf6-4c0f-9994-141f734ea324"], // Böfflamott
  ["da7756af-a26d-4c55-8dd8-bc69f4f3815e", "24d250c6-cc74-4fca-85e4-53aea92c1fbe"], // Büsumer Scholle mit Nordseekrabben
  ["84aeb6e6-00bb-4d57-a3dc-320de560a965", "d1dca2c1-318f-4cc2-9662-3925eba29618"], // Dibbelabbes
  ["c16625d3-1ce6-4932-9458-16800b98eec0", "1a567920-a678-41fb-a1e5-0dafe3cb60e1"], // Erzgebirgische Getzen mit Buttermilch
  ["d9ca9d99-cada-49da-8b68-d1a2c0a7508b", "b5f63b50-f57a-4499-b2ff-e07bebfe03a3"], // Finkenwerder Scholle
  ["38d96287-1711-46ad-87ec-4e5322c137d7", "732357a3-db2f-4566-9edc-7f59d8dcb333"], // Fischfrikadellen
  ["276d5e08-cd69-41f4-af5e-7e6aa1c1f6e2", "eee49ed0-bf04-47b2-b92d-c14e1312e60d"], // Fischstäbchen selbst gemacht
  ["0ccb195d-3781-4dbf-a06d-a8384f00215e", "bf031f1b-0471-4595-b996-7b1e87402891"], // Flusskrebse im Dillsud
  ["d7991e6c-0cad-4972-b912-b2297e7833e8", "2b1233f2-cdd1-466a-b582-ae3831b93dec"], // Forelle blau
  ["1a4f9dd7-55e2-43fe-b160-81fc24f53956", "1a1713aa-f8ad-4b44-b333-7bde723d1601"], // Forelle in Rieslingsauce
  ["97d57da0-bc0b-4782-9080-3e5655353224", "7b51afdb-e3e3-4222-ae5f-20935076ecad"], // Forelle Müllerin
  ["ff8eebc8-bee6-4709-9a3d-7a4cc522e361", "98288bf7-08f1-4d3e-819c-8b8210d9c9e3"], // Fränkisches Schäufele
  ["407f710a-5bdf-4eae-add2-d563adcac519", "932a7942-397c-484f-ac04-a10df7d4a318"], // Gebackener Karpfen
  ["b80c63de-fcd3-4b87-85d8-18edcbad45e2", "adaa9c9a-a801-419f-b8f9-0622e9b9e56b"], // Gefillde
  ["b144bcb5-b415-406c-810f-d581baae4265", "7386d7f5-f123-4818-84a3-614add11df93"], // Gegrillter Lyoner-Ring mit Kartoffelsalat
  ["f9f0031b-98c2-4807-a384-c719ff8204f7", "5f3aa321-47e9-4083-965d-c623f581aa7b"], // Geheiratete
  ["2f8acbba-0e93-42ac-b439-e4f99e55b8b6", "24a2292f-cbff-4bb7-b729-8b61869283a1"], // Grießschnitten
  ["b9d58f73-bce1-4f8b-b909-1a3933c04d12", "f24a6715-87e3-4056-a2e8-df1f082d6a01"], // Grüne Soße nach Frankfurter Art
  ["ca0fc7b1-dcaa-4e28-bb47-4581ffbdf388", "bf64553e-9f05-46cb-afa4-52c11296237a"], // Grünkernbratlinge
  ["c19b8479-38de-4f0c-9ff2-cd32eac00bbb", "665332a8-7fab-49cf-9b44-0b160293cd77"], // Grünkohl mit Pinkel
  ["6228a8b8-8303-44fa-8e96-ceb273db14cf", "de93d9eb-c873-43d1-81af-f21c77cc7316"], // Hamburger Pannfisch
  ["e2111a60-cb09-4764-a451-1f381193b4ce", "7000dcc7-c130-4459-b75b-dd736cb3ccc5"], // Hamburger Rundstück warm
  ["9ba7e78f-83fd-46df-a9de-61232aaf6202", "18d0e3de-cfa6-4e4d-a950-784a56f42e0f"], // Hechtklößchen in Krebssauce
  ["48207c15-a4bb-4b00-a3df-5226d4e05e48", "ca6b5dc7-4716-4fba-8fcc-42c2ac9b6130"], // Hefeklöße mit Blaubeeren
  ["111c475a-7171-4299-8de9-ab0d84572437", "85f2d6fc-7e7b-4529-bc68-89935d2a8bd8"], // Heiligabend-Kartoffelsalat mit Würstchen
  ["f4841e01-039d-430a-a964-a75950eabb2b", "84c99687-8cac-4ef3-80a7-2f500272c527"], // Hessischer Dippehas
  ["9d8181c3-82b2-4673-8933-8513295ae4f6", "4954234c-4e22-407b-a616-6e36787b4bf2"], // Himmel un Ääd
  ["55e64264-de3d-4f8a-aee1-5a66ec1940c1", "4e48feff-f036-4839-ba33-037ebadae8ee"], // Holsteiner Kohlpudding
  ["973a6cdb-a9b8-49ff-8c01-94e5f8749029", "a0af42cd-282c-4135-8fe7-68dbd6ad4165"], // Hummer Helgoländer Art
  ["30c29565-bf7d-40b1-b408-97ea75c904db", "91b44f8b-f3db-4ed3-a6ac-3181df68df71"], // Karpfen blau
  ["be17d027-ee9d-40e0-87ce-9bbfaf4d696b", "1ee1b66a-d954-43ac-8a35-a8bdb6248112"], // Kirschenmichel
  ["4e307c32-cab4-4b2f-8edb-4e2cc701f8d7", "ee94fcbf-b44c-4557-a51d-4dae3d4f47b3"], // Klassischer Gemüseeintopf
  ["08fceedb-8a31-4e63-a497-ed62ba468104", "27168c23-03af-42ba-9891-a9f77197b790"], // Krabben-Rührei
  ["87509a30-0bbb-49c7-8f5f-2f881019d70b", "cd5cadbd-bd39-4319-aa4e-b99d1962e4c0"], // Krautspätzle
  ["26a7327b-87a3-42a7-84f7-e4cc5ee30ce5", "f45ea547-1b9c-4d9b-a49b-693ce96635be"], // Käsefondue
  ["c5044b2f-e879-484a-bda7-4fc4cdb02225", "13f4a6f7-e190-4e28-a713-975bb2a080d5"], // Käsespätzle
  ["4b2414a7-244e-464e-b64c-def2cefefe3e", "9f9d354b-371f-44cc-a5b4-3e91127c05fb"], // Köthener Schusterpfanne
  ["37b3b8b4-874e-4ddf-83a3-57bb13bf4d34", "8ab82eba-c936-4e04-8233-5fa4a166b878"], // Labskaus
  ["3950d879-ed5b-4246-aa16-0978130859d0", "e06c66dd-a290-496c-820b-8d18f86ee3c9"], // Lippischer Pickert
  ["e1a777e5-6cf9-48b9-a335-76fb83528579", "b2f992b5-96b2-4530-bbb3-d5efeb271a02"], // Maischolle mit Bratkartoffeln und Gurkensalat
  ["8a334dd0-bc5c-4ce4-a5be-b49650a10163", "f0b3a77a-51b8-45ca-8d4c-20811994380b"], // Matjes nach Hausfrauenart mit Pellkartoffeln
  ["99c8b350-7da5-4bb7-87d9-014f815eb102", "cd8aef5f-5359-4e8f-92e9-b37aebb005d5"], // Mecklenburger Kartoffeleintopf mit Backpflaumen
  ["f5f5733e-770a-4474-a9ef-44242beb4d08", "2951783a-34e3-4c11-9e64-f1bf9cee0309"], // Miesmuscheln rheinische Art
  ["8decc2e0-721e-4a0c-bbce-e4c373072916", "9d945105-e848-419e-85c9-249613d7d11f"], // Norddeutscher Steckrübeneintopf
  ["503ba449-f0fe-4c54-b947-d0ddc121a357", "7152802a-fab0-45e9-b65a-02d760622506"], // Nordhessisches Weckewerk
  ["c960e9b6-142f-4cde-8878-124e679cf774", "80fa8a2a-566f-4f23-b4e4-c258f1cf6646"], // Panierte Schollenfilets mit Kartoffelsalat
  ["8dc6ab54-f2f1-4e38-9849-36478faea866", "4c1d16ba-f460-4c8e-8208-6a4af96c981d"], // Pellkartoffeln mit Kräuterquark
  ["c8f3228b-c429-4375-aa49-8e6961903cca", "9b22a71d-970c-44ff-9e1d-8484df2e999f"], // Pfifferlingpfanne
  ["1b1cbc79-9f86-4829-ab0a-027ce4355f45", "b152a524-0803-48ba-8a89-72835b02546f"], // Pfälzer Saumagen
  ["35b12406-4264-4964-a307-3ebd0dabf43c", "663f1f48-17d7-4ee0-91c0-ae641ab4fa52"], // Pfälzer Schlachtplatte
  ["7cd42d1c-2c80-4e71-af56-898e89be723d", "80434d3d-3fe1-442f-a132-dadd4ef2f3e5"], // Raclette mit klassischen Pfännchen
  ["b17812d5-999a-4a5d-9265-2fd964bb5142", "b8ac465b-10b6-4df1-89b2-053d87b33b39"], // Rahmspinat mit Spiegelei und Salzkartoffeln
  ["d4a9615d-7bd6-46fc-b1e8-72bbee6471bb", "e8b53187-dabd-4418-beed-d38e1c5e533f"], // Rheinische Reibekuchen mit Apfelkompott
  ["93f00e82-cbf1-410f-8111-aaac7f0824b7", "602c5e22-bb0b-4eae-93fe-b18fa020e7c6"], // Rheinischer Döppekooche
  ["a3d2e3f2-da36-44db-8e27-3b4320f86b97", "c07fd9df-4dfc-438a-b07f-d45f45e8d9b8"], // Rheinischer Heringsstipp
  ["6dedb4b9-a7fb-45cd-bfae-5c7f58a3396c", "49b85846-43b8-4615-9e63-3dfb0f563995"], // Rheinischer Möhreneintopf
  ["d87dd47e-5e8b-4cd0-b3f0-a6908b30f0af", "2919af30-cbf6-4c3e-b7c7-af19a8256992"], // Rohrnudeln mit Vanillesauce
  ["4db2f10e-cb0d-4712-a2ad-4421b1439455", "269bd994-3a2f-4178-a3bc-a0fc41a245b8"], // Sauerländer Potthucke
  ["b1c7a52f-00e7-41c8-b402-d7b49d026f13", "a0614fa1-f15b-4f8c-aa5d-8d2b99f5a0b1"], // Saure Kutteln
  ["a27be961-d0f3-44c1-b381-499eec90c3b6", "09b82d17-3a2c-4270-a639-b98835e2d144"], // Schlesisches Himmelreich
  ["bd302ce7-a3c3-4d73-b76a-c236dafe1229", "7e48919b-3c73-4cb0-95dd-9933eaba2eee"], // Schmorgurken nach Spreewälder Art
  ["373c5838-3a64-417d-9a5d-56520ede75e2", "b80cee94-e9af-4426-9920-4c2569f7b7e0"], // Schnüsch
  ["06f3d57a-d3df-4e3a-84c1-64af7efd1742", "b4447624-52de-43eb-ade2-52fcad1ec7e0"], // Scholle nach Müllerin Art
  ["d62d8744-d564-4dd3-aeca-7cbd88822da0", "73b31eb6-08c1-480a-a197-c346d4a293a7"], // Schollenröllchen mit Spinat in Senfsauce
  ["e91ea01b-8622-4464-af7e-f080c4f0933b", "617d1070-3758-46b1-9404-a478f034b549"], // Schwäbische Krautkrapfen
  ["c7e7ca86-a3f2-4073-8203-feb2e0b8ac79", "2786b6f9-af19-4098-9ebe-8852411996d1"], // Schwäbische Linsen mit Spätzle und Saitenwürstle
  ["13aa9dd3-64de-4356-833d-dca991082c93", "68334ae9-72e0-4c88-8f31-9471b30b942e"], // Seelachsfilet paniert
  ["c1cb77e4-c6f2-48c6-ab2d-a862889ae768", "65b1f2c0-d5d1-46f5-9321-d4e70342609d"], // Senfeier mit Kartoffeln
  ["8905f9f8-5a3b-4b7f-b543-5e361e99bc47", "b9a6cd61-9da9-4a93-a40d-2593b1f0b5d2"], // Spargel mit neuen Kartoffeln
  ["93b5d3a3-f6b2-4f83-8235-89207896475c", "d8370731-450a-42d4-9a59-bde7f7a869f2"], // Spinatknödel
  ["5c7ac179-1afc-4958-8b07-33d50e10dab4", "12dfcfb4-e165-424d-8f24-a7e264ef1834"], // Steckerlfisch
  ["a9a2d2f5-dc41-4bff-9b48-85199f011c7f", "36ed8325-0f54-4048-a799-6845c555a1ed"], // Thüringer Rostbrätel
  ["6051fdb8-55a8-45ce-8832-549ec7039d1f", "f67ce0a9-1bc5-4cff-813f-942998d66620"], // Updrögt Bohnen
  ["39612b25-1ce5-49aa-98e1-08ae128de35e", "3b65ee67-9171-4b05-aff5-481be9c8caa6"], // Westfälischer Pfefferpotthast
  ["51777fa5-8419-450d-8cf5-47eaa18f0a5b", "9d656644-39ed-443f-8504-ec8c79bb239e"], // Wickelklöße
  ["19a5687f-5314-4559-ba08-91460cdd8395", "34514dc1-2233-4add-bb0e-6a4a54d0aa2b"], // Zander auf Rahmsauerkraut
];

const CORE_IDS: ReadonlySet<string> = new Set(CORE_DISHES.flat());

/**
 * Gehört ein Rezept zum Kern? `id` ist die ID der Datenbankzeile, mit oder ohne
 * "user_" davor; `family` sagt, ob es ein Familienrezept ist (isFamilyRecipe).
 */
export function isCoreRecipe(id: string, family: boolean): boolean {
  if (!CORE_ONLY) return true;
  return family || CORE_IDS.has(id.replace(/^user_/, ""));
}
