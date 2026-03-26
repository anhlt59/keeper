"use client";

import { GlobeIcon } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";

/** Compact language toggle button for the header */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLang(lang === "en" ? "vi" : "en")}
      className="gap-1.5 text-xs font-medium cursor-pointer"
    >
      <GlobeIcon className="h-4 w-4" />
      {lang === "en" ? "VI" : "EN"}
    </Button>
  );
}
