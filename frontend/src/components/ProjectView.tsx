import { TopBar } from "./TopBar";
import { ProjectRail } from "./ProjectRail";
import { TaskList } from "./TaskList";
import { TaskDetail } from "./TaskDetail";
import { useWorkspace } from "../hooks/useWorkspace";

interface ProjectViewProps {
  token: string;
  username: string;
  onLogout(): void;
}

export function ProjectView({ token, username, onLogout }: ProjectViewProps) {
  const ws = useWorkspace(token);

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

      <main className="workspace">
        <ProjectRail
          projects={ws.projects}
          selectedId={ws.selectedProjectId}
          loading={ws.loadingProjects}
          progressFor={ws.progressFor}
          onSelect={ws.selectProject}
          onDelete={ws.removeProject}
          onCreate={ws.addProject}
        />

        <TaskList
          tasks={ws.tasks}
          selectedTaskId={ws.selectedTaskId}
          filter={ws.filter}
          loading={ws.loadingTasks}
          projectSelected={ws.selectedProjectId !== null}
          onFilter={ws.setFilter}
          onSelect={ws.selectTask}
          onCreate={ws.addTask}
        />

        <TaskDetail
          task={ws.selectedTask}
          comments={ws.comments}
          loadingComments={ws.loadingComments}
          onChangeStatus={ws.changeStatus}
          onChangeDueDate={ws.changeDueDate}
          onDeleteTask={ws.removeTask}
          onAddComment={ws.addComment}
          onDeleteComment={ws.removeComment}
        />
      </main>
    </div>
  );
}
