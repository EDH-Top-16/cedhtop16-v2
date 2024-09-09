import { graphql, usePreloadedQuery } from "react-relay";
import { RelayProps, withRelay } from "relay-nextjs";
import { getClientEnvironment } from "../../lib/client/relay_client_environment";
import { v2Query } from "../../queries/__generated__/v2Query.graphql";

const V2Query = graphql`
  query v2Query {
    commanders {
      name
    }
  }
`;

function V2Page({ preloadedQuery }: RelayProps<{}, v2Query>) {
  const { commanders } = usePreloadedQuery(V2Query, preloadedQuery);

  return <div>I am EDHTop16</div>;
}

export default withRelay(V2Page, V2Query, {
  createClientEnvironment: () => getClientEnvironment()!,
  createServerEnvironment: async (ctx) => {
    const { createServerEnvironment } = await import(
      "../../lib/server/relay_server_environment"
    );

    return createServerEnvironment();
  },
});
