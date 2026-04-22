import { getAuthToken, getAuthUserId } from "./authSession";

const FALLBACK_API_BASE_URL =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function isLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function resolveApiBaseUrl() {
  const preferProxyInDev =
    isLocalDevelopment() &&
    String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() !==
      "true";

  if (preferProxyInDev) {
    return "";
  }

  const explicitBase =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_FLIGHT_API_BASE_URL;

  if (explicitBase && explicitBase.trim()) {
    return explicitBase.trim();
  }

  // Reuse the Places API host when present, so all APIs stay on the same backend.
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

const API_BASE_URL = resolveApiBaseUrl();

const FLIGHT_BOOKINGS_ROOT = "/api/FlightBookings";

function toAbsoluteUrl(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/+$/, "")}/${urlOrPath.replace(/^\/+/, "")}`;
  }

  return urlOrPath;
}

function shouldUseNgrokBypass(urlOrPath) {
  try {
    const parsed = new URL(toAbsoluteUrl(urlOrPath), window.location.origin);
    return (
      parsed.hostname.includes("ngrok-free.dev") ||
      parsed.hostname.includes("ngrok.io")
    );
  } catch {
    return false;
  }
}

function buildUrl(path, query = {}) {
  const base = toAbsoluteUrl(path);
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

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function resolveAuthToken() {
  return normalizeText(getAuthToken(), "");
}

function resolveCurrentUserId(explicitUserId) {
  const directValue = normalizeText(explicitUserId, "");
  if (directValue) {
    return directValue;
  }
  return normalizeText(getAuthUserId(), "");
}

function resolveRequiredUserId(userId) {
  const resolved = resolveCurrentUserId(userId);
  if (!resolved) {
    throw new Error("X-User-Id header is required. Please sign in again.");
  }

  return resolved;
}

function normalizeFlightClassOption(option) {
  const travelClass = String(
    pickFirst(option, ["travelClass", "TravelClass"], "")
  ).trim();

  return {
    travelClass,
    priceInr: Number(pickFirst(option, ["priceInr", "PriceInr"], 0)) || 0,
    availableSeats:
      Number(pickFirst(option, ["availableSeats", "AvailableSeats"], 0)) || 0,
    totalSeats: Number(pickFirst(option, ["totalSeats", "TotalSeats"], 0)) || 0,
  };
}

function normalizeFlightSearchRecord(record, index = 0) {
  const classOptionsRaw = pickFirst(
    record,
    ["classOptions", "ClassOptions", "travelClassOptions", "TravelClassOptions"],
    []
  );
  const classOptions = Array.isArray(classOptionsRaw)
    ? classOptionsRaw
        .map((option) => normalizeFlightClassOption(option))
        .filter((option) => option.travelClass)
    : [];
  const selectedTravelClass = String(
    pickFirst(
      record,
      ["selectedTravelClass", "SelectedTravelClass", "travelClass", "TravelClass"],
      classOptions[0]?.travelClass || ""
    ) || ""
  ).trim();

  const selectedOption =
    classOptions.find((option) => option.travelClass === selectedTravelClass) ||
    classOptions[0] ||
    null;

  const seatsFromOptions = classOptions.reduce(
    (sum, option) => sum + Number(option.availableSeats || 0),
    0
  );

  const supportedTravelClassesRaw = pickFirst(
    record,
    ["supportedTravelClasses", "SupportedTravelClasses"],
    []
  );
  const supportedTravelClasses = Array.isArray(supportedTravelClassesRaw)
    ? supportedTravelClassesRaw.map((value) => String(value || "").trim()).filter(Boolean)
    : classOptions.map((option) => option.travelClass);

  return {
    id:
      pickFirst(record, ["id", "Id", "flightId", "FlightId"], null) ||
      `flight-${index + 1}`,
    airline: String(
      pickFirst(
        record,
        ["airline", "Airline", "airlineName", "AirlineName", "providerName", "ProviderName"],
        "Unknown Airline"
      ) || "Unknown Airline"
    ),
    flightNumber: String(
      pickFirst(record, ["flightNumber", "FlightNumber", "tripNumber", "TripNumber"], "--") ||
        "--"
    ),
    cabinClass: String(pickFirst(record, ["cabinClass", "CabinClass"], "") || ""),
    fromCity: String(pickFirst(record, ["fromCity", "FromCity", "source", "Source"], "") || ""),
    toCity: String(
      pickFirst(record, ["toCity", "ToCity", "destination", "Destination"], "") || ""
    ),
    departureTimeIst: pickFirst(
      record,
      ["departureTimeIst", "DepartureTimeIst", "departureDateTimeIst", "DepartureDateTimeIst"],
      null
    ),
    arrivalTimeIst: pickFirst(
      record,
      ["arrivalTimeIst", "ArrivalTimeIst", "arrivalDateTimeIst", "ArrivalDateTimeIst"],
      null
    ),
    departureTimeUtc: pickFirst(
      record,
      ["departureTimeUtc", "DepartureTimeUtc", "departureDateTimeUtc", "DepartureDateTimeUtc"],
      null
    ),
    arrivalTimeUtc: pickFirst(
      record,
      ["arrivalTimeUtc", "ArrivalTimeUtc", "arrivalDateTimeUtc", "ArrivalDateTimeUtc"],
      null
    ),
    classOptions,
    selectedTravelClass:
      selectedTravelClass || selectedOption?.travelClass || "Economy",
    selectedTravelClassPriceInr:
      Number(
        pickFirst(record, ["selectedTravelClassPriceInr", "SelectedTravelClassPriceInr"], null)
      ) ||
      Number(selectedOption?.priceInr || 0),
    selectedTravelClassAvailableSeats:
      Number(
        pickFirst(
          record,
          ["selectedTravelClassAvailableSeats", "SelectedTravelClassAvailableSeats"],
          null
        )
      ) ||
      Number(selectedOption?.availableSeats || 0),
    selectedTravelClassTotalSeats:
      Number(
        pickFirst(
          record,
          ["selectedTravelClassTotalSeats", "SelectedTravelClassTotalSeats"],
          null
        )
      ) ||
      Number(selectedOption?.totalSeats || 0),
    totalAvailableSeats:
      Number(pickFirst(record, ["totalAvailableSeats", "TotalAvailableSeats"], null)) ||
      seatsFromOptions,
    totalSeats:
      Number(pickFirst(record, ["totalSeats", "TotalSeats"], null)) ||
      Number(pickFirst(record, ["totalAvailableSeats", "TotalAvailableSeats"], null)) ||
      seatsFromOptions,
    supportedTravelClasses,
  };
}

function normalizeFlightPassenger(passenger, index = 0) {
  return {
    fullName: String(
      pickFirst(passenger, ["fullName", "FullName", "name", "Name"], `Passenger ${index + 1}`)
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
    ? passengersRaw.map((passenger, index) => normalizeFlightPassenger(passenger, index))
    : [];
  const seatsBookedFallback = passengers.filter(
    (passenger) => String(passenger.passengerType || "").toLowerCase() !== "infant"
  ).length;

  return {
    bookingId: pickFirst(record, ["bookingId", "BookingId"], null),
    bookingReference: String(
      pickFirst(record, ["bookingReference", "BookingReference"], "") || ""
    ),
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
      pickFirst(record, ["providerName", "ProviderName", "airline", "Airline"], "") || ""
    ),
    departureTimeUtc: pickFirst(
      record,
      ["departureTimeUtc", "DepartureTimeUtc", "departureDateTimeUtc", "DepartureDateTimeUtc"],
      null
    ),
    travelClass: String(
      pickFirst(record, ["travelClass", "TravelClass"], "") || ""
    ),
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
      pickFirst(record, ["tripNumber", "TripNumber", "flightNumber", "FlightNumber"], "") ||
        ""
    ),
    passengers,
  };
}

function normalizeFlightActionResponse(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  return {
    ...response,
    bookingId: pickFirst(response, ["bookingId", "BookingId"], response.bookingId),
    bookingReference: pickFirst(
      response,
      ["bookingReference", "BookingReference"],
      response.bookingReference
    ),
    status: pickFirst(response, ["status", "Status"], response.status),
    message: pickFirst(response, ["message", "Message"], response.message),
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

    // ngrok / express error pages may return HTML with a <pre> message.
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

async function requestJson(urlOrPath, options = {}) {
  const { userId, requireUserId, ...fetchOptions } = options;
  const resolvedUserId = requireUserId
    ? resolveRequiredUserId(userId)
    : resolveCurrentUserId(userId);
  const resolvedToken = resolveAuthToken();
  const headers = {
    Accept: "application/json",
    ...(resolvedUserId ? { "X-User-Id": resolvedUserId } : {}),
    ...(resolvedToken && !options?.headers?.Authorization
      ? { Authorization: `Bearer ${resolvedToken}` }
      : {}),
    ...(options.headers || {}),
  };

  if (fetchOptions.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (shouldUseNgrokBypass(urlOrPath)) {
    headers["ngrok-skip-browser-warning"] = "true";
  }

  const response = await fetch(toAbsoluteUrl(urlOrPath), {
    ...fetchOptions,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const normalizedMessage = normalizeErrorMessage(payload);
    if (normalizedMessage) {
      throw new Error(normalizedMessage);
    }

    throw new Error("Request failed. Please try again.");
  }

  return payload;
}

export async function searchFlights({ from, to, date, travelClass }) {
  const url = buildUrl(FLIGHT_BOOKINGS_ROOT, {
    from,
    fromCity: from,
    to,
    toCity: to,
    date,
    class: travelClass,
    travelClass,
  });

  try {
    const data = await requestJson(url, { method: "GET" });

    if (Array.isArray(data)) {
      return data.map((record, index) => normalizeFlightSearchRecord(record, index));
    }

    const responseText = String(data || "").toLowerCase();
    if (
      responseText.includes("<!doctype html") ||
      responseText.includes("<html") ||
      responseText.includes("cannot get /api/flightbookings")
    ) {
      throw new Error(
        "Flight API returned an unexpected HTML response. Check backend/proxy configuration."
      );
    }

    return [];
  } catch (error) {
    throw error;
  }
}

export async function bookFlight({ flightId, payload, userId } = {}) {
  const data = await requestJson(`${FLIGHT_BOOKINGS_ROOT}/${flightId}/book`, {
    method: "POST",
    body: JSON.stringify(payload),
    userId,
    requireUserId: true,
  });

  return normalizeFlightActionResponse(data);
}

export async function listFlightBookings({ passengerPhone, status, userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/bookings`, {
    passengerPhone,
    status,
  });

  try {
    const data = await requestJson(url, { method: "GET", userId, requireUserId: true });
    return Array.isArray(data)
      ? data.map((record) => normalizeFlightBookingRecord(record))
      : [];
  } catch (error) {
    throw error;
  }
}

