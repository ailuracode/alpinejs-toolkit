import type { QueryState, QueryStore } from "@ailuracode/alpine-query";
import { createQueryClient } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";
import type { Alpine } from "alpinejs";

const POKEAPI = "https://pokeapi.co/api/v2/pokemon";
const PAGE_SIZE = 12;
const STALE_TIME = 5 * 60_000;

type PokemonListResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: { name: string; url: string }[];
};

type QueryObserver = QueryState<PokemonListResponse> & { destroy(): void };

async function fetchPokemonPage(page: number): Promise<PokemonListResponse> {
	const response = await fetch(
		`${POKEAPI}?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
	);

	if (!response.ok) {
		throw new Error(`PokeAPI request failed (${response.status})`);
	}

	return response.json() as Promise<PokemonListResponse>;
}

function createPokeapiDemo(options: {
	adapterName: string;
	badge: string;
	observePage: (page: number) => QueryObserver;
}) {
	return () => ({
		page: 1,
		pageSize: PAGE_SIZE,
		query: null as QueryObserver | null,
		adapterName: options.adapterName,
		badge: options.badge,
		loadPage() {
			if (this.query?.destroy) {
				this.query.destroy();
			}

			this.query = options.observePage(this.page);
		},
		prevPage() {
			if (this.page > 1) {
				this.page--;
				this.loadPage();
			}
		},
		nextPage() {
			if (this.query?.data?.next) {
				this.page++;
				this.loadPage();
			}
		},
		init() {
			this.loadPage();
		},
		destroy() {
			this.query?.destroy();
		},
	});
}

export function registerQueryDemos(Alpine: Alpine): void {
	const alpineClient = createQueryClient({
		adapter: createAlpineStoreAdapter(Alpine),
	});

	const zustandClient = createQueryClient({
		adapter: createAlpineZustandAdapter(Alpine),
	});

	Alpine.data(
		"queryNanostoresAdapterDemo",
		createPokeapiDemo({
			adapterName: "Nanostores",
			badge: "recommended · $store.query",
			observePage: (page) => {
				const store = Alpine.store("query") as QueryStore;
				return store.observe(["pokemon", page], () => fetchPokemonPage(page), {
					staleTime: STALE_TIME,
				});
			},
		}),
	);

	Alpine.data(
		"queryAlpineAdapterDemo",
		createPokeapiDemo({
			adapterName: "Alpine.reactive",
			badge: "Alpine.reactive",
			observePage: (page) =>
				alpineClient.observe(["pokemon", "alpine", page], () => fetchPokemonPage(page), {
					staleTime: STALE_TIME,
				}),
		}),
	);

	Alpine.data(
		"queryZustandAdapterDemo",
		createPokeapiDemo({
			adapterName: "Zustand",
			badge: "Zustand",
			observePage: (page) =>
				zustandClient.observe(["pokemon", "zustand", page], () => fetchPokemonPage(page), {
					staleTime: STALE_TIME,
				}),
		}),
	);
}
