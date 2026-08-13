import { useState, type FormEvent } from "react";
import type { Task, TaskStatus, TaskPriority } from "../types";
import { statusLabel, dueInfo, dueText, priorityLabel } from "../ui";

type StatusFilter = TaskStatus | "ALL";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "Doing" },
  { value: "DONE", label: "Done" },
];

type PriorityFilter = TaskPriority | "ALL";

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "ALL", label: "Any priority" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: number | null;
  filter: StatusFilter;
  priorityFilter: PriorityFilter;
  loading: boolean;
  projectSelected: boolean;
  onFilter(filter: StatusFilter): void;
  onPriorityFilter(priority: PriorityFilter): void;
  onSelect(id: number): void;
  onCreate(payload: {
    title: string;
    details?: string;
    status: TaskStatus;
    priority: TaskPriority;
    labels?: string[];
    dueAt?: string;
    assigneeUsername?: string;
  }): Promise<void>;
}

export function TaskList({
  tasks,
  selectedTaskId,
  filter,
  priorityFilter,
  loading,
  projectSelected,
  onFilter,
  onPriorityFilter,
  onSelect,
  onCreate,
}: TaskListProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [labelText, setLabelText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function parseLabels(text: string): string[] {
    return Array.from(
      new Set(
        text
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean)
      )
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const labels = parseLabels(labelText);
      await onCreate({
        title: trimmed,
        details: details.trim() || undefined,
        status,
        priority,
        labels: labels.length ? labels : undefined,
        dueAt: dueDate ? new Date(dueDate + "T23:59:59").toISOString() : undefined,
        assigneeUsername: assignee.trim() || undefined,
      });
      setTitle("");
      setDetails("");
      setAssignee("");
      setDueDate("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setLabelText("");
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

      <div className="filter-row filter-row-priority">
        {PRIORITY_FILTERS.map((p) => (
          <button
            key={p.value}
            className={`pill${priorityFilter === p.value ? " active" : ""}`}
            onClick={() => onPriorityFilter(p.value)}
          >
            {p.label}
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
              <select
                className="field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="HIGH">High priority</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input
                className="field"
                placeholder="Assignee (optional)"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
              <input
                className="field"
                placeholder="Labels, comma separated"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <label className="label" htmlFor="task-due">
                Due date (optional)
              </label>
              <input
                id="task-due"
                type="date"
                className="field"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
            const due = dueInfo(task.dueAt);
            const isDone = task.status === "DONE";
            const dueClass =
              due && !isDone && due.state !== "later" ? ` due-${due.state}` : "";
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
                  {task.priority && task.priority !== "MEDIUM" && (
                    <span className={`prio-chip prio-${task.priority}`}>
                      {priorityLabel(task.priority)}
                    </span>
                  )}
                </div>
                <div className="task-card-meta">
                  {statusLabel(task.status)}
                  {task.assignee?.username
                    ? ` · ${task.assignee.username.replace(/^github_/, "")}`
                    : ""}
                  {due ? (
                    <span className={`due-chip${dueClass}`}>{dueText(due)}</span>
                  ) : null}
                </div>
                {task.labels && task.labels.length > 0 && (
                  <div className="label-row">
                    {task.labels.map((l) => (
                      <span key={l} className="label-chip">
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
