import { useState, useEffect, type FormEvent } from "react";
import type { Task, TaskStatus, TaskPriority, Comment } from "../types";
import { statusLabel, formatDate, initials, dueInfo, dueText, isoToDateInput } from "../ui";

interface TaskDetailProps {
  task: Task | null;
  comments: Comment[];
  loadingComments: boolean;
  onChangeStatus(taskId: number, status: TaskStatus): void;
  onChangeDueDate(taskId: number, dueAt: string): void;
  onChangePriority(taskId: number, priority: TaskPriority): void;
  onChangeLabels(taskId: number, labels: string[]): void;
  onDeleteTask(taskId: number): void;
  onAddComment(body: string): Promise<void>;
  onDeleteComment(commentId: number): void;
}

export function TaskDetail({
  task,
  comments,
  loadingComments,
  onChangeStatus,
  onChangeDueDate,
  onChangePriority,
  onChangeLabels,
  onDeleteTask,
  onAddComment,
  onDeleteComment,
}: TaskDetailProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [labelText, setLabelText] = useState("");

  useEffect(() => {
    setLabelText(task?.labels?.join(", ") ?? "");
  }, [task?.id, task?.labels]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await onAddComment(trimmed);
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  if (!task) {
    return (
      <section className="detail">
        <div className="pane-empty">Select a task to see its details.</div>
      </section>
    );
  }

  const created = formatDate(task.createdAt);
  const due = dueInfo(task.dueAt);
  const isDone = task.status === "DONE";
  const dueClass =
    due && !isDone && due.state !== "later" ? ` due-${due.state}` : "";

  return (
    <section className="detail">
      <div className="detail-head">
        <div>
          <h2 className="detail-title">{task.title}</h2>
          {created && <div className="detail-created">Created {created}</div>}
        </div>
        <button
          className="btn btn-danger"
          onClick={() => onDeleteTask(task.id)}
        >
          Delete
        </button>
      </div>

      {task.details && <p className="detail-body">{task.details}</p>}

      <div className="detail-meta">
        <div className="meta-box">
          <div className="label" style={{ marginBottom: 6 }}>
            Status
          </div>
          <select
            className="field"
            value={task.status}
            onChange={(e) =>
              onChangeStatus(task.id, e.target.value as TaskStatus)
            }
          >
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div className="meta-box">
          <div className="label" style={{ marginBottom: 6 }}>
            Priority
          </div>
          <select
            className="field"
            value={task.priority ?? "MEDIUM"}
            onChange={(e) =>
              onChangePriority(task.id, e.target.value as TaskPriority)
            }
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="meta-box">
          <div className="label" style={{ marginBottom: 6 }}>
            Assignee
          </div>
          <div className="meta-value">
            {task.assignee?.username
              ? task.assignee.username.replace(/^github_/, "")
              : "Unassigned"}
          </div>
        </div>
        <div className="meta-box">
          <div className="label" style={{ marginBottom: 6 }}>
            Due date
          </div>
          {due && (
            <span
              className={`due-chip${dueClass}`}
              style={{ marginLeft: 0, marginBottom: 6, display: "inline-block" }}
            >
              {dueText(due)}
            </span>
          )}
          <input
            type="date"
            className="field"
            value={isoToDateInput(task.dueAt)}
            onChange={(e) =>
              e.target.value &&
              onChangeDueDate(
                task.id,
                new Date(e.target.value + "T23:59:59").toISOString()
              )
            }
          />
        </div>
      </div>

      <div className="detail-labels">
        <div className="label" style={{ marginBottom: 6 }}>
          Labels
        </div>
        {task.labels && task.labels.length > 0 && (
          <div className="label-row" style={{ marginLeft: 0, marginBottom: 8 }}>
            {task.labels.map((l) => (
              <span key={l} className="label-chip">
                {l}
              </span>
            ))}
          </div>
        )}
        <input
          className="field"
          placeholder="Labels, comma separated"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          onBlur={() => {
            const next = Array.from(
              new Set(
                labelText
                  .split(",")
                  .map((l) => l.trim())
                  .filter(Boolean)
              )
            );
            const current = task.labels ?? [];
            if (next.join(",") !== current.join(",")) {
              onChangeLabels(task.id, next);
            }
          }}
        />
      </div>

      <div className="comments">
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          Comments{comments.length ? ` · ${comments.length}` : ""}
        </div>

        {loadingComments ? (
          <div className="pane-empty">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet.</div>
        ) : (
          <ul className="comment-list">
            {comments.map((comment) => (
              <li key={comment.id} className="comment">
                <div className="avatar comment-avatar">
                  {initials(comment.authorUsername ?? "?")}
                </div>
                <div className="comment-body">
                  <div className="comment-top">
                    <span className="comment-author">
                      {comment.authorUsername
                        ? comment.authorUsername.replace(/^github_/, "")
                        : "Someone"}
                    </span>
                    {formatDate(comment.createdAt) && (
                      <span className="comment-date">
                        {formatDate(comment.createdAt)}
                      </span>
                    )}
                    <button
                      className="comment-del"
                      aria-label="Delete comment"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="comment-text">{comment.body}</div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form className="comment-add" onSubmit={submit}>
          <input
            className="field"
            placeholder="Add a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy || !body.trim()}
          >
            {busy ? "…" : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
