export class QueryCacheDestroyedError extends Error {
  override readonly name = "QueryCacheDestroyedError";
  readonly code = "QUERY_CACHE_DESTROYED";

  constructor(message = "QueryCache has been destroyed") {
    super(message);
  }
}
