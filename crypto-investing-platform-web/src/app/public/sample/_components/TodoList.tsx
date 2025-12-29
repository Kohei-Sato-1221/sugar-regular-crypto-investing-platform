import type { Todo } from "../actions/todo";
import { TodoItem } from "./TodoItem";

// Server Component - リストを表示する部分
// Server Componentなので、propsでデータを受け取る
export function TodoList({ todos }: { todos: Todo[] }) {
	return (
		<div className="flex flex-col gap-2">
			{todos.length === 0 ? (
				<p className="text-gray-300">No todos yet. Add one below!</p>
			) : (
				todos.map((todo) => <TodoItem key={todo.id} todo={todo} />)
			)}
		</div>
	);
}
