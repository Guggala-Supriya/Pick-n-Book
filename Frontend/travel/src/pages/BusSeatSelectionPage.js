import React, { useEffect, useMemo, useState } from "react";
import { BusFront, Clock3, Info } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../STYLES/BusBookingFlow.css";
import { getBusSeatMap } from "../api/busBookingsApi";
import apsrtcBg from "../IMAGES/apsrtc-bg.svg";
import apsrtcLogo from "../IMAGES/apsrtc-logo.svg";
import gsrtcBg from "../IMAGES/gsrtc-bg.svg";
import gsrtcLogo from "../IMAGES/gsrtc-logo.svg";
import keralaRtcBg from "../IMAGES/kerala-rtc-bg.svg";
import keralaRtcLogo from "../IMAGES/kerala-rtc-logo.svg";
import ksrtcBg from "../IMAGES/ksrtc-bg.svg";
import ksrtcLogo from "../IMAGES/ksrtc-logo.svg";
import privatePrimeLogo from "../IMAGES/private-prime-logo.svg";
import privateRoyalLogo from "../IMAGES/private-royal-logo.svg";
import privateSkylineLogo from "../IMAGES/private-skyline-logo.svg";
import rtcBusLogo from "../IMAGES/rtc-bus-logo.svg";
import tgsrtcBg from "../IMAGES/tgsrtc-bg.svg";
import tgsrtcLogo from "../IMAGES/tgsrtc-logo.svg";
import {
  readBusBookingFlowState,
  writeBusBookingFlowState,
} from "./busBookingFlowStore";

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return `\u20b9 ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)}`;
}

