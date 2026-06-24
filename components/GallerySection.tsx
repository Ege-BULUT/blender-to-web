"use client";

import { useTranslation } from "@/lib/translations/useTranslation";
import dynamic from "next/dynamic";
import UploadButton from "./UploadButton";
import type { SceneEntry } from "@/lib/types";

const GalleryClient = dynamic(() => import("./GalleryClient"), {
  ssr: false,
  loading: () => <div className="gallery-loading">Galeri yükleniyor...</div>,
});

export default function GallerySection({ scenes }: { scenes: SceneEntry[] }) {
  const { t } = useTranslation();
  
  return (
    <section className="gallery-section">
      <h2>{t("sceneGallery")}</h2>
      <GalleryClient scenes={scenes} />
      <UploadButton />
    </section>
  );
}