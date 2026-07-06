import { onCall, HttpsError } from "firebase-functions/v2/https";
import type {
  PlacesAutocompleteRequest,
  PlacesAutocompleteResponse,
} from "@routecard/shared";
import { googleMapsApiKey } from "../routes/computeRoutes";

const AUTOCOMPLETE_ENDPOINT =
  "https://places.googleapis.com/v1/places:autocomplete";

/**
 * Cloud Functions経由でPlaces Autocompleteを呼び出す。
 * 駅名・施設名の補完に使用し、日本国内 (country:jp) に限定する。
 */
export const placesAutocomplete = onCall<PlacesAutocompleteRequest>(
  { secrets: [googleMapsApiKey], region: "asia-northeast1" },
  async (request): Promise<PlacesAutocompleteResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "サインインが必要です");
    }

    const { input, sessionToken } = request.data;
    if (!input) {
      throw new HttpsError("invalid-argument", "inputは必須です");
    }

    const res = await fetch(AUTOCOMPLETE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleMapsApiKey.value(),
      },
      body: JSON.stringify({
        input,
        sessionToken,
        includedRegionCodes: ["jp"],
      }),
    });

    if (!res.ok) {
      throw new HttpsError("internal", `Places API error: ${res.status}`);
    }

    const json = (await res.json()) as {
      suggestions?: {
        placePrediction?: { placeId?: string; text?: { text?: string } };
      }[];
    };

    const suggestions = (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text?: { text?: string } } => !!p?.placeId)
      .map((p) => ({
        placeId: p.placeId,
        description: p.text?.text ?? "",
      }));

    return { suggestions };
  }
);
