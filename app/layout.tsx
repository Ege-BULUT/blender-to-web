import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://blender-to-web.vercel.app"),
  verification: { google: "s66rd8O_x1saL6PLGpSpIPeHmGazHyTo27NTPkK-GJg" },
  title: "Blender to Web",
  description:
    "Blender sahnelerini web'e tasi. 3D galeri ve editor ile Blender exportlarini aninda goruntule, duzenle, paylas.",
  openGraph: {
    type: "website",
    siteName: "Blender to Web",
    title: "Blender to Web",
    description: "Blender sahnelerini web'e taşı: 3D galeri ve editör ile exportları anında görüntüle, düzenle, paylaş.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}