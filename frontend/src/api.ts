import type { Project, Task, TaskStatus, Comment, Page } from "./types";

export const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/+$/, "");

// Tokens that backend returns from /api/auth/*
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  username: string;
}

// Generic helper to call backend JSON APIs
async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        message = text;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    // @ts-expect-error: caller expects void / null
    return null;
  }

  return (await res.json()) as T;
}

// ===== Auth =====

export async function login(
  username: string,
  password: string
): Promise<AuthTokens> {
  return request<AuthTokens>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function register(
  username: string,
  password: string
): Promise<AuthTokens> {
  return request<AuthTokens>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function refresh(
  refreshTokenValue: string
): Promise<AuthTokens> {
  return request<AuthTokens>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  });
}

export async function me(token: string): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me", {}, token);
}

// ===== Projects =====

export async function fetchProjects(
  token: string,
  page = 0,
  size = 50
): Promise<Page<Project>> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy: "createdAt",
    dir: "desc",
  });
  return request<Page<Project>>(`/api/projects?${query.toString()}`, {}, token);
}

export async function createProject(
  token: string,
  name: string,
  description?: string
): Promise<Project> {
  return request<Project>(
    "/api/projects",
    {
      method: "POST",
      body: JSON.stringify({ name, description }),
    },
    token
  );
}

export async function deleteProject(
  token: string,
  projectId: number
): Promise<void> {
  await request<void>(
    `/api/projects/${projectId}`,
    {
      method: "DELETE",
    },
    token
  );
}

// ===== Tasks =====

export async function fetchTasks(
  token: string,
  projectId: number,
  page = 0,
  size = 100,
  status?: TaskStatus
): Promise<Page<Task>> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (status) {
    query.set("status", status);
  }

  return request<Page<Task>>(
    `/api/projects/${projectId}/tasks?${query.toString()}`,
    {},
    token
  );
}

export interface CreateTaskPayload {
  title: string;
  details?: string;
  status?: TaskStatus;
  dueAt?: string;
  assigneeUsername?: string;
}

export async function createTask(
  token: string,
  projectId: number,
  payload: CreateTaskPayload
): Promise<Task> {
  const body: CreateTaskPayload = {
    title: payload.title,
    details: payload.details,
    status: payload.status,
    dueAt: payload.dueAt,
    assigneeUsername: payload.assigneeUsername,
  };

  return request<Task>(
    `/api/projects/${projectId}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token
  );
}

export async function deleteTask(
  token: string,
  projectId: number,
  taskId: number
): Promise<void> {
  await request<void>(
    `/api/projects/${projectId}/tasks/${taskId}`,
    {
      method: "DELETE",
    },
    token
  );
}

export async function updateTaskStatus(
  token: string,
  projectId: number,
  taskId: number,
  status: TaskStatus
): Promise<Task> {
  return request<Task>(
    `/api/projects/${projectId}/tasks/${taskId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    token
  );
}

// ===== Comments =====

export async function fetchComments(
  token: string,
  taskId: number,
  page = 0,
  size = 50
): Promise<Page<Comment>> {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return request<Page<Comment>>(
    `/api/tasks/${taskId}/comments?${query.toString()}`,
    {},
    token
  );
}

export async function createComment(
  token: string,
  taskId: number,
  body: string
): Promise<Comment> {
  return request<Comment>(
    `/api/tasks/${taskId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
    token
  );
}

export async function deleteComment(
  token: string,
  taskId: number,
  commentId: number
): Promise<void> {
  await request<void>(
    `/api/tasks/${taskId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
    token
  );
}
