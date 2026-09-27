"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // Email confirmation is disabled on this project: the user is signed
      // in immediately.
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。",
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-50">
          新規登録
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-300"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-300"
            >
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 outline-none focus:border-zinc-500"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-zinc-50 py-2 font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "登録中…" : "登録する"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          すでにアカウントをお持ちですか?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-50 underline underline-offset-2"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
