"use client";

import { useTranslation } from "@/lib/translations/useTranslation";

export default function HeroSection() {
  const { t } = useTranslation();
  
  const parseTitle = (text: string) => {
    const parts = text.split(/<0>(.*?)<\/0>/);
    if (parts.length === 1) return text;
    
    return (
      <>
        {parts[0]}
        <span>{parts[1]}</span>
        {parts[2] || ''}
      </>
    );
  };
  
  return (
    <section className="hero">
      <div className="hero-badge">
        <span>{t("heroBadge")}</span>
      </div>
      <h1>
        {parseTitle(t("heroTitle"))}
      </h1>
      <p className="hero-sub">{t("heroSubtitle")}</p>
    </section>
  );
}