import { NextResponse } from "next/server";
import { listScenes } from "@/lib/scenes";

export const dynamic = "force-dynamic";

export async function GET() {
  const scenes = await listScenes();
  return NextResponse.json({ scenes });
}