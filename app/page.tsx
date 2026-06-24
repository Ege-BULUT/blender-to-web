import { listScenes } from "@/lib/scenes";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import CtaSection from "@/components/CtaSection";
import PageFooter from "@/components/PageFooter";
import GallerySection from "@/components/GallerySection";
import Header from "@/components/Header";

export const revalidate = 0;

export default async function Page() {
  const scenes = await listScenes();
  return (
    <div className="landing">
      <Header />
      <HeroSection />
      <GallerySection scenes={scenes} />
      <hr className="divider" />
      <AboutSection />
      <hr className="divider" />
      <CtaSection />
      <PageFooter />
    </div>
  );
}
