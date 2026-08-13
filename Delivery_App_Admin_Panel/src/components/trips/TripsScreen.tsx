import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import PlacesAutocompleteField from "../form/PlacesAutocompleteField";
import type { PlaceDetails } from "../../services/places.service";
import { useModal } from "../../hooks/useModal";
import {
  Delivery,
  CreateDeliveryPayload,
  CreateOutsideTownPayload,
  EstimateResponse,
  estimateDelivery,
  outsideTownPriceForWeight,
} from "../../services/delivery.service";
import {
  getDeliveries,
  createDelivery,
  createOutsideTownDelivery,
  assignDelivery,
} from "../../services/delivery.service";
import { getDrivers, Driver } from "../../services/driver.service";
import { getUsers, User } from "../../services/user.service";
import { useAdminAuth } from "../../context/AdminAuthContext";

const STATUS_COLORS: Record<
  string,
  "primary" | "success" | "error" | "warning"
> = {
  pending: "warning",
  accepted: "primary",
  picked: "primary",
  on_way: "primary",
  delivered: "success",
  cancelled: "error",
};

export default function TripsScreen() {
  const { can } = useAdminAuth();
  const canWriteDeliveries = can("deliveries:write");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const createModal = useModal(false);
  const assignModal = useModal(false);
  const detailModal = useModal(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [detailDelivery, setDetailDelivery] = useState<Delivery | null>(null);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await getDeliveries(statusFilter);
      setDeliveries(data.deliveries);
    } catch (err) {
      console.error("Failed to fetch deliveries:", err);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await getDrivers();
      setDrivers(data.drivers);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data.users);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  useEffect(() => {
    if (createModal.isOpen || assignModal.isOpen) {
      fetchDrivers();
      fetchUsers();
    }
  }, [createModal.isOpen, assignModal.isOpen]);

  const handleOpenDetail = (d: Delivery) => {
    setDetailDelivery(d);
    detailModal.openModal();
  };

  const handleOpenAssign = (d: Delivery) => {
    setSelectedDelivery(d);
    setAssignDriverId("");
    setAssignError(null);
    assignModal.openModal();
  };

  const handleAssign = async () => {
    if (!selectedDelivery || !assignDriverId) {
      setAssignError("Please select a driver");
      return;
    }
    setAssignError(null);
    setAssigningId(selectedDelivery.id);
    try {
      await assignDelivery(selectedDelivery.id, assignDriverId);
      assignModal.closeModal();
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAssignError(
        e?.response?.data?.message || "Failed to assign driver"
      );
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="picked">Picked</option>
            <option value="on_way">On the way</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {canWriteDeliveries && (
          <Button size="sm" onClick={createModal.openModal}>
            Create Trip
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading trips...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Order #
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    ID
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Pickup
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Dropoff
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Status
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Price
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Requester
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Driver
                  </TableCell>
                  <TableCell isHeader className="p-4 dark:text-white">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {deliveries.map((d) => (
                  <TableRow
                    key={d.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/[0.04] cursor-pointer"
                    onClick={() => handleOpenDetail(d)}
                  >
                    <TableCell className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-gray-300">
                      {String(d.order_number ?? 0).padStart(6, "0")}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {d.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate" title={(d.pickup_name || d.pickup_address) || "—"}>
                      {(d.pickup_name && d.pickup_name.trim()) ? d.pickup_name : (d.pickup_address || "—")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate" title={(d.drop_name || d.drop_address) || "—"}>
                      {(d.drop_name && d.drop_name.trim()) ? d.drop_name : (d.drop_address || "—")}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        size="sm"
                        color={STATUS_COLORS[d.status] || "primary"}
                      >
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.price} ETB
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.user?.name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.driver?.name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div
                        role="presentation"
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                      >
                        {canWriteDeliveries && d.status === "pending" && !d.driver_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={assigningId === d.id}
                            onClick={() => handleOpenAssign(d)}
                          >
                            {assigningId === d.id ? "Assigning..." : "Assign"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {deliveries.length === 0 && (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              No trips found
            </div>
          )}
        </div>
      )}

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        onSuccess={() => {
          createModal.closeModal();
          fetchDeliveries();
        }}
        users={users}
      />

      {/* Trip Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={() => {
          detailModal.closeModal();
          setDetailDelivery(null);
        }}
      >
        <div className="max-w-lg p-6 dark:bg-gray-900 rounded-3xl">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Trip details
          </h3>
          {detailDelivery && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Order #</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{String(detailDelivery.order_number ?? 0).padStart(6, "0")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">ID</span>
                <span className="font-mono text-gray-800 dark:text-gray-200 truncate max-w-[240px]" title={detailDelivery.id}>{detailDelivery.id}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Status</span>
                <Badge size="sm" color={STATUS_COLORS[detailDelivery.status] || "primary"}>
                  {detailDelivery.status}
                </Badge>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Price</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.price} ETB</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Distance</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.distance_km} km</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Object type</span>
                <span className="text-gray-800 dark:text-gray-200">{detailDelivery.object_type}</span>
              </div>
              {detailDelivery.weight_kg != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Weight</span>
                  <span className="text-gray-800 dark:text-gray-200">{detailDelivery.weight_kg} kg</span>
                </div>
              )}
              {detailDelivery.description && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Description</span>
                  <span className="text-gray-800 dark:text-gray-200 text-right max-w-[240px]">{detailDelivery.description}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Pickup</span>
                <p className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.pickup_name && detailDelivery.pickup_name.trim() ? detailDelivery.pickup_name : null}
                  {detailDelivery.pickup_name && detailDelivery.pickup_name.trim() && detailDelivery.pickup_address ? " – " : null}
                  {detailDelivery.pickup_address || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block mb-1">Dropoff</span>
                <p className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.drop_name && detailDelivery.drop_name.trim() ? detailDelivery.drop_name : null}
                  {detailDelivery.drop_name && detailDelivery.drop_name.trim() && detailDelivery.drop_address ? " – " : null}
                  {detailDelivery.drop_address || "—"}
                </p>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Requester</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.user?.name || "—"}
                  {detailDelivery.user?.phone ? ` (${detailDelivery.user.phone})` : ""}
                </span>
              </div>
              {(detailDelivery.receiver_name || detailDelivery.receiver_phone) && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Receiver</span>
                  <span className="text-gray-800 dark:text-gray-200">
                    {detailDelivery.receiver_name || "—"}
                    {detailDelivery.receiver_name && detailDelivery.receiver_phone ? " · " : ""}
                    {detailDelivery.receiver_phone || ""}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Driver</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.driver?.name || "—"}
                  {detailDelivery.driver?.phone ? ` (${detailDelivery.driver.phone})` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="text-gray-800 dark:text-gray-200">
                  {detailDelivery.created_at ? new Date(detailDelivery.created_at).toLocaleString() : "—"}
                </span>
              </div>
              {canWriteDeliveries && detailDelivery.status === "pending" && !detailDelivery.driver_id && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      detailModal.closeModal();
                      setDetailDelivery(null);
                      handleOpenAssign(detailDelivery);
                    }}
                  >
                    Assign driver
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => {
          assignModal.closeModal();
          setSelectedDelivery(null);
        }}
      >
        <div className="max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Assign Driver
          </h3>
          {selectedDelivery && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Trip: {(selectedDelivery.pickup_name && selectedDelivery.pickup_name.trim()) ? selectedDelivery.pickup_name : selectedDelivery.pickup_address} → {(selectedDelivery.drop_name && selectedDelivery.drop_name.trim()) ? selectedDelivery.drop_name : selectedDelivery.drop_address}
            </p>
          )}
          {assignError && (
            <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
              {assignError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Label>Driver</Label>
              <select
                value={assignDriverId}
                onChange={(e) => setAssignDriverId(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select driver</option>
                {drivers.map((dr) => (
                  <option key={dr.id} value={dr.id}>
                    {dr.name} ({dr.phone}) - {dr.plate_number}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={assignModal.closeModal}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={!assignDriverId || assigningId !== null}
              >
                {assigningId ? "Assigning..." : "Assign"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  users: User[];
}

function CreateTripModal({
  isOpen,
  onClose,
  onSuccess,
  users,
}: CreateTripModalProps) {
  const [tripType, setTripType] = useState<"inside" | "outside">("inside");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDetails, setPickupDetails] = useState<PlaceDetails | null>(null);
  const [dropAddress, setDropAddress] = useState("");
  const [dropDetails, setDropDetails] = useState<PlaceDetails | null>(null);
  const [pickupAddressText, setPickupAddressText] = useState("");
  const [dropAddressText, setDropAddressText] = useState("");
  const [weightKg, setWeightKg] = useState(1);
  const [description, setDescription] = useState("");
  const [objectType, setObjectType] = useState("documents");
  const [carType, setCarType] = useState("motorcycle");
  const [userId, setUserId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"express" | "standard" | "same_day" | null>(null);
  const [manualPrice, setManualPrice] = useState<number | "">("");
  const [priceEdited, setPriceEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesterSearch, setRequesterSearch] = useState("");
  const [requesterOpen, setRequesterOpen] = useState(false);
  const requesterBoxRef = useRef<HTMLDivElement>(null);

  const isManualPriceValid =
    typeof manualPrice === "number" && Number.isFinite(manualPrice) && manualPrice > 0;

  const filteredRequesters = useMemo(() => {
    const q = requesterSearch.trim().toLowerCase();
    let list: User[];
    if (!q) {
      list = users.slice(0, 200);
    } else {
      list = users.filter((u) => {
        const name = (u.name || "").toLowerCase();
        const phone = (u.phone || "").replace(/\s/g, "").toLowerCase();
        return name.includes(q) || phone.includes(q.replace(/\s/g, ""));
      });
    }
    const selected = users.find((u) => u.id === userId);
    if (selected && !list.some((u) => u.id === userId)) {
      return [selected, ...list];
    }
    return list;
  }, [users, requesterSearch, userId]);

  useEffect(() => {
    if (isOpen) {
      setRequesterSearch("");
      setRequesterOpen(false);
    }
  }, [isOpen]);

  // Prefill outside-town price from formula unless admin has edited it.
  useEffect(() => {
    if (tripType !== "outside" || priceEdited) return;
    setManualPrice(outsideTownPriceForWeight(weightKg));
  }, [tripType, weightKg, priceEdited]);

  useEffect(() => {
    if (!requesterOpen) return;
    const onDoc = (e: globalThis.MouseEvent) => {
      if (requesterBoxRef.current && !requesterBoxRef.current.contains(e.target as Node)) {
        setRequesterOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [requesterOpen]);

  const requesterLabelForId = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.name} (${u.phone})` : "";
  };

  const handleRequesterInputChange = (value: string) => {
    setRequesterSearch(value);
    setRequesterOpen(true);
    if (userId && requesterLabelForId(userId) !== value) {
      setUserId("");
    }
  };

  const selectRequester = (u: User) => {
    setUserId(u.id);
    setRequesterSearch(`${u.name} (${u.phone})`);
    setRequesterOpen(false);
  };

  const handleFetchEstimate = async () => {
    if (!pickupDetails || !dropDetails) {
      setError("Select pickup and dropoff addresses from the suggestions");
      return;
    }
    setError(null);
    setSelectedPlan(null);
    setManualPrice("");
    setPriceEdited(false);
    setLoading(true);
    try {
      const res = await estimateDelivery(
        { lat: pickupDetails.lat, lng: pickupDetails.lng },
        { lat: dropDetails.lat, lng: dropDetails.lng }
      );
      setEstimate(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setEstimate(null);
      setError(e?.response?.data?.message || "Failed to get estimate");
    } finally {
      setLoading(false);
    }
  };

  // Receiver phone: 10 digits starting with 09, or 13 chars starting with +2519 (same as mobile app)
  const isReceiverPhoneValid =
    receiverPhone.trim() === "" ||
    /^09\d{8}$/.test(receiverPhone.trim()) ||
    /^\+2519\d{8}$/.test(receiverPhone.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (tripType === "outside") {
      if (!pickupAddressText.trim()) {
        setError("Pickup address is required");
        return;
      }
      if (!dropAddressText.trim()) {
        setError("Dropoff address is required");
        return;
      }
      if (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 20) {
        setError("Weight must be between 1 and 20 kg");
        return;
      }
      if (!isManualPriceValid) {
        setError("Price must be a number greater than 0");
        return;
      }
      if (!userId) {
        setError("Please select a requester");
        return;
      }
      if (receiverPhone.trim() !== "" && !isReceiverPhoneValid) {
        setError("Receiver phone must be 09XXXXXXXX or +2519XXXXXXXX");
        return;
      }
      setLoading(true);
      try {
        const payload: CreateOutsideTownPayload = {
          pickup_address: pickupAddressText.trim(),
          dropoff_address: dropAddressText.trim(),
          weight_kg: weightKg,
          price: Number(manualPrice),
          object_type: objectType,
          user_id: userId,
        };
        if (receiverName.trim()) payload.receiver_name = receiverName.trim();
        if (receiverPhone.trim()) payload.receiver_phone = receiverPhone.trim();
        if (description.trim()) payload.description = description.trim();
        await createOutsideTownDelivery(payload);
        resetForm();
        onSuccess();
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        setError(e?.response?.data?.message || "Failed to create outside-town trip");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!pickupDetails || !dropDetails) {
      setError("Select pickup and dropoff addresses from the suggestions");
      return;
    }
    if (!selectedPlan || !estimate) {
      setError("Get estimate and select a delivery plan");
      return;
    }
    if (!isManualPriceValid) {
      setError("Price must be a number greater than 0");
      return;
    }
    if (receiverPhone.trim() !== "" && !isReceiverPhoneValid) {
      setError("Receiver phone must be 09XXXXXXXX or +2519XXXXXXXX");
      return;
    }
    if (!userId) {
      setError("Please select a requester");
      return;
    }
    setLoading(true);
    try {
      const payload: CreateDeliveryPayload = {
        pickup: {
          lat: pickupDetails.lat,
          lng: pickupDetails.lng,
          address: pickupDetails.formattedAddress,
          name: (pickupDetails.name && pickupDetails.name.trim()) ? pickupDetails.name : undefined,
        },
        dropoff: {
          lat: dropDetails.lat,
          lng: dropDetails.lng,
          address: dropDetails.formattedAddress,
          name: (dropDetails.name && dropDetails.name.trim()) ? dropDetails.name : undefined,
        },
        delivery_plan: selectedPlan,
        price: Number(manualPrice),
        object_type: objectType,
        vehicle_type: carType,
        user_id: userId,
      };
      if (receiverName.trim()) payload.receiver_name = receiverName.trim();
      if (receiverPhone.trim()) payload.receiver_phone = receiverPhone.trim();
      if (description.trim()) payload.description = description.trim();
      await createDelivery(payload);
      resetForm();
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTripType("inside");
    setPickupAddress("");
    setPickupDetails(null);
    setDropAddress("");
    setDropDetails(null);
    setPickupAddressText("");
    setDropAddressText("");
    setWeightKg(1);
    setDescription("");
    setObjectType("documents");
    setCarType("car");
    setUserId("");
    setReceiverName("");
    setReceiverPhone("");
    setEstimate(null);
    setSelectedPlan(null);
    setManualPrice("");
    setPriceEdited(false);
    setRequesterSearch("");
    setRequesterOpen(false);
  };

  if (!isOpen) return null;

  const requesterSection = (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/60">
      <Label className="text-sm font-semibold text-gray-800 dark:text-white">
        Requester
      </Label>
      {/* <p className="mt-1 mb-3 text-xs text-gray-600 dark:text-gray-400">
        Type to search — suggestions update as you write. Click a row to select.
      </p> */}
      <div ref={requesterBoxRef} className="relative">
        <input
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={requesterSearch}
          onChange={(e) => handleRequesterInputChange(e.target.value)}
          onFocus={() => setRequesterOpen(true)}
          placeholder="Search name or phone…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search requesters"
          aria-expanded={requesterOpen}
          aria-controls="requester-suggestions"
          className="min-h-11 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none ring-offset-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-400"
          disabled={loading}
        />
        {requesterOpen && (
          <ul
            id="requester-suggestions"
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 dark:border-gray-600 dark:bg-gray-900 dark:ring-white/10"
          >
            {filteredRequesters.length === 0 ? (
              <li className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                {users.length === 0
                  ? "No users loaded yet."
                  : "No matches — try another name or phone."}
              </li>
            ) : (
              filteredRequesters.map((u) => (
                <li key={u.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={userId === u.id}
                    className={`flex w-full items-baseline gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-gray-800 ${
                      userId === u.id
                        ? "bg-blue-50 font-medium text-blue-900 dark:bg-blue-500/20 dark:text-blue-100"
                        : "text-gray-900 dark:text-white"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectRequester(u)}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-gray-500 dark:text-gray-400">{u.phone}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {userId ? (
        <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
          Requester selected
        </p>
      ) : (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {/* Select a user from the suggestions above. */}
          Select user
        </p>
      )}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Create Trip
        </h3>
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 mb-4 bg-gray-100 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => {
              setTripType("inside");
              setError(null);
              setManualPrice("");
              setPriceEdited(false);
            }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              tripType === "inside"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Inside town
          </button>
          <button
            type="button"
            onClick={() => {
              setTripType("outside");
              setError(null);
              setPriceEdited(false);
              setManualPrice(outsideTownPriceForWeight(weightKg));
            }}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              tripType === "outside"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Outside town
          </button>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 p-3 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tripType === "outside" ? (
            <>
              {requesterSection}
              <div>
                <Label>Pickup address</Label>
                <input
                  type="text"
                  value={pickupAddressText}
                  onChange={(e) => setPickupAddressText(e.target.value)}
                  placeholder="Full pickup address"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Dropoff address</Label>
                <input
                  type="text"
                  value={dropAddressText}
                  onChange={(e) => setDropAddressText(e.target.value)}
                  placeholder="Full dropoff address"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  1–20 kg. Suggested: {outsideTownPriceForWeight(weightKg)} ETB
                </p>
              </div>
              <div>
                <Label>Price (ETB)</Label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={manualPrice}
                  onChange={(e) => {
                    setPriceEdited(true);
                    const v = e.target.value;
                    if (v === "") {
                      setManualPrice("");
                      return;
                    }
                    const n = parseFloat(v);
                    setManualPrice(Number.isFinite(n) ? n : "");
                  }}
                  placeholder="Enter price"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Object type</Label>
                <select
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="documents">Documents</option>
                  <option value="food">Food</option>
                  <option value="electronics">Electronics</option>
                </select>
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Receiver name</Label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Receiver name"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Receiver phone</Label>
                <input
                  type="tel"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="09XXXXXXXX or +2519XXXXXXXX"
                  className={`h-11 w-full rounded-lg border px-4 py-2 text-sm dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 ${
                    receiverPhone.trim() !== "" && !isReceiverPhoneValid
                      ? "border-red-500 focus:ring-red-500/20 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  disabled={loading}
                />
                {receiverPhone.trim() !== "" && !isReceiverPhoneValid && (
                  <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                    Only 09XXXXXXXX or +2519XXXXXXXX allowed
                  </p>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !userId ||
                    !pickupAddressText.trim() ||
                    !dropAddressText.trim() ||
                    weightKg < 1 ||
                    weightKg > 20 ||
                    !isManualPriceValid ||
                    (receiverPhone.trim() !== "" && !isReceiverPhoneValid)
                  }
                >
                  {loading ? "Creating..." : "Create Trip"}
                </Button>
              </div>
            </>
          ) : (
            <>
          {requesterSection}
          <PlacesAutocompleteField
            label="Pickup"
            placeholder="Search pickup address in Addis Ababa..."
            value={pickupAddress}
            onChange={setPickupAddress}
            onPlaceSelected={(d) => setPickupDetails(d)}
            onSelectionCleared={() => setPickupDetails(null)}
            disabled={loading}
          />

          <PlacesAutocompleteField
            label="Dropoff"
            placeholder="Search dropoff address in Addis Ababa..."
            value={dropAddress}
            onChange={setDropAddress}
            onPlaceSelected={(d) => setDropDetails(d)}
            onSelectionCleared={() => setDropDetails(null)}
            disabled={loading}
          />

          <div>
            <Label>Receiver name</Label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Receiver name"
              className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
              disabled={loading}
            />
          </div>
          <div>
            <Label>Receiver phone</Label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              placeholder="09XXXXXXXX or +2519XXXXXXXX"
              className={`h-11 w-full rounded-lg border px-4 py-2 text-sm dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 ${
                receiverPhone.trim() !== "" && !isReceiverPhoneValid
                  ? "border-red-500 focus:ring-red-500/20 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              disabled={loading}
            />
            {receiverPhone.trim() !== "" && !isReceiverPhoneValid && (
              <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                Only 09XXXXXXXX or +2519XXXXXXXX allowed
              </p>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Object Type</Label>
              <select
                value={objectType}
                onChange={(e) => setObjectType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="documents">Documents</option>
                <option value="food">Food</option>
                <option value="electronics">Electronics</option>
              </select>
            </div>
            <div>
              <Label>Car Type</Label>
              <select
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                <option value="motorcycle">Motorcycle </option>
                <option value="car">Car</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchEstimate}
              disabled={loading}
            >
              {loading ? "Calculating..." : "Get Estimate"}
            </Button>
            {estimate && (
              <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                {estimate.distanceKm} km
              </span>
            )}
          </div>

          {estimate && (
            <div className="space-y-2">
              <Label>Select delivery plan</Label>
              <div className="grid gap-2">
                {(["express", "standard", "same_day"] as const).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => {
                      if (selectedPlan === plan) {
                        setSelectedPlan(null);
                        setManualPrice("");
                        setPriceEdited(false);
                        return;
                      }
                      setSelectedPlan(plan);
                      setManualPrice(estimate.plans[plan].price);
                      setPriceEdited(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      selectedPlan === plan
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>
                      <span className="font-medium capitalize">
                        {plan.replace("_", " ")}
                      </span>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                        ({estimate.plans[plan].eta})
                      </span>
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {estimate.plans[plan].price} ETB
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedPlan && estimate && (
            <div>
              <Label>Price (ETB)</Label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={manualPrice}
                onChange={(e) => {
                  setPriceEdited(true);
                  const v = e.target.value;
                  if (v === "") {
                    setManualPrice("");
                    return;
                  }
                  const n = parseFloat(v);
                  setManualPrice(Number.isFinite(n) ? n : "");
                }}
                placeholder="Enter price"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Prefills from the selected plan; you can override it.
              </p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !selectedPlan ||
                !userId ||
                !isManualPriceValid ||
                (receiverPhone.trim() !== "" && !isReceiverPhoneValid)
              }
            >
              {loading ? "Creating..." : "Create Trip"}
            </Button>
          </div>
            </>
          )}
        </form>
      </div>
    </Modal>
  );
}
