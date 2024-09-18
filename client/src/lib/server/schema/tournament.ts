import { Prisma } from "@prisma/client";
import { TournamentRoundType, TournamentTableType, builder } from "./builder";
import { EntryType } from "./entry";
import { prisma } from "../prisma";
import { TimePeriod } from "./types";
import { subMonths } from "date-fns";

TournamentTableType.implement({
  fields: (t) => ({
    table: t.exposeInt("table"),
    roundName: t.exposeString("roundName"),
    entries: t.field({
      type: t.listRef(EntryType, { nullable: true }),
      resolve: async (parent, args, ctx) => {
        const entries = await ctx.entries.loadMany(
          parent.players.map((p) => ({
            TID: parent.TID,
            topdeckProfile: p.id,
          })),
        );

        return entries.map((e) => (e instanceof Error ? undefined : e));
      },
    }),
    winnerSeatPosition: t.int({
      nullable: true,
      resolve: (parent) => {
        const winnerIndex = parent.players.findIndex(
          (p) => p.name === parent.winner,
        );

        if (winnerIndex < 0) return null;
        return winnerIndex + 1;
      },
    }),
    winner: t.field({
      type: EntryType,
      nullable: true,
      resolve: async (parent, _args, ctx) => {
        const winnerPlayer = parent.players.find(
          (p) => p.name === parent.winner,
        );

        if (winnerPlayer == null) return null;

        return await ctx.entries.load({
          TID: parent.TID,
          topdeckProfile: winnerPlayer.id,
        });
      },
    }),
  }),
});

TournamentRoundType.implement({
  fields: (t) => ({
    round: t.string({
      resolve: (parent) => `${parent.round}`,
    }),
    tables: t.field({
      type: t.listRef(TournamentTableType),
      resolve: (parent) => {
        return parent.tables.map((t) => ({
          ...t,
          TID: parent.TID,
          roundName: `${parent.round}`,
        }));
      },
    }),
  }),
});

export const TournamentType = builder.prismaObject("Tournament", {
  fields: (t) => ({
    id: t.exposeID("uuid"),
    TID: t.exposeString("TID"),
    name: t.exposeString("name"),
    size: t.exposeInt("size"),
    swissRounds: t.exposeInt("swissRounds"),
    topCut: t.exposeInt("topCut"),
    tournamentDate: t.string({
      resolve: (tournament) => tournament.tournamentDate.toISOString(),
    }),
    entries: t.relation("entries", {
      query: {
        orderBy: { standing: "asc" },
      },
    }),
    rounds: t.field({
      type: t.listRef(TournamentRoundType),
      resolve: async (parent, _args, ctx) => {
        const tournament = await ctx.topdeckClient.loadRoundsData(parent.TID);
        return (
          tournament?.rounds.map((r) => ({
            ...r,
            TID: parent.TID,
          })) ?? []
        );
      },
    }),
    topPod: t.relation("entries", {
      query: {
        where: { standing: { lte: 4 } },
        orderBy: { standing: "asc" },
      },
    }),
  }),
});

const TournamentSortBy = builder.enumType("TournamentSortBy", {
  values: ["PLAYERS", "DATE"] as const,
});

const TournamentFiltersInput = builder.inputType("TournamentFilters", {
  fields: (t) => ({
    timePeriod: t.field({ type: TimePeriod }),
    minSize: t.int(),
    maxSize: t.int(),
  }),
});

builder.queryField("tournaments", (t) =>
  t.prismaField({
    type: ["Tournament"],
    args: {
      search: t.arg.string(),
      filters: t.arg({ type: TournamentFiltersInput }),
      sortBy: t.arg({ type: TournamentSortBy, defaultValue: "DATE" }),
    },
    resolve: async (query, _root, args, _ctx, _info) => {
      const where: Prisma.TournamentWhereInput[] = [];

      if (args.search) {
        where.push({
          name: { contains: args.search, mode: "insensitive" },
        });
      }

      if (args.filters?.minSize) {
        where.push({ size: { gte: args.filters.minSize } });
      }

      if (args.filters?.maxSize) {
        where.push({ size: { lte: args.filters.maxSize } });
      }

      if (args.filters?.timePeriod) {
        const minDate =
          args.filters.timePeriod === "SIX_MONTHS"
            ? subMonths(new Date(), 6)
            : args.filters.timePeriod === "THREE_MONTHS"
            ? subMonths(new Date(), 3)
            : args.filters.timePeriod === "ONE_MONTH"
            ? subMonths(new Date(), 1)
            : new Date(0);

        where.push({ tournamentDate: { gte: minDate } });
      }

      const orderBy: Prisma.TournamentOrderByWithRelationInput[] =
        args.sortBy === "PLAYERS"
          ? [{ size: "desc" }, { tournamentDate: "desc" }]
          : [{ tournamentDate: "desc" }, { size: "desc" }];

      return prisma.tournament.findMany({
        ...query,
        orderBy,
        where: { AND: where },
      });
    },
  }),
);

builder.queryField("tournament", (t) =>
  t.prismaField({
    type: "Tournament",
    args: { TID: t.arg.string({ required: true }) },
    resolve: async (query, _root, args, _ctx, _info) =>
      prisma.tournament.findUniqueOrThrow({
        ...query,
        where: { TID: args.TID },
      }),
  }),
);
