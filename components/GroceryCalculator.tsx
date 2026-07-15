"use client";

import { useMemo, useState } from "react";
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      {/* Eingabezeile */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          list="grocery-calc-suggestions"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder={tr("Ingredient, e.g. chicken breast…", "Zutat, z. B. Hähnchenbrust…")}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
        />
        <datalist id="grocery-calc-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="flex gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder={tr("Amount", "Menge")}
            inputMode="decimal"
            className="w-24 px-3 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-3 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-orange-300"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{unitLabel(u)}</option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={!name.trim() || !amount.trim()}
            className="px-5 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 flex-shrink-0"
            style={{ background: "#f97316" }}
          >
            +
          </button>
        </div>
      </div>

      {/* Beispiel laden */}
      {items.length === 0 && (
        <button
          onClick={loadExample}
          className="mt-3 text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          {tr("Try an example weekly shop →", "Beispiel-Wocheneinkauf laden →")}
        </button>
      )}

      {/* Liste */}
      {items.length > 0 && (
        <div className="mt-5 space-y-1">
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 group">
              <span className="flex-1 text-sm font-medium text-gray-800 capitalize">{i.name}</span>
              <span className="text-xs text-gray-500">
                {String(i.amount).replace(".", de ? "," : ".")} {unitLabel(i.unit)}
              </span>
              <span className="text-sm font-semibold text-gray-700 w-20 text-right tabular-nums">
                {typeof i.price === "number" ? formatEstPrice(i.price, locale) : "–"}
              </span>
              <button
                onClick={() => remove(i.id)}
                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 rounded-lg"
                title={tr("Remove", "Entfernen")}
              >
                ×
              </button>
            </div>
          ))}

          {/* Summe */}
          <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-4 px-3">
            <span className="text-sm font-bold text-gray-900">
              {tr("Estimated total", "Geschätzte Gesamtkosten")}
            </span>
            <span className="text-2xl font-bold text-orange-600 tabular-nums">
              {formatEstPrice(total, locale)}
            </span>
          </div>
          {unpriced > 0 && (
            <p className="px-3 text-xs text-gray-400">
              {de
                ? `${unpriced} Zutat${unpriced > 1 ? "en" : ""} ohne Preisschätzung (nicht in der Summe).`
                : `${unpriced} item${unpriced > 1 ? "s" : ""} without a price estimate (not included in the total).`}
            </p>
          )}
          <p className="px-3 pt-1 text-[11px] text-gray-300">
            {de
              ? "Schätzung auf Discounter-Niveau (Eigenmarken). Tatsächliche Preise variieren je nach Markt und Region."
              : "Estimates at discount-store level (own brands). Actual prices vary by store and region."}
          </p>
        </div>
      )}
    </div>
  );
}
