import { NextResponse } from "next/server";
import { getScene } from "@/lib/scenes";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const scene = await getScene(params.slug);
  if (!scene) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ scene });
}