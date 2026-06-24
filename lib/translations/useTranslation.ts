import { useAppContext } from "@/contexts/AppContext";
import { translations } from ".";

type TranslationKey = keyof typeof translations.tr;

export function useTranslation() {
  const { language } = useAppContext();
  
  const t = (key: TranslationKey) => {
    const lang = translations[language] as Record<string, string>;
    return lang[key] || translations.tr[key] || key;
  };
  
  return { t, language };
}