/**
 * This file was generated by kysely-codegen.
 * Please do not edit it manually.
 */

export interface Card {
  data: string;
  id: number;
  name: string;
  oracleId: string;
}

export interface Commander {
  colorId: string;
  id: number;
  name: string;
}

export interface DecklistItem {
  cardId: number;
  entryId: number;
}

export interface Entry {
  commanderId: number;
  decklist: string | null;
  draws: number;
  id: number;
  lossesBracket: number;
  lossesSwiss: number;
  playerId: number;
  standing: number;
  tournamentId: number;
  winsBracket: number;
  winsSwiss: number;
}

export interface Player {
  id: number;
  name: string;
  topdeckProfile: string | null;
}

export interface Tournament {
  bracketUrl: string | null;
  id: number;
  name: string;
  size: number;
  swissRounds: number;
  TID: string;
  topCut: number;
  tournamentDate: string;
}

export interface DB {
  Card: Card;
  Commander: Commander;
  DecklistItem: DecklistItem;
  Entry: Entry;
  Player: Player;
  Tournament: Tournament;
}
