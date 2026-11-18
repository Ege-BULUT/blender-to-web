import type { MetadataRoute } from "next";

const BASE = "https://blender-to-web.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/docs"].map((p) => ({ url: BASE + p, lastModified: new Date() }));
}
