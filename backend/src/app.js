require("dotenv").config();

const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const { initSocket } = require("./config/socket");
require("./modules");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);

// Attach Socket.IO immediately – same structure as hosted app
initSocket(server);

app.use(cors());
app.use(express.json());
app.use(
  "/driver_kyc_img",
  express.static(path.join(__dirname, "driver_kyc_img"))
);

app.use("/api", routes);

// Optional: serve admin panel build with SPA fallback so /basic-tables etc. work on refresh
const adminPanelDist = path.join(__dirname, "../../delivery_adminpanel/dist");
if (fs.existsSync(adminPanelDist)) {
  app.use(express.static(adminPanelDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(adminPanelDist, "index.html"));
  });
}

app.use((req, res) =>
  res.status(404).json({ message: "The requested resource was not found" })
);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  const message =
    status >= 500 ? "Internal server error" : err.message || "Bad request";

  console.error(err);
  return res.status(status).json({ message });
});

const PORT = process.env.PORT || 4000;

async function ensureFirstAdmin() {
  const Admin = require("./modules/admins/admin.model");
  const bcrypt = require("bcryptjs");
  const count = await Admin.count();
  if (count > 0) return;
  const username = process.env.ADMIN_USERNAME || "admin";
  const plainPassword = process.env.ADMIN_DEFAULT_PASSWORD || "changeme";
  const password_hash = bcrypt.hashSync(plainPassword, 10);
  await Admin.create({
    username,
    password_hash,
    name: "Admin",
    admin_role: "super_admin",
  });
  console.log("First admin created (username:", username, "). Change password in production.");
}

async function ensureSuperAdminExists() {
  const Admin = require("./modules/admins/admin.model");
  const superCount = await Admin.count({ where: { admin_role: "super_admin" } });
  if (superCount > 0) return;
  const first = await Admin.findOne({ order: [["created_at", "ASC"]] });
  if (!first) return;
  await first.update({ admin_role: "super_admin" });
  console.log("Promoted oldest admin to super_admin (no super_admin existed).");
}

// Top-level server.listen (like hosted app) – no bootstrap/require.main
server.listen(PORT, async () => {
  try {
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
      await ensureFirstAdmin();
      await ensureSuperAdminExists();
    } else {
      await sequelize.authenticate();
    }
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});

module.exports = app;
