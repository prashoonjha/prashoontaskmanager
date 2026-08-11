export interface Project {
  id: number;
  name: string;
  description?: string | null;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: number;
  title: string;
  details?: string | null;
  status: TaskStatus;
  priority?: TaskPriority;
  labels?: string[];
  dueAt?: string | null;
  createdAt?: string | null;
  assignee?: {
    id?: number;
    username?: string;
  } | null;
}

export interface Comment {
  id: number;
  body: string;
  createdAt?: string | null;
  authorUsername?: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
