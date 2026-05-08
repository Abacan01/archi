"use client";

import { useMemo, useState } from "react";
import { InlineEditor } from "./inline-editor";
import type { ProjectItem, SpotlightPanel } from "../lib/content-types";

type SpotlightEditGridProps = {
  spotlight: SpotlightPanel | null | undefined;
  additionalPanels: SpotlightPanel[];
  projects: ProjectItem[];
};

export function SpotlightEditGrid({ spotlight, additionalPanels, projects }: SpotlightEditGridProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const panels = useMemo(() => {
    return [spotlight, ...additionalPanels].filter(Boolean) as SpotlightPanel[];
  }, [spotlight, additionalPanels]);

  const toggle = (index: number) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
  };

  return (
    <div className="project-grid">
      {panels.map((panel, index) => {
        const fallbackProject = projects[index] || projects[0];
        const panelPathPrefix = index === 0 ? "spotlight" : index === 1 ? "spotlightTwo" : index === 2 ? "spotlightThree" : "spotlightFour";

        return (
          <div key={`${panel.title || "panel"}-${index}`} style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", display: "flex", gap: "0.5rem", zIndex: 10 }}>
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => toggle(index)}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  accentColor: "#4CAF50",
                }}
                title="Select for bulk delete"
              />
            </div>

            <article
              className={`project-card project-card-display project-spotlight spotlight-edit-card${index % 2 === 0 ? " is-image-right" : ""}`}
              style={{ position: "relative", overflow: "hidden" }}
            >
              <div className="project-spotlight-media spotlight-edit-media" style={{ position: "relative", height: "100%" }}>
                <InlineEditor
                  type="image"
                  path={`projectsPage.${panelPathPrefix}.imageUrl`}
                  initialValue={panel.imageUrl || fallbackProject?.coverImageUrl || "/assets/images/mckinley-west-residence.jpg"}
                />
                {hoveredIndex === index && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0, 0, 0, 0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 5,
                    }}
                  >
                    <button
                      onClick={() => {
                        const input = document.querySelector(
                          `input[data-spotlight-path="${panelPathPrefix}.imageUrl"]`
                        ) as HTMLInputElement | null;
                        if (input) input.click();
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                      }}
                    >
                      Replace Image
                    </button>
                  </div>
                )}
              </div>

              <div className="project-spotlight-copy spotlight-edit-copy">
                <InlineEditor
                  as="p"
                  className="spotlight-type"
                  path={`projectsPage.${panelPathPrefix}.type`}
                  initialValue={panel.type || fallbackProject?.category || "Residential"}
                />
                <InlineEditor
                  as="h3"
                  path={`projectsPage.${panelPathPrefix}.title`}
                  initialValue={panel.title || fallbackProject?.title || "Featured Architecture"}
                />
                <InlineEditor
                  as="p"
                  className="spotlight-description"
                  path={`projectsPage.${panelPathPrefix}.description`}
                  initialValue={panel.description || "Project details available on request."}
                  multiline
                />
                <div className="spotlight-points">
                  {(panel.points || []).map((point, pointIndex) => (
                    <InlineEditor
                      key={`${point}-${index}-${pointIndex}`}
                      as="span"
                      path={`projectsPage.${panelPathPrefix}.points[${pointIndex}]`}
                      initialValue={point}
                    />
                  ))}
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  );
}