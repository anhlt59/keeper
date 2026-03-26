"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Lang, translations } from "@/lib/i18n/translations";

const STORAGE_KEY = "zoo-lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Translate a key — returns the key itself if no translation found */
  t: (key: string) => string;
}

/** Default value used during SSR / before LanguageProvider is mounted */
const defaultT = (key: string) => translations[key]?.["en"] ?? key;

const defaultContext: LanguageContextValue = {
  lang: "en",
  setLang: () => {},
  t: defaultT,
};

const LanguageContext = createContext<LanguageContextValue>(defaultContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "vi") {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
