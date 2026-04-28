import { useState } from "react";
import { TodoCard } from "./components/TodoCard";
import type { Tab, Task } from "./types/task";

const initialTasks: Task[] = [
  { id: crypto.randomUUID(), text: "Personal Work # 1", completed: true },
  { id: crypto.randomUUID(), text: "Personal Work # 2", completed: false },
  { id: crypto.randomUUID(), text: "Personal Work # 3", completed: false },
  { id: crypto.randomUUID(), text: "Personal Work # 4", completed: true },
  { id: crypto.randomUUID(), text: "Personal Work # 5", completed: false },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  const addTask = (text: string) => {
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, completed: false },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.completed));
  };

  return (
    <main className="min-h-screen w-full flex items-start justify-center bg-page py-10">
      <TodoCard
        tasks={tasks}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAdd={addTask}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onClearCompleted={clearCompleted}
      />
    </main>
  );
}

export default App;
