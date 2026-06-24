"use client";

import { useTranslation } from "@/lib/translations/useTranslation";

export default function AboutSection() {
  const { t } = useTranslation();
  
  return (
    <section className="about-section">
      <h2>{t("howItWorks")}</h2>
      <p>{t("howItWorksSubtitle")}</p>
      <div className="steps">
        <div className="step">
          <span className="step-num">1</span>
          <div className="step-content">
            <div className="step-title">{t("step1Title")}</div>
            <div className="step-desc">{t("step1Desc")}</div>
          </div>
        </div>
        <div className="step">
          <span className="step-num">2</span>
          <div className="step-content">
            <div className="step-title">{t("step2Title")}</div>
            <div className="step-desc">{t("step2Desc")}</div>
          </div>
        </div>
        <div className="step">
          <span className="step-num">3</span>
          <div className="step-content">
            <div className="step-title">{t("step3Title")}</div>
            <div className="step-desc">{t("step3Desc")}</div>
          </div>
        </div>
        <div className="step">
          <span className="step-num">4</span>
          <div className="step-content">
            <div className="step-title">{t("step4Title")}</div>
            <div className="step-desc">{t("step4Desc")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}