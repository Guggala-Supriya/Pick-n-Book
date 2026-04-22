import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Bus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MessageSquareText,
  Minus,
  Plane,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import offer1 from "./IMAGES/offer1.jpg";
import offer2 from "./IMAGES/offer2.jpg";
import offer3 from "./IMAGES/offer3.jfif";
import heroImage from "./IMAGES/hero.jpg";
import flight1 from "./IMAGES/flight1.jpg";
import flight2 from "./IMAGES/flight2.jpg";
import flight3 from "./IMAGES/flight3.jpg";
import flight4 from "./IMAGES/flight4.jpg";
import airIndiaExpress from "./IMAGES/brands/air-india-express.png";
import airIndia from "./IMAGES/brands/air-india.png";
import akasaAir from "./IMAGES/brands/akasa-air.png";
import airAsia from "./IMAGES/brands/airasia.png";
import emirates from "./IMAGES/brands/emirates.png";
import indigo from "./IMAGES/brands/indigo.png";
import lufthansa from "./IMAGES/brands/lufthansa.png";
import qatarAirways from "./IMAGES/brands/qatar-airways.png";
import spiceJet from "./IMAGES/Spicejet.png";
import { POPULAR_RTC_OPERATORS } from "./data/popularBuses";
import SiteFooter from "./Components/SiteFooter";
import "./HomePage.css";

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

const CLASS_OPTIONS = [
  "Economy",
  "Premium Economy",
  "Business",
  "Premium Business",
  "First Class",
];

const FLIGHT_TRIP_TYPES = [
  { value: "oneway", label: "One Way" },
  { value: "twoway", label: "Two Way" },
  { value: "multicity", label: "Multi City" },
];

const BUS_TRIP_TYPES = [
  { value: "oneway", label: "One Way" },
  { value: "twoway", label: "Two Way" },
];

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

const OFFERS = [
  {
    id: "offer-1",
    image: offer1,
    title: "Weekend Wheels Bus Offer",
    description: "Up to 20% instant discount on weekend bus bookings.",
    code: "WEEKEND20",
    bookingType: "bus",
  },
  {
    id: "offer-2",
    image: offer2,
    title: "BusBuddy Flat Fare",
    description: "Get INR 100 flat off on selected AC sleeper routes.",
    code: "FLAT100",
    bookingType: "bus",
  },
  {
    id: "offer-3",
    image: offer3,
    title: "Flight Special Deal",
    description: "Save up to INR 250 on domestic and international fares.",
    code: "SAVE250",
    bookingType: "flight",
  },
  {
    id: "offer-4",
    image: offer1,
    title: "Monsoon Express",
    description: "Book now and unlock 15% fare savings this season.",
    code: "RAIN15",
    bookingType: "bus",
  },
  {
    id: "offer-5",
    image: offer2,
    title: "Festive Flyer",
    description: "Round-trip customers get exclusive festive discounts.",
    code: "FESTIVE9",
    bookingType: "flight",
  },
  {
    id: "offer-6",
    image: offer3,
    title: "Student Saver",
    description: "Students can enjoy lower fares with verified IDs.",
    code: "STUDENT5",
    bookingType: "flight",
  },
  {
    id: "offer-7",
    image: offer1,
    title: "Family Getaway",
    description: "Bundle ticket booking and get cashback on payment.",
    code: "FAMILY25",
    bookingType: "bus",
  },
];

const AD_BANNERS = [
  {
    id: "ad-1",
    image: offer2,
    label: "Sponsored",
    title: "Flash Travel Sale",
    description:
      "Extra savings on selected flights and buses this week. Limited inventory.",
    cta: "Explore Deals",
    bookingType: "flight",
  },
];

const POPULAR_FLIGHTS = [
  {
    id: "flight-1",
    image: flight1,
    route: "Delhi to Mumbai",
    summary: "Multiple daily departures and flexible timings.",
    price: "INR 4,500",
  },
  {
    id: "flight-2",
    image: flight2,
    route: "Delhi to New York",
    summary: "Premium long-haul options with one-stop routes.",
    price: "INR 35,000",
  },
  {
    id: "flight-3",
    image: flight3,
    route: "Delhi to Dubai",
    summary: "Fast visa-friendly routes with top carriers.",
    price: "INR 15,000",
  },
  {
    id: "flight-4",
    image: flight4,
    route: "Kolkata to Patna",
    summary: "Affordable direct routes for frequent travelers.",
    price: "INR 3,500",
  },
  {
    id: "flight-5",
    image: flight1,
    route: "Pune to Chennai",
    summary: "Quick connections with excellent morning slots.",
    price: "INR 5,200",
  },
  {
    id: "flight-6",
    image: flight2,
    route: "Bangalore to Jaipur",
    summary: "Business and economy seats available every day.",
    price: "INR 6,400",
  },
  {
    id: "flight-7",
    image: flight3,
    route: "Hyderabad to Kolkata",
    summary: "Convenient schedules for weekend travel plans.",
    price: "INR 5,900",
  },
  {
    id: "flight-8",
    image: flight4,
    route: "Mumbai to Doha",
    summary: "Competitive fares on popular Gulf routes.",
    price: "INR 18,300",
  },
];

