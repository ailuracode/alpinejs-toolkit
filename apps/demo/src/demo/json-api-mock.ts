type ArticleRecord = {
  id: string;
  title: string;
  body: string;
  authorId: string;
};

type PersonRecord = {
  id: string;
  name: string;
};

const people: PersonRecord[] = [{ id: "9", name: "Dan Gebhardt" }];

let articles: ArticleRecord[] = [
  {
    id: "1",
    title: "JSON:API paints my bikeshed!",
    body: "A complete specification for building APIs.",
    authorId: "9",
  },
  {
    id: "2",
    title: "Alpine + JSON:API",
    body: "Typed fetch helpers for queryFn callbacks.",
    authorId: "9",
  },
];

let nextId = 3;

function jsonApiHeaders(): HeadersInit {
  return { "content-type": "application/vnd.api+json", accept: "application/vnd.api+json" };
}

function articleDocument(article: ArticleRecord) {
  return {
    data: {
      type: "articles",
      id: article.id,
      attributes: { title: article.title, body: article.body },
      relationships: {
        author: { data: { type: "people", id: article.authorId } },
      },
    },
    included: people.map((person) => ({
      type: "people",
      id: person.id,
      attributes: { name: person.name },
    })),
  };
}

function articlesCollection(sort?: string) {
  const sorted = [...articles];

  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "-title") {
    sorted.sort((a, b) => b.title.localeCompare(a.title));
  }

  return {
    data: sorted.map((article) => ({
      type: "articles",
      id: article.id,
      attributes: { title: article.title, body: article.body },
      relationships: {
        author: { data: { type: "people", id: article.authorId } },
      },
    })),
    included: people.map((person) => ({
      type: "people",
      id: person.id,
      attributes: { name: person.name },
    })),
    links: { self: "/json-api/articles" },
  };
}

function parseSort(url: URL): string | undefined {
  return url.searchParams.get("sort") ?? undefined;
}

function notFoundResponse(): Response {
  return Response.json(
    { errors: [{ status: "404", title: "Not found" }] },
    { status: 404, headers: jsonApiHeaders() }
  );
}

function findArticle(id: string): ArticleRecord | undefined {
  return articles.find((item) => item.id === id);
}

function parseAttributes(init?: RequestInit): { title?: string; body?: string } {
  const payload = init?.body ? JSON.parse(String(init.body)) : null;
  return payload?.data?.attributes ?? {};
}

function handleListArticles(url: URL): Response {
  return Response.json(articlesCollection(parseSort(url)), { headers: jsonApiHeaders() });
}

function handleGetArticle(id: string): Response {
  const article = findArticle(id);
  return article
    ? Response.json(articleDocument(article), { headers: jsonApiHeaders() })
    : notFoundResponse();
}

function handleCreateArticle(init?: RequestInit): Response {
  const attributes = parseAttributes(init);
  const article: ArticleRecord = {
    id: String(nextId++),
    title: attributes.title ?? "Untitled",
    body: attributes.body ?? "",
    authorId: "9",
  };

  articles = [...articles, article];

  return Response.json(articleDocument(article), { status: 201, headers: jsonApiHeaders() });
}

function handleUpdateArticle(id: string, init?: RequestInit): Response {
  const article = findArticle(id);
  if (!article) {
    return notFoundResponse();
  }

  const attributes = parseAttributes(init);
  const updated: ArticleRecord = {
    ...article,
    title: attributes.title ?? article.title,
    body: attributes.body ?? article.body,
  };

  articles = articles.map((item) => (item.id === updated.id ? updated : item));

  return Response.json(articleDocument(updated), { headers: jsonApiHeaders() });
}

function handleDeleteArticle(id: string): Response {
  const existed = articles.some((item) => item.id === id);
  articles = articles.filter((item) => item.id !== id);

  return existed
    ? new Response(null, { status: 204, headers: jsonApiHeaders() })
    : notFoundResponse();
}

function handleMockRequest(input: RequestInfo | URL, init?: RequestInit): Response {
  const url = new URL(String(input), "http://localhost");
  const method = init?.method?.toUpperCase() ?? "GET";
  const path = url.pathname.replace(/\.json$/, "");
  const articleMatch = path.match(/^\/json-api\/articles\/([^/]+)$/);
  const articleId = articleMatch?.[1];

  if (path === "/json-api/articles" && method === "GET") {
    return handleListArticles(url);
  }

  if (articleId && method === "GET") {
    return handleGetArticle(articleId);
  }

  if (path === "/json-api/articles" && method === "POST") {
    return handleCreateArticle(init);
  }

  if (articleId && method === "PATCH") {
    return handleUpdateArticle(articleId, init);
  }

  if (articleId && method === "DELETE") {
    return handleDeleteArticle(articleId);
  }

  return notFoundResponse();
}

export function createJsonApiMockFetcher(): typeof fetch {
  return (input, init) => Promise.resolve(handleMockRequest(input, init));
}