export async function getFlightBookingById(bookingId, { userId } = {}) {
  const data = await requestJson(`${FLIGHT_BOOKINGS_ROOT}/bookings/${bookingId}`, {
    method: "GET",
    userId,
    requireUserId: true,
  });

  return normalizeFlightBookingRecord(data);
}

export async function cancelFlightBooking(bookingId, reason, { userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/bookings/${bookingId}/cancel`, {
    reason,
  });

  const data = await requestJson(url, { method: "POST", userId, requireUserId: true });
  return normalizeFlightActionResponse(data);
}

export async function listHotFlightRoutes({ metric = "score" } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/hot-routes`, { metric });
  const data = await requestJson(url, { method: "GET" });

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((record, index) => ({
    routeId:
      pickFirst(record, ["routeId", "RouteId"], null) || `flight-hot-${index + 1}`,
    fromCity: String(
      pickFirst(record, ["fromCity", "FromCity", "source", "Source"], "") || ""
    ),
    toCity: String(
      pickFirst(record, ["toCity", "ToCity", "destination", "Destination"], "") || ""
    ),
    score: Number(pickFirst(record, ["score", "Score"], 0)) || 0,
    searchCount: Number(pickFirst(record, ["searchCount", "SearchCount"], 0)) || 0,
    bookingCount:
      Number(pickFirst(record, ["bookingCount", "BookingCount"], 0)) || 0,
    ...record,
  }));
}

export async function getFlightSeatMap(flightId, travelClass, { userId } = {}) {
  const url = buildUrl(`${FLIGHT_BOOKINGS_ROOT}/${flightId}/seats`, {
    travelClass,
  });

  return requestJson(url, { method: "GET", userId });
}
