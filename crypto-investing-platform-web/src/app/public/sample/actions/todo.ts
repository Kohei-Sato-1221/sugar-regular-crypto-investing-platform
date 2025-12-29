"use server";

import { revalidatePath } from "next/cache";

// Server Actions - サーバー側で実行される関数

export type Todo = {
	id: string;
	title: string;
	completed: boolean;
	createdAt: Date;
};

// 簡易的なインメモリストア（実際のプロジェクトではDBを使用）
let todos: Todo[] = [
	{
		id: "1",
		title: "Server ComponentとServer Actionsのサンプルを作成",
		completed: true,
		createdAt: new Date(),
	},
	{
		id: "2",
		title: "Client Componentでインタラクションを実装",
		completed: false,
		createdAt: new Date(),
	},
];

export async function getTodos(): Promise<Todo[]> {
	// サーバー側でデータを取得
	// 実際のプロジェクトではDBから取得
	await new Promise((resolve) => setTimeout(resolve, 100)); // シミュレーション
	return [...todos];
}

export async function createTodo(title: string): Promise<Todo> {
	// サーバー側で新しいTODOを作成
	const newTodo: Todo = {
		id: Date.now().toString(),
		title,
		completed: false,
		createdAt: new Date(),
	};
	todos.push(newTodo);

	// ページのキャッシュを無効化して再検証
	revalidatePath("/public");

	return newTodo;
}

export async function toggleTodo(id: string): Promise<Todo> {
	// サーバー側でTODOの完了状態をトグル
	const todo = todos.find((t) => t.id === id);
	if (!todo) {
		throw new Error("Todo not found");
	}
	todo.completed = !todo.completed;

	// ページのキャッシュを無効化して再検証
	revalidatePath("/public");

	return todo;
}

export async function deleteTodo(id: string): Promise<void> {
	// サーバー側でTODOを削除
	todos = todos.filter((t) => t.id !== id);

	// ページのキャッシュを無効化して再検証
	revalidatePath("/public");
}
