import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { Observable } from '@apollo/client/utilities';
import CONFIG from '@/config';

// create http link
const httpLink = new HttpLink({
  uri: CONFIG.graphqlEndpoint,
});

// create error link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    const errorWithExtensions = graphQLErrors.find(({ extensions }) => extensions);

    if (errorWithExtensions?.extensions) {
      return new Observable((observer) => {
        observer.next({
          data: {
            extensions: errorWithExtensions.extensions,
            message: errorWithExtensions.message,
          },
          errors: undefined,
        });
        observer.complete();
      });
    }

    // Log errors without extensions
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }

  if (networkError) console.error(`[Network error]: ${networkError}`);
});

// create client - global singleton
const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

export { client };
