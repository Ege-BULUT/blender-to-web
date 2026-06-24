"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "tr" | "en";
type Theme = "dark" | "light";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("tr");
  const [theme, setTheme] = useState<Theme>("dark");

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    const savedTheme = localStorage.getItem("theme");
    
    if (savedLang === "en" || savedLang === "tr") {
      setLanguage(savedLang);
    }
    
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
    localStorage.setItem("theme", theme);
  }, [language, theme]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <AppContext.Provider value={{ language, setLanguage, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}