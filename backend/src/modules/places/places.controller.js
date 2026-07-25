const PlacesService = require("./places.service");

async function autocomplete(req, res) {
  try {
    const input = req.query?.input || "";
    const sessionToken = req.query?.session_token || "";
    const predictions = await PlacesService.fetchPredictions(input, sessionToken);
    return res.status(200).json({ predictions });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Places autocomplete failed";
    return res.status(status).json({ message });
  }
}

async function details(req, res) {
  try {
    const placeId = req.query?.place_id || "";
    const sessionToken = req.query?.session_token || "";
    const details = await PlacesService.getPlaceDetails(placeId, sessionToken);
    return res.status(200).json(details);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Place details failed";
    return res.status(status).json({ message });
  }
}

module.exports = { autocomplete, details };
