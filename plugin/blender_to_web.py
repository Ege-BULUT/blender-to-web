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

EXPORTER_VERSION = "0.3.1"


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
        "export_settings": {
            "max_texture_size": getattr(props, "max_texture_size", 0),
            "jpeg_quality": getattr(props, "jpeg_quality", 85),
            "bake_textures": getattr(props, "bake_textures", False),
            "include_cameras": getattr(props, "include_cameras", True),
            "include_lights": getattr(props, "include_lights", True),
        },
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)


def resize_image(img, max_size):
    if img.size[0] <= max_size and img.size[1] <= max_size:
        return
    ratio = min(max_size / img.size[0], max_size / img.size[1])
    new_w = int(img.size[0] * ratio)
    new_h = int(img.size[1] * ratio)
    img.scale(new_w, new_h)


def bake_node_textures(material, max_size, jpeg_quality):
    if not material.use_nodes:
        return
    for node in material.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            img = node.image
            if max_size > 0:
                resize_image(img, max_size)
            if img.filepath_raw:
                img.filepath_raw = bpy.path.ensure_ext(img.filepath_raw, '.jpg')
            img.file_format = 'JPEG'
            img.quality = jpeg_quality


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
    max_texture_size: bpy.props.IntProperty(
        name="Max Texture Size",
        description="Texture'lari bu boyuta kadar kucult (0 = limit yok)",
        default=1024,
        min=0,
        max=4096,
    )
    jpeg_quality: bpy.props.IntProperty(
        name="JPEG Quality",
        description="Texture kalitesi (1-100, 100 = kayipsiz)",
        default=85,
        min=1,
        max=100,
    )
    bake_textures: bpy.props.BoolProperty(
        name="Bake Textures",
        description="Tum texture'lari diffuse'a bake et (dosya boyutunu kuculturur)",
        default=False,
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

        if self.bake_textures:
            try:
                self._bake_all_textures(context)
            except Exception as exc:
                self.report({"WARNING"}, f"Texture baking failed: {exc}")

        if self.max_texture_size > 0:
            try:
                self._resize_textures(self.max_texture_size)
            except Exception as exc:
                self.report({"WARNING"}, f"Texture resize failed: {exc}")

        for obj in context.scene.objects:
            if obj.type == 'MESH':
                for mod in obj.modifiers:
                    try:
                        context.view_layer.objects.active = obj
                        obj.select_set(True)
                        bpy.ops.object.modifier_apply(modifier=mod.name)
                    except Exception:
                        pass
                obj.select_set(False)

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
            self.report({"WARNING"}, f"ZIP creation failed: {exc}")

        self.report({"INFO"}, f"Exported to {scene_dir}" + (f" + {zip_path}" if os.path.exists(zip_path) else ""))
        return {"FINISHED"}

    def _bake_all_textures(self, context):
        orig_engine = context.scene.render.engine
        context.scene.render.engine = 'CYCLES'
        context.scene.cycles.bake_type = 'DIFFUSE'
        context.scene.render.bake.use_pass_direct = False
        context.scene.render.bake.use_pass_indirect = False
        context.scene.render.bake.use_selected_to_active = False

        selected = context.selected_objects
        bpy.ops.object.select_all(action='DESELECT')

        for obj in context.scene.objects:
            if obj.type != 'MESH':
                continue
            obj.select_set(True)
            context.view_layer.objects.active = obj
            if obj.data.materials:
                try:
                    bpy.ops.object.bake(type='DIFFUSE')
                except Exception:
                    pass
            obj.select_set(False)

        for obj in selected:
            obj.select_set(True)
        context.scene.render.engine = orig_engine

    def _resize_textures(self, max_size):
        for img in bpy.data.images:
            if img.name == 'Render Result':
                continue
            if not img.has_data:
                continue
            if img.size[0] > max_size or img.size[1] > max_size:
                ratio = min(max_size / img.size[0], max_size / img.size[1])
                new_w = max(1, int(img.size[0] * ratio))
                new_h = max(1, int(img.size[1] * ratio))
                img.scale(new_w, new_h)


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