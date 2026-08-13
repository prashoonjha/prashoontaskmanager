import { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { ProjectRail } from "./ProjectRail";
import { TaskList } from "./TaskList";
import { TaskDetail } from "./TaskDetail";
import { KanbanBoard } from "./KanbanBoard";
import { useWorkspace } from "../hooks/useWorkspace";

interface ProjectViewProps {
  token: string;
  username: string;
  onLogout(): void;
}

export function ProjectView({ token, username, onLogout }: ProjectViewProps) {
  const ws = useWorkspace(token);
  const [view, setView] = useState<"list" | "board">("list");

  useEffect(() => {
    if (view === "board" && ws.filter !== "ALL") {
      ws.setFilter("ALL");
    }
  }, [view, ws.filter, ws.setFilter]);

  return (
    <div className="app">
      <TopBar username={username} onLogout={onLogout} />

      {ws.error && (
        <div className="app-error">
          <span>{ws.error}</span>
          <button className="btn-ghost" onClick={ws.clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className="view-toggle">
        <button
          className={`view-btn${view === "list" ? " active" : ""}`}
          onClick={() => setView("list")}
        >
          List
        </button>
        <button
          className={`view-btn${view === "board" ? " active" : ""}`}
          onClick={() => setView("board")}
        >
          Board
        </button>
      </div>

      <main className={view === "board" ? "workspace board-mode" : "workspace"}>
        <ProjectRail
          projects={ws.projects}
          selectedId={ws.selectedProjectId}
          loading={ws.loadingProjects}
          progressFor={ws.progressFor}
          onSelect={ws.selectProject}
          onDelete={ws.removeProject}
          onCreate={ws.addProject}
        />

        {view === "list" ? (
          <>
            <TaskList
              tasks={ws.tasks}
              selectedTaskId={ws.selectedTaskId}
              filter={ws.filter}
              priorityFilter={ws.priorityFilter}
              loading={ws.loadingTasks}
              projectSelected={ws.selectedProjectId !== null}
              onFilter={ws.setFilter}
              onPriorityFilter={ws.setPriorityFilter}
              onSelect={ws.selectTask}
              onCreate={ws.addTask}
            />

            <TaskDetail
              task={ws.selectedTask}
              comments={ws.comments}
              loadingComments={ws.loadingComments}
              onChangeStatus={ws.changeStatus}
              onChangeDueDate={ws.changeDueDate}
              onChangePriority={ws.changePriority}
              onChangeLabels={ws.changeLabels}
              onDeleteTask={ws.removeTask}
              onAddComment={ws.addComment}
              onDeleteComment={ws.removeComment}
            />
          </>
        ) : (
          <KanbanBoard
            tasks={ws.tasks}
            loading={ws.loadingTasks}
            projectSelected={ws.selectedProjectId !== null}
            selectedTaskId={ws.selectedTaskId}
            onSelect={ws.selectTask}
            onChangeStatus={ws.changeStatus}
          />
        )}
      </main>
    </div>
  );
}
