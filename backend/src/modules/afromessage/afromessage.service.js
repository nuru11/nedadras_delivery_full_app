const env = require("../../config/env");

const AFROMESSAGE_BASE = "https://api.afromessage.com/api/challenge";
const AFROMESSAGE_SEND_BASE = "https://api.afromessage.com/api/send";
const OTP_LENGTH = 4;
const OTP_TTL = 30;

/**
 * Normalize Ethiopian phone to E.164 format (+251XXXXXXXXX).
 */
function toE164(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("251") && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+251${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+251${digits}`;
  }
  return `+251${digits}`;
}

/**
 * Send OTP via Afromessage challenge API.
 * @param {string} phone - Phone number (09XXXXXXXX or +251XXXXXXXXX)
 * @returns {Promise<{ code: string, verificationId: string }>}
 */
async function sendOtp(phone) {
  const from = env.afromessageFrom;
  const sender = env.afromessageSender || "Negadras";

  if (!from) {
    const err = new Error("AFROMESSAGE_FROM is not configured");
    err.status = 503;
    throw err;
  }

  const to = toE164(phone);
  const url = new URL(AFROMESSAGE_BASE);
  url.searchParams.set("from", from);
  url.searchParams.set("sender", sender);
  url.searchParams.set("to", to);
  url.searchParams.set("pr", "YOUR OTP CODE: ");
  url.searchParams.set("len", String(OTP_LENGTH));
  url.searchParams.set("ttl", String(OTP_TTL));
  url.searchParams.set("sb", "2");
  url.searchParams.set("sa", "3");
  url.searchParams.set("t", "0");

  const headers = {};
  const apiKey = env.afromessageApiKey;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url.toString(), { headers });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.message || data?.error || `Afromessage API error: ${res.status}`;
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  const ack = data?.acknowledge;
  const response = data?.response;

  if (ack !== "success" || !response) {
    const err = new Error(response?.status || data?.message || "Failed to send OTP");
    err.status = 502;
    throw err;
  }

  const code = response.code != null ? String(response.code).trim() : null;
  const verificationId = response.verificationId || null;

  if (!code) {
    const err = new Error("Afromessage did not return OTP code");
    err.status = 502;
    throw err;
  }

  return { code, verificationId };
}

/**
 * Send a plain SMS via Afromessage send API.
 * @param {string} phone - Phone number (09XXXXXXXX or +251XXXXXXXXX)
 * @param {string} message - SMS body
 * @param {string} [callback] - Optional callback URL
 * @returns {Promise<object>} API response
 */
async function sendSms(phone, message, callback) {
  const from = env.afromessageFrom;
  const sender = env.afromessageSender || "Negadras";

  if (!from) {
    const err = new Error("AFROMESSAGE_FROM is not configured");
    err.status = 503;
    throw err;
  }

  const to = toE164(phone);
  const url = new URL(AFROMESSAGE_SEND_BASE);
  url.searchParams.set("from", from);
  url.searchParams.set("sender", sender);
  url.searchParams.set("to", to);
  url.searchParams.set("message", message);
  if (callback) {
    url.searchParams.set("callback", callback);
  }

  const headers = {};
  const apiKey = env.afromessageApiKey;
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url.toString(), { headers });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.message || data?.error || `Afromessage API error: ${res.status}`;
    const err = new Error(msg);
    err.status = 502;
    throw err;
  }

  return data;
}

module.exports = {
  sendOtp,
  sendSms,
  toE164,
};
