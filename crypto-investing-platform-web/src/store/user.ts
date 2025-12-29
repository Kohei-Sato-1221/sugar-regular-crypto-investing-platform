import { atom } from "jotai";

/**
 * ユーザーデータの型定義
 */
export type User = {
	id: string;
	name: string;
	email: string | null;
} | null;

/**
 * ユーザー情報を管理するatom
 * モジュールスコープで定義することで、アプリ全体で同じインスタンスを共有
 */
export const userAtom = atom<User>(null);
