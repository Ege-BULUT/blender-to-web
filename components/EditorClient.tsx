"use client";

import { Canvas, useThree } from "@react-three/fiber";
import {
  CameraControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  TransformControls,
  useGLTF,
} from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { SceneEntry, Vec3 } from "@/lib/types";
import { useAppContext } from "@/contexts/AppContext";

type ObjKind = "mesh" | "light";
type LightType = "ambient" | "point" | "directional" | "spot";

interface SceneObj {
  id: string;
  kind: ObjKind;
  name: string;
  lightType?: LightType;
}

const LIGHT_TYPES: LightType[] = ["ambient", "point", "directional", "spot"];

let idCounter = 0;
const newId = () => `obj_${++idCounter}_${Date.now().toString(36)}`;

export default function EditorClient({ scene }: { scene: SceneEntry }) {
  const [objects, setObjects] = useState<SceneObj[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [clip, setClip] = useState<THREE.Object3D | null>(null);

  const objectMap = useRef<Map<string, THREE.Object3D>>(new Map());
  const sceneRef = useRef<THREE.Group>(null);
  const cameraControlsRef = useRef<CameraControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportMeta, setExportMeta] = useState({ slug: scene.slug, title: scene.title, description: scene.description || "", tags: (scene.tags || []).join(", "), author: scene.author || "" });
  const [cameraDefault] = useState<{ position: Vec3; target: Vec3 } | null>(
    scene.camera_default ?? null
  );

  // glb yükle, kök objeleri kaydet
  const gltf = useGLTF(scene.glbPath);
  const gltfRoot = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    const list: THREE.Object3D[] = [];
    gltfRoot.traverse((o) => {
      if (o.name === "") o.name = `${o.type}_${newId()}`;
      if ((o as THREE.Mesh).isMesh || (o as THREE.Light).isLight) {
        list.push(o);
      }
    });
    const objs: SceneObj[] = list.map((o) => {
      const isLight = (o as THREE.Light).isLight;
      const id = newId();
      objectMap.current.set(id, o);
      return {
        id,
        kind: isLight ? "light" : "mesh",
        name: o.name,
        lightType: isLight ? ((o as unknown as { type: string }).type.toLowerCase() as LightType) : undefined,
      };
    });
    setObjects(objs);
  }, [gltfRoot]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (!t.closest(".menu-root")) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selectedObj = selectedId ? objectMap.current.get(selectedId) ?? null : null;

  function addLight(type: LightType) {
    const id = newId();
    let light: THREE.Light;
    const name = `${type}_${id.slice(-4)}`;
    if (type === "ambient") {
      light = new THREE.AmbientLight(0xffffff, 0.6);
    } else if (type === "point") {
      light = new THREE.PointLight(0xffffff, 50, 0, 2);
      light.position.set(2, 3, 2);
    } else if (type === "directional") {
      light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(4, 6, 5);
    } else {
      const s = new THREE.SpotLight(0xffffff, 100, 0, Math.PI / 6, 0.3, 2);
      s.position.set(3, 5, 3);
      light = s;
    }
    light.name = name;
    objectMap.current.set(id, light);
    sceneRef.current?.add(light);
    setObjects((arr) => [...arr, { id, kind: "light", name, lightType: type }]);
    setSelectedId(id);
  }

  function addMesh(shape: "box" | "sphere" | "plane") {
    const id = newId();
    let geo: THREE.BufferGeometry;
    if (shape === "box") geo = new THREE.BoxGeometry(1, 1, 1);
    else if (shape === "sphere") geo = new THREE.SphereGeometry(0.6, 32, 16);
    else geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `${shape}_${id.slice(-4)}`;
    mesh.position.set(0, 0.6, 0);
    objectMap.current.set(id, mesh);
    sceneRef.current?.add(mesh);
    setObjects((arr) => [...arr, { id, kind: "mesh", name: mesh.name }]);
    setSelectedId(id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    const obj = objectMap.current.get(selectedId);
    if (!obj) return;
    // glb kökünden degil, sceneRef altindan kaldirmak için parent.remove
    obj.parent?.remove(obj);
    objectMap.current.delete(selectedId);
    setObjects((arr) => arr.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selectedId) return;
    const obj = objectMap.current.get(selectedId);
    if (!obj) return;
    const clone = obj.clone(true);
    clone.position.add(new THREE.Vector3(1.2, 0, 0));
    clone.name = `${obj.name}_copy`;
    obj.parent?.add(clone);
    const id = newId();
    objectMap.current.set(id, clone);
    const isLight = (clone as THREE.Light).isLight;
    setObjects((arr) => [
      ...arr,
      {
        id,
        kind: isLight ? "light" : "mesh",
        name: clone.name,
        lightType: isLight ? ((clone as unknown as { type: string }).type.toLowerCase() as LightType) : undefined,
      },
    ]);
    setSelectedId(id);
  }

  function copySelected() {
    if (!selectedId) return;
    const obj = objectMap.current.get(selectedId);
    if (!obj) return;
    setClip(obj.clone(true));
  }

  function pasteClip() {
    if (!clip) return;
    const clone = clip.clone(true);
    clone.position.add(new THREE.Vector3(1.2, 0, 0));
    clone.name = `${clip.name}_paste`;
    sceneRef.current?.add(clone);
    const id = newId();
    objectMap.current.set(id, clone);
    const isLight = (clone as THREE.Light).isLight;
    setObjects((arr) => [
      ...arr,
      {
        id,
        kind: isLight ? "light" : "mesh",
        name: clone.name,
        lightType: isLight ? ((clone as unknown as { type: string }).type.toLowerCase() as LightType) : undefined,
      },
    ]);
    setSelectedId(id);
  }

  async function exportGlb() {
    setExportMeta({
      slug: scene.slug + "_edited",
      title: scene.title + " (Edited)",
      description: scene.description || "",
      tags: (scene.tags || []).join(", "),
      author: scene.author || "",
    });
    setExportModalOpen(true);
    setMenuOpen(false);
  }

  async function doExport() {
    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    const exporter = new GLTFExporter();
    const root = sceneRef.current;
    if (!root) return;
    const tags = exportMeta.tags.split(",").map((s) => s.trim()).filter(Boolean);
    const meta = {
      slug: exportMeta.slug,
      title: exportMeta.title,
      description: exportMeta.description,
      author: exportMeta.author,
      tags,
      created_at: new Date().toISOString(),
      exporter_version: "web-editor",
      scene_name: scene.scene_name || scene.title,
      camera_default: cameraDefault,
    };
    const metaJson = JSON.stringify(meta, null, 2);
    exporter.parse(
      root,
      (result) => {
        const glbBlob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
        const glbUrl = URL.createObjectURL(glbBlob);
        const a = document.createElement("a");
        a.href = glbUrl;
        a.download = "scene.glb";
        a.click();
        URL.revokeObjectURL(glbUrl);
        const metaBlob = new Blob([metaJson], { type: "application/json" });
        const metaUrl = URL.createObjectURL(metaBlob);
        const b = document.createElement("a");
        b.href = metaUrl;
        b.download = "meta.json";
        b.click();
        URL.revokeObjectURL(metaUrl);
        setExportModalOpen(false);
      },
      (err) => console.error("export error", err),
      { binary: true }
    );
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const buffer = await file.arrayBuffer();
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(buffer, "", resolve, reject);
      });
      const imported = gltf.scene;
      imported.name = `imported_${newId().slice(-4)}`;
      sceneRef.current?.add(imported);
      const children: SceneObj[] = [];
      imported.traverse((o: THREE.Object3D) => {
        if (o.name === "") o.name = `${o.type}_${newId().slice(-4)}`;
        if ((o as THREE.Mesh).isMesh || (o as THREE.Light).isLight) {
          const cid = newId();
          objectMap.current.set(cid, o);
          children.push({
            id: cid,
            kind: (o as THREE.Light).isLight ? "light" : "mesh",
            name: o.name,
            lightType: (o as THREE.Light).isLight
              ? ((o as unknown as { type: string }).type.toLowerCase() as LightType)
              : undefined,
          });
        }
      });
      setObjects((arr) => [...arr, ...children]);
      setSelectedId(children[0]?.id ?? null);
    } catch (err) {
      console.error("Import error", err);
    }
    setMenuOpen(false);
  }

  return (
    <div className="editor-shell" data-theme={theme}>
      <input ref={fileInputRef} type="file" accept=".glb,.gltf" style={{ display: "none" }} onChange={handleImportFile} />
      <div className="editor-top">
        <div className="menu-root">
          <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>☰</button>
          {menuOpen && (
            <div className="menu-dropdown">
              <div className="menu-item" onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}>Import GLB...</div>
              <div className="menu-item" onClick={() => { setMenuOpen(false); exportGlb(); }}>Export GLB</div>
              <div className="menu-separator" />
              <div className={`menu-item${theme === "dark" ? " active" : ""}`} onClick={() => { setTheme("dark"); setMenuOpen(false); }}>Blender Dark</div>
              <div className={`menu-item${theme === "light" ? " active" : ""}`} onClick={() => { setTheme("light"); setMenuOpen(false); }}>Blender Light</div>
              <div className="menu-separator" />
              <div className="menu-item" onClick={() => { window.location.href = "/"; }}>← Back to Gallery</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{scene.title}</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className="btn"
            onClick={() => setMode("translate")}
            style={mode === "translate" ? { background: "#2a4d7a", borderColor: "#3a6dac", color: "#fff" } : {}}
          >
            Move
          </button>
          <button
            className="btn"
            onClick={() => setMode("rotate")}
            style={mode === "rotate" ? { background: "#2a4d7a", borderColor: "#3a6dac", color: "#fff" } : {}}
          >
            Rotate
          </button>
          <button
            className="btn"
            onClick={() => setMode("scale")}
            style={mode === "scale" ? { background: "#2a4d7a", borderColor: "#3a6dac", color: "#fff" } : {}}
          >
            Scale
          </button>
        </div>
      </div>

      <div className="editor-left">
        <div className="panel-title">Scene Tree</div>
        {objects.map((o) => (
          <div
            key={o.id}
            className={`tree-item${o.id === selectedId ? " selected" : ""}`}
            onClick={() => setSelectedId(o.id)}
          >
            <span className="type">{o.kind === "light" ? o.lightType ?? "light" : "mesh"}</span>
            <span className="name">{o.name}</span>
          </div>
        ))}

        <div className="panel-title" style={{ marginTop: 18 }}>
          Add Light
        </div>
        <div className="add-menu">
          {LIGHT_TYPES.map((t) => (
            <button key={t} className="btn" onClick={() => addLight(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="panel-title" style={{ marginTop: 12 }}>
          Add Mesh
        </div>
        <div className="add-menu">
          <button className="btn" onClick={() => addMesh("box")}>
            Box
          </button>
          <button className="btn" onClick={() => addMesh("sphere")}>
            Sphere
          </button>
          <button className="btn" onClick={() => addMesh("plane")}>
            Plane
          </button>
        </div>
      </div>

      <div className="editor-canvas">
        <Canvas
          shadows
          camera={{ position: cameraDefault?.position ?? [5, 3, 6], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
        >
          <SceneTheme theme={theme} />
          <CameraControlsImpl
            defaultCam={cameraDefault}
            controlsRef={cameraControlsRef}
          />
          <group ref={sceneRef}>
            <primitive object={gltfRoot} />
          </group>
          <Grid
            args={[40, 40]}
            cellSize={0.5}
            cellColor={theme === "dark" ? "#1a2030" : "#c0c8d8"}
            sectionSize={2}
            sectionColor={theme === "dark" ? "#2a3550" : "#a0a8b8"}
            fadeDistance={30}
            infiniteGrid
          />
          {selectedObj ? (
            <TransformControlsBridge
              object={selectedObj}
              mode={mode}
              cameraControlsRef={cameraControlsRef}
            />
          ) : null}
          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport axisColors={["#ff6b6b", "#6bff8a", "#6b9bff"]} labelColor={theme === "dark" ? "#fff" : "#222"} />
          </GizmoHelper>
        </Canvas>
      </div>

      <div className="editor-right">
        {selectedObj ? (
          <Inspector
            obj={selectedObj}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onCopy={copySelected}
            onPaste={pasteClip}
            canPaste={!!clip}
          />
        ) : (
          <>
            <div className="panel-title">No selection</div>
            <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
              Soldan bir obje seçin. Kamera: sag tik + WASD fly, scroll zoom, middle orbit.
            </div>
          </>
        )}
      </div>

      <div className="editor-bottom">
        <span>{objects.length} objects</span>
        <span style={{ marginLeft: "auto" }}>
          Kamera: WASD + sag-tik fly, scroll dolly, orta-tik orbit
        </span>
      </div>

      {exportModalOpen && (
        <div className="modal-overlay" onClick={() => setExportModalOpen(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h3>Sahne Bilgileri</h3>
            <p>Export öncesi metadata düzenle. scene.glb ve meta.json birlikte indirilecek.</p>
            <div className="metadata-form">
              <div className="form-row">
                <label>Slug (URL)</label>
                <input
                  type="text"
                  value={exportMeta.slug}
                  onChange={(e) => setExportMeta({ ...exportMeta, slug: e.target.value })}
                  placeholder="scene-name"
                />
              </div>
              <div className="form-row">
                <label>Başlık</label>
                <input
                  type="text"
                  value={exportMeta.title}
                  onChange={(e) => setExportMeta({ ...exportMeta, title: e.target.value })}
                  placeholder="Scene Title"
                />
              </div>
              <div className="form-row">
                <label>Açıklama</label>
                <textarea
                  value={exportMeta.description}
                  onChange={(e) => setExportMeta({ ...exportMeta, description: e.target.value })}
                  placeholder="Scene description..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <label>Etiketler (virgülle ayır)</label>
                <input
                  type="text"
                  value={exportMeta.tags}
                  onChange={(e) => setExportMeta({ ...exportMeta, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="form-row">
                <label>Yazar</label>
                <input
                  type="text"
                  value={exportMeta.author}
                  onChange={(e) => setExportMeta({ ...exportMeta, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-close" onClick={() => setExportModalOpen(false)}>
                İptal
              </button>
              <button className="btn-primary" onClick={doExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SceneTheme({ theme }: { theme: "dark" | "light" }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(theme === "dark" ? "#05050a" : "#d8d8e0");
  }, [theme, scene]);
  return null;
}

function CameraControlsImpl({
  defaultCam,
  controlsRef,
}: {
  defaultCam: { position: Vec3; target: Vec3 } | null;
  controlsRef: React.MutableRefObject<CameraControls | null>;
}) {
  const ref = useRef<CameraControls | null>(null);
  const { camera } = useThree();
  useEffect(() => {
    controlsRef.current = ref.current;
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef]);
  useEffect(() => {
    if (defaultCam) {
      camera.position.set(...defaultCam.position);
      const c = ref.current;
      if (c) c.setTarget(...defaultCam.target);
    }
  }, [defaultCam, camera]);
  return <CameraControls ref={ref} />;
}

function TransformControlsBridge({
  object,
  mode,
  cameraControlsRef,
}: {
  object: THREE.Object3D;
  mode: "translate" | "rotate" | "scale";
  cameraControlsRef: React.MutableRefObject<CameraControls | null>;
}) {
  const controlsRef = useRef<any>(null);
  useEffect(() => {
    const tc = controlsRef.current;
    if (!tc) return;
    const onDraggingChanged = (e: any) => {
      const cc = cameraControlsRef.current;
      if (cc) cc.enabled = !e.value;
    };
    tc.addEventListener("dragging-changed", onDraggingChanged);
    return () => {
      tc.removeEventListener("dragging-changed", onDraggingChanged);
      const cc = cameraControlsRef.current;
      if (cc) cc.enabled = true;
    };
  }, [cameraControlsRef]);
  return <TransformControls ref={controlsRef} object={object} mode={mode} />;
}

function Inspector({
  obj,
  onDelete,
  onDuplicate,
  onCopy,
  onPaste,
  canPaste,
}: {
  obj: THREE.Object3D;
  onDelete: () => void;
  onDuplicate: () => void;
  onCopy: () => void;
  onPaste: () => void;
  canPaste: boolean;
}) {
  const isLight = (obj as THREE.Light).isLight;
  const light = isLight ? (obj as THREE.Light) : null;
  const mesh = !isLight ? (obj as THREE.Mesh) : null;

  const [pos, setPos] = useState<Vec3>([obj.position.x, obj.position.y, obj.position.z]);
  const [rot, setRot] = useState<Vec3>([
    (obj.rotation.x * 180) / Math.PI,
    (obj.rotation.y * 180) / Math.PI,
    (obj.rotation.z * 180) / Math.PI,
  ]);
  const [scale, setScale] = useState<Vec3>([obj.scale.x, obj.scale.y, obj.scale.z]);
  const [intensity, setIntensity] = useState(light ? light.intensity : 1);
  const [color, setColor] = useState(
    light ? `#${(light as THREE.Light & { color: THREE.Color }).color.getHexString()}` : "#ffffff"
  );

  // ponytail: inspector aktif objeyi takip etmiyor, secim degisince remount gerekir.
  // Bunun yerine key ile yeniden render tetikliyoruz (parent).
  useEffect(() => {
    setPos([obj.position.x, obj.position.y, obj.position.z]);
    setRot([
      (obj.rotation.x * 180) / Math.PI,
      (obj.rotation.y * 180) / Math.PI,
      (obj.rotation.z * 180) / Math.PI,
    ]);
    setScale([obj.scale.x, obj.scale.y, obj.scale.z]);
    if (light) {
      setIntensity(light.intensity);
      setColor(`#${(light as THREE.Light & { color: THREE.Color }).color.getHexString()}`);
    }
  }, [obj, light]);

  function applyPos(v: Vec3) {
    setPos(v);
    obj.position.set(...v);
  }
  function applyRot(v: Vec3) {
    setRot(v);
    obj.rotation.set((v[0] * Math.PI) / 180, (v[1] * Math.PI) / 180, (v[2] * Math.PI) / 180);
  }
  function applyScale(v: Vec3) {
    setScale(v);
    obj.scale.set(...v);
  }
  function applyIntensity(v: number) {
    setIntensity(v);
    if (light) light.intensity = v;
  }
  function applyColor(v: string) {
    setColor(v);
    if (light) (light as THREE.Light & { color: THREE.Color }).color.set(v);
  }

  return (
    <div key={obj.uuid}>
      <div className="panel-title">
        {isLight ? "Light" : "Mesh"} - {obj.name}
      </div>

      <div className="row">
        <label>Position</label>
        <div className="vec3">
          <input
            type="number"
            step="0.1"
            value={pos[0]}
            onChange={(e) => applyPos([parseFloat(e.target.value) || 0, pos[1], pos[2]])}
          />
          <input
            type="number"
            step="0.1"
            value={pos[1]}
            onChange={(e) => applyPos([pos[0], parseFloat(e.target.value) || 0, pos[2]])}
          />
          <input
            type="number"
            step="0.1"
            value={pos[2]}
            onChange={(e) => applyPos([pos[0], pos[1], parseFloat(e.target.value) || 0])}
          />
        </div>
      </div>

      <div className="row">
        <label>Rotation</label>
        <div className="vec3">
          <input
            type="number"
            step="1"
            value={rot[0]}
            onChange={(e) => applyRot([parseFloat(e.target.value) || 0, rot[1], rot[2]])}
          />
          <input
            type="number"
            step="1"
            value={rot[1]}
            onChange={(e) => applyRot([rot[0], parseFloat(e.target.value) || 0, rot[2]])}
          />
          <input
            type="number"
            step="1"
            value={rot[2]}
            onChange={(e) => applyRot([rot[0], rot[1], parseFloat(e.target.value) || 0])}
          />
        </div>
      </div>

      <div className="row">
        <label>Scale</label>
        <div className="vec3">
          <input
            type="number"
            step="0.1"
            value={scale[0]}
            onChange={(e) => applyScale([parseFloat(e.target.value) || 0.01, scale[1], scale[2]])}
          />
          <input
            type="number"
            step="0.1"
            value={scale[1]}
            onChange={(e) => applyScale([scale[0], parseFloat(e.target.value) || 0.01, scale[2]])}
          />
          <input
            type="number"
            step="0.1"
            value={scale[2]}
            onChange={(e) => applyScale([scale[0], scale[1], parseFloat(e.target.value) || 0.01])}
          />
        </div>
      </div>

      {isLight ? (
        <>
          <div className="row">
            <label>Intensity</label>
            <input
              type="number"
              step="0.1"
              value={intensity}
              onChange={(e) => applyIntensity(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="row">
            <label>Color</label>
            <input type="color" value={color} onChange={(e) => applyColor(e.target.value)} />
          </div>
        </>
      ) : null}

      <div className="panel-title" style={{ marginTop: 18 }}>
        Actions
      </div>
      <div className="add-menu">
        <button className="btn" onClick={onDuplicate}>
          Duplicate
        </button>
        <button className="btn" onClick={onCopy}>
          Copy
        </button>
        <button className="btn" onClick={onPaste} disabled={!canPaste}>
          Paste
        </button>
        <button className="btn danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}