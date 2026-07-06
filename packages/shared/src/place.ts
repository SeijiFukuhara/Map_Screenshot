export interface Place {
  name: string;
  placeId: string;
  /** Places Autocompleteの候補はplaceIdのみで、lat/lngは含まない。Place Details取得後に設定する */
  lat?: number;
  lng?: number;
}
