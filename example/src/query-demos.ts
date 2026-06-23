import type { QueryState, QueryStore } from "@ailuracode/alpine-query";
import { createQueryClient, typedFetch } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { createAlpineZustandAdapter } from "@ailuracode/alpine-query-adapter-zustand";
import type { Alpine } from "alpinejs";

const POKEAPI = "https://pokeapi.co/api/v2/pokemon";
const PAGE_SIZE = 12;
const STALE_TIME = 5 * 60_000;
const SKELETON_NAMES = [
	"bulbasaur",
	"ivysaur",
	"charmander",
	"squirtle",
	"caterpie",
	"weedle",
	"pidgey",
	"rattata",
	"spearow",
	"ekans",
	"pikachu",
	"sandshrew",
] as const;

type PokemonListResponse = {
	count: number;
	next: string | null;
	previous: string | null;
	results: { name: string; url: string }[];
};

type QueryObserver = QueryState<PokemonListResponse> & { destroy(): void };

type PokemonRow = {
	id: number;
	name: string;
	loading?: boolean;
};

type PokeapiDemoData = {
	page: number;
	pageSize: number;
	queries: Record<number, QueryObserver>;
	adapterName: string;
	badge: string;
	query: QueryObserver | null;
	rows: PokemonRow[];
	tableRows: PokemonRow[];
	isAwaitingData: boolean;
	totalCount: number;
	hasCachedPage: boolean;
	ensurePage(page?: number): void;
	loadPage(): void;
	prevPage(): void;
	nextPage(): void;
	init(): void;
	destroy(): void;
};

function createSkeletonRows(page: number, pageSize: number): PokemonRow[] {
	const offset = (page - 1) * pageSize;

	return Array.from({ length: pageSize }, (_, index) => ({
		id: offset + index + 1,
		name: SKELETON_NAMES[index % SKELETON_NAMES.length] ?? "pokemon",
		loading: true,
	}));
}

async function fetchPokemonPage(page: number): Promise<PokemonListResponse> {
	return typedFetch<PokemonListResponse>(
		`${POKEAPI}?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`,
		{
			// Avoid the browser HTTP cache so DevTools throttling and refetches hit the network.
			cache: "no-store",
		},
	);
}

function createPokeapiDemo(options: {
	adapterName: string;
	badge: string;
	observePage: (page: number) => QueryObserver;
}) {
	return (): PokeapiDemoData => ({
		page: 1,
		pageSize: PAGE_SIZE,
		queries: {} as Record<number, QueryObserver>,
		adapterName: options.adapterName,
		badge: options.badge,
		get query(): QueryObserver | null {
			return this.queries[this.page] ?? null;
		},
		get rows(): PokemonRow[] {
			const query = this.query;
			if (!query?.data?.results?.length) {
				return [];
			}

			const offset = (this.page - 1) * this.pageSize;

			return query.data.results.map((pokemon, index) => ({
				id: offset + index + 1,
				name: pokemon.name,
			}));
		},
		get tableRows(): PokemonRow[] {
			if (this.rows.length > 0) {
				return this.rows;
			}

			// Skeleton while the query resolves — avoid isLoading (flickers on page changes).
			if (this.query && !this.hasCachedPage) {
				return createSkeletonRows(this.page, this.pageSize);
			}

			return [];
		},
		get isAwaitingData(): boolean {
			return Boolean(this.query && !this.hasCachedPage);
		},
		get totalCount(): number {
			return this.query?.data?.count ?? 0;
		},
		get hasCachedPage(): boolean {
			return Boolean(this.query?.data?.results?.length);
		},
		ensurePage(this: PokeapiDemoData, page = this.page) {
			if (this.queries[page]) {
				return;
			}

			this.queries[page] = options.observePage(page);
		},
		loadPage() {
			this.ensurePage(this.page);
		},
		prevPage() {
			if (this.page > 1) {
				this.page--;
				this.ensurePage(this.page);
			}
		},
		nextPage() {
			if (this.query?.data?.next) {
				this.page++;
				this.ensurePage(this.page);
			}
		},
		init() {
			this.ensurePage(1);
		},
		destroy() {
			for (const query of Object.values(this.queries)) {
				query.destroy();
			}

			this.queries = {};
		},
	});
}

export function registerQueryDemos(Alpine: Alpine): QueryStore[] {
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

	return [alpineClient, zustandClient];
}
