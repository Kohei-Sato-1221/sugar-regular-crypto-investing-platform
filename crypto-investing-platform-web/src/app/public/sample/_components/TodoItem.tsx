"use client";

import { useTransition } from "react";
import type { Todo } from "../actions/todo";
import { toggleTodo, deleteTodo } from "../actions/todo";

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
			<div className="flex items-center gap-3 flex-1">
				<input
					type="checkbox"
					checked={todo.completed}
					onChange={handleToggle}
					disabled={isPending}
					className="h-5 w-5 rounded border-gray-300"
				/>
				<span
					className={`text-lg ${
						todo.completed ? "line-through text-gray-400" : "text-white"
					}`}
				>
					{todo.title}
				</span>
			</div>
			<button
				onClick={handleDelete}
				disabled={isPending}
				className="rounded bg-red-500/20 px-4 py-2 text-red-200 hover:bg-red-500/30 disabled:opacity-50"
			>
				Delete
			</button>
		</div>
	);
}

