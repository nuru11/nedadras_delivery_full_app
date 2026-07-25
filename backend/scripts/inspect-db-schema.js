require("dotenv").config();

const sequelize = require("../src/config/db");

async function main() {
  const qi = sequelize.getQueryInterface();

  const tables = ["users", "drivers", "deliveries", "delivery_requests"];

  for (const table of tables) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const desc = await qi.describeTable(table);
      // Print only the columns we care most about.
      const important = Object.fromEntries(
        Object.entries(desc).filter(([col]) =>
          [
            "id",
            "user_id",
            "driver_id",
            "delivery_id",
            "phone",
            "role",
            "status",
            "pickup_lat",
            "pickup_lng",
            "drop_lat",
            "drop_lng",
            "distance_km",
            "price",
          ].includes(col)
        )
      );

      // eslint-disable-next-line no-console
      console.log(`\n=== ${table} ===`);
      // eslint-disable-next-line no-console
      console.log(important);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`\n=== ${table} ===`);
      // eslint-disable-next-line no-console
      console.log("Could not describe table:", e?.message || e);
    }
  }

  await sequelize.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Schema inspection failed:", e);
  process.exit(1);
});

