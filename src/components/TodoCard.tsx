import type { Tab, Task } from "../types/task";
import { ClearCompletedButton } from "./ClearCompletedButton";
import { Logo } from "./Logo";
import { TabBar } from "./TabBar";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";

type TodoCardProps = {
  tasks: Task[];
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
};

export function TodoCard({
  tasks,
  activeTab,
  onTabChange,
  onAdd,
  onToggle,
  onDelete,
  onClearCompleted,
}: TodoCardProps) {
  const hasCompleted = tasks.some((task) => task.completed);

  return (
    <div className="w-full max-w-[720px] mx-auto flex flex-col gap-6 p-8">
      <Logo />
      <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      <TaskInput onAdd={onAdd} />

      <div className="bg-card rounded-[28px] p-6 shadow-sm">
        <TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} />
        <div className="flex justify-end pt-4">
          <ClearCompletedButton
            onClear={onClearCompleted}
            disabled={!hasCompleted}
          />
        </div>
      </div>
    </div>
  );
}
