
import { useEffect, useState, type FormEvent } from "react";
import type { Project, Task, TaskStatus, Comment } from "../types";
import {
  createProject,
  createTask,
  deleteProject,
  deleteTask,
  fetchProjects,
  fetchTasks,
  updateTaskStatus,
  fetchComments,
  createComment,
  deleteComment,
} from "../api";

interface ProjectViewProps {
  token: string;
  username: string;
  onLogout(): void;
}

type StatusFilter = TaskStatus | "ALL";

export function ProjectView(props: ProjectViewProps) {
  const { token, username, onLogout } = props;

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("TODO");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const [newCommentBody, setNewCommentBody] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  // ---- task counts for selected project ----
  const totalTasks = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "TODO").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingProjects(true);
      setError(null);
      try {
        const page = await fetchProjects(token, 0, 100);
        if (!cancelled) {
          setProjects(page.content);
          if (page.content.length > 0) {
            setSelectedProjectId((current) => current ?? page.content[0]?.id ?? null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load tasks whenever selectedProjectId or statusFilter changes
  useEffect(() => {
    if (selectedProjectId === null) {
      setTasks([]);
      setSelectedTaskId(null);
      return;
    }

    const projectId = selectedProjectId;
    let cancelled = false;

    async function load() {
      setLoadingTasks(true);
      setError(null);
      try {
        const page = await fetchTasks(
          token,
          projectId,
          0,
          200,
          statusFilter === "ALL" ? undefined : statusFilter
        );
        if (!cancelled) {
          setTasks(page.content);
          if (page.content.length > 0) {
            setSelectedTaskId((current) =>
              current ?? page.content[0]?.id ?? null
            );
          } else {
            setSelectedTaskId(null);
          }
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoadingTasks(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, selectedProjectId, statusFilter]);

  // Load comments when selectedTaskId changes
  useEffect(() => {
    if (selectedTaskId === null) {
      setComments([]);
      return;
    }

    const taskId = selectedTaskId;
    let cancelled = false;

    async function load() {
      setLoadingComments(true);
      setError(null);
      try {
        const page = await fetchComments(token, taskId, 0, 100);
        if (!cancelled) setComments(page.content);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token, selectedTaskId]);

  // ---- actions ----

  async function handleCreateProject(e: FormEvent) {
    e.preventDefault();
    const name = newProjectName.trim();
    const description = newProjectDesc.trim() || undefined;
    if (!name) {
      setError("Project name is required.");
      return;
    }
    setError(null);
    try {
      const project = await createProject(token, name, description);
      setProjects((prev) => [project, ...prev]);
      setNewProjectName("");
      setNewProjectDesc("");
      setSelectedProjectId(project.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteProject(id: number) {
    if (!window.confirm("Delete this project and all its tasks?")) return;
    setError(null);
    try {
      await deleteProject(token, id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setTasks([]);
        setSelectedTaskId(null);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    const projectId = selectedProjectId;
    if (projectId === null) return;

    const title = newTaskTitle.trim();
    if (!title) {
      setError("Task title is required.");
      return;
    }
    setError(null);
    try {
      const task = await createTask(token, projectId, {
        title,
        details: newTaskDetails.trim() || undefined,
        status: newTaskStatus,
        assigneeUsername: newTaskAssignee.trim() || undefined,
      });
      setTasks((prev) => [task, ...prev]);
      setNewTaskTitle("");
      setNewTaskDetails("");
      setNewTaskAssignee("");
      setNewTaskStatus("TODO");
      setSelectedTaskId(task.id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteTask(id: number) {
    const projectId = selectedProjectId;
    if (projectId === null) return;
    if (!window.confirm("Delete this task?")) return;

    setError(null);
    try {
      await deleteTask(token, projectId, id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleChangeStatus(id: number, status: TaskStatus) {
    const projectId = selectedProjectId;
    if (projectId === null) return;

    setError(null);
    try {
      const updated = await updateTaskStatus(token, projectId, id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (selectedTaskId === id) {
        setSelectedTaskId(updated.id);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    const taskId = selectedTaskId;
    if (taskId === null) return;

    const body = newCommentBody.trim();
    if (!body) return;
    setError(null);
    try {
      const created = await createComment(token, taskId, body);
      setComments((prev) => [...prev, created]);
      setNewCommentBody("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteComment(id: number) {
    const taskId = selectedTaskId;
    if (taskId === null) return;
    if (!window.confirm("Delete this comment?")) return;
    setError(null);
    try {
      await deleteComment(token, taskId, id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // ---- render helpers ----

  function renderProjectItem(project: Project) {
    const isSelected = project.id === selectedProjectId;
    return (
      <button
        key={project.id}
        type="button"
        onClick={() => {
          setSelectedProjectId(project.id);
          setSelectedTaskId(null);
        }}
        style={{
          width: "100%",
          textAlign: "left",
          borderRadius: 14,
          border: `1px solid ${
            isSelected ? "rgba(56,189,248,0.9)" : "rgba(148,163,184,0.6)"
          }`,
          padding: "0.55rem 0.7rem",
          marginBottom: 6,
          background: isSelected
            ? "radial-gradient(circle at top left, rgba(56,189,248,0.24), transparent 60%), #020617"
            : "rgba(15,23,42,0.95)",
          color: "#e5e7eb",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 2,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {project.name}
          </div>
          {project.description && (
            <div
              style={{
                fontSize: 12,
                color: "#9ca3af",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {project.description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteProject(project.id);
          }}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(248,113,113,0.6)",
            background: "rgba(127,29,29,0.25)",
            color: "#fecaca",
            fontSize: 11,
            padding: "0.1rem 0.5rem",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </button>
    );
  }

  function renderTaskItem(task: Task) {
    const isSelected = task.id === selectedTaskId;
    const badgeColor =
      task.status === "TODO"
        ? "rgba(248,113,113,0.85)"
        : task.status === "IN_PROGRESS"
        ? "rgba(251,191,36,0.9)"
        : "rgba(52,211,153,0.9)";

    return (
      <button
        key={task.id}
        type="button"
        onClick={() => setSelectedTaskId(task.id)}
        style={{
          width: "100%",
          textAlign: "left",
          borderRadius: 14,
          border: `1px solid ${
            isSelected ? "rgba(56,189,248,0.9)" : "rgba(148,163,184,0.6)"
          }`,
          padding: "0.55rem 0.7rem",
          marginBottom: 6,
          background: isSelected
            ? "radial-gradient(circle at top left, rgba(56,189,248,0.20), transparent 60%), rgba(15,23,42,0.98)"
            : "rgba(15,23,42,0.95)",
          color: "#e5e7eb",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {task.title}
          </div>
          <span
            style={{
              borderRadius: 999,
              border: `1px solid ${badgeColor}`,
              color: badgeColor,
              fontSize: 11,
              padding: "0.05rem 0.55rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "rgba(15,23,42,0.95)",
            }}
          >
            {task.status.replace("_", " ")}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {task.assignee?.username
              ? `Assignee: ${task.assignee.username}`
              : "Unassigned"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(task.id);
              }}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(248,113,113,0.6)",
                background: "rgba(127,29,29,0.25)",
                color: "#fecaca",
                fontSize: 11,
                padding: "0.05rem 0.55rem",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </button>
    );
  }

  function renderTaskDetails(task: Task | null) {
    if (!task) {
      return (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          Select a task to see its details.
        </div>
      );
    }

    const createdAt = task.createdAt
      ? new Date(task.createdAt).toLocaleString()
      : "n/a";
    const updatedAt = (task as any).updatedAt
      ? new Date((task as any).updatedAt).toLocaleString()
      : "n/a";

    return (
      <div>
        <h3
          style={{
            margin: "0 0 0.3rem",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {task.title}
        </h3>

        {/* Editable status */}
        <div
          style={{
            margin: "0 0 0.2rem",
            fontSize: 13,
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <strong>Status:</strong>
          <select
            value={task.status}
            onChange={(e) =>
              handleChangeStatus(task.id, e.target.value as TaskStatus)
            }
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.7)",
              background: "rgba(15,23,42,0.98)",
              color: "#e5e7eb",
              padding: "0.15rem 0.6rem",
              fontSize: 12,
              outline: "none",
            }}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <p
          style={{
            margin: "0 0 0.2rem",
            fontSize: 13,
            color: "#9ca3af",
          }}
        >
          <strong>Assignee:</strong>{" "}
          {task.assignee?.username ?? "Unassigned"}
        </p>
        <p
          style={{
            margin: "0 0 0.2rem",
            fontSize: 13,
            color: "#9ca3af",
          }}
        >
          <strong>Created:</strong> {createdAt}
        </p>
        <p
          style={{
            margin: "0 0 0.2rem",
            fontSize: 13,
            color: "#9ca3af",
          }}
        >
          <strong>Updated:</strong> {updatedAt}
        </p>
        <p
          style={{
            margin: "0.3rem 0 0",
            fontSize: 13,
            color: "#e5e7eb",
          }}
        >
          <strong>Details:</strong>{" "}
          {task.details && task.details.trim()
            ? task.details
            : "No details provided."}
        </p>
      </div>
    );
  }

  function renderCommentItem(comment: Comment) {
    const createdAt = comment.createdAt
      ? new Date(comment.createdAt).toLocaleString()
      : "";
    return (
      <div
        key={comment.id}
        style={{
          borderRadius: 14,
          border: "1px solid rgba(148,163,184,0.65)",
          padding: "0.5rem 0.6rem",
          marginBottom: 6,
          background: "rgba(15,23,42,0.96)",
          color: "#e5e7eb",
          fontSize: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 2,
          }}
        >
          <strong style={{ fontSize: 12 }}>{username}</strong>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{createdAt}</span>
        </div>
        <div style={{ marginBottom: 4 }}>{comment.body}</div>
        <button
          type="button"
          onClick={() => handleDeleteComment(comment.id)}
          style={{
            borderRadius: 999,
            border: "1px solid rgba(248,113,113,0.6)",
            background: "rgba(127,29,29,0.25)",
            color: "#fecaca",
            fontSize: 11,
            padding: "0.05rem 0.55rem",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      </div>
    );
  }

  // ---- layout ----

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.24), transparent 60%), radial-gradient(circle at bottom right, rgba(129,140,248,0.24), transparent 55%), #020617",
        color: "#e5e7eb",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text","Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "0.75rem 1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(148,163,184,0.3)",
          background:
            "linear-gradient(to right, rgba(15,23,42,0.97), rgba(15,23,42,0.9))",
          backdropFilter: "blur(22px)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9ca3af",
            }}
          >
            Task Manager
          </div>
          <div style={{ fontSize: 14, color: "#e5e7eb" }}>
            Project workspace
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            Signed in as{" "}
            <span
              style={{
                padding: "0.15rem 0.6rem",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.7)",
                background:
                  "radial-gradient(circle at 0% 0%, rgba(56,189,248,0.35), transparent 60%)",
                color: "#e0f2fe",
                fontSize: 11,
              }}
            >
              {username}
            </span>
          </span>
          <button
            type="button"
            onClick={onLogout}
            style={{
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              background: "rgba(15,23,42,0.95)",
              color: "#e5e7eb",
              fontSize: 11,
              padding: "0.3rem 0.75rem",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: 1160,
          margin: "1.6rem auto 2.4rem",
          padding: "0 1.6rem",
        }}
      >
        {error && (
          <div
            style={{
              marginBottom: 10,
              fontSize: 13,
              color: "#fecaca",
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.6)",
              background: "rgba(127,29,29,0.35)",
              padding: "0.4rem 0.7rem",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.4fr)",
            gap: "1.2rem",
          }}
        >
          {/* Left column: projects */}
          <section>
            {/* New project card */}
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.96)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
                padding: "0.9rem 1rem 1rem",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#9ca3af",
                  }}
                >
                  Projects
                </h2>
                <span
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  {loadingProjects
                    ? "Loading…"
                    : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
                </span>
              </div>

              <form onSubmit={handleCreateProject}>
                <div style={{ marginBottom: 6 }}>
                  <label
                    htmlFor="new-project-name"
                    style={{
                      display: "block",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#9ca3af",
                      marginBottom: 3,
                    }}
                  >
                    Project name
                  </label>
                  <input
                    id="new-project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name here"
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.6)",
                      padding: "0.45rem 0.6rem",
                      background: "rgba(15,23,42,0.96)",
                      color: "#e5e7eb",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label
                    htmlFor="new-project-desc"
                    style={{
                      display: "block",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#9ca3af",
                      marginBottom: 3,
                    }}
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="new-project-desc"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="A short description for this project…"
                    rows={2}
                    style={{
                      width: "100%",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.6)",
                      padding: "0.45rem 0.6rem",
                      background: "rgba(15,23,42,0.96)",
                      color: "#e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.8)",
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,1), rgba(14,165,233,1))",
                    color: "#0b1120",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "0.4rem 0.7rem",
                    cursor: "pointer",
                  }}
                >
                  Add project
                </button>
              </form>
            </div>

            {/* Project list */}
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.96)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.95)",
                padding: "0.9rem 1rem",
                maxHeight: 450,
                overflowY: "auto",
              }}
            >
              {projects.length === 0 && !loadingProjects ? (
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  No projects yet. Create one above to get started.
                </div>
              ) : (
                projects.map(renderProjectItem)
              )}
            </div>
          </section>

          {/* Right column: tasks + details/comments */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Tasks card */}
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.96)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.95)",
                padding: "0.9rem 1rem 1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 13,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                    }}
                  >
                    {selectedProject
                      ? `Tasks — ${selectedProject.name}`
                      : "Tasks"}
                  </h2>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      marginTop: 3,
                    }}
                  >
                    {loadingTasks
                      ? "Loading tasks…"
                      : selectedProject
                      ? `${totalTasks} total · ${todoCount} todo · ${inProgressCount} in progress · ${doneCount} done`
                      : "Select a project to view tasks."}
                  </div>
                </div>

                {/* status filter */}
                <div
                  style={{
                    display: "inline-flex",
                    padding: 3,
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.6)",
                    background: "rgba(15,23,42,0.95)",
                    fontSize: 11,
                  }}
                >
                  {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as StatusFilter[]).map(
                    (value) => {
                      const isActive = statusFilter === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setStatusFilter(value)}
                          style={{
                            border: "none",
                            borderRadius: 999,
                            padding: "0.15rem 0.55rem",
                            cursor: "pointer",
                            background: isActive
                              ? "rgba(56,189,248,1)"
                              : "transparent",
                            color: isActive ? "#0b1120" : "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.10em",
                          }}
                        >
                          {value === "ALL"
                            ? "All"
                            : value === "TODO"
                            ? "Todo"
                            : value === "IN_PROGRESS"
                            ? "In Progress"
                            : "Done"}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* New task form */}
              <form onSubmit={handleCreateTask} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <label
                      htmlFor="new-task-title"
                      style={{
                        display: "block",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        marginBottom: 3,
                      }}
                    >
                      Task title
                    </label>
                    <input
                      id="new-task-title"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Enter task title here"
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,0.6)",
                        padding: "0.45rem 0.6rem",
                        background: "rgba(15,23,42,0.96)",
                        color: "#e5e7eb",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-task-assignee"
                      style={{
                        display: "block",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        marginBottom: 3,
                      }}
                    >
                      Assignee (username)
                    </label>
                    <input
                      id="new-task-assignee"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="user1"
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,0.6)",
                        padding: "0.45rem 0.6rem",
                        background: "rgba(15,23,42,0.96)",
                        color: "#e5e7eb",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 2.3fr)",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <label
                      htmlFor="new-task-status"
                      style={{
                        display: "block",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        marginBottom: 3,
                      }}
                    >
                      Status
                    </label>
                    <select
                      id="new-task-status"
                      value={newTaskStatus}
                      onChange={(e) =>
                        setNewTaskStatus(e.target.value as TaskStatus)
                      }
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,0.6)",
                        padding: "0.4rem 0.6rem",
                        background: "rgba(15,23,42,0.96)",
                        color: "#e5e7eb",
                        fontSize: 13,
                        outline: "none",
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="new-task-details"
                      style={{
                        display: "block",
                        fontSize: 11,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#9ca3af",
                        marginBottom: 3,
                      }}
                    >
                      Details
                    </label>
                    <textarea
                      id="new-task-details"
                      value={newTaskDetails}
                      onChange={(e) => setNewTaskDetails(e.target.value)}
                      placeholder="Describe the task…"
                      rows={2}
                      style={{
                        width: "100%",
                        borderRadius: 10,
                        border: "1px solid rgba(148,163,184,0.6)",
                        padding: "0.45rem 0.6rem",
                        background: "rgba(15,23,42,0.96)",
                        color: "#e5e7eb",
                        fontSize: 13,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedProject}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.8)",
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,1), rgba(14,165,233,1))",
                    color: "#0b1120",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "0.4rem 0.7rem",
                    cursor: selectedProject ? "pointer" : "not-allowed",
                    opacity: selectedProject ? 1 : 0.6,
                  }}
                >
                  Add task
                </button>
              </form>

              {/* Task list */}
              <div
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                {tasks.length === 0 && !loadingTasks ? (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    {selectedProject
                      ? "No tasks yet. Create one above."
                      : "Select a project to see tasks."}
                  </div>
                ) : (
                  tasks.map(renderTaskItem)
                )}
              </div>
            </div>

            {/* Task details + comments */}
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,0.5)",
                background: "rgba(15,23,42,0.96)",
                boxShadow: "0 18px 40px rgba(15,23,42,0.95)",
                padding: "0.9rem 1rem 1.1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 13,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#9ca3af",
                  }}
                >
                  Task Details & Comments
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  {loadingComments
                    ? "Loading comments…"
                    : `${comments.length} comment${
                        comments.length === 1 ? "" : "s"
                      }`}
                </span>
              </div>

              <div
                style={{
                  borderRadius: 14,
                  border: "1px dashed rgba(148,163,184,0.6)",
                  padding: "0.6rem 0.75rem",
                  marginBottom: 10,
                  background: "rgba(15,23,42,0.9)",
                }}
              >
                {renderTaskDetails(selectedTask ?? null)}
              </div>

              {/* New comment form */}
              <form onSubmit={handleAddComment} style={{ marginBottom: 8 }}>
                <label
                  htmlFor="new-comment-body"
                  style={{
                    display: "block",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#9ca3af",
                    marginBottom: 3,
                  }}
                >
                  New comment
                </label>
                <textarea
                  id="new-comment-body"
                  value={newCommentBody}
                  onChange={(e) => setNewCommentBody(e.target.value)}
                  placeholder={
                    selectedTask ? "Write a comment…" : "Select a task first…"
                  }
                  rows={2}
                  disabled={!selectedTask}
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid rgba(148,163,184,0.6)",
                    padding: "0.45rem 0.6rem",
                    background: "rgba(15,23,42,0.96)",
                    color: "#e5e7eb",
                    fontSize: 13,
                    outline: "none",
                    resize: "vertical",
                    opacity: selectedTask ? 1 : 0.6,
                  }}
                />
                <button
                  type="submit"
                  disabled={!selectedTask}
                  style={{
                    marginTop: 4,
                    borderRadius: 999,
                    border: "1px solid rgba(56,189,248,0.8)",
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,1), rgba(14,165,233,1))",
                    color: "#0b1120",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "0.35rem 0.7rem",
                    cursor: selectedTask ? "pointer" : "not-allowed",
                    opacity: selectedTask ? 1 : 0.6,
                  }}
                >
                  Add comment
                </button>
              </form>

              {/* Comments list */}
              <div
                style={{
                  maxHeight: 160,
                  overflowY: "auto",
                }}
              >
                {comments.length === 0 && !loadingComments ? (
                  <div style={{ fontSize: 13, color: "#9ca3af" }}>
                    {selectedTask
                      ? "No comments yet. Add one above."
                      : "Select a task to see comments."}
                  </div>
                ) : (
                  comments.map(renderCommentItem)
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
