import type { CurrencyCode } from "./types";

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "US dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British pound (GBP)" },
  { code: "CAD", label: "Canadian dollar (CAD)" },
  { code: "AUD", label: "Australian dollar (AUD)" },
  { code: "AED", label: "UAE dirham (AED)" },
  { code: "INR", label: "Indian rupee (INR)" },
  { code: "PKR", label: "Pakistani rupee (PKR)" },
];

export interface MoneyFormatter {
  /** $12,345 */
  full: (n: number) => string;
  /** $12.3K */
  compact: (n: number) => string;
  code: CurrencyCode;
}

const cache = new Map<CurrencyCode, MoneyFormatter>();

/**
 * Display-only currency formatting. Amounts in the sample dataset are stored in
 * one base currency; changing the preference changes the symbol, it does NOT
 * convert values (no exchange rates are used in the demo).
 */
export function moneyFormatter(code: CurrencyCode): MoneyFormatter {
  const existing = cache.get(code);
  if (existing) return existing;
  // Explicit min/max digits keep server (Node) and browser output identical.
  const full = new Intl.NumberFormat("en-US", { style: "currency", currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const formatter: MoneyFormatter = { full: (n) => full.format(n), compact: (n) => compact.format(n), code };
  cache.set(code, formatter);
  return formatter;
}

export const usd = moneyFormatter("USD");

const numberFmt = new Intl.NumberFormat("en-US");
export const formatNumber = (n: number) => numberFmt.format(n);

export function formatPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

export function formatSignedPercent(n: number, digits = 0): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}
