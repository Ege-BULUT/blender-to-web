"use client";

import { useTranslation } from "@/lib/translations/useTranslation";

const PLUGIN_DOWNLOAD_URL = "https://github.com/Ege-BULUT/blender-to-web/releases/latest/download/blender_to_web.py";

export default function CtaSection() {
  const { t } = useTranslation();
  
  return (
    <section className="cta-section">
      <h2>{t("downloadPlugin")}</h2>
      <p>{t("downloadPluginSubtitle")}</p>
      <a className="btn-primary btn-download" href={PLUGIN_DOWNLOAD_URL} download>
        {t("downloadButton")}
      </a>
    </section>
  );
}