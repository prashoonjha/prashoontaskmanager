import { useState, type FormEvent } from "react";
import type { Project } from "../types";

interface ProjectRailProps {
  projects: Project[];
  selectedId: number | null;
  loading: boolean;
  progressFor(projectId: number): { done: number; total: number } | null;
  onSelect(id: number): void;
  onDelete(id: number): void;
  onCreate(name: string, description?: string): Promise<void>;
}

export function ProjectRail({
  projects,
  selectedId,
  loading,
  progressFor,
  onSelect,
  onDelete,
  onCreate,
}: ProjectRailProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onCreate(trimmed, desc.trim() || undefined);
      setName("");
      setDesc("");
      setAdding(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rail">
      <div className="eyebrow" style={{ marginBottom: 12 }}>
        Projects
      </div>

      {loading && projects.length === 0 ? (
        <div className="rail-empty">Loading…</div>
      ) : projects.length === 0 && !adding ? (
        <div className="rail-empty">
          No projects yet. Create one to get started.
        </div>
      ) : (
        <div className="rail-list">
          {projects.map((project) => {
            const active = project.id === selectedId;
            const progress = progressFor(project.id);
            const pct =
              progress && progress.total > 0
                ? Math.round((progress.done / progress.total) * 100)
                : 0;
            return (
              <div
                key={project.id}
                className={`rail-item${active ? " active" : ""}`}
                onClick={() => onSelect(project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(project.id);
                  }
                }}
              >
                <div className="rail-item-head">
                  <span className="rail-item-name">{project.name}</span>
                  <button
                    className="rail-del"
                    aria-label={`Delete ${project.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.id);
                    }}
                  >
                    ×
                  </button>
                </div>
                {progress && progress.total > 0 && (
                  <div className="meter-row">
                    <div className="meter">
                      <div
                        className={`meter-fill${
                          progress.done === progress.total ? " done" : ""
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="meter-count">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {adding ? (
        <form className="rail-add" onSubmit={submit}>
          <input
            className="field"
            style={{ marginBottom: 8 }}
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            style={{ marginBottom: 8 }}
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={busy}
            >
              {busy ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setAdding(false);
                setName("");
                setDesc("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="rail-newbtn" onClick={() => setAdding(true)}>
          + New project
        </button>
      )}
    </aside>
  );
}
