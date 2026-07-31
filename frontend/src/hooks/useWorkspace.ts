import { useCallback, useEffect, useMemo, useState } from "react";
import type { Project, Task, TaskStatus, Comment } from "../types";
import {
  createComment,
  createProject,
  createTask,
  deleteComment,
  deleteProject,
  deleteTask,
  fetchComments,
  fetchProjects,
  fetchProjectStats,
  fetchTasks,
  updateTaskStatus,
} from "../api";

type StatusFilter = TaskStatus | "ALL";

export interface CreateTaskInput {
  title: string;
  details?: string;
  status: TaskStatus;
  assigneeUsername?: string;
}

export function useWorkspace(token: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // task counts per project, for the progress meters
  const [counts, setCounts] = useState<Record<number, { done: number; total: number }>>({});

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  // ---- load projects ----
  useEffect(() => {
    let cancelled = false;
    setLoadingProjects(true);
    setError(null);
    fetchProjects(token, 0, 100)
      .then((page) => {
        if (cancelled) return;
        setProjects(page.content);
        setSelectedProjectId((cur) => cur ?? page.content[0]?.id ?? null);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoadingProjects(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ---- load per-project counts for the meters ----
  const refreshCounts = useCallback(
    (projectId: number) => {
      fetchProjectStats(token, projectId)
        .then((stats) => {
          setCounts((prev) => ({
            ...prev,
            [projectId]: { done: stats.done, total: stats.total },
          }));
        })
        .catch(() => {
          /* meters are best-effort */
        });
    },
    [token]
  );

  useEffect(() => {
    projects.forEach((p) => refreshCounts(p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.map((p) => p.id).join(","), refreshCounts]);

  // ---- load tasks ----
  useEffect(() => {
    if (selectedProjectId === null) {
      setTasks([]);
      setSelectedTaskId(null);
      return;
    }
    const projectId = selectedProjectId;
    let cancelled = false;
    setLoadingTasks(true);
    setError(null);
    fetchTasks(token, projectId, 0, 100, filter === "ALL" ? undefined : filter)
      .then((page) => {
        if (cancelled) return;
        setTasks(page.content);
        setSelectedTaskId(page.content[0]?.id ?? null);
      })
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoadingTasks(false));
    return () => {
      cancelled = true;
    };
  }, [token, selectedProjectId, filter]);

  // ---- load comments ----
  useEffect(() => {
    if (selectedTaskId === null) {
      setComments([]);
      return;
    }
    const taskId = selectedTaskId;
    let cancelled = false;
    setLoadingComments(true);
    fetchComments(token, taskId, 0, 100)
      .then((page) => !cancelled && setComments(page.content))
      .catch((err) => !cancelled && setError((err as Error).message))
      .finally(() => !cancelled && setLoadingComments(false));
    return () => {
      cancelled = true;
    };
  }, [token, selectedTaskId]);

  // ---- mutations ----
  const addProject = useCallback(
    async (name: string, description?: string) => {
      setError(null);
      const project = await createProject(token, name, description);
      setProjects((prev) => [project, ...prev]);
      setSelectedProjectId(project.id);
    },
    [token]
  );

  const removeProject = useCallback(
    async (id: number) => {
      if (!window.confirm("Delete this project and all its tasks?")) return;
      setError(null);
      try {
        await deleteProject(token, id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProjectId === id) setSelectedProjectId(null);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token, selectedProjectId]
  );

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (selectedProjectId === null) return;
      setError(null);
      const task = await createTask(token, selectedProjectId, input);
      setTasks((prev) => [task, ...prev]);
      setSelectedTaskId(task.id);
      refreshCounts(selectedProjectId);
    },
    [token, selectedProjectId, refreshCounts]
  );

  const removeTask = useCallback(
    async (id: number) => {
      if (selectedProjectId === null) return;
      if (!window.confirm("Delete this task?")) return;
      setError(null);
      try {
        await deleteTask(token, selectedProjectId, id);
        setTasks((prev) => prev.filter((t) => t.id !== id));
        if (selectedTaskId === id) setSelectedTaskId(null);
        refreshCounts(selectedProjectId);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token, selectedProjectId, selectedTaskId, refreshCounts]
  );

  const changeStatus = useCallback(
    async (id: number, status: TaskStatus) => {
      if (selectedProjectId === null) return;
      setError(null);
      try {
        const updated = await updateTaskStatus(token, selectedProjectId, id, status);
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        refreshCounts(selectedProjectId);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token, selectedProjectId, refreshCounts]
  );

  const addComment = useCallback(
    async (bodyText: string) => {
      if (selectedTaskId === null) return;
      setError(null);
      const created = await createComment(token, selectedTaskId, bodyText);
      setComments((prev) => [...prev, created]);
    },
    [token, selectedTaskId]
  );

  const removeComment = useCallback(
    async (id: number) => {
      if (selectedTaskId === null) return;
      if (!window.confirm("Delete this comment?")) return;
      setError(null);
      try {
        await deleteComment(token, selectedTaskId, id);
        setComments((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token, selectedTaskId]
  );

  const progressFor = useCallback(
    (projectId: number) => counts[projectId] ?? null,
    [counts]
  );

  return {
    projects,
    selectedProjectId,
    tasks,
    selectedTaskId,
    selectedTask,
    comments,
    filter,
    loadingProjects,
    loadingTasks,
    loadingComments,
    error,
    setFilter,
    selectProject: setSelectedProjectId,
    selectTask: setSelectedTaskId,
    progressFor,
    addProject,
    removeProject,
    addTask,
    removeTask,
    changeStatus,
    addComment,
    removeComment,
    clearError: () => setError(null),
  };
}
