import { Place } from "./place";

export type SearchType = "departure" | "arrival";
export type LegMode = "TRANSIT" | "WALK";

/** 区間（乗車〜降車、または徒歩区間）ひとつ分 */
export interface RouteLeg {
  mode: LegMode;
  lineName: string | null;
  headsign: string | null;
  depStop: string;
  /** ISO 8601 文字列（Firestore Timestamp を直列化したもの） */
  depTime: string;
  arrStop: string;
  arrTime: string;
  durationMinutes: number;
}

/** routeCards/{cardId} ドキュメント */
export interface RouteCard {
  origin: Place;
  destination: Place;
  searchType: SearchType;
  departureTime: string;
  arrivalTime: string;
  legs: RouteLeg[];
  fare: number | null;
  memo: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

/** S2 の候補一覧に載る、保存前のルート候補 */
export interface RouteOption {
  searchType: SearchType;
  departureTime: string;
  arrivalTime: string;
  legs: RouteLeg[];
  fare: number | null;
  transferCount: number;
}
