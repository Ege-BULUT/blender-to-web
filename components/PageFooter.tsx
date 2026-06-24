"use client";

import { useTranslation } from "@/lib/translations/useTranslation";

export default function PageFooter() {
  const { t } = useTranslation();
  
  return (
    <footer className="landing-footer">
      <p>{t("copyright")}</p>
    </footer>
  );
}