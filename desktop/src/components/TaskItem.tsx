import { Check, Trash2 } from "lucide-react";
import type { Task } from "../types/task";

type TaskItemProps = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className="flex items-center gap-5 py-3 border-b border-divider last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={
          task.completed ? "Mark task incomplete" : "Mark task complete"
        }
        aria-pressed={task.completed}
        className={[
          "shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors",
          task.completed
            ? "border-accent text-accent"
            : "border-checkbox-border text-transparent hover:border-neutral-500",
        ].join(" ")}
      >
        {task.completed && <Check size={18} strokeWidth={3} />}
      </button>

      <span
        className={[
          "flex-1 text-[20px] transition-colors",
          task.completed
            ? "line-through text-text-muted"
            : "text-text-primary",
        ].join(" ")}
      >
        {task.text}
      </span>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete task: ${task.text}`}
        className="shrink-0 text-accent hover:opacity-80 transition p-1"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
