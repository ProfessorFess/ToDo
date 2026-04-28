"use client";

import { useState } from "react";
import { TodoCard } from "./TodoCard";
import type { Tab, Task } from "../types/task";

type TodoAppProps = {
  initialTasks: Task[];
};

export function TodoApp({ initialTasks }: TodoAppProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<Tab>("personal");

  const addTask = async (text: string) => {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const created: Task = await res.json();
    setTasks((prev) => [...prev, created]);
  };

  const toggleTask = async (id: string) => {
    const current = tasks.find((t) => t.id === id);
    if (!current) return;
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !current.completed }),
    });
    if (!res.ok) return;
    const updated: Task = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id: string) => {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = async () => {
    const res = await fetch("/api/todos?completed=true", { method: "DELETE" });
    if (!res.ok) return;
    setTasks((prev) => prev.filter((t) => !t.completed));
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
