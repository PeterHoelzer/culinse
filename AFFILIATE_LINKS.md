# Culinse — Amazon Affiliate Links

Tag: `culinse-21`  
Letzter vollständiger Check: **25. Mai 2026**  
Alle Links: `https://www.amazon.de/dp/{ASIN}?tag=culinse-21`

---

## ✅ Zutaten-Links (INGREDIENT_MAP)

Nur Produkte mit verifiziertem ASIN werden direkt verlinkt.  
Alle anderen nutzen eine Suche-URL als Fallback.

| # | Keyword(s) | ASIN | Produkt | Preis | Prime | Geprüft |
|---|-----------|------|---------|-------|-------|---------|
| 1 | olive oil, olivenöl | **B075P28BLK** | Bertolli Extra Vergine 750ml | ~€20 | ✅ | 25.05.26 |
| 2 | sea salt, salt, salz, kosher salt | **B003CNZYGC** | Le Saunier de Camargue Fleur de Sel 125g | ~€5 | ✅ | 25.05.26 |
| 3 | lemon juice, lime juice, zitronen | **B078K7H3HD** | Pfanner 100% Zitronensaft 2kg | ~€17 | ✅ | 25.05.26 |
| 4 | soy sauce, sojasauce | **B005E9VL28** | Kikkoman Sojasoße 1L | ~€8 | ✅ | 25.05.26 |
| 5 | oregano | **B0897C4JRV** | Alpi Nature Oregano getrocknet 500g | ~€10 | ✅ | 25.05.26 |
| 6 | black pepper, pfeffer | **B08LTKG129** | Alpi Nature Schwarzer Pfeffer 250g | ~€8 | ✅ | 25.05.26 |
| 7 | red wine vinegar, rotweinessig | **B003TUDAFA** | Kühne Rotweinessig 6% 500ml | ~€3 | ✅ | 25.05.26 |
| 8 | apple cider vinegar, apfelessig | **B085BDZZKY** | Eat Wholesome Bio Apfelessig 1L | ~€15 | ✅ | 25.05.26 |
| 9 | coconut milk, kokosmilch | **B0071JPZHQ** | Aroy-D Kokosmilch 1x400ml | ~€2 | ✅ | 25.05.26 |
| 10 | tomato paste, tomatenmark | **B08L4DJHVP** | Mutti Tomatenkonzentrat 200g | ~€2 | ✅ | 25.05.26 |

**Alle anderen Zutaten** → Amazon-Suchseite (kein ASIN, kein falsches Produkt)

---

## ✅ Equipment-Links (AFFILIATE_PRODUCTS)

Nur Tools mit ≥ 2 passenden Tags zum Rezept werden angezeigt.

| # | Tool | ASIN | Produkt | Preis | Prime | Geprüft |
|---|------|------|---------|-------|-------|---------|
| 1 | Ninja Woodfire Grill 🔥 | **B0CXDTMM28** | Ninja Woodfire Pro Connect XL BBQ Smoker | ~€429 | ✅ | 25.05.26 |
| 2 | Kochmesser 🔪 | **B085V653KM** | Wüsthof Classic Kochmesser 20cm | ~€95 | ✅ | 25.05.26 |
| 3 | Gusseisenpfanne 🥩 | **B00006JSUA** | Lodge Bratpfanne Gusseisen 26cm | ~€30 | ✅ | 25.05.26 |
| 4 | Fleischthermometer 🌡️ | **B074XND445** | ThermoPro TP17 Grill-Thermometer | ~€22 | ✅ | 25.05.26 |

**Alle anderen Tools** → Amazon-Suchseite (kein ASIN)

---

## 📋 Kriterien für neue Produkte

Bevor ein neues Produkt aufgenommen wird:
- [ ] Direkt auf amazon.de/dp/{ASIN} prüfen — Seite lädt korrekt?
- [ ] Prime-Badge sichtbar?
- [ ] "In den Einkaufswagen" Button vorhanden?
- [ ] Verkäufer: Amazon selbst oder bekannte Marke (kein unbekannter China-Drittanbieter)?
- [ ] Sinnvolle Packungsgröße für einen Haushalt (keine 12er-Packs, keine 3L-Dosen)?
- [ ] Preis im `affiliateProducts.ts` mit echtem Preis übereinstimmen?

---

## 🔄 Nächster Check

Empfehlung: alle **3 Monate** die ASIN-Spalte durchgehen.  
Schnellcheck per Browser: `https://www.amazon.de/dp/{ASIN}` → Prime-Badge + "In den Einkaufswagen" sichtbar?

Datei: `lib/affiliateProducts.ts`
