import { useState, type FormEvent } from "react";
import type { Task, TaskStatus } from "../types";
import { statusLabel, dueLabel } from "../ui";

type StatusFilter = TaskStatus | "ALL";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "Doing" },
  { value: "DONE", label: "Done" },
];

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: number | null;
  filter: StatusFilter;
  loading: boolean;
  projectSelected: boolean;
  onFilter(filter: StatusFilter): void;
  onSelect(id: number): void;
  onCreate(payload: {
    title: string;
    details?: string;
    status: TaskStatus;
    assigneeUsername?: string;
  }): Promise<void>;
}

export function TaskList({
  tasks,
  selectedTaskId,
  filter,
  loading,
  projectSelected,
  onFilter,
  onSelect,
  onCreate,
}: TaskListProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [assignee, setAssignee] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onCreate({
        title: trimmed,
        details: details.trim() || undefined,
        status,
        assigneeUsername: assignee.trim() || undefined,
      });
      setTitle("");
      setDetails("");
      setAssignee("");
      setStatus("TODO");
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  if (!projectSelected) {
    return (
      <section className="tasks">
        <div className="pane-empty">Select a project to see its tasks.</div>
      </section>
    );
  }

  return (
    <section className="tasks">
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`pill${filter === f.value ? " active" : ""}`}
            onClick={() => onFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <form className="task-add" onSubmit={submit}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="field"
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setExpanded(true)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !title.trim()}
          >
            {busy ? "…" : "Add"}
          </button>
        </div>
        {expanded && (
          <div className="task-add-more">
            <textarea
              className="field"
              rows={2}
              placeholder="Details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <select
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
              <input
                className="field"
                placeholder="Assignee (optional)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
          </div>
        )}
      </form>

      {loading && tasks.length === 0 ? (
        <div className="pane-empty">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="pane-empty">
          {filter === "ALL"
            ? "No tasks yet. Add your first one above."
            : "No tasks match this filter."}
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => {
            const active = task.id === selectedTaskId;
            const due = dueLabel(task.dueAt);
            const isDone = task.status === "DONE";
            return (
              <div
                key={task.id}
                className={`task-card${active ? " active" : ""}`}
                onClick={() => onSelect(task.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(task.id);
                  }
                }}
              >
                <div className="task-card-title">
                  <span className={`dot dot-${task.status}`} />
                  <span className={isDone ? "task-done" : ""}>{task.title}</span>
                </div>
                <div className="task-card-meta">
                  {statusLabel(task.status)}
                  {task.assignee?.username
                    ? ` · ${task.assignee.username.replace(/^github_/, "")}`
                    : ""}
                  {due ? (
                    <span className={due.overdue && !isDone ? "overdue" : ""}>
                      {" "}
                      · due {due.text}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
