
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  CheckCircle2,
  Filter,
  Loader2,
  Moon,
  Search,
  ShieldAlert,
  Sun,
  Sunrise,
  Sunset,
  XCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import busLoadingVideo from "../IMAGES/busloading.mp4";
import { searchBuses } from "../api/busBookingsApi";
import "./BusSearchResults.css";

const USE_DIRECT_API_IN_DEV =
  String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() ===
  "true";
const IS_LOCAL_DEV =
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
const PLACES_API_URL =
  IS_LOCAL_DEV && !USE_DIRECT_API_IN_DEV
    ? "/api/Places"
    : process.env.REACT_APP_PLACES_API_URL || "/api/Places";
const FALLBACK_CITIES = [
  "Hyderabad",
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Pune",
  "Vijayawada",
  "Visakhapatnam",
  "Delhi",
  "Kolkata",
  "Ahmedabad",
];

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const TIME_WINDOWS = [
  { key: "morning", label: "6am to 12pm", min: 6, max: 12, icon: Sunrise },
  { key: "afternoon", label: "12pm to 6pm", min: 12, max: 18, icon: Sun },
  { key: "evening", label: "6pm to 12am", min: 18, max: 24, icon: Sunset },
  { key: "night", label: "12am to 6am", min: 0, max: 6, icon: Moon },
];

const SORT_OPTIONS = [
  { key: "departure", label: "Departure" },
  { key: "duration", label: "Duration" },
  { key: "arrival", label: "Arrival" },
  { key: "fare", label: "Fare" },
  { key: "seats", label: "Seats Available" },
];

const BUS_TYPE_FILTERS = [
  { key: "ac", label: "AC" },
  { key: "nonac", label: "Non AC" },
  { key: "seater", label: "Seater" },
  { key: "sleeper", label: "Sleeper" },
];

const DEFAULT_BUS_TYPES = {
  ac: true,
  nonac: true,
  seater: true,
  sleeper: true,
};

function readValue(params, state, key) {
  const queryValue = params.get(key);

  if (typeof queryValue === "string" && queryValue.trim()) {
    return queryValue.trim();
  }

  const stateValue = state?.[key];
  return typeof stateValue === "string" ? stateValue.trim() : "";
}

function parseDateInput(value) {
  const [year, month, day] = String(value || "")
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  return new Date(year, month - 1, day);
}

function formatDateInput(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

function parseTimeValue(dateString) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(date) {
  if (!date) {
    return "--:--";
  }

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function formatShortDate(date) {
  if (!date) {
    return "-- ---";
  }

  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]}`;
}

function formatLongDate(date) {
  if (!date) {
    return "--";
  }

  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS[date.getMonth()]} ${
    date.getFullYear()
  }`;
}

function formatDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    return "--";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h : ${minutes}m`;
}

function formatCurrency(value) {
  const numeric = Number(value) || 0;

  if (Number.isInteger(numeric)) {
    return `INR ${new Intl.NumberFormat("en-IN").format(numeric)}`;
  }

  return `INR ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numeric)}`;
}

function hourInWindow(hour, window) {
  if (window.min < window.max) {
    return hour >= window.min && hour < window.max;
  }

  return hour >= window.min || hour < window.max;
}

function getBusTags(busType) {
  const normalized = String(busType || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  const hasNonAc = /\bnon[-\s]?a\/?c\b|\bnon[-\s]?ac\b/.test(normalized);
  const hasAc = /\ba\/?c\b|\bac\b/.test(normalized);

  return {
    ac: hasAc && !hasNonAc,
    nonac: hasNonAc,
    seater: normalized.includes("seater"),
    sleeper: normalized.includes("sleeper"),
  };
}

function getDurationInMinutes(bus) {
  const departureUtc = parseTimeValue(bus.departureTimeUtc);
  const arrivalUtc = parseTimeValue(bus.arrivalTimeUtc);

  if (departureUtc && arrivalUtc) {
    const minutes = Math.round((arrivalUtc - departureUtc) / 60000);
    if (minutes >= 0) {
      return minutes;
    }
  }

  const departureIst = parseTimeValue(bus.departureTimeIst);
  const arrivalIst = parseTimeValue(bus.arrivalTimeIst);

  if (!departureIst || !arrivalIst) {
    return null;
  }

  let minutes = Math.round((arrivalIst - departureIst) / 60000);
  if (minutes < 0) {
    minutes += 24 * 60;
  }

  return minutes;
}

function createToggleMap(items, previous = {}) {
  const next = {};

  items.forEach((item) => {
    next[item] = previous[item] ?? true;
  });

  return next;
}

function ModifyPlaceAutocomplete({
  label,
  value,
  onChange,
  tripType,
  field,
  placeholder,
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const requestAbortRef = useRef(null);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const query = inputValue.trim();

    if (!open || query.length === 0) {
      setResults([]);
      setLoading(false);

      if (requestAbortRef.current) {
        requestAbortRef.current.abort();
      }

      return;
    }

    const controller = new AbortController();

    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
    }

    requestAbortRef.current = controller;

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const endpoint = new URL(PLACES_API_URL, window.location.origin);
        endpoint.searchParams.set("query", query);
        endpoint.searchParams.set("tripType", tripType);
        endpoint.searchParams.set("field", field);
        endpoint.searchParams.set("limit", "20");

        const needsNgrokBypass =
          endpoint.hostname.includes("ngrok-free.dev") ||
          endpoint.hostname.includes("ngrok.io");

        const response = await fetch(endpoint.toString(), {
          signal: controller.signal,
          headers: needsNgrokBypass
            ? { "ngrok-skip-browser-warning": "true" }
            : undefined,
        });

        if (!response.ok) {
          throw new Error(`Place API failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rawList = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.value)
            ? payload.value
            : [];

        const normalized = rawList
          .map((item) => ({
            cityName: typeof item === "string" ? item : item?.cityName || "",
            usageCount:
              typeof item === "object" && item?.usageCount
                ? item.usageCount
                : 0,
          }))
          .filter((item) => item.cityName);

        setResults(normalized);
      } catch (error) {
        if (error.name !== "AbortError") {
          const normalizedQuery = query.toLowerCase();
          const fallbackMatches = FALLBACK_CITIES.filter((city) =>
            city.toLowerCase().includes(normalizedQuery)
          ).map((cityName, index) => ({
            cityName,
            usageCount: 100 - index,
          }));

          setResults(fallbackMatches);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [field, inputValue, open, tripType]);

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onChange(nextValue);
    setOpen(nextValue.trim().length > 0);
  };

  const handleSelect = (cityName) => {
    setInputValue(cityName);
    onChange(cityName);
    setOpen(false);
  };

  return (
    <label className="bus-modify-field bus-modify-place" ref={wrapperRef}>
      <span>{label}</span>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(inputValue.trim().length > 0)}
        className="bus-modify-place-input"
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (
        <div className="bus-place-dropdown">
          {loading ? (
            <div className="bus-place-meta">Searching places...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <button
                key={`${item.cityName}-${item.usageCount}`}
                type="button"
                className="bus-place-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(item.cityName)}
              >
                {item.cityName}
              </button>
            ))
          ) : (
            <div className="bus-place-meta">No matching places found</div>
          )}
        </div>
      )}
    </label>
  );
}

