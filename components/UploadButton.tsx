"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/translations/useTranslation";

const LOCAL_SERVICE_URL = "https://localhost:3457/upload";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        {t("publishScene")}
      </button>

      {open && (
        <DragDropUploadModal onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function DragDropUploadModal({ onClose }: { onClose: () => void }) {
  const [dragActive, setDragActive] = useState(false);
  const [sceneFile, setSceneFile] = useState<File | null>(null);
  const [metaFile, setMetaFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>({});
  const [tagsRaw, setTagsRaw] = useState("");
  const [publishToPublic, setPublishToPublic] = useState(false);
  const [step, setStep] = useState<"drop" | "metadata" | "processing" | "success" | "error">("drop");
  const sceneInputRef = useRef<HTMLInputElement>(null);
  const metaInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      const glb = dropped.find((f) => f.name.endsWith(".glb") || f.name.endsWith(".gltf"));
      const json = dropped.find((f) => f.name.endsWith(".json"));

      if (glb) setSceneFile(glb);
      if (json) {
        setMetaFile(json);
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const meta = JSON.parse(ev.target?.result as string);
            setMetadata(meta);
            setTagsRaw(Array.isArray(meta.tags) ? meta.tags.join(", ") : "");
          } catch {}
        };
        reader.readAsText(json);
      }

      if (glb) setStep("metadata");
    }
  }, []);

  const handleSceneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSceneFile(e.target.files[0]);
      setStep("metadata");
    }
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMetaFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const meta = JSON.parse(ev.target?.result as string);
          setMetadata(meta);
          setTagsRaw(Array.isArray(meta.tags) ? meta.tags.join(", ") : "");
        } catch {}
      };
      reader.readAsText(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!sceneFile) return;

    if (!publishToPublic) {
      const url = URL.createObjectURL(sceneFile);
      window.location.href = `/scene/__import?url=${encodeURIComponent(url)}&meta=${encodeURIComponent(JSON.stringify(metadata))}`;
      return;
    }

    setStep("processing");

    try {
      const formData = new FormData();
      formData.append("files", sceneFile);

      if (metadata && Object.keys(metadata).length > 0) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      let uploadUrl = "/api/upload";
      try {
        const hc = await fetch("https://localhost:3457/health", { method: "GET" });
        if (hc.ok) uploadUrl = LOCAL_SERVICE_URL;
      } catch {
        try {
          const hc2 = await fetch("http://localhost:3456/health", { method: "GET" });
          if (hc2.ok) uploadUrl = "http://localhost:3456/upload";
        } catch {}
      }

      const response = await fetch(uploadUrl, { method: "POST", body: formData });
      const result = await response.json();

      if (result.success) {
        setStep("success");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setStep("error");
      }
    } catch (err) {
      setStep("error");
      console.error("Upload failed", err);
    }
  };

  if (step === "drop") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>{t("publishScene")}</h3>
          <p>{t("dragDropInstructions")}</p>

          <div
            className={`upload-area ${dragActive ? "active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input ref={sceneInputRef} type="file" accept=".glb,.gltf" style={{ display: "none" }} onChange={handleSceneChange} />
            <input ref={metaInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleMetaChange} />
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p>{t("dragDropArea")}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button className="btn-secondary" onClick={() => sceneInputRef.current?.click()}>
                  {t("selectSceneFile")}
                </button>
                <button className="btn-secondary" onClick={() => metaInputRef.current?.click()}>
                  {t("selectMetaFile")}
                </button>
              </div>
            </div>
          </div>

          <div className="upload-hints">
            <p className="upload-hint">
              <strong>{t("sceneFile")}</strong> .glb veya .gltf
            </p>
            <p className="upload-hint">
              <strong>{t("metaFile")}</strong> .json (opsiyonel, metadata otomatik doldurulur)
            </p>
          </div>

          <div className="modal-actions">
            <button className="modal-close" onClick={onClose}>{t("cancel")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "metadata") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal large" onClick={(e) => e.stopPropagation()}>
          <h3>{t("publishScene")}</h3>

          <div className="upload-file-info">
            {sceneFile && (
              <div className="upload-file-chip">
                <span className="upload-file-icon">📦</span>
                <span>{sceneFile.name}</span>
                <span className="upload-file-size">({(sceneFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
            {metaFile && (
              <div className="upload-file-chip meta">
                <span className="upload-file-icon">📝</span>
                <span>{metaFile.name}</span>
              </div>
            )}
            {!metaFile && (
              <button className="btn-secondary btn-small" onClick={() => metaInputRef.current?.click()}>
                + {t("addMetaFile")}
              </button>
            )}
            <input ref={metaInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleMetaChange} />
          </div>

          <div className="metadata-form">
            <div className="form-row">
              <label>{t("metadataSlug")}</label>
              <input
                type="text"
                value={metadata?.slug || ""}
                onChange={(e) => setMetadata({...metadata, slug: e.target.value})}
                placeholder="scene-name"
              />
            </div>

            <div className="form-row">
              <label>{t("metadataTitleField")}</label>
              <input
                type="text"
                value={metadata?.title || ""}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                placeholder="Scene Title"
              />
            </div>

            <div className="form-row">
              <label>{t("metadataDescription")}</label>
              <textarea
                value={metadata?.description || ""}
                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                placeholder="Scene description..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <label>{t("metadataTags")}</label>
              <input
                type="text"
                value={tagsRaw}
                onChange={(e) => {
                  setTagsRaw(e.target.value);
                  const tags = e.target.value.split(",").map((s: string) => s.trim()).filter((s: string) => s);
                  setMetadata({...metadata, tags});
                }}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="form-row">
              <label>{t("metadataAuthor")}</label>
              <input
                type="text"
                value={metadata?.author || ""}
                onChange={(e) => setMetadata({...metadata, author: e.target.value})}
                placeholder="Author name"
              />
            </div>
            <div className="form-row toggle-row">
              <label>{t("publishToPublic")}</label>
              <button
                className={`toggle-btn ${publishToPublic ? "active" : ""}`}
                onClick={() => setPublishToPublic(!publishToPublic)}
                type="button"
              >
                <span className="toggle-thumb" />
              </button>
            </div>
            <p className="toggle-hint">
              {publishToPublic ? t("publishToPublicHintOn") : t("publishToPublicHintOff")}
            </p>
          </div>

          <div className="modal-actions">
            <button className="modal-close" onClick={onClose}>{t("cancel")}</button>
            <button className="btn-primary" onClick={handleSubmit}>
              {publishToPublic ? t("publishToWeb") : t("openInEditor")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>{t("publishing")}</h3>
          <div className="processing-spinner">⏳</div>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
            {t("publishingHint")}
          </p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>✅ {t("publishSuccess")}</h3>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
            {t("publishSuccessHint")}
          </p>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>❌ {t("uploadError")}</h3>
          <div className="modal-actions">
            <button className="modal-close" onClick={onClose}>{t("cancel")}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}