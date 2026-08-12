import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import type { Task, TaskStatus } from "../types";
import { dueInfo, dueText, priorityLabel } from "../ui";

interface KanbanBoardProps {
  tasks: Task[];
  loading: boolean;
  projectSelected: boolean;
  selectedTaskId: number | null;
  onSelect(id: number): void;
  onChangeStatus(id: number, status: TaskStatus): void;
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "To do" },
  { status: "IN_PROGRESS", label: "In progress" },
  { status: "DONE", label: "Done" },
];

function TaskCardInner({
  task,
  selected,
}: {
  task: Task;
  selected: boolean;
}) {
  const due = dueInfo(task.dueAt);
  const isDone = task.status === "DONE";
  const dueClass =
    due && !isDone && due.state !== "later" ? ` due-${due.state}` : "";

  return (
    <div className={`board-card${selected ? " active" : ""}`}>
      <div className="board-card-title">
        <span className={isDone ? "task-done" : ""}>{task.title}</span>
        {task.priority && task.priority !== "MEDIUM" && (
          <span className={`prio-chip prio-${task.priority}`}>
            {priorityLabel(task.priority)}
          </span>
        )}
      </div>
      {(task.assignee?.username || due) && (
        <div className="board-card-meta">
          {task.assignee?.username
            ? task.assignee.username.replace(/^github_/, "")
            : ""}
          {due ? (
            <span className={`due-chip${dueClass}`}>{dueText(due)}</span>
          ) : null}
        </div>
      )}
      {task.labels && task.labels.length > 0 && (
        <div className="label-row" style={{ marginLeft: 0 }}>
          {task.labels.map((l) => (
            <span key={l} className="label-chip">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DraggableCard({
  task,
  selected,
  onSelect,
}: {
  task: Task;
  selected: boolean;
  onSelect(id: number): void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? "board-card-wrap dragging" : "board-card-wrap"}
      onClick={() => onSelect(task.id)}
    >
      <TaskCardInner task={task} selected={selected} />
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  selectedTaskId,
  onSelect,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  selectedTaskId: number | null;
  onSelect(id: number): void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const colTasks = tasks.filter((t) => t.status === status);

  return (
    <div ref={setNodeRef} className={`board-col${isOver ? " over" : ""}`}>
      <div className="board-col-head">
        <span className={`dot dot-${status}`} />
        {label}
        <span className="board-count">{colTasks.length}</span>
      </div>
      <div className="board-col-body">
        {colTasks.length === 0 ? (
          <div className="board-empty">No tasks</div>
        ) : (
          colTasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              selected={task.id === selectedTaskId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  loading,
  projectSelected,
  selectedTaskId,
  onSelect,
  onChangeStatus,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  if (!projectSelected) {
    return (
      <section className="board">
        <div className="pane-empty">Select a project to see its board.</div>
      </section>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <section className="board">
        <div className="pane-empty">Loading board…</div>
      </section>
    );
  }

  function handleStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
  }

  function handleEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = Number(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      onChangeStatus(taskId, newStatus);
    }
  }

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
    >
      <section className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelect={onSelect}
          />
        ))}
      </section>
      <DragOverlay>
        {activeTask ? (
          <TaskCardInner task={activeTask} selected={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
