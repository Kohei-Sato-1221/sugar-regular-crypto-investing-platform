import "@testing-library/jest-dom";
import { vi } from "vitest";

// Next.js Router のモック
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		prefetch: vi.fn(),
		back: vi.fn(),
		refresh: vi.fn(),
	}),
	useSearchParams: () => ({
		get: vi.fn(),
		has: vi.fn(),
		getAll: vi.fn(),
	}),
	usePathname: () => "/",
}));

