import cn from "classnames";
import { format } from "date-fns";
import { useRouter } from "next/router";
import { PropsWithChildren, useCallback } from "react";
import { Tabs } from "react-aria-components";
import { useFragment, useLazyLoadQuery, usePreloadedQuery } from "react-relay";
import { RelayProps, withRelay } from "relay-nextjs";
import { graphql } from "relay-runtime";
import { Card } from "../../../components/card";
import { Edhtop16Fallback } from "../../../components/fallback";
import { Navigation } from "../../../components/navigation";
import { Tab, TabList } from "../../../components/tabs";
import { formatOrdinals } from "../../../lib/client/format";
import { getClientEnvironment } from "../../../lib/client/relay_client_environment";
import { ServerSafeSuspense } from "../../../lib/client/suspense";
import { TID_EntryCard$key } from "../../../queries/__generated__/TID_EntryCard.graphql";
import { TID_TournamentBanner$key } from "../../../queries/__generated__/TID_TournamentBanner.graphql";
import { TID_TournamentPageFallbackQuery } from "../../../queries/__generated__/TID_TournamentPageFallbackQuery.graphql";
import { TID_TournamentPageShell$key } from "../../../queries/__generated__/TID_TournamentPageShell.graphql";
import { TID_TournamentQuery } from "../../../queries/__generated__/TID_TournamentQuery.graphql";

function EntryCard(props: { entry: TID_EntryCard$key }) {
  const entry = useFragment(
    graphql`
      fragment TID_EntryCard on Entry {
        standing
        wins
        losses
        draws
        decklist

        player {
          name
        }

        commander {
          name
          imageUrls
        }
      }
    `,
    props.entry,
  );

  let entryName = `${entry.player?.name ?? "Unknown Player"}`;
  if (entry.standing === 1) {
    entryName = `🥇 ${entryName}`;
  } else if (entry.standing === 2) {
    entryName = `🥈 ${entryName}`;
  } else if (entry.standing === 3) {
    entryName = `🥉 ${entryName}`;
  }

  const bottomText = (
    <div className="flex">
      <span className="flex-1">{formatOrdinals(entry.standing)} place</span>
      <span>
        Wins: {entry.wins} / Losses: {entry.losses} / Draws: {entry.draws}
      </span>
    </div>
  );

  return (
    <Card
      className="group first:md:col-span-2 lg:max-w-3xl first:lg:col-span-3 first:lg:w-full first:lg:justify-self-center"
      bottomText={bottomText}
      images={entry.commander.imageUrls.map((img) => ({
        src: img,
        alt: `${entry.commander.name} art`,
      }))}
    >
      <div className="flex h-32 flex-col space-y-2 group-first:lg:h-40">
        {entry.decklist ? (
          <a
            href={entry.decklist}
            target="_blank"
            className="line-clamp-2 text-xl font-bold underline decoration-transparent transition-colors group-hover:decoration-inherit"
          >
            {entryName}
          </a>
        ) : (
          <span className="text-xl font-bold">{entryName}</span>
        )}

        <span>{entry.commander.name}</span>
      </div>
    </Card>
  );
}

function TournamentBanner(props: { tournament: TID_TournamentBanner$key }) {
  const tournament = useFragment(
    graphql`
      fragment TID_TournamentBanner on Tournament {
        name
        size
        tournamentDate

        winner: entries(maxStanding: 1) {
          commander {
            imageUrls
          }
        }
      }
    `,
    props.tournament,
  );

  return (
    <div className="h-64 w-full bg-black/60 md:h-80">
      <div className="relative mx-auto flex h-full w-full max-w-screen-xl flex-col items-center justify-center space-y-4">
        <div className="absolute left-0 top-0 flex h-full w-full brightness-[40%]">
          {tournament.winner[0].commander.imageUrls.map(
            (src, _i, { length }) => {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={cn(
                    "flex-1 object-cover object-top",
                    length === 2 ? "w-1/2" : "w-full",
                  )}
                  key={src}
                  src={src}
                  alt={`${tournament.name} winner art`}
                />
              );
            },
          )}
        </div>

        <h1 className="relative text-center font-title text-2xl font-semibold text-white md:text-4xl lg:text-5xl">
          {tournament.name}
        </h1>
        <div className="relative flex w-full max-w-screen-md flex-col items-center justify-evenly gap-1 text-base text-white md:flex-row md:text-lg lg:text-xl">
          <span>{format(tournament.tournamentDate, "MMMM do yyyy")}</span>
          <span>{tournament.size} Players</span>
        </div>
      </div>
    </div>
  );
}

