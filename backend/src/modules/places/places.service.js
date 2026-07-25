const env = require("../../config/env");

const ADDIS_LAT = 9.032;
const ADDIS_LNG = 38.7469;
const ADDIS_RADIUS_M = 50000;

async function fetchPredictions(input, sessionToken) {
  const key = env.googleMapsApiKey;
  if (!key || key === "") {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  const trimmed = (input || "").trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    input: trimmed,
    key,
    components: "country:et",
    language: "en",
    location: `${ADDIS_LAT},${ADDIS_LNG}`,
    radius: String(ADDIS_RADIUS_M),
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places autocomplete failed: ${data.status}`);
  }

  const list = data.predictions || [];
  return list
    .filter((p) => p.place_id)
    .map((p) => ({ placeId: p.place_id, description: p.description || p.structured_formatting?.main_text || "" }));
}

async function getPlaceDetails(placeId, sessionToken) {
  const key = env.googleMapsApiKey;
  if (!key || key === "") {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }
  if (!placeId) {
    throw new Error("place_id is required");
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key,
    fields: "formatted_address,geometry,name",
  });
  if (sessionToken) params.set("sessiontoken", sessionToken);

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(data.error_message || `Place details failed: ${data.status}`);
  }

  const result = data.result;
  if (!result) throw new Error("Place details: missing result");

  const location = result.geometry?.location;
  const lat = location?.lat ? Number(location.lat) : null;
  const lng = location?.lng ? Number(location.lng) : null;
  if (lat == null || lng == null) {
    throw new Error("Place details: missing geometry");
  }

  return {
    placeId,
    lat,
    lng,
    formattedAddress: result.formatted_address || "",
    name: result.name || null,
  };
}

module.exports = { fetchPredictions, getPlaceDetails };
