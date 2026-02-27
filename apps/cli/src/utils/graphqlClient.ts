/**
 * Types and utilities for making standardized GraphQL requests.
 */

export interface GraphQLError {
  message: string;
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLRequestOptions {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

/**
 * Custom error class for errors returned by the GraphQL server
 * in the `errors` array.
 */
export class GraphQLClientError extends Error {
  constructor(
    message: string,
    public readonly errors?: GraphQLError[]
  ) {
    super(message);
    this.name = 'GraphQLClientError';
  }
}

/**
 * Standardized network error for HTTP failures (status >= 400).
 */
export class GraphQLHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'GraphQLHttpError';
  }
}

/**
 * Makes a GraphQL POST request with timeouts, standard JSON typing,
 * and robust error handling.
 *
 * @throws {GraphQLHttpError} If the HTTP response status is not OK.
 * @throws {GraphQLClientError} If the GraphQL response contains an `errors` array.
 * @throws {Error} If there is a network error, timeout, or missing `data`.
 *
 * @returns The strongly-typed `data` payload of the GraphQL response.
 */
export async function requestGraphQL<T>(options: GraphQLRequestOptions): Promise<T> {
  const { endpoint, query, variables, headers, timeoutMs = 15000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new GraphQLHttpError(`HTTP ${response.status}: ${text.slice(0, 200)}`, response.status);
    }

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors && json.errors.length > 0) {
      const messages = json.errors.map((e) => e.message ?? 'Unknown GraphQL error').join('; ');
      throw new GraphQLClientError(`GraphQL errors: ${messages}`, json.errors);
    }

    if (!json.data) {
      throw new Error('No data returned in GraphQL response');
    }

    return json.data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw err;
    }
    throw new Error(`Network error: ${String(err)}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
