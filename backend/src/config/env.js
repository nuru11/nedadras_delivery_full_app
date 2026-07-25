function getEnv(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
}

function getNumberEnv(name, fallback) {
  const raw = getEnv(name, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  nodeEnv: getEnv("NODE_ENV", "development"),
  port: getNumberEnv("PORT", 4000),

  // Auth
  jwtSecret: getEnv("JWT_SECRET", ""),

  // Afromessage OTP (SMS)
  afromessageFrom: getEnv("AFROMESSAGE_FROM", ""),
  afromessageSender: getEnv("AFROMESSAGE_SENDER", "Negadras"),
  afromessageApiKey: getEnv("AFROMESSAGE_API_KEY", ""),

  // Realtime / Geo
  redisUrl: getEnv("REDIS_URL", ""),

  // Pricing (used by estimate - plan formulas are in delivery.service.js)
  ratePerKm: getNumberEnv("RATE_PER_KM", 10),

  // Google APIs (placeholder until configured)
  googleMapsApiKey: getEnv("GOOGLE_MAPS_API_KEY", ""),

  // Addis Ababa bounds (server-side validation)
  addisSouth: 8.92,
  addisWest: 38.65,
  addisNorth: 9.15,
  addisEast: 38.92,
};