const REVIEWS = [
  {
    id: "review-1",
    type: "Flight Booking",
    comment:
      "Two-way booking flow is smooth and payment confirmation is instant.",
    author: "Rohit M.",
    rating: "4.9/5",
  },
  {
    id: "review-2",
    type: "Bus Booking",
    comment: "Seat layout and boarding point details are clear and accurate.",
    author: "Priya S.",
    rating: "4.8/5",
  },
  {
    id: "review-3",
    type: "Flight Booking",
    comment:
      "I use multicity often and adding legs is quick with no confusion.",
    author: "Karthik R.",
    rating: "4.7/5",
  },
  {
    id: "review-4",
    type: "Bus Booking",
    comment: "Round trip option helped me plan both routes in one screen.",
    author: "Sneha P.",
    rating: "4.8/5",
  },
  {
    id: "review-5",
    type: "Flight Booking",
    comment:
      "Date selector opens instantly and return date handling is perfect.",
    author: "Amit K.",
    rating: "4.9/5",
  },
  {
    id: "review-6",
    type: "Bus Booking",
    comment: "Price filters and route details make intercity planning easy.",
    author: "Neha T.",
    rating: "4.6/5",
  },
];

const AIRLINE_BRANDS = [
  { id: "brand-1", image: indigo, name: "IndiGo", scale: 1.2 },
  { id: "brand-2", image: airIndia, name: "Air India", scale: 1.34 },
  { id: "brand-3", image: airAsia, name: "AirAsia", scale: 1.08 },
  { id: "brand-4", image: akasaAir, name: "Akasa Air", scale: 1.18 },
  { id: "brand-5", image: emirates, name: "Emirates", scale: 1.08 },
  { id: "brand-6", image: qatarAirways, name: "Qatar Airways", scale: 1.16 },
  { id: "brand-7", image: lufthansa, name: "Lufthansa", scale: 1.1 },
  { id: "brand-8", image: spiceJet, name: "SpiceJet", scale: 1.14 },
  {
    id: "brand-9",
    image: airIndiaExpress,
    name: "Air India Express",
    scale: 1.08,
  },
];

const HIGHLIGHTS = [
  {
    id: "highlight-1",
    title: "Why Choose Us?",
    text: "From flights and buses to complete trip planning, we keep bookings simple, pricing transparent, and support available whenever you need help.",
  },
  {
    id: "highlight-2",
    title: "We Believe in the Magic of Travel",
    text: "Every journey should feel smooth and personal. Our platform focuses on fast search, trusted inventory, and confirmation workflows that reduce stress.",
  },
  {
    id: "highlight-3",
    title: "Your Perfect Travel Experience Starts Here",
    text: "Compare options, book quickly, and manage plans in one place. We are built for both quick bookings and detailed multi-city travel itineraries.",
  },
];

const HERO_METRICS = [
  { id: "metric-1", value: "3,200+", label: "Verified Routes" },
  { id: "metric-2", value: "180+", label: "Cities Connected" },
  { id: "metric-3", value: "24/7", label: "Travel Assistance" },
  { id: "metric-4", value: "98.7%", label: "On-Time Confirmations" },
  { id: "metric-5", value: "1.2M+", label: "Tickets Booked" },
];

const HERO_TAGS = [
  { id: "tag-1", label: "Live fares" },
  { id: "tag-2", label: "Instant booking confirmation" },
  { id: "tag-3", label: "Flexible trip combinations" },
];

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function createMultiCityLeg(from, to, offsetDays) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from,
    to,
    departureDate: getDateInputValue(offsetDays),
  };
}

function formatTravellerSummary(adults, children, infants) {
  const parts = [`${adults} Adult${adults > 1 ? "s" : ""}`];

  if (children > 0) {
    parts.push(`${children} Child${children > 1 ? "ren" : ""}`);
  }

  if (infants > 0) {
    parts.push(`${infants} Infant${infants > 1 ? "s" : ""}`);
  }

  return parts.join(", ");
}

