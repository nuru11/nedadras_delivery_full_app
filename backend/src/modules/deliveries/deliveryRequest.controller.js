const DeliveryRequestService = require("./deliveryRequest.service");
const { uuidToBin, binToUuid } = require("../../utils/uuid");

function parseRequestId(req) {
  const id = req.params.id;
  if (!id) {
    return { error: { status: 400, message: "Request id is required" } };
  }
  try {
    const idBin = uuidToBin(id);
    return { idBin };
  } catch {
    return { error: { status: 400, message: "Invalid request id" } };
  }
}

/** GET /api/delivery-requests/pending — driver only. Returns pending requests (e.g. after login). */
async function getPending(req, res) {
  if (req.user?.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can fetch pending requests" });
  }
  const driverUserId = req.user.sub;
  if (!driverUserId) {
    return res.status(401).json({ message: "User id missing" });
  }

 

  try {
    const requests = await DeliveryRequestService.getPendingRequests(driverUserId);
    return res.status(200).json({ requests });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to fetch pending requests";
    return res.status(status).json({ message });
  }
}

/** POST /api/delivery-requests/:id/accept — driver only, transactional. */
async function accept(req, res) {
  if (req.user?.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can accept delivery requests" });
  }
  const driverUserId = req.user.sub;
  if (!driverUserId) {
    return res.status(401).json({ message: "User id missing" });
  }

  const parsed = parseRequestId(req);
  if (parsed.error) {
    return res.status(parsed.error.status).json({ message: parsed.error.message });
  }

  try {
    const { deliveryRequest, delivery } = await DeliveryRequestService.accept(
      parsed.idBin,
      driverUserId
    );
    const deliveryRequestId =
      deliveryRequest.id && Buffer.isBuffer(deliveryRequest.id)
        ? binToUuid(deliveryRequest.id)
        : deliveryRequest.id;
    const deliveryId =
      delivery.id && Buffer.isBuffer(delivery.id) ? binToUuid(delivery.id) : delivery.id;
    const deliveryData = delivery.toJSON ? delivery.toJSON() : delivery;
    return res.status(200).json({
      deliveryRequest: { id: deliveryRequestId, status: deliveryRequest.status },
      delivery: { ...deliveryData, id: deliveryId },
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to accept request";
    return res.status(status).json({ message });
  }
}

/** POST /api/delivery-requests/:id/reject — driver only. */
async function reject(req, res) {
  if (req.user?.role !== "driver") {
    return res.status(403).json({ message: "Only drivers can reject delivery requests" });
  }
  const driverUserId = req.user.sub;
  if (!driverUserId) {
    return res.status(401).json({ message: "User id missing" });
  }

 

  const parsed = parseRequestId(req);
  if (parsed.error) {
    return res.status(parsed.error.status).json({ message: parsed.error.message });
  }

  try {
    const { deliveryRequest } = await DeliveryRequestService.reject(
      parsed.idBin,
      driverUserId
    );
    const deliveryRequestId =
      deliveryRequest.id && Buffer.isBuffer(deliveryRequest.id)
        ? binToUuid(deliveryRequest.id)
        : deliveryRequest.id;
    return res.status(200).json({
      deliveryRequest: { id: deliveryRequestId, status: deliveryRequest.status },
    });
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Failed to reject request";
    return res.status(status).json({ message });
  }
}

module.exports = { getPending, accept, reject };
