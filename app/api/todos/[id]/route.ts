import { NextResponse } from "next/server";
import { getCurrentUser } from "@/utils/supabase/server";
import { db } from "@/src/prisma/db";
import type { Todo } from "../route";

export type UpdateTodoRequestBody = { isCompleted: boolean };
export type UpdateTodoResponse = { todo: Todo } | { error: string };

export type DeleteTodoResponse = { ok: true } | { error: string };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<UpdateTodoResponse>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = (await request.json()) as UpdateTodoRequestBody;

  if (typeof body.isCompleted !== "boolean") {
    return NextResponse.json<UpdateTodoResponse>(
      { error: "isCompleted must be a boolean" },
      { status: 400 },
    );
  }

  const row = await db
    .asServiceRole()
    .orm.public.Todo.where({ id, userId: user.id })
    .update({ isCompleted: body.isCompleted });

  if (!row) {
    return NextResponse.json<UpdateTodoResponse>(
      { error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json<UpdateTodoResponse>({
    todo: {
      id: row.id,
      title: row.title,
      isCompleted: row.isCompleted,
      dueDate: row.dueDate,
      createdAt: row.createdAt,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json<DeleteTodoResponse>(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const row = await db
    .asServiceRole()
    .orm.public.Todo.where({ id, userId: user.id })
    .delete();

  if (!row) {
    return NextResponse.json<DeleteTodoResponse>(
      { error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json<DeleteTodoResponse>({ ok: true });
}
