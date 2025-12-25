import { getTodos } from "./actions/todo";
import { AddTodoForm } from "./_components/AddTodoForm";
import { TodoList } from "./_components/TodoList";
import { ServerInfo } from "./_components/ServerInfo";

// Server Component - ページのメインコンポーネント
// データ取得はServer Componentで行う（デフォルトでServer Component）
export default async function PublicSamplePage() {
	// Server Componentなので、サーバー側でデータを取得
	const todos = await getTodos();

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-purple-600 text-white">
			<div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
				<div className="text-center">
					<h1 className="font-extrabold text-5xl tracking-tight sm:text-[5rem]">
						PublicSamplePage
					</h1>
					<p className="mt-4 text-xl text-blue-100">
						Server Components + Server Actions + Client Components
					</p>
				</div>

				{/* Server Component - サーバー側の情報を表示 */}
				<ServerInfo />

				{/* Server Component - TODOリストを表示 */}
				<div className="w-full max-w-2xl rounded-xl bg-white/10 p-8 backdrop-blur">
					<h2 className="mb-6 text-2xl font-bold">Todo List</h2>

					{/* Server ComponentからClient Componentにpropsでデータを渡す */}
					<TodoList todos={todos} />

					<div className="mt-6">
						{/* Client Component - インタラクティブなフォーム */}
						<AddTodoForm />
					</div>
				</div>

				<div className="mt-8 rounded-lg bg-white/5 p-6 backdrop-blur">
					<h3 className="mb-4 font-semibold text-lg">
						このサンプルの構成
					</h3>
					<ul className="flex flex-col gap-2 text-sm text-gray-300">
						<li>
							✅ <strong>Server Component</strong>: page.tsx, TodoList.tsx,
							ServerInfo.tsx
						</li>
						<li>
							✅ <strong>Server Actions</strong>: actions/todo.ts
						</li>
						<li>
							✅ <strong>Client Components</strong>: TodoItem.tsx,
							AddTodoForm.tsx
						</li>
					</ul>
				</div>
			</div>
		</main>
	);
}