export default function BusSearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const state = location.state || {};

  const initialSourceName = readValue(params, state, "source") || "Hyderabad";
  const initialDestinationName =
    readValue(params, state, "destination") || "Vijayawada";
  const initialDepartureDateInput =
    readValue(params, state, "departureDate") ||
    new Date().toISOString().slice(0, 10);
  const initialTripType = readValue(params, state, "tripType") || "oneway";

  const [sourceName, setSourceName] = useState(initialSourceName);
  const [destinationName, setDestinationName] = useState(initialDestinationName);
  const [tripType, setTripType] = useState(initialTripType);
  const [isModifySearchOpen, setIsModifySearchOpen] = useState(false);
  const [modifyForm, setModifyForm] = useState({
    source: initialSourceName,
    destination: initialDestinationName,
    departureDate: initialDepartureDateInput,
    tripType: initialTripType,
  });

  const [selectedDate, setSelectedDate] = useState(() =>
    parseDateInput(initialDepartureDateInput)
  );
  const [searchVersion, setSearchVersion] = useState(0);
  const [apiBuses, setApiBuses] = useState([]);
  const [isLoadingBuses, setIsLoadingBuses] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [sortBy, setSortBy] = useState("departure");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [busTypeFilters, setBusTypeFilters] = useState(DEFAULT_BUS_TYPES);
  const [departureWindows, setDepartureWindows] = useState(() => ({
    morning: true,
    afternoon: true,
    evening: true,
    night: true,
  }));
  const [arrivalWindows, setArrivalWindows] = useState(() => ({
    morning: true,
    afternoon: true,
    evening: true,
    night: true,
  }));
  const [boardingFilters, setBoardingFilters] = useState({});
  const [droppingFilters, setDroppingFilters] = useState({});
  const [travelFilters, setTravelFilters] = useState({});
  const [boardingSearchText, setBoardingSearchText] = useState("");
  const [droppingSearchText, setDroppingSearchText] = useState("");
  const [travelSearchText, setTravelSearchText] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const [seatLoadingBusId, setSeatLoadingBusId] = useState(null);
  const seatLoadingTimerRef = useRef(null);
  const loadingVideoRef = useRef(null);

  useEffect(() => {
    setSourceName(initialSourceName);
    setDestinationName(initialDestinationName);
    setTripType(initialTripType);
    setSelectedDate(parseDateInput(initialDepartureDateInput));
    setModifyForm({
      source: initialSourceName,
      destination: initialDestinationName,
      departureDate: initialDepartureDateInput,
      tripType: initialTripType,
    });
  }, [
    initialSourceName,
    initialDestinationName,
    initialTripType,
    initialDepartureDateInput,
  ]);

  useEffect(
    () => () => {
      if (seatLoadingTimerRef.current) {
        window.clearTimeout(seatLoadingTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    let isCurrent = true;

    async function runSearch() {
      const startedAt = Date.now();
      setIsLoadingBuses(true);
      setSearchError("");

      try {
        const result = await searchBuses({
          from: sourceName,
          to: destinationName,
          date: formatDateInput(selectedDate),
        });

        if (!isCurrent) {
          return;
        }

        setApiBuses(result);
        setExpandedCard(null);
      } catch (error) {
        if (isCurrent) {
          setApiBuses([]);
          setSearchError(error.message || "Unable to load buses right now.");
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = 3500 - elapsed;
        if (remaining > 0 && isCurrent) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        if (isCurrent) {
          setIsLoadingBuses(false);
        }
      }
    }

    runSearch();
    return () => {
      isCurrent = false;
    };
  }, [sourceName, destinationName, selectedDate, searchVersion]);

  const buses = useMemo(
    () =>
      apiBuses.map((bus) => {
        const departureDate =
          parseTimeValue(bus.departureTimeIst) || parseTimeValue(bus.departureTimeUtc);
        const arrivalDate =
          parseTimeValue(bus.arrivalTimeIst) || parseTimeValue(bus.arrivalTimeUtc);
        const durationMinutes = getDurationInMinutes(bus);

        return {
          id: bus.id,
          busNumber: bus.busNumber || "--",
          operatorName: bus.operatorName || "Unknown Travels",
          busType: bus.busType || "Bus Service",
          fromCity: bus.fromCity || sourceName,
          toCity: bus.toCity || destinationName,
          boardingPoint: bus.boardingPoint || sourceName,
          droppingPoint: bus.droppingPoint || destinationName,
          departureDate: departureDate || selectedDate,
          arrivalDate: arrivalDate || selectedDate,
          departureHour: departureDate ? departureDate.getHours() : 0,
          arrivalHour: arrivalDate ? arrivalDate.getHours() : 0,
          departureSortValue: departureDate
            ? departureDate.getHours() * 60 + departureDate.getMinutes()
            : 0,
          arrivalSortValue: arrivalDate
            ? arrivalDate.getHours() * 60 + arrivalDate.getMinutes()
            : 0,
          departureTime: formatTime(departureDate),
          arrivalTime: formatTime(arrivalDate),
          durationMinutes: durationMinutes ?? 0,
          duration: formatDuration(durationMinutes),
          fare: Number(bus.priceInr) || 0,
          availableSeats: Number(bus.availableSeats) || 0,
          totalSeats: Number(bus.totalSeats) || 0,
          tags: getBusTags(bus.busType),
        };
      }),
    [apiBuses, sourceName, destinationName, selectedDate]
  );

  const minFare = useMemo(
    () => (buses.length === 0 ? 0 : Math.min(...buses.map((bus) => bus.fare))),
    [buses]
  );

  const maxFare = useMemo(
    () => (buses.length === 0 ? 0 : Math.max(...buses.map((bus) => bus.fare))),
    [buses]
  );

  useEffect(() => {
    setPriceMin(minFare);
    setPriceMax(maxFare);
  }, [minFare, maxFare]);

  const boardingList = useMemo(
    () => Array.from(new Set(buses.map((bus) => bus.boardingPoint))).sort(),
    [buses]
  );
  const droppingList = useMemo(
    () => Array.from(new Set(buses.map((bus) => bus.droppingPoint))).sort(),
    [buses]
  );
  const travelList = useMemo(
    () => Array.from(new Set(buses.map((bus) => bus.operatorName))).sort(),
    [buses]
  );

  useEffect(() => {
    setBoardingFilters((previous) => createToggleMap(boardingList, previous));
  }, [boardingList]);

  useEffect(() => {
    setDroppingFilters((previous) => createToggleMap(droppingList, previous));
  }, [droppingList]);

  useEffect(() => {
    setTravelFilters((previous) => createToggleMap(travelList, previous));
  }, [travelList]);

  const filteredBuses = useMemo(() => {
    const activeTypes = Object.keys(busTypeFilters).filter((key) => busTypeFilters[key]);
    const activeBoarding = Object.keys(boardingFilters).filter((key) => boardingFilters[key]);
    const activeDropping = Object.keys(droppingFilters).filter((key) => droppingFilters[key]);
    const activeTravels = Object.keys(travelFilters).filter((key) => travelFilters[key]);
    const hasActiveDepartureWindow = TIME_WINDOWS.some(
      (window) => departureWindows[window.key]
    );
    const hasActiveArrivalWindow = TIME_WINDOWS.some((window) => arrivalWindows[window.key]);

    const result = buses.filter((bus) => {
      if (bus.fare < priceMin || bus.fare > priceMax) {
        return false;
      }

      const hasKnownBusType = Object.values(bus.tags || {}).some(Boolean);
      if (
        activeTypes.length > 0 &&
        hasKnownBusType &&
        !activeTypes.some((typeKey) => bus.tags[typeKey])
      ) {
        return false;
      }

      if (hasActiveDepartureWindow) {
        const departureMatch = TIME_WINDOWS.some((window) => {
          if (!departureWindows[window.key]) {
            return false;
          }
          return hourInWindow(bus.departureHour, window);
        });

        if (!departureMatch) {
          return false;
        }
      }

      if (hasActiveArrivalWindow) {
        const arrivalMatch = TIME_WINDOWS.some((window) => {
          if (!arrivalWindows[window.key]) {
            return false;
          }
          return hourInWindow(bus.arrivalHour, window);
        });

        if (!arrivalMatch) {
          return false;
        }
      }

      if (activeBoarding.length > 0 && !activeBoarding.includes(bus.boardingPoint)) {
        return false;
      }

      if (activeDropping.length > 0 && !activeDropping.includes(bus.droppingPoint)) {
        return false;
      }

      if (activeTravels.length > 0 && !activeTravels.includes(bus.operatorName)) {
        return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "duration") {
        return a.durationMinutes - b.durationMinutes;
      }

      if (sortBy === "arrival") {
        return a.arrivalSortValue - b.arrivalSortValue;
      }

      if (sortBy === "fare") {
        return a.fare - b.fare;
      }

      if (sortBy === "seats") {
        return b.availableSeats - a.availableSeats;
      }

      return a.departureSortValue - b.departureSortValue;
    });
  }, [
    buses,
    busTypeFilters,
    boardingFilters,
    droppingFilters,
    travelFilters,
    priceMin,
    priceMax,
    departureWindows,
    arrivalWindows,
    sortBy,
  ]);

  const visibleBoarding = useMemo(() => {
    const query = boardingSearchText.trim().toLowerCase();
    return query
      ? boardingList.filter((item) => item.toLowerCase().includes(query))
      : boardingList;
  }, [boardingList, boardingSearchText]);

  const visibleDropping = useMemo(() => {
    const query = droppingSearchText.trim().toLowerCase();
    return query
      ? droppingList.filter((item) => item.toLowerCase().includes(query))
      : droppingList;
  }, [droppingList, droppingSearchText]);

  const visibleTravels = useMemo(() => {
    const query = travelSearchText.trim().toLowerCase();
    return query
      ? travelList.filter((item) => item.toLowerCase().includes(query))
      : travelList;
  }, [travelList, travelSearchText]);

  const tripLabel = tripType === "twoway" ? "Round Trip" : "One Way";
  const loadingSearchDetails = [
    { id: "from", label: "From", value: sourceName },
    { id: "to", label: "To", value: destinationName },
    { id: "date", label: "Departure Date", value: formatLongDate(selectedDate) },
    { id: "trip", label: "Trip Type", value: tripLabel },
    { id: "fare-scan", label: "Fare Scan", value: "Checking best operator fares" },
    { id: "seat-sync", label: "Seat Sync", value: "Syncing latest seat availability" },
  ];

  const applyLoadingVideoSpeed = (videoElement) => {
    if (!videoElement) {
      return;
    }

    videoElement.playbackRate = 1.45;
  };

  const openDatePicker = (event) => {
    try {
      if (typeof event.currentTarget.showPicker === "function") {
        event.currentTarget.showPicker();
      }
    } catch {
      // Ignore browser picker access failures.
    }
  };

  const toggleModifySearch = () => {
    setModifyForm({
      source: sourceName,
      destination: destinationName,
      departureDate: formatDateInput(selectedDate),
      tripType,
    });
    setIsModifySearchOpen((previous) => !previous);
  };

  const handleSwapModifyCities = () => {
    setModifyForm((previous) => ({
      ...previous,
      source: previous.destination,
      destination: previous.source,
    }));
  };

  const handleApplyModifySearch = () => {
    const nextSource = modifyForm.source.trim();
    const nextDestination = modifyForm.destination.trim();
    const nextDateInput = modifyForm.departureDate || formatDateInput(selectedDate);
    const nextTripType = modifyForm.tripType || "oneway";

    if (!nextSource || !nextDestination) {
      setSearchError("Source and destination are required to update search.");
      return;
    }

    setSearchError("");
    setActionMessage("");
    setSourceName(nextSource);
    setDestinationName(nextDestination);
    setTripType(nextTripType);
    setSelectedDate(parseDateInput(nextDateInput));
    setSearchVersion((previous) => previous + 1);
    setIsModifySearchOpen(false);

    const nextParams = new URLSearchParams(location.search);
    nextParams.set("source", nextSource);
    nextParams.set("destination", nextDestination);
    nextParams.set("departureDate", nextDateInput);
    nextParams.set("tripType", nextTripType);

    navigate(
      `${location.pathname}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`,
      {
        replace: true,
        state: {
          ...state,
          source: nextSource,
          destination: nextDestination,
          departureDate: nextDateInput,
          tripType: nextTripType,
        },
      }
    );
  };

  const toggleSimpleFilter = (setter, key) => {
    setter((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const resetFilters = () => {
    setPriceMin(minFare);
    setPriceMax(maxFare);
    setBusTypeFilters(DEFAULT_BUS_TYPES);
    setDepartureWindows({ morning: true, afternoon: true, evening: true, night: true });
    setArrivalWindows({ morning: true, afternoon: true, evening: true, night: true });
    setBoardingFilters(createToggleMap(boardingList));
    setDroppingFilters(createToggleMap(droppingList));
    setTravelFilters(createToggleMap(travelList));
    setBoardingSearchText("");
    setDroppingSearchText("");
    setTravelSearchText("");
    setSortBy("departure");
  };

  const openDetailCard = (busId, panel) => {
    setExpandedCard((previous) => {
      if (previous && previous.busId === busId && previous.panel === panel) {
        return null;
      }
      return { busId, panel };
    });
  };

  const openBooking = (bus) => {
    if (seatLoadingBusId || bus.availableSeats <= 0) {
      return;
    }

    if (seatLoadingTimerRef.current) {
      window.clearTimeout(seatLoadingTimerRef.current);
      seatLoadingTimerRef.current = null;
    }

    setActionMessage("");
    setSeatLoadingBusId(bus.id);

    const searchContext = {
      source: sourceName,
      destination: destinationName,
      departureDate: formatDateInput(selectedDate),
      tripType,
    };

    seatLoadingTimerRef.current = window.setTimeout(() => {
      navigate("/bus/seats", {
        state: {
          bus,
          searchContext,
        },
      });

      setSeatLoadingBusId(null);
      seatLoadingTimerRef.current = null;
    }, 1100);
  };

  const priceRangeMinPercent =
    maxFare === minFare ? 0 : ((priceMin - minFare) / (maxFare - minFare)) * 100;
  const priceRangeMaxPercent =
    maxFare === minFare ? 0 : ((priceMax - minFare) / (maxFare - minFare)) * 100;
  const priceRangeStyle = {
    "--range-min": `${Math.max(0, Math.min(100, priceRangeMinPercent))}%`,
    "--range-max": `${Math.max(0, Math.min(100, priceRangeMaxPercent))}%`,
  };

  return (
    <main className="bus-results-page">
      <div className="bus-results-shell">
        <section className="bus-search-summary">
          <article className="route-part route-source">
            <span>From</span>
            <strong>{sourceName}</strong>
          </article>

          <div className="route-switch-icon" aria-hidden="true">
            <ArrowLeftRight size={16} />
          </div>

          <article className="route-part route-destination">
            <span>To</span>
            <strong>{destinationName}</strong>
          </article>

          <article className="route-part route-date">
            <span>Date</span>
            <strong>{formatLongDate(selectedDate)}</strong>
          </article>

          <button
            type="button"
            className="bus-modify-btn"
            onClick={toggleModifySearch}
          >
            Modify Search
          </button>
        </section>

        {isModifySearchOpen && (
          <section className="bus-modify-search-panel">
            <div className="bus-modify-grid">
              <ModifyPlaceAutocomplete
                label="Source"
                value={modifyForm.source}
                onChange={(nextValue) =>
                  setModifyForm((previous) => ({
                    ...previous,
                    source: nextValue,
                  }))
                }
                tripType="bus"
                field="from"
                placeholder="Type source city"
              />

              <button
                type="button"
                className="bus-modify-swap"
                onClick={handleSwapModifyCities}
                aria-label="Swap source and destination"
              >
                <ArrowLeftRight size={16} />
              </button>

              <ModifyPlaceAutocomplete
                label="Destination"
                value={modifyForm.destination}
                onChange={(nextValue) =>
                  setModifyForm((previous) => ({
                    ...previous,
                    destination: nextValue,
                  }))
                }
                tripType="bus"
                field="to"
                placeholder="Type destination city"
              />

              <label className="bus-modify-field">
                <span>Departure Date</span>
                <input
                  type="date"
                  value={modifyForm.departureDate}
                  onClick={openDatePicker}
                  onChange={(event) =>
                    setModifyForm((previous) => ({
                      ...previous,
                      departureDate: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="bus-modify-field">
                <span>Trip Type</span>
                <select
                  value={modifyForm.tripType}
                  onChange={(event) =>
                    setModifyForm((previous) => ({
                      ...previous,
                      tripType: event.target.value,
                    }))
                  }
                >
                  <option value="oneway">One Way</option>
                  <option value="twoway">Two Way</option>
                </select>
              </label>
            </div>

            <div className="bus-modify-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setIsModifySearchOpen(false)}
              >
                Close
              </button>
              <button type="button" className="primary" onClick={handleApplyModifySearch}>
                Apply Search
              </button>
            </div>
          </section>
        )}

        {searchError && (
          <div className="bus-feedback error">
            <XCircle size={16} />
            <span>{searchError}</span>
          </div>
        )}

        {actionMessage && (
          <div className="bus-feedback success">
            <CheckCircle2 size={16} />
            <span>{actionMessage}</span>
          </div>
        )}

        {isLoadingBuses ? (
          <section className="bus-loading-screen" aria-live="polite" aria-busy="true">
            <article className="bus-loading-media-card">
              <div className="bus-loading-status-chip">
                <Loader2 size={15} className="spin" />
                <span>Finding buses for your trip</span>
              </div>
              <video
                ref={loadingVideoRef}
                className="bus-loading-video"
                src={busLoadingVideo}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                onLoadedMetadata={(event) => applyLoadingVideoSpeed(event.currentTarget)}
                onPlay={(event) => applyLoadingVideoSpeed(event.currentTarget)}
              />
            </article>

            <div className="bus-loading-copy">
              <h3>Checking top operators and live fares</h3>
              <p>
                Pulling real-time route options and seat inventory. Results will appear in
                a moment.
              </p>
              <div className="bus-loading-progress" aria-hidden="true">
                <span />
              </div>
            </div>

            <section className="bus-loading-search-details">
              {loadingSearchDetails.map((detail) => (
                <article key={detail.id} className="bus-loading-detail-card">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </article>
              ))}
            </section>
          </section>
        ) : (
          <div className="bus-results-layout">
            <aside className="bus-filters-rail">
              <header className="bus-filters-header">
                <div>
                  <Filter size={14} />
                  <span>Filters</span>
                </div>
                <button type="button" onClick={resetFilters}>
                  Reset
                </button>
              </header>

              <section className="bus-filter-card">
                <h3>INR Price Range</h3>
                <div className="bus-range-head">
                  <span>{formatCurrency(priceMin)}</span>
                  <span>{formatCurrency(priceMax)}</span>
                </div>
                <div className="bus-range-stack" style={priceRangeStyle}>
                  <div className="bus-range-track" aria-hidden="true" />
                  <input
                    type="range"
                    min={minFare}
                    max={maxFare}
                    value={priceMin}
                    disabled={minFare === maxFare}
                    onChange={(event) =>
                      setPriceMin(Math.min(Number(event.target.value), priceMax))
                    }
                  />
                  <input
                    type="range"
                    min={minFare}
                    max={maxFare}
                    value={priceMax}
                    disabled={minFare === maxFare}
                    onChange={(event) =>
                      setPriceMax(Math.max(Number(event.target.value), priceMin))
                    }
                  />
                </div>
              </section>

              <section className="bus-filter-card">
                <h3>Bus Type</h3>
                <div className="bus-type-grid">
                  {BUS_TYPE_FILTERS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`bus-type-chip ${busTypeFilters[item.key] ? "active" : ""}`}
                      onClick={() => toggleSimpleFilter(setBusTypeFilters, item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="bus-filter-card">
                <h3>Departure Time</h3>
                <div className="time-chip-grid">
                  {TIME_WINDOWS.map((window) => (
                    <button
                      key={window.key}
                      type="button"
                      className={`time-chip ${departureWindows[window.key] ? "active" : ""}`}
                      onClick={() => toggleSimpleFilter(setDepartureWindows, window.key)}
                    >
                      <window.icon size={15} />
                      <span>{window.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="bus-filter-card">
                <h3>Arrival Time</h3>
                <div className="time-chip-grid">
                  {TIME_WINDOWS.map((window) => (
                    <button
                      key={window.key}
                      type="button"
                      className={`time-chip ${arrivalWindows[window.key] ? "active" : ""}`}
                      onClick={() => toggleSimpleFilter(setArrivalWindows, window.key)}
                    >
                      <window.icon size={15} />
                      <span>{window.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="bus-filter-card">
                <h3>Boarding Points</h3>
                <div className="point-search">
                  <Search size={14} />
                  <input
                    type="text"
                    value={boardingSearchText}
                    onChange={(event) => setBoardingSearchText(event.target.value)}
                    placeholder="Choose Boarding Point"
                  />
                </div>
                <div className="point-list">
                  {visibleBoarding.map((point) => (
                    <label key={point} className="point-row">
                      <input
                        type="checkbox"
                        checked={Boolean(boardingFilters[point])}
                        onChange={() => toggleSimpleFilter(setBoardingFilters, point)}
                      />
                      <span>{point}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="bus-filter-card">
                <h3>Dropping Point</h3>
                <div className="point-search">
                  <Search size={14} />
                  <input
                    type="text"
                    value={droppingSearchText}
                    onChange={(event) => setDroppingSearchText(event.target.value)}
                    placeholder="Choose Dropping Point"
                  />
                </div>
                <div className="point-list">
                  {visibleDropping.map((point) => (
                    <label key={point} className="point-row">
                      <input
                        type="checkbox"
                        checked={Boolean(droppingFilters[point])}
                        onChange={() => toggleSimpleFilter(setDroppingFilters, point)}
                      />
                      <span>{point}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="bus-filter-card">
                <h3>Travels</h3>
                <div className="point-search">
                  <Search size={14} />
                  <input
                    type="text"
                    value={travelSearchText}
                    onChange={(event) => setTravelSearchText(event.target.value)}
                    placeholder="Choose Travel Name"
                  />
                </div>
                <div className="point-list">
                  {visibleTravels.map((name) => (
                    <label key={name} className="point-row">
                      <input
                        type="checkbox"
                        checked={Boolean(travelFilters[name])}
                        onChange={() => toggleSimpleFilter(setTravelFilters, name)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                </div>
              </section>
            </aside>

            <section className="bus-results-column">
              <header className="bus-sort-strip">
                <div className="bus-found-count">
                  <strong>{filteredBuses.length} Buses</strong> found
                </div>
                <div className="sort-controls">
                  <span>Sort by:</span>
                  <div className="sort-control-list">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={sortBy === option.key ? "active" : ""}
                        onClick={() => setSortBy(option.key)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </header>

              <div className="bus-card-list">
                {filteredBuses.length === 0 ? (
                  <div className="bus-empty-state">
                    <ShieldAlert size={18} />
                    <p>No buses match the selected filters.</p>
                  </div>
                ) : (
                  filteredBuses.map((bus) => (
                    <article className="bus-result-card" key={bus.id}>
                      <div className="bus-operator-cell">
                        <h4>{bus.operatorName}</h4>
                        <p>{bus.busType}</p>
                        <small>Bus No: {bus.busNumber}</small>
                      </div>

                      <div className="bus-depart-cell">
                        <strong>{bus.departureTime}</strong>
                        <span>{formatShortDate(bus.departureDate)}</span>
                        <p>{bus.boardingPoint}</p>
                      </div>

                      <div className="bus-duration-cell">
                        <span>{bus.duration}</span>
                        <div className="duration-dash">
                          <i />
                        </div>
                      </div>

                      <div className="bus-arrive-cell">
                        <strong>{bus.arrivalTime}</strong>
                        <span>{formatShortDate(bus.arrivalDate)}</span>
                        <p>{bus.droppingPoint}</p>
                      </div>

                      <div className="bus-fare-cell">
                        <span>Starts from</span>
                        <strong>{formatCurrency(bus.fare)}</strong>
                      </div>

                      <div className="bus-seat-cell">
                        <strong>{bus.availableSeats} Seats Available</strong>
                        <span>Total {bus.totalSeats}</span>
                      </div>

                      <div className="bus-action-cell">
                        <button
                          type="button"
                          className="subtle"
                          onClick={() => openDetailCard(bus.id, "boarding")}
                        >
                          Boarding & Dropping Points
                        </button>
                        <button
                          type="button"
                          className="subtle"
                          onClick={() => openDetailCard(bus.id, "policy")}
                        >
                          Cancellation Policies
                        </button>
                        <button
                          type="button"
                          className="primary"
                          onClick={() => openBooking(bus)}
                          disabled={bus.availableSeats <= 0 || Boolean(seatLoadingBusId)}
                        >
                          {seatLoadingBusId === bus.id ? (
                            <>
                              <Loader2 size={14} className="spin" />
                              <span>Loading Seats...</span>
                            </>
                          ) : (
                            "View Seats"
                          )}
                        </button>
                      </div>

                      {expandedCard?.busId === bus.id && (
                        <div className="bus-expand-panel">
                          {expandedCard.panel === "boarding" ? (
                            <p>
                              Boarding: <strong>{bus.boardingPoint}</strong> | Dropping:{" "}
                              <strong>{bus.droppingPoint}</strong>
                            </p>
                          ) : (
                            <p>
                              Free cancellation available up to 6 hours before departure.
                              Partial refund may apply afterwards.
                            </p>
                          )}
                        </div>
                      )}

                      {seatLoadingBusId === bus.id && (
                        <div className="bus-seat-loading-panel" aria-live="polite">
                          <div className="bus-seat-loading-bars">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
