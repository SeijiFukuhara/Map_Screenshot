import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import type {
  ComputeRoutesRequest,
  ComputeRoutesResponse,
  RouteLeg,
  RouteOption,
} from "@routecard/shared";

export const googleMapsApiKey = defineSecret("GOOGLE_MAPS_API_KEY");

const ROUTES_ENDPOINT =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

const FIELD_MASK = [
  "routes.duration",
  "routes.legs.steps.transitDetails",
  "routes.legs.steps.travelMode",
  "routes.legs.steps.staticDuration",
  "routes.travelAdvisory.transitFare",
].join(",");

/**
 * Cloud Functions経由でRoutes API (computeRoutes) を呼び出す。
 * APIキーはシークレットとしてのみ保持し、クライアントに渡さない。
 */
export const computeRoutes = onCall<ComputeRoutesRequest>(
  { secrets: [googleMapsApiKey], region: "asia-northeast1" },
  async (request): Promise<ComputeRoutesResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "サインインが必要です");
    }

    const { origin, destination, searchType, time } = request.data;
    if (!origin || !destination || !time) {
      throw new HttpsError("invalid-argument", "origin/destination/timeは必須です");
    }

    const body = {
      origin: toWaypoint(origin),
      destination: toWaypoint(destination),
      travelMode: "TRANSIT",
      computeAlternativeRoutes: true,
      ...(searchType === "arrival" ? { arrivalTime: time } : { departureTime: time }),
    };

    const res = await fetch(ROUTES_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey.value(),
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new HttpsError("internal", `Routes API error: ${res.status}`);
    }

    const json = (await res.json()) as GoogleRoutesResponse;
    const routes = (json.routes ?? []).map((route) => toRouteOption(route, searchType));

    return { routes };
  }
);

// --- Google Routes APIレスポンスの最小限の型 ---
interface GoogleRoutesResponse {
  routes?: GoogleRoute[];
}

interface GoogleRoute {
  duration?: string;
  legs?: { steps?: GoogleStep[] }[];
  travelAdvisory?: { transitFare?: { units?: string } };
}

interface GoogleStep {
  travelMode?: string;
  staticDuration?: string;
  transitDetails?: {
    stopDetails?: {
      departureStop?: { name?: string };
      arrivalStop?: { name?: string };
    };
    localizedValues?: {
      departureTime?: { time?: { text?: string } };
      arrivalTime?: { time?: { text?: string } };
    };
    transitLine?: { name?: string };
    headsign?: string;
  };
}

function toRouteOption(route: GoogleRoute, searchType: "departure" | "arrival"): RouteOption {
  const steps = route.legs?.[0]?.steps ?? [];
  const legs: RouteLeg[] = steps.map((step) => {
    const isTransit = step.travelMode === "TRANSIT";
    const details = step.transitDetails;
    return {
      mode: isTransit ? "TRANSIT" : "WALK",
      lineName: details?.transitLine?.name ?? null,
      headsign: details?.headsign ?? null,
      depStop: details?.stopDetails?.departureStop?.name ?? "",
      depTime: details?.localizedValues?.departureTime?.time?.text ?? "",
      arrStop: details?.stopDetails?.arrivalStop?.name ?? "",
      arrTime: details?.localizedValues?.arrivalTime?.time?.text ?? "",
      durationMinutes: parseDurationMinutes(step.staticDuration),
    };
  });

  const transferCount = legs.filter((leg) => leg.mode === "TRANSIT").length - 1;
  const fareUnits = route.travelAdvisory?.transitFare?.units;

  return {
    searchType,
    departureTime: legs[0]?.depTime ?? "",
    arrivalTime: legs[legs.length - 1]?.arrTime ?? "",
    legs,
    fare: fareUnits ? Number(fareUnits) : null,
    transferCount: Math.max(transferCount, 0),
  };
}

function toWaypoint(place: ComputeRoutesRequest["origin"]) {
  // Places Autocompleteの候補はplaceIdのみ（lat/lngは持たない）ため、placeIdを優先する
  if (place.placeId) {
    return { placeId: place.placeId };
  }
  return { location: { latLng: { latitude: place.lat, longitude: place.lng } } };
}

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 0;
  const seconds = Number(duration.replace("s", ""));
  return Math.round(seconds / 60);
}
