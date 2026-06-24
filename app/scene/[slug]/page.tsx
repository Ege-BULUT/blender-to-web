import dynamic from "next/dynamic";
import { getScene } from "@/lib/scenes";
import { notFound } from "next/navigation";

const EditorClient = dynamic(() => import("@/components/EditorClient"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 24, color: "#888" }}>Editor yukleniyor...</div>
  ),
});

export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const scene = await getScene(params.slug);
  if (!scene) notFound();
  return <EditorClient scene={scene} />;
}