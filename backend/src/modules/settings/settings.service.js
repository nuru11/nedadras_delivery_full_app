const Settings = require("./settings.model");

const COMMISSION_IN_HOUSE_KEY = "commission_in_house";
const COMMISSION_FREELANCER_KEY = "commission_freelancer";
const DEFAULT_IN_HOUSE = 0.1;
const DEFAULT_FREELANCER = 0.3;

/**
 * Get commission rates (0–1). Missing keys fall back to defaults.
 * @returns {Promise<{ in_house: number, freelancer: number }>}
 */
async function getCommissionRates() {
  const rows = await Settings.findAll({
    where: {
      key: [COMMISSION_IN_HOUSE_KEY, COMMISSION_FREELANCER_KEY],
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const in_house =
    map[COMMISSION_IN_HOUSE_KEY] != null
      ? parseFloat(map[COMMISSION_IN_HOUSE_KEY], 10)
      : DEFAULT_IN_HOUSE;
  const freelancer =
    map[COMMISSION_FREELANCER_KEY] != null
      ? parseFloat(map[COMMISSION_FREELANCER_KEY], 10)
      : DEFAULT_FREELANCER;
  return {
    in_house: Number.isFinite(in_house) ? in_house : DEFAULT_IN_HOUSE,
    freelancer: Number.isFinite(freelancer) ? freelancer : DEFAULT_FREELANCER,
  };
}

/**
 * Set commission rates (0–1). Validates range.
 * @param {{ in_house?: number, freelancer?: number }} payload
 * @returns {Promise<{ in_house: number, freelancer: number }>}
 */
async function setCommissionRates(payload) {
  const rates = await getCommissionRates();
  if (payload.in_house != null) {
    const v = Number(payload.in_house);
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      const err = new Error("commission in_house must be between 0 and 1");
      err.status = 400;
      throw err;
    }
    rates.in_house = v;
    await Settings.upsert({
      key: COMMISSION_IN_HOUSE_KEY,
      value: String(v),
    });
  }
  if (payload.freelancer != null) {
    const v = Number(payload.freelancer);
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      const err = new Error("commission freelancer must be between 0 and 1");
      err.status = 400;
      throw err;
    }
    rates.freelancer = v;
    await Settings.upsert({
      key: COMMISSION_FREELANCER_KEY,
      value: String(v),
    });
  }
  return rates;
}

module.exports = {
  getCommissionRates,
  setCommissionRates,
};
