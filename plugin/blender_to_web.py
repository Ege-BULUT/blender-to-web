bl_info = {
    "name": "Blender to Web (glTF + meta)",
    "author": "blender_to_web",
    "version": (0, 1, 0),
    "blender": (4, 0, 0),
    "location": "File > Export > Web Gallery Scene",
    "description": "Export active scene as glTF (.glb) plus a meta.json sidecar for the web gallery.",
    "category": "Export",
}

import bpy
import json
import os
import re
import zipfile
from datetime import datetime, timezone

EXPORTER_VERSION = "0.2.0"


def slugify(value: str) -> str:
    if not value:
        return "scene"
    s = value.strip().lower()
    s = re.sub(r"[^a-z0-9._-]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "scene"


def default_output_dir() -> str:
    # ponytail: user home altinda tek klasor, ayar yok
    home = os.path.expanduser("~")
    return os.path.join(home, "blender_to_web_exports")


def active_camera_dict():
    cam = bpy.context.scene.camera
    if cam is None:
        return None
    pos = cam.location
    # target: kamera bakis yonu, -Z forward
    target = cam.matrix_world.to_translation() + cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))
    return {
        "position": [round(pos.x, 4), round(pos.y, 4), round(pos.z, 4)],
        "target": [round(target.x, 4), round(target.y, 4), round(target.z, 4)],
    }


from mathutils import Vector  # noqa: E402


def write_meta(path: str, props) -> None:
    scene = bpy.context.scene
    meta = {
        "slug": props.slug,
        "title": props.title,
        "description": props.description,
        "author": getattr(props, "author", ""),
        "tags": [t.strip() for t in props.tags.split(",") if t.strip()] if props.tags else [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "blender_version": bpy.app.version_string,
        "exporter_version": EXPORTER_VERSION,
        "scene_name": scene.name,
        "camera_default": active_camera_dict(),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)


class WEBGALLERY_OT_export(bpy.types.Operator):
    """Export scene as glTF + meta.json for the web gallery."""

    bl_idname = "export_scene.web_gallery"
    bl_label = "Web Gallery Scene"
    bl_options = {"REGISTER", "UNDO"}

    title: bpy.props.StringProperty(
        name="Title",
        description="Galeride kart basligi olarak görünecek metin",
        default="",
    )
    description: bpy.props.StringProperty(
        name="Description",
        description="Hoverda görünecek kisa açiklama",
        default="",
    )
    tags: bpy.props.StringProperty(
        name="Tags",
        description="Virgülle ayrilmis etiketler (örn: interior, morning)",
        default="",
    )
    author: bpy.props.StringProperty(
        name="Author",
        description="Sahne sahibi / yazar adi",
        default="",
    )
    slug: bpy.props.StringProperty(
        name="Slug",
        description="Klasör ve URL adi, bos birakilirse title'dan üretilir",
        default="",
    )
    output_dir: bpy.props.StringProperty(
        name="Output Directory",
        description="Scene klasörlerinin olusturulacagi ana dizin",
        default="",
        subtype="DIR_PATH",
    )
    include_cameras: bpy.props.BoolProperty(
        name="Include Cameras",
        default=True,
    )
    include_lights: bpy.props.BoolProperty(
        name="Include Lights",
        default=True,
    )

    @classmethod
    def poll(cls, context):
        return context.scene is not None

    def invoke(self, context, event):
        if not self.title:
            self.title = context.scene.name or "Scene"
        if not self.slug:
            self.slug = slugify(self.title)
        if not self.output_dir:
            self.output_dir = default_output_dir()
        return context.window_manager.invoke_props_dialog(self)

    def execute(self, context):
        slug = slugify(self.slug) if self.slug else slugify(self.title)
        if not slug:
            slug = "scene"

        out_root = bpy.path.abspath(self.output_dir)
        scene_dir = os.path.join(out_root, slug)
        os.makedirs(scene_dir, exist_ok=True)

        glb_path = os.path.join(scene_dir, "scene.glb")
        meta_path = os.path.join(scene_dir, "meta.json")

        try:
            bpy.ops.export_scene.gltf(
                filepath=glb_path,
                export_format="GLB",
                export_apply=True,
                export_yup=True,
                export_cameras=self.include_cameras,
                export_lights=self.include_lights,
                use_selection=False,
            )
        except Exception as exc:
            self.report({"ERROR"}, f"glTF export failed: {exc}")
            return {"CANCELLED"}

        try:
            write_meta(meta_path, self)
        except Exception as exc:
            self.report({"ERROR"}, f"meta.json write failed: {exc}")
            return {"CANCELLED"}

        zip_path = os.path.join(out_root, f"{slug}.zip")
        try:
            with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
                zf.write(glb_path, "scene.glb")
                zf.write(meta_path, "meta.json")
        except Exception as exc:
            self.report({"WARNING"}, f"ZIP creation failed: {exc}, GLB+JSON exported separately")

        self.report({"INFO"}, f"Exported to {scene_dir}" + (f" + {zip_path}" if os.path.exists(zip_path) else ""))
        return {"FINISHED"}


def menu_func_export(self, context):
    self.layout.operator(WEBGALLERY_OT_export.bl_idname, text="Web Gallery Scene (.glb + meta)")


classes = (WEBGALLERY_OT_export,)


def register():
    for c in classes:
        bpy.utils.register_class(c)
    bpy.types.TOPBAR_MT_file_export.append(menu_func_export)


def unregister():
    try:
        bpy.types.TOPBAR_MT_file_export.remove(menu_func_export)
    except ValueError:
        pass
    for c in reversed(classes):
        try:
            bpy.utils.unregister_class(c)
        except RuntimeError:
            pass


if __name__ == "__main__":
    register()