"use client";

import { useTransition } from "react";
import type { Todo } from "../actions/todo";
import { deleteTodo, toggleTodo } from "../actions/todo";

// Client Component - インタラクティブな部分
// onClickなどのイベントハンドラを使用するため'use client'が必要
export function TodoItem({ todo }: { todo: Todo }) {
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			await toggleTodo(todo.id);
		});
	};

	const handleDelete = () => {
		startTransition(async () => {
			await deleteTodo(todo.id);
		});
	};

	return (
		<div
			className={`flex items-center justify-between gap-4 rounded-lg bg-white/10 p-4 backdrop-blur ${
				todo.completed ? "opacity-60" : ""
			}`}
		>
			<div className="flex flex-1 items-center gap-3">
				<input
					checked={todo.completed}
					className="h-5 w-5 rounded border-gray-300"
					disabled={isPending}
					onChange={handleToggle}
					type="checkbox"
				/>
				<span className={`text-lg ${todo.completed ? "text-gray-400 line-through" : "text-white"}`}>
					{todo.title}
				</span>
			</div>
			<button
				className="rounded bg-red-500/20 px-4 py-2 text-red-200 hover:bg-red-500/30 disabled:opacity-50"
				disabled={isPending}
				onClick={handleDelete}
				type="button"
			>
				Delete
			</button>
		</div>
	);
}
