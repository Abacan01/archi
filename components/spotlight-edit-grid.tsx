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
            className={`project-card project-card-display spotlight-edit-card${selected.has(index) ? " is-selected" : ""}`}
            style={{ position: "relative", overflow: "hidden" }}
          >
            <label className="spotlight-select-toggle">
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => toggle(index)}
                className="spotlight-select-input"
                aria-label={`Select spotlight card ${index + 1}`}
              />
            </label>
            {selected.has(index) && <span className="spotlight-selected-badge">Selected</span>}

            <div className="spotlight-edit-media" style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
              <InlineEditor
                type="image"
                path={`projectsPage.${panelPathPrefix}.imageUrl`}
                initialValue={panel.imageUrl || fallbackProject?.coverImageUrl || "/assets/images/mckinley-west-residence.jpg"}
              />
            </div>

            <div className="spotlight-edit-copy" style={{ padding: "1rem" }}>
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
        );
      })}
    </div>
  );
}