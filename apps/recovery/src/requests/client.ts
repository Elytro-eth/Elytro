import { ApolloClient, InMemoryCache, HttpLink, from, DocumentNode } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import config from '../config';

const httpLink = new HttpLink({
  uri: config.graphqlEndpoint,
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    );

  if (networkError) console.error(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

async function query<T>(queryDocument: DocumentNode, variables?: Record<string, unknown>): Promise<T> {
  const { data, errors } = await client.query({
    query: queryDocument,
    variables,
    fetchPolicy: 'no-cache',
  });
  if (errors) {
    throw errors;
  }
  return data as T;
}

async function mutate<T>(mutationDocument: DocumentNode, variables?: Record<string, unknown>): Promise<T> {
  const { data, errors } = await client.mutate({
    mutation: mutationDocument,
    variables,
  });

  if (errors) {
    throw errors;
  }
  return data as T;
}

export { client, query, mutate };
