"use client";

import { HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

function makeClient() {
  const token = process.env.NEXT_PUBLIC_API_TOKEN;
  const url = process.env.NEXT_PUBLIC_API_URL;
  const httpLink = new HttpLink({
    uri: url,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    fetchOptions: {},
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
