"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type {
  Todo,
  ListTodosResponse,
  CreateTodoRequestBody,
  CreateTodoResponse,
} from "@/app/api/todos/route";
import type {
  UpdateTodoRequestBody,
  UpdateTodoResponse,
  DeleteTodoResponse,
} from "@/app/api/todos/[id]/route";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    loadTodos();
  }, []);

  async function loadTodos() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/todos");
    const data = (await res.json()) as ListTodosResponse;

    setLoading(false);

    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "TODOの取得に失敗しました");
      return;
    }

    setTodos(data.todos);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setAdding(true);
    setError(null);

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title } satisfies CreateTodoRequestBody),
    });
    const data = (await res.json()) as CreateTodoResponse;

    setAdding(false);

    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "TODOの追加に失敗しました");
      return;
    }

    setTodos((prev) => [data.todo, ...prev]);
    setNewTitle("");
  }

  async function handleToggle(todo: Todo) {
    const nextIsCompleted = !todo.isCompleted;

    // Optimistic update.
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todo.id ? { ...t, isCompleted: nextIsCompleted } : t,
      ),
    );

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isCompleted: nextIsCompleted,
      } satisfies UpdateTodoRequestBody),
    });
    const data = (await res.json()) as UpdateTodoResponse;

    if (!res.ok || "error" in data) {
      // Revert on failure.
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t,
        ),
      );
      setError("error" in data ? data.error : "更新に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));

    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    const data = (await res.json()) as DeleteTodoResponse;

    if (!res.ok || "error" in data) {
      setTodos(previous);
      setError("error" in data ? data.error : "削除に失敗しました");
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-4 sm:px-8">
        <h1 className="text-lg font-semibold">My TODO App</h1>
        <div className="flex items-center gap-3">
          <span className="hidden max-w-[12rem] truncate text-sm text-zinc-400 sm:inline">
            {email ?? "…"}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="shrink-0 whitespace-nowrap rounded-lg border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {loggingOut ? "ログアウト中…" : "ログアウト"}
          </button>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl sm:p-8">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="新しいTODOを入力"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={adding || newTitle.trim() === ""}
              className="shrink-0 rounded-lg bg-zinc-50 px-4 py-2 font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              追加
            </button>
          </form>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <ul className="mt-6 flex flex-col gap-2">
            {loading ? (
              <li className="py-8 text-center text-sm text-zinc-500">
                読み込み中…
              </li>
            ) : todos.length === 0 ? (
              <li className="py-8 text-center text-sm text-zinc-500">
                TODOはまだありません
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={() => handleToggle(todo)}
                    className="h-4 w-4 shrink-0 accent-zinc-50"
                  />
                  <span
                    className={
                      "min-w-0 flex-1 break-words text-sm" +
                      (todo.isCompleted
                        ? " text-zinc-500 line-through"
                        : " text-zinc-100")
                    }
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
                  >
                    削除
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
