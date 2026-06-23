import { createQueryClient } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";
import type { Alpine } from "alpinejs";

const API = "https://jsonplaceholder.typicode.com";

type JsonPlaceholderUser = {
	id: number;
	name: string;
	username: string;
	email: string;
};

async function fetchUser(id: number): Promise<JsonPlaceholderUser> {
	const response = await fetch(`${API}/users/${id}`);

	if (!response.ok) {
		throw new Error(`JSONPlaceholder request failed (${response.status})`);
	}

	return response.json() as Promise<JsonPlaceholderUser>;
}

export function registerQueryDemos(Alpine: Alpine): void {
	const alpineClient = createQueryClient({
		adapter: createAlpineStoreAdapter(Alpine),
	});

	Alpine.data("queryAlpineAdapterDemo", () => ({
		query: null as ReturnType<typeof alpineClient.observe<JsonPlaceholderUser>> | null,
		adapterName: "Alpine.reactive",
		init() {
			this.query = alpineClient.observe(
				["example", "adapter", "alpine", "user", 1],
				() => fetchUser(1),
				{ staleTime: 60_000 },
			);
		},
		destroy() {
			this.query?.destroy();
		},
	}));

	const zustandClient = createQueryClient({
		adapter: createAlpineZustandAdapter(Alpine),
	});

	Alpine.data("queryZustandAdapterDemo", () => ({
		query: null as ReturnType<typeof zustandClient.observe<JsonPlaceholderUser>> | null,
		adapterName: "Zustand",
		init() {
			this.query = zustandClient.observe(
				["example", "adapter", "zustand", "user", 2],
				() => fetchUser(2),
				{ staleTime: 60_000 },
			);
		},
		destroy() {
			this.query?.destroy();
		},
	}));
}
