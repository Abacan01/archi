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
          <article
            key={`${panel.title || "panel"}-${index}`}
            className="project-card project-card-display"
            style={{ position: "relative", overflow: "hidden" }}
          >
            <label
              style={{
                position: "absolute",
                top: "0.75rem",
                left: "0.75rem",
                zIndex: 20,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 6,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.4)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => toggle(index)}
                style={{ width: 18, height: 18, cursor: "pointer" }}
                aria-label={`Select spotlight card ${index + 1}`}
              />
            </label>

            <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
              <InlineEditor
                type="image"
                path={`projectsPage.${panelPathPrefix}.imageUrl`}
                initialValue={panel.imageUrl || fallbackProject?.coverImageUrl || "/assets/images/mckinley-west-residence.jpg"}
              />
            </div>

            <div style={{ padding: "1rem" }}>
              <InlineEditor
                as="p"
                className="tag"
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
        );
      })}
    </div>
  );
}