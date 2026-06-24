"use client";

import { useAppContext } from "@/contexts/AppContext";
import { useTranslation } from "@/lib/translations/useTranslation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { language, setLanguage, theme, setTheme } = useAppContext();
  const { t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="landing-header">
      <span className="landing-logo">Blender to Web</span>
      <div className="header-controls">
        <nav className="landing-nav">
          <a href="/docs">{t("docs")}</a>
          <a href="https://github.com/Ege-BULUT/blender-to-web" target="_blank" rel="noopener noreferrer">{t("github")}</a>
        </nav>
        <div className="header-dropdowns">
          <div className="dropdown" ref={langRef}>
            <button className="dropdown-trigger" onClick={() => setLangOpen(!langOpen)}>
              {language === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"} ▼
            </button>
            {langOpen && (
              <div className="dropdown-menu">
                <button
                  className={`dropdown-item ${language === "tr" ? "active" : ""}`}
                  onClick={() => { setLanguage("tr"); setLangOpen(false); }}
                >
                  🇹🇷 Türkçe
                </button>
                <button
                  className={`dropdown-item ${language === "en" ? "active" : ""}`}
                  onClick={() => { setLanguage("en"); setLangOpen(false); }}
                >
                  🇬🇧 English
                </button>
              </div>
            )}
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
            title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}