function parseBusSeatCode(seatCode) {
  const match = String(seatCode || "")
    .trim()
    .toUpperCase()
    .match(/^([LU])(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    seatNumber: Number(match[2]),
    label: `${match[1]}${match[2]}`,
  };
}

function compareBusSeatLabels(left, right) {
  const parsedLeft = parseBusSeatCode(left);
  const parsedRight = parseBusSeatCode(right);

  if (parsedLeft && parsedRight) {
    if (parsedLeft.prefix !== parsedRight.prefix) {
      return parsedLeft.prefix.localeCompare(parsedRight.prefix);
    }

    return parsedLeft.seatNumber - parsedRight.seatNumber;
  }

  if (parsedLeft) {
    return -1;
  }

  if (parsedRight) {
    return 1;
  }

  return String(left || "").localeCompare(String(right || ""));
}

function normalizeSeatMap(seatMapPayload, farePerSeat) {
  const seatsRaw = seatMapPayload?.seats || seatMapPayload?.Seats || [];

  if (!Array.isArray(seatsRaw)) {
    return { seats: [], meta: null };
  }

  const fare = Number(farePerSeat) || 0;
  const normalizedSeats = seatsRaw
    .map((seat, index) => {
      const rawCode =
        seat?.seatCode ??
        seat?.SeatCode ??
        seat?.seatNumber ??
        seat?.SeatNumber ??
        "";
      const parsed = parseBusSeatCode(rawCode);
      const label = parsed?.label || String(rawCode || "").trim() || `S${index + 1}`;
      const deck =
        parsed?.prefix === "U"
          ? "Upper Deck"
          : parsed?.prefix === "L"
            ? "Lower Deck"
            : "Main Deck";
      const isBooked = Boolean(seat?.isBooked ?? seat?.IsBooked);

      return {
        id: `seat-${label}`,
        label,
        deck,
        status: isBooked ? "booked" : "available",
        fare,
      };
    })
    .sort((a, b) => compareBusSeatLabels(a.label, b.label));

  const totalSeats =
    Number(seatMapPayload?.totalSeats ?? seatMapPayload?.TotalSeats ?? 0) ||
    normalizedSeats.length;
  const bookedSeats =
    Number(seatMapPayload?.bookedSeats ?? seatMapPayload?.BookedSeats ?? 0) ||
    normalizedSeats.filter((seat) => seat.status === "booked").length;
  const availableSeats =
    Number(seatMapPayload?.availableSeats ?? seatMapPayload?.AvailableSeats ?? 0) ||
    Math.max(0, totalSeats - bookedSeats);

  return {
    seats: normalizedSeats,
    meta: {
      totalSeats,
      bookedSeats,
      availableSeats,
    },
  };
}

function seatRowsForDeck(seats, deckName) {
  const deckSeats = seats
    .filter((seat) => seat.deck === deckName)
    .sort((a, b) => compareBusSeatLabels(a.label, b.label));

  const rows = [];
  for (let index = 0; index < deckSeats.length; index += 5) {
    const row = deckSeats.slice(index, index + 5);
    while (row.length < 5) {
      row.push(null);
    }
    rows.push(row);
  }

  return rows;
}

function resolveBusOverviewVisual(bus) {
  const operatorName = String(bus?.operatorName || "").trim();
  const busType = String(bus?.busType || "").trim();
  const busNumber = String(bus?.busNumber || "--").trim();
  const fromCity = String(bus?.fromCity || "--").trim();
  const toCity = String(bus?.toCity || "--").trim();
  const normalized = operatorName.toLowerCase();

  const visualCatalog = [
    {
      match: ["apsrtc"],
      brand: "APSRTC",
      logo: apsrtcLogo,
      background: apsrtcBg,
    },
    {
      match: ["tgsrtc", "tsrtc", "telangana"],
      brand: "TGSRTC",
      logo: tgsrtcLogo,
      background: tgsrtcBg,
    },
    {
      match: ["ksrtc", "karnataka"],
      brand: "KSRTC",
      logo: ksrtcLogo,
      background: ksrtcBg,
    },
    {
      match: ["kerala"],
      brand: "Kerala RTC",
      logo: keralaRtcLogo,
      background: keralaRtcBg,
    },
    {
      match: ["gsrtc", "gujarat"],
      brand: "GSRTC",
      logo: gsrtcLogo,
      background: gsrtcBg,
    },
    {
      match: ["prime"],
      brand: "Prime Travels",
      logo: privatePrimeLogo,
      background: ksrtcBg,
    },
    {
      match: ["royal"],
      brand: "Royal Travels",
      logo: privateRoyalLogo,
      background: keralaRtcBg,
    },
    {
      match: ["skyline"],
      brand: "Skyline Travels",
      logo: privateSkylineLogo,
      background: gsrtcBg,
    },
  ];

  const matchedVisual =
    visualCatalog.find((item) =>
      item.match.some((keyword) => normalized.includes(keyword))
    ) || null;

  const selectedVisual = matchedVisual || {
    brand: operatorName || "Travel Bus",
    logo: rtcBusLogo,
    background: tgsrtcBg,
  };

  return {
    ...selectedVisual,
    routeText: `${fromCity} to ${toCity}`,
    summaryText: [busType || "Bus Service", `Bus No: ${busNumber}`].join(" | "),
    operatorName: operatorName || "Travel Bus",
  };
}

export default function BusSeatSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const persistedState = readBusBookingFlowState();
  const incomingState = location.state || {};

  const bus = incomingState.bus || persistedState?.bus || null;
  const searchContext = incomingState.searchContext || persistedState?.searchContext || null;

  const [isSeatLayoutLoading, setIsSeatLayoutLoading] = useState(false);
  const [seatMapPayload, setSeatMapPayload] = useState(null);
  const [seatMapError, setSeatMapError] = useState("");
  const [seatMapVersion, setSeatMapVersion] = useState(0);
  const [activePointTab, setActivePointTab] = useState("boarding");
  const [selectedBoardingId, setSelectedBoardingId] = useState(
    incomingState.selectedBoardingId || persistedState?.selectedBoardingId || ""
  );
  const [selectedDroppingId, setSelectedDroppingId] = useState(
    incomingState.selectedDroppingId || persistedState?.selectedDroppingId || ""
  );
  const [selectedSeatLabels, setSelectedSeatLabels] = useState(
    incomingState.selectedSeatLabels || persistedState?.selectedSeatLabels || []
  );
  const [selectionError, setSelectionError] = useState("");
  const [hoveredSeat, setHoveredSeat] = useState(null);

  useEffect(() => {
    if (!bus) {
      return;
    }

    writeBusBookingFlowState({
      bus,
      searchContext,
    });
  }, [bus, searchContext]);

  useEffect(() => {
    let isCurrent = true;

    async function loadSeatMap() {
      if (!bus?.id) {
        setSeatMapPayload(null);
        setSeatMapError("");
        return;
      }

      setIsSeatLayoutLoading(true);
      setSeatMapError("");

      try {
        const data = await getBusSeatMap(bus.id);
        if (!isCurrent) {
          return;
        }

        setSeatMapPayload(data);
      } catch (error) {
        if (isCurrent) {
          setSeatMapPayload(null);
          setSeatMapError(error.message || "Unable to load bus seat map.");
        }
      } finally {
        if (isCurrent) {
          setIsSeatLayoutLoading(false);
        }
      }
    }

    loadSeatMap();

    return () => {
      isCurrent = false;
    };
  }, [bus?.id, seatMapVersion]);

  const seatData = useMemo(() => {
    if (!bus) {
      return { seats: [], meta: null };
    }

    return normalizeSeatMap(seatMapPayload, bus.fare);
  }, [bus, seatMapPayload]);

  const seatsByLabel = useMemo(() => {
    const map = new Map();
    seatData.seats.forEach((seat) => map.set(seat.label, seat));
    return map;
  }, [seatData.seats]);

  const boardingPoints = useMemo(() => {
    if (!bus) {
      return [];
    }

    return [
      {
        id: "boarding-1",
        name: String(bus.boardingPoint || bus.fromCity || "Boarding Point").trim(),
        address: String(bus.fromCity || "").trim(),
        time: String(bus.departureTime || "--:--").trim(),
      },
    ];
  }, [bus]);

  const droppingPoints = useMemo(() => {
    if (!bus) {
      return [];
    }

    return [
      {
        id: "dropping-1",
        name: String(bus.droppingPoint || bus.toCity || "Dropping Point").trim(),
        address: String(bus.toCity || "").trim(),
        time: String(bus.arrivalTime || "--:--").trim(),
      },
    ];
  }, [bus]);

  useEffect(() => {
    if (boardingPoints.length === 1 && !selectedBoardingId) {
      setSelectedBoardingId(boardingPoints[0].id);
    }
  }, [boardingPoints, selectedBoardingId]);

  useEffect(() => {
    if (droppingPoints.length === 1 && !selectedDroppingId) {
      setSelectedDroppingId(droppingPoints[0].id);
    }
  }, [droppingPoints, selectedDroppingId]);

  useEffect(() => {
    if (seatData.seats.length === 0) {
      return;
    }

    setSelectedSeatLabels((previous) =>
      previous.filter((label) => {
        const seat = seatsByLabel.get(label);
        return seat && seat.status !== "booked";
      })
    );
  }, [seatData.seats, seatsByLabel]);

  const selectedSeats = useMemo(
    () =>
      selectedSeatLabels
        .map((seatLabel) => seatsByLabel.get(seatLabel))
        .filter(Boolean),
    [selectedSeatLabels, seatsByLabel]
  );

  const availableSeatCount = Number(seatData.meta?.availableSeats ?? bus?.availableSeats ?? 0) || 0;

  const maxSelectableSeats = Math.min(
    6,
    Math.max(1, availableSeatCount || selectedSeats.length || 1)
  );

  const selectedSeatTotal = selectedSeats.reduce(
    (accumulator, seat) => accumulator + (Number(seat.fare) || 0),
    0
  );

  const selectedBoarding = boardingPoints.find((point) => point.id === selectedBoardingId) || null;
  const selectedDropping = droppingPoints.find((point) => point.id === selectedDroppingId) || null;

  const upperDeckRows = useMemo(
    () => seatRowsForDeck(seatData.seats, "Upper Deck"),
    [seatData.seats]
  );
  const lowerDeckRows = useMemo(
    () => seatRowsForDeck(seatData.seats, "Lower Deck"),
    [seatData.seats]
  );
  const busOverview = useMemo(() => resolveBusOverviewVisual(bus), [bus]);

  if (!bus) {
    return (
      <main className="bus-flow-page">
        <div className="bus-flow-shell">
          <section className="bus-flow-empty">
            <h2>Select a bus first</h2>
            <p>Open bus search results and click View Seats to continue booking.</p>
            <button type="button" onClick={() => navigate("/search/buses")}>
              Go to Bus Search
            </button>
          </section>
        </div>
      </main>
    );
  }

  const hasSeatLayout = lowerDeckRows.length > 0 || upperDeckRows.length > 0;

  const handleSeatToggle = (seat) => {
    if (!seat || seat.status === "booked" || seatMapError) {
      return;
    }

    setSelectionError("");
    setSelectedSeatLabels((previous) => {
      if (previous.includes(seat.label)) {
        return previous.filter((label) => label !== seat.label);
      }

      if (previous.length >= maxSelectableSeats) {
        setSelectionError(`You can select up to ${maxSelectableSeats} seats in one booking.`);
        return previous;
      }

      return [...previous, seat.label];
    });
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) {
      setSelectionError("Select at least one seat.");
      return;
    }

    if (!selectedBoarding || !selectedDropping) {
      setSelectionError("Select both boarding and dropping points.");
      return;
    }

    const baseFare = selectedSeatTotal;
    const tax = 0;
    const convenienceFee = 0;
    const totalFare = baseFare + tax + convenienceFee;

    const flowData = {
      bus,
      searchContext,
      selectedSeatLabels,
      selectedSeats,
      selectedBoardingId,
      selectedDroppingId,
      boardingPoint: selectedBoarding,
      droppingPoint: selectedDropping,
      fareSummary: {
        baseFare,
        tax,
        convenienceFee,
        totalFare,
      },
    };

    writeBusBookingFlowState(flowData);
    navigate("/bus/passenger-details", { state: flowData });
  };

  const renderSeatButton = (seat) => {
    if (!seat) {
      return <span className="bus-flow-seat-gap" />;
    }

    const isSelected = selectedSeatLabels.includes(seat.label);
    const className = [
      "bus-flow-seat",
      `status-${seat.status}`,
      isSelected ? "status-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        key={seat.id}
        type="button"
        className={className}
        onClick={() => handleSeatToggle(seat)}
        onMouseEnter={(event) =>
          setHoveredSeat({
            label: seat.label,
            fare: seat.fare,
            x: event.clientX,
            y: event.clientY,
          })
        }
        onMouseMove={(event) =>
          setHoveredSeat((previous) =>
            previous && previous.label === seat.label
              ? { ...previous, x: event.clientX, y: event.clientY }
              : previous
          )
        }
        onMouseLeave={() => setHoveredSeat(null)}
        disabled={seat.status === "booked"}
      >
        {seat.label}
      </button>
    );
  };

  return (
    <main className="bus-flow-page">
      <div className="bus-flow-shell">
        <section className="bus-flow-summary-card">
          <div className="bus-flow-overview-banner">
            <img
              src={busOverview.background}
              alt={`${busOverview.brand} bus`}
              className="bus-flow-overview-bg"
            />
            <div className="bus-flow-overview-overlay" />
            <div className="bus-flow-overview-content">
              <div className="bus-flow-overview-logo-wrap">
                <img
                  src={busOverview.logo}
                  alt={`${busOverview.brand} logo`}
                  className="bus-flow-overview-logo"
                />
              </div>

              <div className="bus-flow-overview-copy">
                <p>{busOverview.routeText}</p>
                <h3>{busOverview.operatorName}</h3>
                <span>{busOverview.summaryText}</span>
              </div>
            </div>
          </div>

          <div className="bus-flow-summary-grid">
            <article>
              <h2>{bus.operatorName}</h2>
              <p>{bus.busType}</p>
            </article>
            <article>
              <strong>{bus.departureTime}</strong>
              <span>{bus.boardingPoint}</span>
            </article>
            <article className="bus-flow-duration">
              <BusFront size={18} />
              <span>{bus.duration}</span>
            </article>
            <article>
              <strong>{bus.arrivalTime}</strong>
              <span>{bus.droppingPoint}</span>
            </article>
            <article>
              <small>Starts from</small>
              <strong>{formatCurrency(bus.fare)}</strong>
            </article>
            <article>
              <small>{availableSeatCount} Seats Available</small>
            </article>
          </div>
          <div className="bus-flow-summary-actions">
            <button type="button">Boarding & Dropping Points</button>
            <button type="button">Cancellation Policies</button>
            <button
              type="button"
              className="active"
              onClick={() => setSeatMapVersion((previous) => previous + 1)}
              disabled={isSeatLayoutLoading}
            >
              {isSeatLayoutLoading ? "LOADING SEATS" : "REFRESH SEATS"}
            </button>
          </div>
        </section>

        {isSeatLayoutLoading ? (
          <section className="bus-flow-seat-loader">
            <div className="loader-bars" aria-label="Loading seats">
              <span />
              <span />
              <span />
            </div>
          </section>
        ) : (
          <section className="bus-flow-seat-layout">
            <div className="bus-flow-seat-zone">
              <header className="bus-flow-seat-top">
                <div className="bus-flow-fares">
                  <h3>{availableSeatCount} Seats Available</h3>
                  <div className="bus-flow-fare-chips">
                    <button type="button" className="active" disabled>
                      {formatCurrency(bus.fare)} / seat
                    </button>
                  </div>
                </div>

                <div className="bus-flow-seat-legend">
                  <span className="legend available">Available Seats</span>
                  <span className="legend booked">Booked Seats</span>
                  <span className="legend selected">Selected Seats</span>
                </div>
              </header>

              {seatMapError && (
                <p className="flow-error">
                  <Info size={14} />
                  {seatMapError}
                </p>
              )}

              {hasSeatLayout ? (
                <div className="bus-flow-deck-stack">
                  {lowerDeckRows.length > 0 && (
                    <section className="bus-flow-deck-card">
                      <aside>Lower Deck</aside>
                      <div className="bus-flow-sleeper-grid">
                        {lowerDeckRows.map((row, rowIndex) => (
                          <div className="bus-flow-sleeper-row" key={`lower-${rowIndex}`}>
                            {row.map((seat) => renderSeatButton(seat))}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {upperDeckRows.length > 0 && (
                    <section className="bus-flow-deck-card">
                      <aside>Upper Deck</aside>
                      <div className="bus-flow-sleeper-grid">
                        {upperDeckRows.map((row, rowIndex) => (
                          <div className="bus-flow-sleeper-row" key={`upper-${rowIndex}`}>
                            {row.map((seat) => renderSeatButton(seat))}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              ) : (
                <p className="flow-error">
                  <Info size={14} />
                  No seat map available for this bus.
                </p>
              )}

              {hoveredSeat && (
                <div
                  className="bus-flow-seat-tooltip"
                  style={{
                    left: `${Math.min(window.innerWidth - 190, hoveredSeat.x + 14)}px`,
                    top: `${Math.max(8, hoveredSeat.y - 34)}px`,
                  }}
                >
                  Seat No:{hoveredSeat.label} | Fare: {formatCurrency(hoveredSeat.fare)}
                </div>
              )}
            </div>

            <aside className="bus-flow-point-panel">
              <h3>Select The Boarding & Dropping Point</h3>

              <div className="point-tabs">
                <button
                  type="button"
                  className={activePointTab === "boarding" ? "active" : ""}
                  onClick={() => setActivePointTab("boarding")}
                >
                  Boarding Point
                </button>
                <button
                  type="button"
                  className={activePointTab === "dropping" ? "active" : ""}
                  onClick={() => setActivePointTab("dropping")}
                >
                  Dropping Point
                </button>
              </div>

              <div className="point-list">
                {(activePointTab === "boarding" ? boardingPoints : droppingPoints).map((point) => {
                  const checked =
                    activePointTab === "boarding"
                      ? selectedBoardingId === point.id
                      : selectedDroppingId === point.id;

                  return (
                    <button
                      type="button"
                      key={point.id}
                      className={`point-item ${checked ? "selected" : ""}`}
                      onClick={() => {
                        if (activePointTab === "boarding") {
                          setSelectedBoardingId(point.id);
                        } else {
                          setSelectedDroppingId(point.id);
                        }
                      }}
                    >
                      <i />
                      <div>
                        <strong>{point.name}</strong>
                        <span>{point.address}</span>
                      </div>
                      <small>
                        <Clock3 size={14} />
                        {point.time}
                      </small>
                    </button>
                  );
                })}
              </div>

              <div className="selected-seat-summary">
                <h4>Selected Seats</h4>
                <strong>{formatCurrency(selectedSeatTotal)}</strong>
              </div>

              <p className="selected-seat-list">
                {selectedSeats.length === 0
                  ? "No Seats selected yet"
                  : selectedSeats.map((seat) => seat.label).join(", ")}
              </p>

              {selectionError && (
                <p className="flow-error">
                  <Info size={14} />
                  {selectionError}
                </p>
              )}

              <button
                type="button"
                className="flow-continue-btn"
                disabled={
                  isSeatLayoutLoading ||
                  Boolean(seatMapError) ||
                  !hasSeatLayout ||
                  selectedSeats.length === 0 ||
                  !selectedBoarding ||
                  !selectedDropping
                }
                onClick={handleContinue}
              >
                Continue
              </button>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}
