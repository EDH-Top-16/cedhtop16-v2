import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { createContext } from "../../lib/server/context";
import { schema } from "../../lib/server/schema";

const server = new ApolloServer({
  schema,
  introspection: true,
  plugins: [
    ApolloServerPluginLandingPageLocalDefault({
      embed: true,
    }),
  ],
});

export default startServerAndCreateNextHandler(server, {
  context: async () => createContext(),
});
