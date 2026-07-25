const crypto = require("crypto");

/** Parse UUID string (with or without dashes) to 16-byte buffer. */
function uuidToBin(uuid) {
  const hex = (uuid || "").replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error("Invalid UUID length");
  }
  return Buffer.from(hex, "hex");
}

/** Format 16-byte buffer as UUID string (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx). */
function binToUuid(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length !== 16) {
    throw new Error("Buffer must be 16 bytes");
  }
  const hex = buffer.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Generate a new v4 UUID as 16-byte buffer (for BINARY(16) columns). */
function newUuidBin() {
  const uuid = crypto.randomUUID();
  return uuidToBin(uuid);
}

module.exports = { uuidToBin, binToUuid, newUuidBin };
