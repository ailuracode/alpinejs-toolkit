export class HttpError extends Error {
  override readonly name = "HttpError";

  constructor(
    message: string,
    readonly response: Response
  ) {
    super(message);
  }

  get status(): number {
    return this.response.status;
  }
}

export type ResponseParser<T> = (response: Response) => Promise<T>;

export interface TypedFetchInit extends Omit<RequestInit, "body"> {
  /** Custom fetch implementation (tests, SSR, or injected clients). */
  fetcher?: typeof fetch;
  /** Parse the response body. Defaults to JSON. */
  parse?: ResponseParser<unknown>;
}

function parseJsonBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return Promise.resolve(undefined);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return Promise.resolve(undefined);
  }

  return response.json();
}

/**
 * Typed wrapper around native `fetch` that parses JSON and throws on non-OK responses.
 * Pass an explicit generic to describe the expected response shape.
 */
export async function typedFetch<T>(input: RequestInfo | URL, init?: TypedFetchInit): Promise<T> {
  const { fetcher = fetch, parse = parseJsonBody, ...requestInit } = init ?? {};
  const response = await fetcher(input, requestInit);

  if (!response.ok) {
    throw new HttpError(`Request failed with status ${response.status}`, response);
  }

  return (await parse(response)) as T;
}