function TournamentPageShell({
  tab,
  onUpdateQueryParam,
  children,
  ...props
}: PropsWithChildren<{
  tab: string;
  tournament: TID_TournamentPageShell$key;
  onUpdateQueryParam?: (key: string, value: string) => void;
}>) {
  const tournament = useFragment(
    graphql`
      fragment TID_TournamentPageShell on Tournament {
        ...TID_TournamentBanner
      }
    `,
    props.tournament,
  );

  return (
    <div className="relative min-h-screen bg-[#514f86]">
      <Navigation />
      <TournamentBanner tournament={tournament} />{" "}
      <Tabs
        className="mx-auto max-w-screen-md"
        isDisabled={onUpdateQueryParam == null}
        selectedKey={tab}
        onSelectionChange={(nextKey) =>
          onUpdateQueryParam?.("tab", nextKey as string)
        }
      >
        <TabList>
          <Tab id="entries">Standings</Tab>
          <Tab id="breakdown">Metagame Breakdown</Tab>
        </TabList>
      </Tabs>
      {children}
    </div>
  );
}

const TournamentQuery = graphql`
  query TID_TournamentQuery($TID: String!, $breakdown: Boolean!) {
    tournament(TID: $TID) {
      ...TID_TournamentPageShell

      entries @skip(if: $breakdown) {
        id
        ...TID_EntryCard
      }
    }
  }
`;

function TournamentPage({
  preloadedQuery,
}: RelayProps<{}, TID_TournamentQuery>) {
  const { tournament } = usePreloadedQuery(TournamentQuery, preloadedQuery);

  const router = useRouter();
  const setQueryVariable = useCallback(
    (key: string, value: string) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set(key, value);
      router.replace(nextUrl, undefined, { shallow: true, scroll: false });
    },
    [router],
  );

  return (
    <TournamentPageShell
      tournament={tournament}
      tab={preloadedQuery.variables.breakdown ? "breakdown" : "entries"}
      onUpdateQueryParam={setQueryVariable}
    >
      <div className="mx-auto flex grid w-full max-w-screen-xl grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {!preloadedQuery.variables.breakdown &&
          tournament.entries != null &&
          tournament.entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
      </div>
    </TournamentPageShell>
  );
}

function TournamentPageFallback() {
  const router = useRouter();

  const { tournament } = useLazyLoadQuery<TID_TournamentPageFallbackQuery>(
    graphql`
      query TID_TournamentPageFallbackQuery($TID: String!) {
        tournament(TID: $TID) {
          ...TID_TournamentPageShell
        }
      }
    `,
    { TID: router.query.TID as string },
    { fetchPolicy: "store-or-network" },
  );

  return (
    <TournamentPageShell
      tournament={tournament}
      tab={router.query.tab as string}
    />
  );
}

export default withRelay(TournamentPage, TournamentQuery, {
  fallback: (
    <ServerSafeSuspense fallback={<Edhtop16Fallback />}>
      <TournamentPageFallback />
    </ServerSafeSuspense>
  ),
  createClientEnvironment: () => getClientEnvironment()!,
  createServerEnvironment: async () => {
    const { createServerEnvironment } = await import(
      "../../../lib/server/relay_server_environment"
    );

    return createServerEnvironment();
  },
  variablesFromContext: (ctx) => {
    return {
      TID: ctx.query.TID as string,
      breakdown: ctx.query.tab === "breakdown",
    };
  },
});
