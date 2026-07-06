import { httpsCallable } from 'firebase/functions';
import type {
  ComputeRoutesRequest,
  ComputeRoutesResponse,
  PlacesAutocompleteRequest,
  PlacesAutocompleteResponse,
} from '@routecard/shared';

import { functions } from './firebase';

const computeRoutesCallable = httpsCallable<ComputeRoutesRequest, ComputeRoutesResponse>(
  functions,
  'computeRoutes'
);

const placesAutocompleteCallable = httpsCallable<
  PlacesAutocompleteRequest,
  PlacesAutocompleteResponse
>(functions, 'placesAutocomplete');

export async function computeRoutes(req: ComputeRoutesRequest): Promise<ComputeRoutesResponse> {
  const result = await computeRoutesCallable(req);
  return result.data;
}

export async function placesAutocomplete(
  req: PlacesAutocompleteRequest
): Promise<PlacesAutocompleteResponse> {
  const result = await placesAutocompleteCallable(req);
  return result.data;
}