function getStaticAiReply(message) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("hi") ||
    normalized.includes("hello") ||
    normalized.includes("hey")
  ) {
    return "Hello. I can help with flights, buses, fares, and booking flow questions.";
  }

  if (
    normalized.includes("flight") ||
    normalized.includes("airline") ||
    normalized.includes("plane")
  ) {
    return "For flights, share source, destination, and dates. I can suggest one-way, round-trip, or multi-city flow.";
  }

  if (
    normalized.includes("bus") ||
    normalized.includes("rtc") ||
    normalized.includes("seat")
  ) {
    return "For buses, tell me your route and travel date. I can guide you to seat selection and payment steps.";
  }

  if (
    normalized.includes("price") ||
    normalized.includes("fare") ||
    normalized.includes("cost") ||
    normalized.includes("offer")
  ) {
    return "You can compare fares from the search results page and use active offers shown in the Featured Offers section.";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("refund") ||
    normalized.includes("reschedule")
  ) {
    return "For cancellation or refunds, go to your bookings section and choose the specific trip to view refund details.";
  }

  return "This is a static AI demo reply. Once your API is connected, I will respond with dynamic answers.";
}

function getInitialAiChatMessages() {
  return [
    {
      id: `ai-welcome-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role: "assistant",
      text: "Hi, I am Travel AI. Ask me anything about flights or buses.",
    },
  ];
}

function AutoMarquee({ items, className, duration, renderItem }) {
  const loopItems = [...items, ...items];

  return (
    <div className={`marquee ${className}`}>
      <div
        className="marquee-track"
        style={{ "--marquee-duration": `${duration}s` }}
      >
        {loopItems.map((item, index) => (
          <div className="marquee-slide" key={`${item.id}-${index}`}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceAutocomplete({
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

    const timer = setTimeout(async () => {
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
            city.toLowerCase().includes(normalizedQuery),
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
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, open, tripType, field]);

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
    <div className="field place-autocomplete" ref={wrapperRef}>
      <label>{label}</label>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setOpen(inputValue.trim().length > 0)}
        className="field-control place-input"
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (
        <div className="place-dropdown">
          {loading ? (
            <div className="place-meta">Searching places...</div>
          ) : results.length > 0 ? (
            results.map((item) => (
              <button
                key={`${item.cityName}-${item.usageCount}`}
                type="button"
                className="place-option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(item.cityName)}
              >
                {item.cityName}
              </button>
            ))
          ) : (
            <div className="place-meta">No matching places found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "buses" ? "buses" : "flights";

  const [activeTab, setActiveTab] = useState(initialTab);

  const [flightTripType, setFlightTripType] = useState("oneway");
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightDepartureDate, setFlightDepartureDate] = useState(() =>
    getDateInputValue(0),
  );
  const [flightReturnDate, setFlightReturnDate] = useState(() =>
    getDateInputValue(3),
  );

  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState("Economy");
  const [showTravellerDropdown, setShowTravellerDropdown] = useState(false);
  const travellerFieldRef = useRef(null);
  const aiChatMessagesRef = useRef(null);
  const aiReplyTimerRef = useRef(null);

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState(
    getInitialAiChatMessages,
  );

  const [multiCityLegs, setMultiCityLegs] = useState(() => [
    createMultiCityLeg("", "", 0),
    createMultiCityLeg("", "", 2),
  ]);

  const [busTripType, setBusTripType] = useState("oneway");
  const [busFrom, setBusFrom] = useState("");
  const [busTo, setBusTo] = useState("");
  const [busDepartureDate, setBusDepartureDate] = useState(() =>
    getDateInputValue(0),
  );
  const [busReturnDate, setBusReturnDate] = useState(() =>
    getDateInputValue(1),
  );

  useEffect(() => {
    const tab = searchParams.get("tab") === "buses" ? "buses" : "flights";
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        travellerFieldRef.current &&
        !travellerFieldRef.current.contains(event.target)
      ) {
        setShowTravellerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    setShowTravellerDropdown(false);
  }, [activeTab, flightTripType]);

  useEffect(() => {
    if (!isAiChatOpen || !aiChatMessagesRef.current) {
      return;
    }

    aiChatMessagesRef.current.scrollTop =
      aiChatMessagesRef.current.scrollHeight;
  }, [isAiChatOpen, aiChatMessages, isAiTyping]);

  useEffect(
    () => () => {
      if (aiReplyTimerRef.current) {
        clearTimeout(aiReplyTimerRef.current);
      }
    },
    [],
  );

  const openDatePicker = (event) => {
    try {
      if (typeof event.currentTarget.showPicker === "function") {
        event.currentTarget.showPicker();
      }
    } catch {
      // showPicker may throw NotAllowedError if browser blocks it without direct gesture.
    }
  };

  const handleSwapFlights = () => {
    setFlightFrom(flightTo);
    setFlightTo(flightFrom);
  };

  const handleBookingTabChange = (nextTab) => {
    const normalizedTab = nextTab === "buses" ? "buses" : "flights";
    setActiveTab(normalizedTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", normalizedTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSwapBuses = () => {
    setBusFrom(busTo);
    setBusTo(busFrom);
  };

  const openPopularBusRoutes = (operatorId) => {
    navigate(`/popular-buses/${operatorId}`);
  };

  const changeAdults = (delta) => {
    setAdults((previous) => {
      const next = Math.min(9, Math.max(1, previous + delta));
      setInfants((previousInfants) => Math.min(previousInfants, next));
      return next;
    });
  };

  const changeChildren = (delta) => {
    setChildren((previous) => Math.min(8, Math.max(0, previous + delta)));
  };

  const changeInfants = (delta) => {
    setInfants((previous) => {
      const candidate = previous + delta;
      return Math.max(0, Math.min(adults, candidate));
    });
  };

  const updateMultiCityLeg = (legId, field, value) => {
    setMultiCityLegs((previousLegs) =>
      previousLegs.map((leg) =>
        leg.id === legId ? { ...leg, [field]: value } : leg,
      ),
    );
  };

  const addMultiCityLeg = () => {
    setMultiCityLegs((previousLegs) => {
      const lastLeg = previousLegs[previousLegs.length - 1];
      const defaultFrom = lastLeg ? lastLeg.to : "";

      return [
        ...previousLegs,
        createMultiCityLeg(defaultFrom, "Mumbai", previousLegs.length + 1),
      ];
    });
  };

  const removeMultiCityLeg = (legId) => {
    setMultiCityLegs((previousLegs) =>
      previousLegs.length === 1
        ? previousLegs
        : previousLegs.filter((leg) => leg.id !== legId),
    );
  };

  const isFlightTwoWay = flightTripType === "twoway";
  const isBusTwoWay = busTripType === "twoway";
  const travellerSummary = formatTravellerSummary(adults, children, infants);

  const navigateToFlightSearch = (flightPayload) => {
    const flightParams = new URLSearchParams();

    Object.entries(flightPayload).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        flightParams.set(key, value.trim());
      }
    });

    navigate(
      `/search/flights${
        flightParams.toString() ? `?${flightParams.toString()}` : ""
      }`,
      { state: flightPayload },
    );
  };

  const navigateToBusSearch = (busPayload) => {
    const busParams = new URLSearchParams();

    Object.entries(busPayload).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        busParams.set(key, value.trim());
      }
    });

    navigate(
      `/search/buses${busParams.toString() ? `?${busParams.toString()}` : ""}`,
      { state: busPayload },
    );
  };

  const handleOfferBooking = (offer) => {
    if (offer.bookingType === "bus") {
      navigateToBusSearch({
        source: "Hyderabad",
        destination: "Vijayawada",
        tripType: "oneway",
        departureDate: getDateInputValue(0),
      });
      return;
    }

    navigateToFlightSearch({
      source: "Delhi",
      destination: "Mumbai",
      tripType: "oneway",
      departureDate: getDateInputValue(0),
      travellers: "1 Adult",
      cabinClass: "Economy",
    });
  };

  const handlePopularFlightBooking = (popularFlight) => {
    const [sourceRaw, destinationRaw] = String(popularFlight.route || "").split(
      /\s+to\s+/i,
    );
    const source = sourceRaw?.trim() || "Delhi";
    const destination = destinationRaw?.trim() || "Mumbai";

    navigateToFlightSearch({
      source,
      destination,
      tripType: "oneway",
      departureDate: getDateInputValue(0),
      travellers: "1 Adult",
      cabinClass: "Economy",
    });
  };

  const handleSearch = () => {
    if (activeTab === "flights") {
      const isMultiCity = flightTripType === "multicity";
      const source = isMultiCity ? multiCityLegs[0]?.from || "" : flightFrom;
      const destination = isMultiCity
        ? multiCityLegs[multiCityLegs.length - 1]?.to || ""
        : flightTo;
      const departureDate = isMultiCity
        ? multiCityLegs[0]?.departureDate || ""
        : flightDepartureDate;

      const flightPayload = {
        source: source.trim(),
        destination: destination.trim(),
        tripType: flightTripType,
        departureDate: departureDate.trim(),
        returnDate: flightTripType === "twoway" ? flightReturnDate.trim() : "",
        travellers: travellerSummary,
        cabinClass,
      };
      navigateToFlightSearch(flightPayload);
      return;
    }

    const busPayload = {
      source: busFrom.trim(),
      destination: busTo.trim(),
      tripType: busTripType,
      departureDate: busDepartureDate.trim(),
      returnDate: busTripType === "twoway" ? busReturnDate.trim() : "",
    };
    navigateToBusSearch(busPayload);
  };

  const handleAiChatSubmit = (event) => {
    event.preventDefault();

    const trimmedInput = aiChatInput.trim();
    if (!trimmedInput) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedInput,
    };

    setAiChatMessages((previous) => [...previous, userMessage]);
    setAiChatInput("");
    setIsAiTyping(true);

    if (aiReplyTimerRef.current) {
      clearTimeout(aiReplyTimerRef.current);
    }

    aiReplyTimerRef.current = setTimeout(() => {
      const assistantReply = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: getStaticAiReply(trimmedInput),
      };

      setAiChatMessages((previous) => [...previous, assistantReply]);
      setIsAiTyping(false);
      aiReplyTimerRef.current = null;
    }, 460);
  };

  const handleAiChatReset = () => {
    if (aiReplyTimerRef.current) {
      clearTimeout(aiReplyTimerRef.current);
      aiReplyTimerRef.current = null;
    }

    setIsAiTyping(false);
    setAiChatInput("");
    setAiChatMessages(getInitialAiChatMessages());
  };

  const canResetAiChat =
    isAiTyping || aiChatInput.trim().length > 0 || aiChatMessages.length > 1;

  const travellerField = (
    <div className="field traveller-field" ref={travellerFieldRef}>
      <label>Traveller</label>
      <button
        type="button"
        className={`traveller-trigger ${showTravellerDropdown ? "open" : ""}`}
        onClick={() => setShowTravellerDropdown((previous) => !previous)}
      >
        <span className="traveller-summary">
          <Users size={16} />
          <span>{travellerSummary}</span>
        </span>
        <ChevronDown
          size={16}
          className={`traveller-caret ${showTravellerDropdown ? "open" : ""}`}
        />
      </button>

      {showTravellerDropdown && (
        <div className="traveller-dropdown">
          <div className="counter-row">
            <div className="counter-copy">
              <strong>Adults</strong>
              <span>12 years and above</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeAdults(-1)}
                disabled={adults <= 1}
              >
                <Minus size={14} />
              </button>
              <span>{adults}</span>
              <button type="button" onClick={() => changeAdults(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Child</strong>
              <span>2 to 11 years</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeChildren(-1)}
                disabled={children <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{children}</span>
              <button type="button" onClick={() => changeChildren(1)}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="counter-row">
            <div className="counter-copy">
              <strong>Infant</strong>
              <span>Under 2 years</span>
            </div>
            <div className="counter-box">
              <button
                type="button"
                onClick={() => changeInfants(-1)}
                disabled={infants <= 0}
              >
                <Minus size={14} />
              </button>
              <span>{infants}</span>
              <button
                type="button"
                onClick={() => changeInfants(1)}
                disabled={infants >= adults}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="button"
            className="traveller-done"
            onClick={() => setShowTravellerDropdown(false)}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );

  const classField = (
    <div className="field class-field">
      <label>Class</label>
      <select
        value={cabinClass}
        onChange={(event) => setCabinClass(event.target.value)}
        className="field-control"
      >
        {CLASS_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="homepage">
      <section className="hero-section">
        <img src={heroImage} alt="" className="hero-bg-image" aria-hidden="true" />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-grid">
            <div className="hero-copy-block">
              <span className="hero-kicker">Smart Travel Studio</span>
              <h1>Book bolder journeys with one unified travel desk.</h1>
              <p>
                Compare flights and buses, mix one-way or multi-city routes, and
                confirm tickets in seconds with transparent pricing.
              </p>

              <div className="hero-metric-grid">
                {HERO_METRICS.map((metric) => (
                  <article key={metric.id} className="hero-metric-card">
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </article>
                ))}
              </div>

              <div className="hero-tag-row">
                {HERO_TAGS.map((tag) => (
                  <span key={tag.id} className="hero-tag">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="search-panel">
              <div className="tabs-wrap">
                <div className="tabs" role="tablist" aria-label="Booking type">
                  <button
                    type="button"
                    className={`tab ${activeTab === "flights" ? "active" : ""}`}
                    onClick={() => handleBookingTabChange("flights")}
                  >
                    <Plane size={17} />
                    <span>Flights</span>
                  </button>

                  <button
                    type="button"
                    className={`tab ${activeTab === "buses" ? "active" : ""}`}
                    onClick={() => handleBookingTabChange("buses")}
                  >
                    <Bus size={17} />
                    <span>Buses</span>
                  </button>
                </div>
              </div>

              {activeTab === "flights" ? (
                <div className="booking-content">
                  <div
                    className="trip-switch"
                    role="tablist"
                    aria-label="Flight trip type"
                  >
                    {FLIGHT_TRIP_TYPES.map((tripType) => (
                      <button
                        key={tripType.value}
                        type="button"
                        className={`trip-chip ${
                          flightTripType === tripType.value ? "active" : ""
                        }`}
                        onClick={() => setFlightTripType(tripType.value)}
                      >
                        {tripType.label}
                      </button>
                    ))}
                  </div>

                  {flightTripType === "multicity" ? (
                    <div className="multi-city-list">
                      {multiCityLegs.map((leg) => (
                        <div className="multi-city-row" key={leg.id}>
                          <PlaceAutocomplete
                            label="Source"
                            value={leg.from}
                            onChange={(nextValue) =>
                              updateMultiCityLeg(leg.id, "from", nextValue)
                            }
                            tripType="flight"
                            field="from"
                            placeholder="Type source city"
                          />

                          <PlaceAutocomplete
                            label="Destination"
                            value={leg.to}
                            onChange={(nextValue) =>
                              updateMultiCityLeg(leg.id, "to", nextValue)
                            }
                            tripType="flight"
                            field="to"
                            placeholder="Type destination city"
                          />

                          <div className="field field-with-icon">
                            <label>Departure</label>
                            <div className="control-wrap">
                              <CalendarDays size={16} />
                              <input
                                type="date"
                                value={leg.departureDate}
                                onClick={openDatePicker}
                                onChange={(event) =>
                                  updateMultiCityLeg(
                                    leg.id,
                                    "departureDate",
                                    event.target.value,
                                  )
                                }
                                className="field-control with-leading-icon"
                              />
                            </div>
                          </div>

                          <div
                            className="multi-actions"
                            aria-label="Multi-city row actions"
                          >
                            <button
                              type="button"
                              className="action-circle action-add"
                              onClick={addMultiCityLeg}
                              title="Add row"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              type="button"
                              className="action-circle action-delete"
                              onClick={() => removeMultiCityLeg(leg.id)}
                              title="Delete row"
                              disabled={multiCityLegs.length === 1}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="multi-footer-row">
                        {travellerField}
                        {classField}
                      </div>
                    </div>
                  ) : (
                    <div className="search-grid standard-grid">
                      <PlaceAutocomplete
                        label="Source"
                        value={flightFrom}
                        onChange={setFlightFrom}
                        tripType="flight"
                        field="from"
                        placeholder="Type source city"
                      />

                      <div className="swap-field">
                        <button
                          type="button"
                          className="swap-btn"
                          onClick={handleSwapFlights}
                          aria-label="Swap flight origin and destination"
                        >
                          <ArrowLeftRight size={16} />
                        </button>
                      </div>

                      <PlaceAutocomplete
                        label="Destination"
                        value={flightTo}
                        onChange={setFlightTo}
                        tripType="flight"
                        field="to"
                        placeholder="Type destination city"
                      />

                      <div className="field field-with-icon">
                        <label>Departure</label>
                        <div className="control-wrap">
                          <CalendarDays size={16} />
                          <input
                            type="date"
                            value={flightDepartureDate}
                            onClick={openDatePicker}
                            onChange={(event) =>
                              setFlightDepartureDate(event.target.value)
                            }
                            className="field-control with-leading-icon"
                          />
                        </div>
                      </div>

                      <div className="field field-with-icon">
                        <label>Return</label>
                        <div className="control-wrap">
                          <CalendarDays size={16} />
                          {isFlightTwoWay ? (
                            <input
                              type="date"
                              value={flightReturnDate}
                              onClick={openDatePicker}
                              onChange={(event) =>
                                setFlightReturnDate(event.target.value)
                              }
                              className="field-control with-leading-icon"
                            />
                          ) : (
                            <input
                              type="text"
                              className="field-control with-leading-icon watermark-field"
                              value=""
                              placeholder="Return date available for Two Way"
                              disabled
                            />
                          )}
                        </div>
                      </div>

                      {travellerField}
                      {classField}
                    </div>
                  )}
                </div>
              ) : (
                <div className="booking-content">
                  <div
                    className="trip-switch"
                    role="tablist"
                    aria-label="Bus trip type"
                  >
                    {BUS_TRIP_TYPES.map((tripType) => (
                      <button
                        key={tripType.value}
                        type="button"
                        className={`trip-chip ${
                          busTripType === tripType.value ? "active" : ""
                        }`}
                        onClick={() => setBusTripType(tripType.value)}
                      >
                        {tripType.label}
                      </button>
                    ))}
                  </div>

                  <div className="search-grid bus-standard-grid">
                    <PlaceAutocomplete
                      label="Source"
                      value={busFrom}
                      onChange={setBusFrom}
                      tripType="bus"
                      field="from"
                      placeholder="Type source city"
                    />

                    <div className="swap-field">
                      <button
                        type="button"
                        className="swap-btn"
                        onClick={handleSwapBuses}
                        aria-label="Swap bus origin and destination"
                      >
                        <ArrowLeftRight size={16} />
                      </button>
                    </div>

                    <PlaceAutocomplete
                      label="Destination"
                      value={busTo}
                      onChange={setBusTo}
                      tripType="bus"
                      field="to"
                      placeholder="Type destination city"
                    />

                    <div className="field field-with-icon">
                      <label>Departure</label>
                      <div className="control-wrap">
                        <CalendarDays size={16} />
                        <input
                          type="date"
                          value={busDepartureDate}
                          onClick={openDatePicker}
                          onChange={(event) =>
                            setBusDepartureDate(event.target.value)
                          }
                          className="field-control with-leading-icon"
                        />
                      </div>
                    </div>

                    <div className="field field-with-icon">
                      <label>Return</label>
                      <div className="control-wrap">
                        <CalendarDays size={16} />
                        {isBusTwoWay ? (
                          <input
                            type="date"
                            value={busReturnDate}
                            onClick={openDatePicker}
                            onChange={(event) =>
                              setBusReturnDate(event.target.value)
                            }
                            className="field-control with-leading-icon"
                          />
                        ) : (
                          <input
                            type="text"
                            className="field-control with-leading-icon watermark-field"
                            value=""
                            placeholder="Return date available for Two Way"
                            disabled
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="search-btn"
                onClick={handleSearch}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="offers-section section-shell">
        <div className="section-header offers-header">
          <div>
            <span className="section-kicker">This Week</span>
            <h2>Featured Offers</h2>
          </div>
          <button type="button" className="section-link">
            View all deals
          </button>
        </div>

        <AutoMarquee
          items={OFFERS}
          className="offer-marquee"
          duration={38}
          renderItem={(offer) => (
            <article className="offer-card">
              <img src={offer.image} alt={offer.title} />
              <div className="offer-content">
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
                <span className="offer-code">Code: {offer.code}</span>
                <button type="button" onClick={() => handleOfferBooking(offer)}>
                  Book now
                </button>
              </div>
            </article>
          )}
        />
      </section>

      <section className="ads-section section-shell">
        {AD_BANNERS.map((banner) => (
          <article className="ad-banner" key={banner.id}>
            <img
              src={banner.image}
              alt={banner.title}
              className="ad-banner-image"
            />
            <div className="ad-banner-content">
              <span className="ad-banner-label">{banner.label}</span>
              <h3>{banner.title}</h3>
              <p>{banner.description}</p>
              <button
                type="button"
                onClick={() =>
                  handleOfferBooking({
                    bookingType: banner.bookingType,
                  })
                }
              >
                {banner.cta}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section
        className="popular-buses-section section-shell"
        id="popular-buses"
      >
        <div className="section-header">
          <div>
            <span className="section-kicker">Popular Buses</span>
            <h2>RTC Bus Corporations</h2>
          </div>
        </div>

        <div className="rtc-carousel-wrap">
          <AutoMarquee
            items={POPULAR_RTC_OPERATORS}
            className="rtc-marquee"
            duration={34}
            renderItem={(operator) => (
              <article
                key={operator.id}
                className="rtc-card"
                style={{ backgroundImage: `url(${operator.background})` }}
              >
                <div className="rtc-card-overlay" />
                <div className="rtc-card-logo">
                  <img src={operator.logo} alt={`${operator.shortName} logo`} />
                </div>
                <div className="rtc-card-content">
                  <h3>{operator.shortName}</h3>
                  <p>{operator.name}</p>
                  <button
                    type="button"
                    onClick={() => openPopularBusRoutes(operator.id)}
                  >
                    Book Now
                  </button>
                </div>
              </article>
            )}
          />
        </div>
      </section>

      <section className="popular-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Popular Picks</span>
            <h2>Trending Flight Routes</h2>
          </div>
        </div>

        <AutoMarquee
          items={POPULAR_FLIGHTS}
          className="popular-marquee"
          duration={44}
          renderItem={(flight) => (
            <article className="popular-card">
              <img src={flight.image} alt={flight.route} />
              <div className="popular-content">
                <h3>{flight.route}</h3>
                <p>{flight.summary}</p>
                <span>{flight.price}</span>
                <button
                  type="button"
                  onClick={() => handlePopularFlightBooking(flight)}
                >
                  Book flight
                </button>
              </div>
            </article>
          )}
        />
      </section>

      <section className="reviews-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Customer Voices</span>
            <h2>What Travelers Say</h2>
          </div>
        </div>

        <AutoMarquee
          items={REVIEWS}
          className="review-marquee"
          duration={36}
          renderItem={(review) => (
            <article className="review-slide">
              <div className="review-slide-top">
                <MessageSquareText size={14} />
                <span className="review-type">{review.type}</span>
              </div>
              <p>{review.comment}</p>
              <div className="review-slide-footer">
                <strong>{review.author}</strong>
                <span>{review.rating}</span>
              </div>
            </article>
          )}
        />
      </section>

      <section className="signup-section section-shell">
        <div className="signup-card">
          <div className="signup-copy">
            <h2>Sign Up For Exclusive Offers</h2>
            <p>Exclusive access to coupons, special offers and promotions.</p>
          </div>

          <form
            className="signup-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <input type="email" placeholder="Enter your email address" />
            <input type="tel" placeholder="Enter your mobile no." />
            <button type="submit">Subscribe</button>
          </form>
        </div>
      </section>

      <section className="brands-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Trusted Partners</span>
            <h2>Airline Brands</h2>
          </div>
        </div>

        <AutoMarquee
          items={AIRLINE_BRANDS}
          className="brand-marquee"
          duration={30}
          renderItem={(brand) => (
            <article className="brand-slide">
              <img
                src={brand.image}
                alt={brand.name}
                className="brand-logo"
                style={{ "--brand-scale": brand.scale }}
              />
              <span>{brand.name}</span>
            </article>
          )}
        />
      </section>

      <section className="insights-section section-shell">
        <div className="section-header">
          <div>
            <span className="section-kicker">Travel Insights</span>
            <h2>Plan Better Every Time</h2>
          </div>
        </div>
        <div className="insights-grid">
          {HIGHLIGHTS.map((item) => (
            <article key={item.id} className="insight-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={`home-ai-chat ${isAiChatOpen ? "open" : "closed"}`}>
        <button
          type="button"
          className="home-ai-toggle"
          aria-expanded={isAiChatOpen}
          aria-controls="home-ai-chat-panel"
          aria-label={isAiChatOpen ? "Close AI chat" : "Open AI chat"}
          onClick={() => setIsAiChatOpen((previous) => !previous)}
        >
          <span className="home-ai-toggle-line" aria-hidden="true" />
          {isAiChatOpen ? (
            <ChevronRight size={12} />
          ) : (
            <ChevronLeft size={12} />
          )}
        </button>

        {isAiChatOpen && (
          <aside
            className="home-ai-chat-panel"
            id="home-ai-chat-panel"
            aria-label="Travel AI Assistant"
          >
            <div className="home-ai-cameo" aria-hidden="true">
              <span className="home-ai-cameo-halo" />
              <span className="home-ai-cameo-orbit home-ai-cameo-orbit-a" />
              <span className="home-ai-cameo-orbit home-ai-cameo-orbit-b" />
              <span className="home-ai-cameo-core">AI</span>
            </div>

            <div className="home-ai-chat-head">
              <div className="home-ai-chat-head-copy">
                <strong>AI Concierge</strong>
                <span className="home-ai-chat-status">
                  Static assistant preview
                </span>
              </div>
              <button
                type="button"
                className="home-ai-reset-btn"
                onClick={handleAiChatReset}
                disabled={!canResetAiChat}
              >
                Reset
              </button>
            </div>

            <div className="home-ai-chat-messages" ref={aiChatMessagesRef}>
              {aiChatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`home-ai-chat-message ${
                    message.role === "user" ? "user" : "assistant"
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {isAiTyping && (
                <div className="home-ai-chat-message assistant typing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <form className="home-ai-chat-form" onSubmit={handleAiChatSubmit}>
              <input
                type="text"
                value={aiChatInput}
                onChange={(event) => setAiChatInput(event.target.value)}
                placeholder="Ask Travel AI..."
                maxLength={220}
              />
              <button type="submit">Send</button>
            </form>
          </aside>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
