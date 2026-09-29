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

function formatDueDate(dueDate: string) {
  return dueDate.replaceAll("-", "/");
}

function TodoItem({
  todo,
  onToggle,
  onDeleteRequest,
}: {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onDeleteRequest: (todo: Todo) => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2">
      <input
        type="checkbox"
        checked={todo.isCompleted}
        onChange={() => onToggle(todo)}
        className="h-4 w-4 shrink-0 accent-zinc-50"
      />
      <div className="min-w-0 flex-1">
        <span
          className={
            "block break-words text-sm" +
            (todo.isCompleted ? " text-zinc-500 line-through" : " text-zinc-100")
          }
        >
          {todo.title}
        </span>
        {todo.dueDate && (
          <span className="mt-0.5 block text-xs text-zinc-500">
            期限: {formatDueDate(todo.dueDate)}
          </span>
        )}
      </div>
      <button
        onClick={() => onDeleteRequest(todo)}
        className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
      >
        削除
      </button>
    </li>
  );
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      body: JSON.stringify({
        title,
        dueDate: newDueDate || null,
      } satisfies CreateTodoRequestBody),
    });
    const data = (await res.json()) as CreateTodoResponse;

    setAdding(false);

    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "TODOの追加に失敗しました");
      return;
    }

    setTodos((prev) => [data.todo, ...prev]);
    setNewTitle("");
    setNewDueDate("");
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

  function handleDeleteRequest(todo: Todo) {
    setDeleteTarget(todo);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const target = deleteTarget;

    setDeleting(true);

    const res = await fetch(`/api/todos/${target.id}`, { method: "DELETE" });
    const data = (await res.json()) as DeleteTodoResponse;

    setDeleting(false);
    setDeleteTarget(null);

    if (!res.ok || "error" in data) {
      setError("error" in data ? data.error : "削除に失敗しました");
      return;
    }

    setTodos((prev) => prev.filter((t) => t.id !== target.id));
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const activeTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);

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
          <form onSubmit={handleAdd} className="flex flex-col gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="新しいTODOを入力"
              className="min-w-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newDueDate}
                onChange={(event) => setNewDueDate(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500 [color-scheme:dark]"
              />
              <button
                type="submit"
                disabled={adding || newTitle.trim() === ""}
                className="shrink-0 rounded-lg bg-zinc-50 px-4 py-2 font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                追加
              </button>
            </div>
          </form>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          <div className="mt-6 flex flex-col gap-2">
            {loading ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                読み込み中…
              </p>
            ) : todos.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                TODOはまだありません
              </p>
            ) : (
              <>
                {activeTodos.length === 0 ? (
                  <p className="py-4 text-center text-sm text-zinc-500">
                    未完了のTODOはありません
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {activeTodos.map((todo) => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={handleToggle}
                        onDeleteRequest={handleDeleteRequest}
                      />
                    ))}
                  </ul>
                )}

                {completedTodos.length > 0 && (
                  <div className="mt-2 border-t border-zinc-800 pt-2">
                    <button
                      onClick={() => setCompletedOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      <span>完了済み ({completedTodos.length})</span>
                      <span
                        className={
                          "transition-transform" +
                          (completedOpen ? " rotate-180" : "")
                        }
                      >
                        ▾
                      </span>
                    </button>
                    {completedOpen && (
                      <ul className="mt-2 flex flex-col gap-2">
                        {completedTodos.map((todo) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={handleToggle}
                            onDeleteRequest={handleDeleteRequest}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <p className="text-sm text-zinc-300">
              「{deleteTarget.title}」を削除しますか?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                いいえ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "削除中…" : "はい"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
