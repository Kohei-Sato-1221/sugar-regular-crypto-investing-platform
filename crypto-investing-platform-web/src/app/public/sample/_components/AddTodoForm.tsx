"use client";

import { type FormEvent, useState, useTransition } from "react";
import { createTodo } from "../actions/todo";

// Client Component - フォーム入力と送信
// useStateとonSubmitを使用するため'use client'が必要
export function AddTodoForm() {
	const [title, setTitle] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!title.trim()) return;

		startTransition(async () => {
			await createTodo(title);
			setTitle(""); // フォームをリセット
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<input
				type="text"
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				placeholder="Add a new todo..."
				disabled={isPending}
				className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-white placeholder-gray-400 backdrop-blur focus:bg-white/20 focus:outline-none disabled:opacity-50"
			/>
			<button
				type="submit"
				disabled={isPending || !title.trim()}
				className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isPending ? "Adding..." : "Add"}
			</button>
		</form>
	);
}

