"use client";

import { useAppContext } from "@/contexts/AppContext";
import { useTranslation } from "@/lib/translations/useTranslation";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { language, setLanguage, theme, setTheme } = useAppContext();
  const { t } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
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
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">{t("github")}</a>
        </nav>
        <div className="header-dropdowns">
          <div className="dropdown" ref={langRef}>
            <button className="dropdown-trigger" onClick={() => setLangOpen(!langOpen)}>
              {t("language")} ▼
            </button>
            {langOpen && (
              <div className="dropdown-menu">
                <button 
                  className={`dropdown-item ${language === "tr" ? "active" : ""}`}
                  onClick={() => { setLanguage("tr"); setLangOpen(false); }}
                >
                  Türkçe
                </button>
                <button 
                  className={`dropdown-item ${language === "en" ? "active" : ""}`}
                  onClick={() => { setLanguage("en"); setLangOpen(false); }}
                >
                  English
                </button>
              </div>
            )}
          </div>
          <div className="dropdown" ref={themeRef}>
            <button className="dropdown-trigger" onClick={() => setThemeOpen(!themeOpen)}>
              {t("theme")} ▼
            </button>
            {themeOpen && (
              <div className="dropdown-menu">
                <button 
                  className={`dropdown-item ${theme === "dark" ? "active" : ""}`}
                  onClick={() => { setTheme("dark"); setThemeOpen(false); }}
                >
                  {t("dark")}
                </button>
                <button 
                  className={`dropdown-item ${theme === "light" ? "active" : ""}`}
                  onClick={() => { setTheme("light"); setThemeOpen(false); }}
                >
                  {t("light")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}