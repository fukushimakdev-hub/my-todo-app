import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/supabase/server";
import { db } from "@/src/prisma/db";

export type Todo = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
};

export type ListTodosResponse = { todos: Todo[] } | { error: string };

export type CreateTodoRequestBody = { title: string };
export type CreateTodoResponse = { todo: Todo } | { error: string };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<ListTodosResponse>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const rows = await db
    .asServiceRole()
    .orm.public.Todo.where({ userId: user.id })
    .orderBy((t) => t.createdAt.desc())
    .all();

  const todos: Todo[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    isCompleted: row.isCompleted,
    createdAt: row.createdAt,
  }));

  return NextResponse.json<ListTodosResponse>({ todos });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<CreateTodoResponse>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as CreateTodoRequestBody;
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json<CreateTodoResponse>(
      { error: "title is required" },
      { status: 400 },
    );
  }

  const row = await db.asServiceRole().orm.public.Todo.create({
    userId: user.id,
    title,
  });

  return NextResponse.json<CreateTodoResponse>(
    {
      todo: {
        id: row.id,
        title: row.title,
        isCompleted: row.isCompleted,
        createdAt: row.createdAt,
      },
    },
    { status: 201 },
  );
}
