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
  const [files, setFiles] = useState<FileList | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [tagsRaw, setTagsRaw] = useState("");
  const [publishToPublic, setPublishToPublic] = useState(false);
  const [step, setStep] = useState<"drop" | "metadata" | "processing" | "success" | "error">("drop");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setFiles(e.dataTransfer.files);
      parseMetadata(e.dataTransfer.files);
      setStep("metadata");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
      parseMetadata(e.target.files);
      setStep("metadata");
    }
  };

  const parseMetadata = (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name === "meta.json") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const meta = JSON.parse(e.target?.result as string);
            setMetadata(meta);
            setTagsRaw(Array.isArray(meta.tags) ? meta.tags.join(", ") : "");
          } catch (err) {
            console.error("Failed to parse meta.json", err);
          }
        };
        reader.readAsText(file);
        break;
      }
    }
  };

  const handleSubmit = async () => {
    if (!files) return;

    if (!publishToPublic) {
      const blob = await files[0].arrayBuffer();
      const url = URL.createObjectURL(new Blob([blob]));
      window.location.href = `/scene/__import?url=${encodeURIComponent(url)}&meta=${encodeURIComponent(JSON.stringify(metadata))}`;
      return;
    }

    setStep("processing");

    try {
      const formData = new FormData();

      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      let uploadUrl = "/api/upload";
      try {
        const healthCheck = await fetch("https://localhost:3457/health", { method: "GET" });
        if (healthCheck.ok) uploadUrl = LOCAL_SERVICE_URL;
      } catch {
        try {
          const healthCheckHttp = await fetch("http://localhost:3456/health", { method: "GET" });
          if (healthCheckHttp.ok) uploadUrl = "http://localhost:3456/upload";
        } catch {}
      }

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setStep("success");
        setTimeout(() => {
          window.location.reload();
        }, 3000);
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf,.zip"
              multiple
              onChange={handleChange}
              style={{ display: "none" }}
            />
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <p>{t("dragDropArea")}</p>
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {t("browseFiles")}
              </button>
            </div>
          </div>

          <p className="upload-hint">{t("supportedFiles")}</p>

          <div className="modal-actions">
            <button className="modal-close" onClick={onClose}>
              {t("cancel")}
            </button>
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
            <button className="modal-close" onClick={onClose}>
              {t("cancel")}
            </button>
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
            <button className="modal-close" onClick={onClose}>
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}