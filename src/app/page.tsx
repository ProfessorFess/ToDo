import { prisma } from "@/lib/prisma";
import { TodoApp } from "@/components/TodoApp";

export default async function Page() {
  const todos = await prisma.todo.findMany({ orderBy: { createdAt: "asc" } });
  return <TodoApp initialTasks={todos} />;
}
