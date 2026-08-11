import type { TaskStatus } from "./types";

export function initials(name: string): string {
  const cleaned = name.replace(/^github_/, "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/[\s_-]+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function statusLabel(status: TaskStatus): string {
  switch (status) {
    case "TODO":
      return "To do";
    case "IN_PROGRESS":
      return "In progress";
    case "DONE":
      return "Done";
  }
}

export function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export type DueState = "overdue" | "soon" | "later";

export interface DueInfo {
  text: string;
  state: DueState;
  days: number;
}

export function dueInfo(value?: string | null): DueInfo | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDue = new Date(date);
  startOfDue.setHours(0, 0, 0, 0);

  const days = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / 86400000
  );

  let state: DueState;
  if (days < 0) {
    state = "overdue";
  } else if (days <= 2) {
    state = "soon";
  } else {
    state = "later";
  }

  return { text: formatDate(value) ?? "", state, days };
}

export function dueText(info: DueInfo): string {
  if (info.state === "overdue") {
    const n = Math.abs(info.days);
    return n === 0 ? "due today" : `overdue by ${n}d`;
  }
  if (info.days === 0) return "due today";
  if (info.days === 1) return "due tomorrow";
  return `due ${info.text}`;
}

export function isoToDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function priorityLabel(priority?: string): string {
  switch (priority) {
    case "LOW":
      return "Low";
    case "HIGH":
      return "High";
    case "MEDIUM":
    default:
      return "Medium";
  }
}
