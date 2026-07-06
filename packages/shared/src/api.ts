import { Place } from "./place";
import { RouteOption } from "./routeCard";

/** POST /computeRoutes リクエストボディ */
export interface ComputeRoutesRequest {
  origin: Place;
  destination: Place;
  searchType: "departure" | "arrival";
  /** ISO 8601 文字列 */
  time: string;
}

export interface ComputeRoutesResponse {
  routes: RouteOption[];
}

/** GET /placesAutocomplete?input=...&sessionToken=... */
export interface PlacesAutocompleteRequest {
  input: string;
  sessionToken: string;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface PlacesAutocompleteResponse {
  suggestions: PlaceSuggestion[];
}
