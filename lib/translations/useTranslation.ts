import { useAppContext } from "@/contexts/AppContext";
import { translations } from ".";

type TranslationKey = keyof typeof translations.tr;

export function useTranslation() {
  const { language } = useAppContext();
  
  const t = (key: TranslationKey) => {
    return translations[language][key] || translations.tr[key] || key;
  };
  
  return { t, language };
}