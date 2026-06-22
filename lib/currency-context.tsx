"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type CurrencyCode = "GBP" | "USD" | "EUR" | "CAD" | "AUD";

export const CURRENCIES: Record<CurrencyCode, { symbol: string; locale: string; label: string }> = {
  GBP: { symbol: "£", locale: "en-GB", label: "GBP – £" },
  USD: { symbol: "$", locale: "en-US", label: "USD – $" },
  EUR: { symbol: "€", locale: "de-DE", label: "EUR – €" },
  CAD: { symbol: "CA$", locale: "en-CA", label: "CAD – CA$" },
  AUD: { symbol: "A$", locale: "en-AU", label: "AUD – A$" },
};

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  GB: "GBP",
  US: "USD", CA: "CAD", AU: "AUD",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR",
  NL: "EUR", AT: "EUR", BE: "EUR", PT: "EUR",
  IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
};

interface CurrencyContextType {
  currency: CurrencyCode;
  rate: number;
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (gbpPence: number) => string;
}

const defaultFormat = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(p / 100);

export const CurrencyContext = createContext<CurrencyContextType>({
  currency: "GBP",
  rate: 1,
  setCurrency: () => {},
  formatPrice: defaultFormat,
});

const RATE_KEY = "shoko_fx";
const RATE_TTL = 60 * 60 * 1000;

async function loadRates(): Promise<Record<string, number>> {
  try {
    const cached = localStorage.getItem(RATE_KEY);
    if (cached) {
      const { ts, rates } = JSON.parse(cached);
      if (Date.now() - ts < RATE_TTL) return rates;
    }
  } catch {}
  try {
    const data = await fetch("https://api.exchangerate-api.com/v4/latest/GBP").then((r) => r.json());
    const rates: Record<string, number> = data.rates;
    try {
      localStorage.setItem(RATE_KEY, JSON.stringify({ ts: Date.now(), rates }));
    } catch {}
    return rates;
  } catch {
    return {};
  }
}

function makeFormatter(currency: CurrencyCode, rate: number) {
  const { locale } = CURRENCIES[currency];
  return (gbpPence: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format((gbpPence / 100) * rate);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("GBP");
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem("shoko_currency") as CurrencyCode | null;

    if (saved && CURRENCIES[saved]) {
      setCurrencyState(saved);
      if (saved !== "GBP") {
        loadRates().then((rates) => setRate(rates[saved] ?? 1));
      }
      return;
    }

    // Auto-detect from IP
    fetch("/api/currency/detect")
      .then((r) => r.json())
      .then(({ currency: detected }: { currency: string }) => {
        const code = (CURRENCIES[detected as CurrencyCode] ? detected : "GBP") as CurrencyCode;
        setCurrencyState(code);
        if (code !== "GBP") {
          loadRates().then((rates) => setRate(rates[code] ?? 1));
        }
      })
      .catch(() => {});
  }, []);

  function setCurrency(code: CurrencyCode) {
    setCurrencyState(code);
    localStorage.setItem("shoko_currency", code);
    if (code === "GBP") {
      setRate(1);
    } else {
      loadRates().then((rates) => setRate(rates[code] ?? 1));
    }
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, rate, setCurrency, formatPrice: makeFormatter(currency, rate) }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export { COUNTRY_CURRENCY };
