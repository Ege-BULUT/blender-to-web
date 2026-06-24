import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files") as File[];
    const metadataStr = form.get("metadata") as string | null;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

    const slug = metadata.slug || "scene";
    const scenesDir = path.join(process.cwd(), "public", "scenes", slug);
    await fs.mkdir(scenesDir, { recursive: true });

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO || "Ege-BULUT/blender-to-web";
    const BRANCH = process.env.GITHUB_BRANCH || "main";

    if (GITHUB_TOKEN) {
      const pushed = await pushToGitHub(files, metadata, slug, GITHUB_TOKEN, REPO, BRANCH);
      if (!pushed.ok) {
        return NextResponse.json({ success: false, error: pushed.error }, { status: 500 });
      }
    } else {
      for (const file of files) {
        const buf = Buffer.from(await file.arrayBuffer());
        if (file.name === "meta.json") {
          await fs.writeFile(path.join(scenesDir, "meta.json"), JSON.stringify(metadata, null, 2));
        } else if (file.name.endsWith(".glb") || file.name.endsWith(".gltf")) {
          await fs.writeFile(path.join(scenesDir, "scene.glb"), buf);
        }
      }
      await fs.writeFile(path.join(scenesDir, "meta.json"), JSON.stringify(metadata, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function pushToGitHub(files: File[], metadata: any, slug: string, token: string, repo: string, branch: string) {
  const api = `https://api.github.com/repos/${repo}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const refRes = await fetch(`${api}/git/refs/heads/${branch}`, { headers });
  if (!refRes.ok) return { ok: false, error: `ref fetch failed: ${refRes.status}` };
  const ref = await refRes.json();
  const baseSha = ref.object.sha;

  const treeItems: any[] = [];
  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const content = buf.toString("base64");
    let filename = file.name;
    if (file.name.endsWith(".glb") || file.name.endsWith(".gltf")) filename = "scene.glb";
    const filepath = `public/scenes/${slug}/${filename}`;
    treeItems.push({ path: filepath, mode: "100644", type: "blob", content });
  }
  treeItems.push({
    path: `public/scenes/${slug}/meta.json`,
    mode: "100644",
    type: "blob",
    content: JSON.stringify(metadata, null, 2),
  });

  const treeRes = await fetch(`${api}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tree: treeItems }),
  });
  if (!treeRes.ok) return { ok: false, error: `tree create failed: ${treeRes.status}` };
  const tree = await treeRes.json();

  const commitRes = await fetch(`${api}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: `feat: add scene ${slug}`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });
  if (!commitRes.ok) return { ok: false, error: `commit create failed: ${commitRes.status}` };
  const commit = await commitRes.json();

  const updateRefRes = await fetch(`${api}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ sha: commit.sha }),
  });
  if (!updateRefRes.ok) return { ok: false, error: `ref update failed: ${updateRefRes.status}` };

  return { ok: true };
}