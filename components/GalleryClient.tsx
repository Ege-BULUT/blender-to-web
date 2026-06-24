"use client";

import { useCallback, useEffect, useState } from "react";
import type { SceneEntry } from "@/lib/types";
import ScenePreview from "./ScenePreview";

const CARD_W = 320;
const CARD_H = 360;
const SPACING = CARD_W / 2;
const SIDE_TY = 40;
const SIDE_SCALE = 0.85;
const SIDE_ROTATE = 22;
const SIDE_OPACITY = 0.55;

export default function GalleryClient({ scenes }: { scenes: SceneEntry[] }) {
  const [active, setActive] = useState(0);

  const goPrev = useCallback(() => setActive((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setActive((i) => Math.min(scenes.length - 1, i + 1)),
    [scenes.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "Enter") {
        const s = scenes[active];
        if (s) window.location.href = `/scene/${encodeURIComponent(s.slug)}`;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goPrev, goNext, scenes]);

  if (scenes.length === 0) {
    return (
      <div className="gallery-empty">
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>Henüz scene yok</h2>
        <p style={{ marginTop: 8 }}>
          Blender eklentisinden export aldıktan sonra output klasörünü
          <br />
          <code>public/scenes/&lt;slug&gt;/</code> altına kopyalayın.
        </p>
      </div>
    );
  }

  const count = scenes.length;
  const showArrows = count > 1;

  return (
    <div className="carousel" style={{ height: CARD_H + SIDE_TY + 24 }}>
      <div className="carousel-stage" style={{ height: CARD_H }}>
        {showArrows && (
          <button
            className="carousel-arrow left"
            onClick={goPrev}
            disabled={active === 0}
            aria-label="Önceki sahne"
          >
            &#8592;
          </button>
        )}

        {scenes.map((s, i) => {
          const offset = i - active;
          const isFocus = offset === 0;
          return (
            <a
              key={s.slug}
              className={"carousel-card" + (isFocus ? " is-active" : "")}
              href={isFocus ? `/scene/${encodeURIComponent(s.slug)}` : undefined}
              style={cardStyle(offset)}
              onMouseEnter={() => setActive(i)}
              onClick={(e) => {
                if (!isFocus) { e.preventDefault(); setActive(i); }
              }}
            >
              <div className="carousel-canvas">
                <ScenePreview url={s.glbPath} />
              </div>
              <div className="card-meta">
                <div className="card-title">{s.title}</div>
                {s.description ? <div className="card-desc">{s.description}</div> : null}
                {s.tags && s.tags.length > 0 ? (
                  <div className="card-tags">
                    {s.tags.map((t) => (
                      <span className="card-tag" key={t}>{t}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </a>
          );
        })}

        {showArrows && (
          <button
            className="carousel-arrow right"
            onClick={goNext}
            disabled={active >= count - 1}
            aria-label="Sonraki sahne"
          >
            &#8594;
          </button>
        )}
      </div>
    </div>
  );
}

function cardStyle(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);
  const dir = offset > 0 ? 1 : offset < 0 ? -1 : 0;
  const tx = dir * SPACING * abs;
  const isFocus = offset === 0;

  return {
    position: "absolute",
    top: 0,
    left: "50%",
    width: CARD_W,
    height: CARD_H,
    transform: `translateX(calc(-50% + ${tx}px)) translateY(${isFocus ? 0 : SIDE_TY}px) scale(${isFocus ? 1 : SIDE_SCALE}) rotateY(${isFocus ? 0 : -dir * SIDE_ROTATE}deg)`,
    opacity: isFocus ? 1 : abs > 2 ? 0 : SIDE_OPACITY,
    zIndex: isFocus ? 10 : 10 - abs,
    pointerEvents: abs > 2 ? ("none" as const) : ("auto" as const),
  };
}
