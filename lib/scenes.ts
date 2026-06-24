import fs from "node:fs/promises";
import path from "node:path";
import type { SceneEntry, SceneMeta } from "./types";

const SCENES_DIR = path.join(process.cwd(), "public", "scenes");

async function readMeta(dir: string, slug: string): Promise<SceneMeta | null> {
  try {
    const raw = await fs.readFile(path.join(dir, "meta.json"), "utf-8");
    const parsed = JSON.parse(raw) as SceneMeta;
    if (!parsed.slug) parsed.slug = slug;
    if (!parsed.title) parsed.title = slug;
    return parsed;
  } catch {
    // ponytail: meta yoksa minimal default
    return { slug, title: slug };
  }
}

export async function listScenes(): Promise<SceneEntry[]> {
  try {
    const entries = await fs.readdir(SCENES_DIR, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory());
    const out: SceneEntry[] = [];
    for (const d of dirs) {
      const dir = path.join(SCENES_DIR, d.name);
      const glb = path.join(dir, "scene.glb");
      try {
        await fs.access(glb);
      } catch {
        continue;
      }
      const meta = await readMeta(dir, d.name);
      out.push({
        ...meta,
        slug: meta?.slug ?? d.name,
        title: meta?.title ?? d.name,
        glbPath: `/scenes/${d.name}/scene.glb`,
      });
    }
    out.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    return out;
  } catch {
    return [];
  }
}

export async function getScene(slug: string): Promise<SceneEntry | null> {
  const dir = path.join(SCENES_DIR, slug);
  try {
    await fs.access(path.join(dir, "scene.glb"));
  } catch {
    return null;
  }
  const meta = await readMeta(dir, slug);
  return {
    ...meta,
    slug: meta?.slug ?? slug,
    title: meta?.title ?? slug,
    glbPath: `/scenes/${slug}/scene.glb`,
  };
}