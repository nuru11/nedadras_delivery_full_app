import api from "../lib/api";

export interface PlacePrediction {
  placeId: string;
  description: string;
}

export interface PlaceDetails {
  placeId: string;
  lat: number;
  lng: number;
  formattedAddress: string;
  /** Place name from Google (e.g. "Hilton Hotel"); prefer over formattedAddress for display */
  name?: string | null;
}

export const fetchPredictions = async (
  input: string,
  sessionToken?: string
): Promise<PlacePrediction[]> => {
  const params: Record<string, string> = { input: input.trim() };
  if (sessionToken) params.session_token = sessionToken;
  const { data } = await api.get<{ predictions: PlacePrediction[] }>(
    "/places/autocomplete",
    { params }
  );
  return data.predictions || [];
};

export const getPlaceDetails = async (
  placeId: string,
  sessionToken?: string
): Promise<PlaceDetails> => {
  const params: Record<string, string> = { place_id: placeId };
  if (sessionToken) params.session_token = sessionToken;
  const { data } = await api.get<PlaceDetails>("/places/details", {
    params,
  });
  return data;
};
