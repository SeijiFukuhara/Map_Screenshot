import { httpsCallable } from 'firebase/functions';
import type {
  ComputeRoutesRequest,
  ComputeRoutesResponse,
  PlacesAutocompleteRequest,
  PlacesAutocompleteResponse,
} from '@routecard/shared';

import { getFirebaseFunctions } from './firebase';

export async function computeRoutes(req: ComputeRoutesRequest): Promise<ComputeRoutesResponse> {
  const callable = httpsCallable<ComputeRoutesRequest, ComputeRoutesResponse>(
    getFirebaseFunctions(),
    'computeRoutes'
  );
  const result = await callable(req);
  return result.data;
}

export async function placesAutocomplete(
  req: PlacesAutocompleteRequest
): Promise<PlacesAutocompleteResponse> {
  const callable = httpsCallable<PlacesAutocompleteRequest, PlacesAutocompleteResponse>(
    getFirebaseFunctions(),
    'placesAutocomplete'
  );
  const result = await callable(req);
  return result.data;
}
