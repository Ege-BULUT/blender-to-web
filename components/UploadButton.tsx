"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslation } from "@/lib/translations/useTranslation";

export default function UploadButton() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        {t("addNewScene")}
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
    
    setStep("processing");
    
    try {
      // Create FormData
      const formData = new FormData();
      
      // Append all files
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      
      // Append metadata as JSON
      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata));
      }
      
      // Send to API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setStep("success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
          <h3>{t("dragDropTitle")}</h3>
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
              {...{ webkitdirectory: "true" }}
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
          <h3>{t("metadataTitle")}</h3>
          
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
          </div>
          
          <div className="modal-actions">
            <button className="modal-close" onClick={onClose}>
              {t("cancel")}
            </button>
            <button className="btn-primary" onClick={handleSubmit}>
              {t("confirmUpload")}
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
          <h3>{t("processing")}</h3>
          <div className="processing-spinner">⏳</div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>✅ {t("uploadSuccess")}</h3>
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
