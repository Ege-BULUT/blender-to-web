import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";

export const metadata: Metadata = {
  title: "Blender to Web",
  description:
    "Blender sahnelerini web'e tasi. 3D galeri ve editor ile Blender exportlarini aninda goruntule, duzenle, paylas.",
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