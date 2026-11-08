"use client";

import { useMemo, useState } from "react";
import { Button, Input, Select, Notice } from "@/components/ui";
import {
  allIngredientNames,
  estimatePrice,
  formatEstPrice,
} from "@/lib/ingredient-prices";

interface CalcItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  price: number | null;
}

const UNITS = ["g", "kg", "ml", "L", "pc"] as const;

// Beispiel-Wocheneinkauf (füllt den Rechner mit einem Klick)
const EXAMPLE: { name: string; nameDe: string; amount: number; unit: string }[] = [
  { name: "chicken breast", nameDe: "hähnchenbrust", amount: 500, unit: "g" },
  { name: "rice", nameDe: "reis", amount: 400, unit: "g" },
  { name: "pasta", nameDe: "nudeln", amount: 500, unit: "g" },
  { name: "canned tomatoes", nameDe: "dosentomaten", amount: 2, unit: "pc" },
  { name: "onion", nameDe: "zwiebeln", amount: 3, unit: "pc" },
  { name: "bell pepper", nameDe: "paprika", amount: 3, unit: "pc" },
  { name: "milk", nameDe: "milch", amount: 1, unit: "L" },
  { name: "eggs", nameDe: "eier", amount: 10, unit: "pc" },
  { name: "yogurt", nameDe: "joghurt", amount: 500, unit: "g" },
  { name: "oats", nameDe: "haferflocken", amount: 500, unit: "g" },
  { name: "banana", nameDe: "bananen", amount: 6, unit: "pc" },
  { name: "lentils", nameDe: "rote linsen", amount: 250, unit: "g" },
];

export default function GroceryCalculator({ locale }: { locale: string }) {
  const de = locale === "de";
  const tr = (en: string, deStr: string) => (de ? deStr : en);

  const [items, setItems] = useState<CalcItem[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<string>("g");

  const suggestions = useMemo(
    () => allIngredientNames(de ? "de" : "en"),
    [de]
  );

  const add = () => {
    const cleanName = name.trim();
    const amt = parseFloat(amount.replace(",", "."));
    if (!cleanName || !amt || amt <= 0) return;
    const price = estimatePrice(cleanName, amt, unit === "pc" ? "pc" : unit);
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: cleanName, amount: amt, unit, price },
    ]);
    setName("");
    setAmount("");
  };

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const loadExample = () => {
    setItems(
      EXAMPLE.map((e) => {
        const n = de ? e.nameDe : e.name;
        return {
          id: crypto.randomUUID(),
          name: n,
          amount: e.amount,
          unit: e.unit,
          price: estimatePrice(n, e.amount, e.unit),
        };
      })
    );
  };

  const priced = items.filter((i) => typeof i.price === "number");
  const total = priced.reduce((s, i) => s + (i.price as number), 0);
  const unpriced = items.length - priced.length;

  const unitLabel = (u: string) => (u === "pc" ? tr("pc", "Stück") : u);

  return (
    <div className="rounded-2 border border-line p-5 sm:p-8">
      {/* Eingabezeile */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem_auto] sm:items-end"
      >
        <Input
          list="grocery-calc-suggestions"
          label={tr("Ingredient", "Zutat")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={tr("e.g. chicken breast", "z. B. Hähnchenbrust")}
          autoComplete="off"
        />
        <datalist id="grocery-calc-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Input
          label={tr("Amount", "Menge")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
        />
        <Select label={tr("Unit", "Einheit")} value={unit} onChange={(e) => setUnit(e.target.value)}>
          {UNITS.map((u) => (
            <option key={u} value={u}>{unitLabel(u)}</option>
          ))}
        </Select>
        <Button type="submit" icon="plus" disabled={!name.trim() || !amount.trim()}>
          {tr("Add", "Hinzufügen")}
        </Button>
      </form>

      {/* Beispiel laden */}
      {items.length === 0 && (
        <Button variant="quiet" onClick={loadExample} className="mt-4 text-base">
          {tr("Try an example weekly shop", "Beispiel-Wocheneinkauf laden")}
        </Button>
      )}

      {/* Liste */}
      {items.length > 0 && (
        <div className="mt-8">
          <table className="w-full text-base">
            <caption className="sr-only">{tr("Your shopping list with estimated prices", "Deine Einkaufsliste mit geschätzten Preisen")}</caption>
            <thead>
              <tr className="border-b border-line text-left text-sm text-ink-3">
                <th scope="col" className="py-2 pr-3 font-semibold">{tr("Ingredient", "Zutat")}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{tr("Amount", "Menge")}</th>
                <th scope="col" className="py-2 text-right font-semibold">{tr("Price", "Preis")}</th>
                <th scope="col" className="w-12 py-2"><span className="sr-only">{tr("Remove", "Entfernen")}</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-line">
                  <td className="py-2 pr-3 text-ink capitalize">{i.name}</td>
                  <td className="py-2 pr-3 text-ink-2 tabular whitespace-nowrap">
                    {String(i.amount).replace(".", de ? "," : ".")} {unitLabel(i.unit)}
                  </td>
                  <td className="py-2 text-right text-ink tabular whitespace-nowrap">
                    {typeof i.price === "number" ? formatEstPrice(i.price, locale) : "–"}
                  </td>
                  <td className="py-1 pl-2 text-right">
                    <Button
                      variant="icon"
                      size="sm"
                      icon="x"
                      onClick={() => remove(i.id)}
                      aria-label={`${tr("Remove", "Entfernen")}: ${i.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2} className="pt-4 text-left font-semibold text-ink">
                  {tr("Estimated total", "Geschätzte Gesamtkosten")}
                </th>
                <td colSpan={2} className="pt-4 text-right font-serif text-h2-sm text-ink tabular whitespace-nowrap">
                  {formatEstPrice(total, locale)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-6 space-y-3">
            {unpriced > 0 && (
              <Notice tone="warn">
                {de
                  ? `${unpriced} Zutat${unpriced > 1 ? "en" : ""} ohne Preisschätzung (nicht in der Summe).`
                  : `${unpriced} item${unpriced > 1 ? "s" : ""} without a price estimate (not included in the total).`}
              </Notice>
            )}
            <Notice tone="info">
              {de
                ? "Schätzung auf Discounter-Niveau (Eigenmarken). Tatsächliche Preise variieren je nach Markt und Region."
                : "Estimates at discount-store level (own brands). Actual prices vary by store and region."}
            </Notice>
          </div>

          {/* CRO: Nach dem Ergebnis war hier eine Sackgasse — jetzt führt der
              natürliche nächste Schritt in den Planer (Liste entsteht dort automatisch). */}
          <div className="mt-8 border-t border-line pt-6">
            <p className="font-serif text-h3 text-ink mb-1">
              {de
                ? "Schluss mit Tippen: Im Wochenplaner schreibt sich diese Liste von selbst."
                : "Stop typing lists: in the weekly planner this list writes itself."}
            </p>
            <p className="text-base text-ink-2 mb-4">
              {de
                ? "Rezepte wählen, und die Einkaufsliste mit €-Summe kommt automatisch. Kostenlos, ohne Werbung."
                : "Pick recipes and your shopping list with a € total is generated automatically. Free, no ads."}
            </p>
            <Button href="/weekly-meal-planner">
              {de ? "Wochenplaner kostenlos starten" : "Start the free meal planner"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
