export type Vec3 = [number, number, number];

export interface SceneMeta {
  slug: string;
  title: string;
  description?: string;
  tags?: string[];
  author?: string;
  created_at?: string;
  blender_version?: string;
  exporter_version?: string;
  scene_name?: string;
  camera_default?: {
    position: Vec3;
    target: Vec3;
  } | null;
}

export interface SceneEntry extends SceneMeta {
  glbPath: string;
}