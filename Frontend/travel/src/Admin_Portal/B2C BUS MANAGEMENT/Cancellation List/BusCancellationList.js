import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./BusCancellationList.css";
import { useAdminList } from "../../../adminPortalStorage";
import { getAuthUserId } from "../../../api/authSession";

const adminCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const DEFAULT_FILTERS = {
  bookingId: "",
  pnr: "",
  passengerName: "",
  passengerPhone: "",
};

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const FALLBACK_API_BASE_URL =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const BUS_BOOKINGS_ROOT = "/api/BusBookings";
const FLIGHT_BOOKINGS_ROOT = "/api/FlightBookings";
const DEFAULT_API_USER_ID =
  String(process.env.REACT_APP_API_USER_ID || "").trim() || "user_123";

function isLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function resolveApiBaseUrl(...explicitBases) {
  const preferProxyInDev =
    isLocalDevelopment() &&
    String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() !==
      "true";

  if (preferProxyInDev) {
    return "";
  }

  for (const candidate of explicitBases) {
    const trimmed = String(candidate || "").trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const placesUrl = process.env.REACT_APP_PLACES_API_URL;
  if (placesUrl && placesUrl.trim()) {
    try {
      return new URL(placesUrl.trim()).origin;
    } catch {
      // Fall through to default.
    }
  }

  return FALLBACK_API_BASE_URL;
}

const BUS_API_BASE_URL = resolveApiBaseUrl(
  process.env.REACT_APP_API_BASE_URL,
  process.env.REACT_APP_BUS_API_BASE_URL
);
const FLIGHT_API_BASE_URL = resolveApiBaseUrl(
  process.env.REACT_APP_API_BASE_URL,
  process.env.REACT_APP_FLIGHT_API_BASE_URL
);

function toAbsoluteUrl(apiBaseUrl, urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  if (apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/+$/, "")}/${String(urlOrPath || "").replace(
      /^\/+/,
      ""
    )}`;
  }

  return urlOrPath;
}

function shouldUseNgrokBypass(apiBaseUrl, urlOrPath) {
  try {
    const parsed = new URL(
      toAbsoluteUrl(apiBaseUrl, urlOrPath),
      window.location.origin
    );
    return (
      parsed.hostname.includes("ngrok-free.dev") ||
      parsed.hostname.includes("ngrok.io")
    );
  } catch {
    return false;
  }
}

function buildUrl(apiBaseUrl, path, query = {}) {
  const base = toAbsoluteUrl(apiBaseUrl, path);
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const normalizedValue =
      typeof value === "string" ? value.trim() : String(value);

    if (normalizedValue) {
      params.set(key, normalizedValue);
    }
  });

  return params.toString() ? `${base}?${params.toString()}` : base;
}

function resolveCurrentUserId(explicitUserId) {
  const directValue = normalizeText(explicitUserId, "");
  if (directValue) {
    return directValue;
  }

  const sessionUserId = normalizeText(getAuthUserId(), "");
  return sessionUserId || DEFAULT_API_USER_ID;
}

function shouldUseFallbackBusBookings(error) {
  const message = String(error?.message || "").toLowerCase();

  if (!message) {
    return false;
  }

  return (
    message.includes("cannot get /api/busbookings") ||
    message.includes("err_ngrok_3200") ||
    (message.includes("endpoint") && message.includes("offline")) ||
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  );
}

function shouldUseFallbackFlightBookings(error) {
  const message = String(error?.message || "").toLowerCase();

  if (!message) {
    return false;
  }

  return (
    message.includes("cannot get /api/flightbookings") ||
    message.includes("err_ngrok_3200") ||
    (message.includes("endpoint") && message.includes("offline")) ||
    message.includes("failed to fetch") ||
    message.includes("networkerror")
  );
}

function pickFirst(source, keys, fallback = null) {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function normalizeBusPassenger(passenger, index = 0) {
  return {
    fullName: String(
      pickFirst(
        passenger,
        ["fullName", "FullName", "name", "Name"],
        `Passenger ${index + 1}`
      )
    ),
    gender: String(pickFirst(passenger, ["gender", "Gender"], "")),
    seatNumber: pickFirst(passenger, ["seatNumber", "SeatNumber"], null),
  };
}

function normalizeBusBookingRecord(record) {
  const passengersRaw = pickFirst(record, ["passengers", "Passengers"], []);
  const passengers = Array.isArray(passengersRaw)
    ? passengersRaw.map((passenger, index) =>
        normalizeBusPassenger(passenger, index)
      )
    : [];
  const seatsBookedFallback = passengers.length;

  return {
    bookingId: pickFirst(record, ["bookingId", "BookingId"], null),
    bookingReference: String(
      pickFirst(record, ["bookingReference", "BookingReference"], "") || ""
    ),
    tripType: String(pickFirst(record, ["tripType", "TripType"], "Bus") || "Bus"),
    tripId: pickFirst(record, ["tripId", "TripId"], null),
    passengerName: String(
      pickFirst(record, ["passengerName", "PassengerName"], "") || ""
    ),
    passengerPhone: String(
      pickFirst(record, ["passengerPhone", "PassengerPhone"], "") || ""
    ),
    passengerEmail: String(
      pickFirst(record, ["passengerEmail", "PassengerEmail"], "") || ""
    ),
    fromCity: String(pickFirst(record, ["fromCity", "FromCity"], "") || ""),
    toCity: String(pickFirst(record, ["toCity", "ToCity"], "") || ""),
    providerName: String(
      pickFirst(
        record,
        ["providerName", "ProviderName", "operatorName", "OperatorName"],
        ""
      ) || ""
    ),
    departureTimeUtc: pickFirst(
      record,
      [
        "departureTimeUtc",
        "DepartureTimeUtc",
        "departureDateTimeUtc",
        "DepartureDateTimeUtc",
      ],
      null
    ),
    arrivalTimeUtc: pickFirst(
      record,
      [
        "arrivalTimeUtc",
        "ArrivalTimeUtc",
        "arrivalDateTimeUtc",
        "ArrivalDateTimeUtc",
      ],
      null
    ),
    travelClass: String(
      pickFirst(record, ["travelClass", "TravelClass"], "Not Applicable") ||
        "Not Applicable"
    ),
    adults: Number(pickFirst(record, ["adults", "Adults"], 0)) || 0,
    children: Number(pickFirst(record, ["children", "Children"], 0)) || 0,
    infants: Number(pickFirst(record, ["infants", "Infants"], 0)) || 0,
    seatsBooked:
      Number(pickFirst(record, ["seatsBooked", "SeatsBooked"], null)) ||
      seatsBookedFallback,
    totalPriceInr:
      Number(pickFirst(record, ["totalPriceInr", "TotalPriceInr"], 0)) || 0,
    status: String(pickFirst(record, ["status", "Status"], "Unknown") || "Unknown"),
    bookedAtUtc: pickFirst(record, ["bookedAtUtc", "BookedAtUtc"], null),
    cancelledAtUtc: pickFirst(record, ["cancelledAtUtc", "CancelledAtUtc"], null),
    cancellationReason: String(
      pickFirst(record, ["cancellationReason", "CancellationReason"], "") || ""
    ),
    tripNumber: String(
      pickFirst(
        record,
        ["tripNumber", "TripNumber", "busNumber", "BusNumber"],
        ""
      ) || ""
    ),
    passengers,
  };
}

function normalizeFlightPassenger(passenger, index = 0) {
  return {
    fullName: String(
      pickFirst(
        passenger,
        ["fullName", "FullName", "name", "Name"],
        `Passenger ${index + 1}`
      )
    ),
    passengerType: String(
      pickFirst(passenger, ["passengerType", "PassengerType"], "Adult")
    ),
    gender: String(pickFirst(passenger, ["gender", "Gender"], "")),
    seatNumber: pickFirst(passenger, ["seatNumber", "SeatNumber"], null),
  };
}

function normalizeFlightBookingRecord(record) {
  const passengersRaw = pickFirst(record, ["passengers", "Passengers"], []);
  const passengers = Array.isArray(passengersRaw)
    ? passengersRaw.map((passenger, index) =>
        normalizeFlightPassenger(passenger, index)
      )
    : [];
  const seatsBookedFallback = passengers.filter(
    (passenger) =>
      String(passenger.passengerType || "").toLowerCase() !== "infant"
  ).length;

  return {
    bookingId: pickFirst(record, ["bookingId", "BookingId"], null),
    bookingReference: String(
      pickFirst(record, ["bookingReference", "BookingReference"], "") || ""
    ),
    tripType: String(
      pickFirst(record, ["tripType", "TripType"], "Flight") || "Flight"
    ),
    tripId: pickFirst(record, ["tripId", "TripId"], null),
    passengerName: String(
      pickFirst(record, ["passengerName", "PassengerName"], "") || ""
    ),
    passengerPhone: String(
      pickFirst(record, ["passengerPhone", "PassengerPhone"], "") || ""
    ),
    passengerEmail: String(
      pickFirst(record, ["passengerEmail", "PassengerEmail"], "") || ""
    ),
    fromCity: String(pickFirst(record, ["fromCity", "FromCity"], "") || ""),
    toCity: String(pickFirst(record, ["toCity", "ToCity"], "") || ""),
    providerName: String(
      pickFirst(record, ["providerName", "ProviderName", "airline", "Airline"], "") ||
        ""
    ),
    departureTimeUtc: pickFirst(
      record,
      [
        "departureTimeUtc",
        "DepartureTimeUtc",
        "departureDateTimeUtc",
        "DepartureDateTimeUtc",
      ],
      null
    ),
    arrivalTimeUtc: pickFirst(
      record,
      [
        "arrivalTimeUtc",
        "ArrivalTimeUtc",
        "arrivalDateTimeUtc",
        "ArrivalDateTimeUtc",
      ],
      null
    ),
    travelClass: String(pickFirst(record, ["travelClass", "TravelClass"], "") || ""),
    adults: Number(pickFirst(record, ["adults", "Adults"], 0)) || 0,
    children: Number(pickFirst(record, ["children", "Children"], 0)) || 0,
    infants: Number(pickFirst(record, ["infants", "Infants"], 0)) || 0,
    seatsBooked:
      Number(pickFirst(record, ["seatsBooked", "SeatsBooked"], null)) ||
      seatsBookedFallback,
    totalPriceInr:
      Number(pickFirst(record, ["totalPriceInr", "TotalPriceInr"], 0)) || 0,
    status: String(pickFirst(record, ["status", "Status"], "Unknown") || "Unknown"),
    bookedAtUtc: pickFirst(record, ["bookedAtUtc", "BookedAtUtc"], null),
    cancelledAtUtc: pickFirst(record, ["cancelledAtUtc", "CancelledAtUtc"], null),
    cancellationReason: String(
      pickFirst(record, ["cancellationReason", "CancellationReason"], "") || ""
    ),
    tripNumber: String(
      pickFirst(
        record,
        ["tripNumber", "TripNumber", "flightNumber", "FlightNumber"],
        ""
      ) || ""
    ),
    passengers,
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text;
}

function normalizeErrorMessage(payload) {
  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) {
      return "";
    }

    const preMatch = text.match(/<pre>(.*?)<\/pre>/i);
    if (preMatch?.[1]) {
      return preMatch[1].replace(/\s+/g, " ").trim();
    }

    const noTags = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (noTags) {
      return noTags;
    }

    return text;
  }

  if (payload && typeof payload?.message === "string") {
    return payload.message.trim();
  }

  return "";
}

async function requestJson(apiBaseUrl, urlOrPath, options = {}) {
  const resolvedUserId = resolveCurrentUserId(options.userId);
  const headers = {
    Accept: "application/json",
    "X-User-Id": resolvedUserId,
    ...(options.headers || {}),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (shouldUseNgrokBypass(apiBaseUrl, urlOrPath)) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  const url = toAbsoluteUrl(apiBaseUrl, urlOrPath);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const normalizedMessage = normalizeErrorMessage(payload);
    const message =
      normalizedMessage || `Request failed (${response.status}). Please try again.`;
    const error = new Error(message);
    error.status = response.status;
    error.url = url;
    throw error;
  }

  return payload;
}

async function listAdminBusBookings({ passengerPhone, status } = {}) {
  const url = buildUrl(BUS_API_BASE_URL, `${BUS_BOOKINGS_ROOT}/admin/bookings`, {
    passengerPhone,
    status,
  });

  try {
    const data = await requestJson(BUS_API_BASE_URL, url, { method: "GET" });
    return Array.isArray(data)
      ? data.map((record) => normalizeBusBookingRecord(record))
      : [];
  } catch (error) {
    if (shouldUseFallbackBusBookings(error)) {
      return [];
    }

    throw error;
  }
}

async function listAdminFlightBookings({ passengerPhone, status } = {}) {
  const url = buildUrl(
    FLIGHT_API_BASE_URL,
    `${FLIGHT_BOOKINGS_ROOT}/admin/bookings`,
    {
      passengerPhone,
      status,
    }
  );

  try {
    const data = await requestJson(FLIGHT_API_BASE_URL, url, { method: "GET" });
    return Array.isArray(data)
      ? data.map((record) => normalizeFlightBookingRecord(record))
      : [];
  } catch (error) {
    if (shouldUseFallbackFlightBookings(error)) {
      return [];
    }

    throw error;
  }
}

const parseNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toDateKey = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return normalizeText(value, "").slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
};

const toTimeKey = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const text = normalizeText(value, "");
    if (text.includes("T")) {
      return text.split("T")[1]?.slice(0, 5) || "";
    }

    return text.slice(11, 16);
  }

  return parsed.toISOString().slice(11, 16);
};

const BOOKED_STATUS_SET = new Set(["booked", "success", "confirmed", "ticketed"]);
const PENDING_STATUS_SET = new Set(["pending", "onhold", "processing"]);
const CANCELLED_STATUS_SET = new Set(["cancelled", "canceled"]);

const toAdminStatusLabel = (statusValue) => {
  const normalized = normalizeText(statusValue, "Unknown");
  const key = normalized.toLowerCase();

  if (CANCELLED_STATUS_SET.has(key)) {
    return "Cancelled";
  }

  if (PENDING_STATUS_SET.has(key)) {
    return "Pending";
  }

  if (BOOKED_STATUS_SET.has(key)) {
    return "Booked";
  }

  return normalized;
};

const mapAdminStatusClass = (statusValue) => {
  const key = normalizeText(statusValue, "").toLowerCase();

  if (CANCELLED_STATUS_SET.has(key)) {
    return "cancelled";
  }

  if (PENDING_STATUS_SET.has(key)) {
    return "pending";
  }

  if (BOOKED_STATUS_SET.has(key)) {
    return "success";
  }

  return "pending";
};

const toUnifiedAdminBooking = (record, sourceType) => {
  const safeSourceType = normalizeText(sourceType, "Bus");
  const status = toAdminStatusLabel(record?.status);
  const bookingReference = normalizeText(record?.bookingReference, "");
  const bookingId = normalizeText(record?.bookingId, "");
  const tripNumber = normalizeText(record?.tripNumber, "");
  const bookedAtValue = record?.bookedAtUtc || null;
  const departureValue = record?.departureTimeUtc || null;

  const fare = Math.max(parseNumber(record?.totalPriceInr, 0), 0);
  const inferredProfit = Math.round(fare * 0.04);
  const profit = parseNumber(record?.profit, inferredProfit);

  return {
    id: bookingReference || bookingId || "--",
    bookingId,
    bookingReference,
    tripType: safeSourceType,
    createdAt: toDateKey(bookedAtValue),
    createdAtValue: bookedAtValue,
    passengerName: normalizeText(record?.passengerName, "--"),
    passengerPhone: normalizeText(record?.passengerPhone, "--"),
    from: normalizeText(record?.fromCity, "--"),
    to: normalizeText(record?.toCity, "--"),
    journeyDate: toDateKey(departureValue),
    journeyTime: toTimeKey(departureValue),
    pnr: bookingReference || tripNumber || bookingId || "--",
    status,
    operator: normalizeText(record?.providerName, "--"),
    vehicleType: normalizeText(record?.travelClass, safeSourceType),
    fare,
    profit,
    cancellationReason: normalizeText(record?.cancellationReason, ""),
    cancelledAtValue: record?.cancelledAtUtc || null,
    raw: record,
  };
};

const toCancellationRecord = (unifiedBooking) => {
  const fare = Math.max(parseNumber(unifiedBooking?.fare, 0), 0);
  const raw = unifiedBooking?.raw || {};

  const cancellationChargeRaw = parseNumber(
    raw.cancellationCharge ?? raw.CancellationCharge,
    Number.NaN
  );
  const refundAmountRaw = parseNumber(raw.refundAmount ?? raw.RefundAmount, Number.NaN);

  const cancellationCharge = Number.isFinite(cancellationChargeRaw)
    ? Math.max(cancellationChargeRaw, 0)
    : Math.round(fare * 0.18);

  const refundAmount = Number.isFinite(refundAmountRaw)
    ? Math.max(refundAmountRaw, 0)
    : Math.max(fare - cancellationCharge, 0);

  return {
    ...unifiedBooking,
    cancellationCharge,
    refundAmount,
  };
};

const toNumberDate = (value) => {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
};

const safeValue = (value, fallback = "--") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export default function AdminCancellationListPage() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [selectedCancellation, setSelectedCancellation] = useState(null);
  const [cancellationBookings, setCancellationBookings] = useAdminList(
    "b2c-cancellation-bookings",
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCancellationBookings = useCallback(async (activeFilters) => {
    setIsLoading(true);
    setErrorMessage("");

    const passengerPhone = String(activeFilters.passengerPhone || "").trim() || undefined;

    try {
      const [flightResults, busResults] = await Promise.all([
        listAdminFlightBookings({ passengerPhone, status: "Cancelled" }),
        listAdminBusBookings({ passengerPhone, status: "Cancelled" }),
      ]);

      const merged = [
        ...flightResults.map((record) => toUnifiedAdminBooking(record, "Flight")),
        ...busResults.map((record) => toUnifiedAdminBooking(record, "Bus")),
      ]
        .filter((record) => mapAdminStatusClass(record.status) === "cancelled")
        .map((record) => toCancellationRecord(record))
        .sort((first, second) => {
          const firstTime = toNumberDate(first.cancelledAtValue || first.createdAtValue || first.createdAt);
          const secondTime = toNumberDate(second.cancelledAtValue || second.createdAtValue || second.createdAt);
          return secondTime - firstTime;
        });

      setCancellationBookings(merged);
    } catch (error) {
      setErrorMessage(error?.message || "Unable to load cancellation bookings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCancellationBookings(filters);
  }, [filters, loadCancellationBookings]);

  const filteredCancellations = useMemo(() => {
    return cancellationBookings.filter((booking) => {
      if (filters.bookingId) {
        const idQuery = filters.bookingId.toLowerCase();
        if (!String(booking.id || "").toLowerCase().includes(idQuery)) {
          return false;
        }
      }

      if (filters.pnr) {
        const pnrQuery = filters.pnr.toLowerCase();
        if (!String(booking.pnr || "").toLowerCase().includes(pnrQuery)) {
          return false;
        }
      }

      if (filters.passengerName) {
        const passengerQuery = filters.passengerName.toLowerCase();
        if (!String(booking.passengerName || "").toLowerCase().includes(passengerQuery)) {
          return false;
        }
      }

      if (filters.passengerPhone) {
        if (!String(booking.passengerPhone || "").includes(filters.passengerPhone)) {
          return false;
        }
      }

      return true;
    });
  }, [cancellationBookings, filters]);

  const handleFilterChange = (field, value) => {
    setDraftFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    setFilters(draftFilters);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    setIsFiltersOpen(false);
  };

  const handleExport = () => {
    const headers = [
      "Trip Type",
      "ID",
      "PNR",
      "Date",
      "From",
      "To",
      "Journey Date",
      "Journey Time",
      "Passenger Name",
      "Passenger Phone",
      "Cancellation Charge",
      "Refund Amount",
      "Status",
    ];

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredCancellations.map((booking) => [
      booking.tripType,
      booking.id,
      booking.pnr,
      booking.createdAt,
      booking.from,
      booking.to,
      booking.journeyDate,
      booking.journeyTime,
      booking.passengerName,
      booking.passengerPhone,
      booking.cancellationCharge,
      booking.refundAmount,
      booking.status,
    ]);

    const csvBody = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvBody}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin-bus-cancellations.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-b2c-page admin-cancel-page">
      <header className="admin-b2c-header admin-cancel-header">
        <h1>B2C Bus Cancellation List</h1>
      </header>

      <div className="admin-toolbar-row admin-cancel-toolbar">
        <div className="admin-chip-row">
          <span className="admin-chip admin-cancel-chip">
            Cancelled Records: {filteredCancellations.length}
          </span>
        </div>

        <div className="admin-actions-row">
          <button type="button" onClick={() => setIsFiltersOpen((current) => !current)}>
            {isFiltersOpen ? "Hide Filter" : "Filter"}
          </button>
          <button type="button" className="admin-cancel-clear-btn" onClick={clearFilters}>
            Clear Filter
          </button>
          <button type="button" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {errorMessage ? <div className="admin-data-error">{errorMessage}</div> : null}

      {isFiltersOpen ? (
        <section className="flight-ops-filters admin-ops-filters admin-cancel-filters">
          <label>
            <span>ID</span>
            <input
              type="text"
              placeholder="Search by booking id"
              value={draftFilters.bookingId}
              onChange={(event) => handleFilterChange("bookingId", event.target.value)}
            />
          </label>
          <label>
            <span>PNR</span>
            <input
              type="text"
              placeholder="Search by PNR"
              value={draftFilters.pnr}
              onChange={(event) => handleFilterChange("pnr", event.target.value)}
            />
          </label>
          <label>
            <span>Passenger Name</span>
            <input
              type="text"
              placeholder="Search by passenger"
              value={draftFilters.passengerName}
              onChange={(event) => handleFilterChange("passengerName", event.target.value)}
            />
          </label>
          <label>
            <span>Passenger Phone</span>
            <input
              type="text"
              placeholder="Search by mobile"
              value={draftFilters.passengerPhone}
              onChange={(event) => handleFilterChange("passengerPhone", event.target.value)}
            />
          </label>

          <div className="filters-actions admin-cancel-filter-actions">
            <button type="button" className="primary" onClick={applyFilters}>
              Apply Filter
            </button>
            <button type="button" className="secondary" onClick={clearFilters}>
              Reset
            </button>
          </div>
        </section>
      ) : null}

      <section className="admin-cancel-table-shell">
        <header className="admin-cancel-table-head">
          <span>ID</span>
          <span>PNR / Date</span>
          <span>Segment / Journey</span>
          <span>Passenger Name</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Action</span>
        </header>

        {isLoading ? (
          <div className="admin-cancel-empty">Loading cancellation records...</div>
        ) : filteredCancellations.length ? (
          <div className="admin-cancel-table-body">
            {filteredCancellations.map((booking) => (
              <article key={`${booking.tripType}-${booking.id}-${booking.createdAt}`} className="admin-cancel-table-row">
                <div className="admin-cancel-cell">
                  <strong>{safeValue(booking.id)}</strong>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(booking.pnr)}</strong>
                  <small>{safeValue(booking.createdAt)}</small>
                </div>

                <div className="admin-cancel-cell">
                  <strong>
                    {safeValue(booking.from)} to {safeValue(booking.to)}
                  </strong>
                  <small>
                    {safeValue(booking.journeyDate)} | {safeValue(booking.journeyTime)}
                  </small>
                </div>

                <div className="admin-cancel-cell">
                  <strong>{safeValue(booking.passengerName)}</strong>
                  <small>{safeValue(booking.passengerPhone)}</small>
                </div>

                <div className="admin-cancel-cell">
                  <strong>RA {adminCurrencyFormatter.format(booking.refundAmount)}</strong>
                  <small>CC {adminCurrencyFormatter.format(booking.cancellationCharge)}</small>
                </div>

                <div className="admin-cancel-cell">
                  <span className="admin-status-pill cancelled">Cancelled</span>
                  <small>C / R</small>
                </div>

                <div className="admin-cancel-cell admin-cell-centered">
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={() => setSelectedCancellation(booking)}
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-cancel-empty">Result Not Found.</div>
        )}

        <footer className="admin-cancel-footnote">
          <strong>CC :-</strong> Cancellation Charge, <strong>RA :-</strong> Refund Amount,
          <strong> C :-</strong> Cancel, <strong>R :-</strong> Refund.
        </footer>
      </section>

      {selectedCancellation ? (
        <div className="admin-view-backdrop" onClick={() => setSelectedCancellation(null)}>
          <article
            className="admin-view-card"
            role="dialog"
            aria-modal="true"
            aria-label="Cancellation details"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-view-header">
              <div className="admin-view-header-main">
                <h2>Cancellation Detail View</h2>
                <p className="admin-view-header-subtitle">
                  {safeValue(selectedCancellation.id)} | {safeValue(selectedCancellation.passengerName)}
                </p>
                <div className="admin-view-meta-row">
                  <span className="admin-view-meta-chip cancelled">Cancelled</span>
                  <span className="admin-view-meta-chip">
                    RA {adminCurrencyFormatter.format(selectedCancellation.refundAmount)}
                  </span>
                  <span className="admin-view-meta-chip">
                    CC {adminCurrencyFormatter.format(selectedCancellation.cancellationCharge)}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedCancellation(null)}>
                Close
              </button>
            </header>

            <section className="admin-view-grid">
              <div>
                <span>Trip Type</span>
                <strong>{safeValue(selectedCancellation.tripType)}</strong>
              </div>
              <div>
                <span>Passenger Phone</span>
                <strong>{safeValue(selectedCancellation.passengerPhone)}</strong>
              </div>
              <div>
                <span>Booking ID</span>
                <strong>{safeValue(selectedCancellation.id)}</strong>
              </div>
              <div>
                <span>PNR / Date</span>
                <strong>{safeValue(selectedCancellation.pnr)}</strong>
                <small>{safeValue(selectedCancellation.createdAt)}</small>
              </div>
              <div>
                <span>Segment</span>
                <strong>
                  {safeValue(selectedCancellation.from)} to {safeValue(selectedCancellation.to)}
                </strong>
              </div>
              <div>
                <span>Journey Date & Time</span>
                <strong>
                  {safeValue(selectedCancellation.journeyDate)} | {safeValue(selectedCancellation.journeyTime)}
                </strong>
              </div>
              <div className="admin-view-highlight-card">
                <span>Refund Amount</span>
                <strong>{adminCurrencyFormatter.format(selectedCancellation.refundAmount)}</strong>
              </div>
              <div className="admin-view-highlight-card">
                <span>Cancellation Charge</span>
                <strong>{adminCurrencyFormatter.format(selectedCancellation.cancellationCharge)}</strong>
              </div>
            </section>
          </article>
        </div>
      ) : null}
    </section>
  );
}

