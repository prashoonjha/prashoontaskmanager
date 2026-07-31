import { useState, type FormEvent } from "react";
import type { Task, TaskStatus, Comment } from "../types";
import { statusLabel, formatDate, initials } from "../ui";

interface TaskDetailProps {
  task: Task | null;
  comments: Comment[];
  loadingComments: boolean;
  onChangeStatus(taskId: number, status: TaskStatus): void;
  onDeleteTask(taskId: number): void;
  onAddComment(body: string): Promise<void>;
  onDeleteComment(commentId: number): void;
}

export function TaskDetail({
  task,
  comments,
  loadingComments,
  onChangeStatus,
  onDeleteTask,
  onAddComment,
  onDeleteComment,
}: TaskDetailProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

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
            Assignee
          </div>
          <div className="meta-value">
            {task.assignee?.username
              ? task.assignee.username.replace(/^github_/, "")
              : "Unassigned"}
          </div>
        </div>
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
