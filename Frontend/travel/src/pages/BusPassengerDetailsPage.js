import React, { useMemo, useState } from "react";
import { Clock3, Mail, Phone, User, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../STYLES/BusBookingFlow.css";
import {
  readBusBookingFlowState,
  writeBusBookingFlowState,
} from "./busBookingFlowStore";

function formatCurrency(amount) {
  return `\u20b9 ${new Intl.NumberFormat("en-IN").format(Number(amount) || 0)}`;
}

function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "male") {
    return "Male";
  }
  if (normalized === "female") {
    return "Female";
  }
  return "";
}

function buildPassengerSeed(selectedSeats, existingPassengers) {
  const seats = Array.isArray(selectedSeats) ? selectedSeats : [];

  if (Array.isArray(existingPassengers) && existingPassengers.length > 0) {
    return existingPassengers.map((passenger, index) => {
      const seatNumber = String(
        passenger?.seatNumber || passenger?.seatLabel || seats[index]?.label || ""
      ).trim();
      const legacyFullName = `${passenger?.title || ""} ${passenger?.firstName || ""} ${
        passenger?.lastName || ""
      }`
        .replace(/\s+/g, " ")
        .trim();
      const fullName = String(passenger?.fullName || legacyFullName || "").trim();
      const gender =
        normalizeGender(passenger?.gender) ||
        (String(passenger?.title || "").trim().toLowerCase() === "mr" ? "Male" : "Female");

      return {
        id: passenger?.id || `p-${seatNumber || index + 1}`,
        seatNumber,
        fullName,
        gender,
      };
    });
  }

  return seats.map((seat, index) => ({
    id: `p-${seat.label}-${index + 1}`,
    seatNumber: String(seat.label || "").trim(),
    fullName: "",
    gender: "Male",
  }));
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email || "").trim());
}

function isValidMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

export default function BusPassengerDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const persistedState = readBusBookingFlowState();
  const incomingState = location.state || {};
  const flowState = incomingState.bus ? incomingState : persistedState || {};

  const bus = flowState.bus || null;
  const selectedSeats = flowState.selectedSeats || [];
  const boardingPoint = flowState.boardingPoint || null;
  const droppingPoint = flowState.droppingPoint || null;
  const fareSummary = flowState.fareSummary || {
    baseFare: selectedSeats.reduce((sum, seat) => sum + (Number(seat.fare) || 0), 0),
    tax: 0,
    convenienceFee: 0,
    totalFare: selectedSeats.reduce((sum, seat) => sum + (Number(seat.fare) || 0), 0),
  };

  const [passengers, setPassengers] = useState(() =>
    buildPassengerSeed(selectedSeats, flowState.passengers)
  );
  const [contact, setContact] = useState(() => ({
    email: flowState.contact?.email || "",
    mobile: flowState.contact?.mobile || "",
    whatsappUpdates: Boolean(flowState.contact?.whatsappUpdates),
    whatsappNumber: flowState.contact?.whatsappNumber || "",
  }));
  const [couponCode, setCouponCode] = useState(flowState.couponCode || "");
  const [agreedToFare, setAgreedToFare] = useState(Boolean(flowState.agreedToFare));
  const [formError, setFormError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const estimatedTotal = Math.max(0, Number(fareSummary.totalFare) || 0);

  const allPassengersValid = useMemo(
    () =>
      passengers.every((passenger) => {
        const fullName = String(passenger?.fullName || "").trim();
        const gender = normalizeGender(passenger?.gender);
        return Boolean(fullName) && (gender === "Male" || gender === "Female");
      }),
    [passengers]
  );

  if (!bus || selectedSeats.length === 0 || !boardingPoint || !droppingPoint) {
    return (
      <main className="bus-flow-page">
        <div className="bus-flow-shell">
          <section className="bus-flow-empty">
            <h2>Seat selection data missing</h2>
            <p>Select seats, boarding, and dropping points before filling passenger details.</p>
            <button type="button" onClick={() => navigate("/bus/seats")}>
              Back to Seat Selection
            </button>
          </section>
        </div>
      </main>
    );
  }

  const updatePassenger = (index, field, value) => {
    setPassengers((previous) =>
      previous.map((passenger, passengerIndex) =>
        passengerIndex === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const handleApplyCoupon = () => {
    setCouponCode((previous) => String(previous || "").trim().toUpperCase());
  };

  const handleOpenConfirmation = () => {
    if (!allPassengersValid) {
      setFormError("Fill all passenger fields before continuing.");
      return;
    }

    if (!isValidEmail(contact.email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!isValidMobile(contact.mobile)) {
      setFormError("Enter a valid mobile number.");
      return;
    }

    if (contact.whatsappUpdates) {
      const whatsappValue = contact.whatsappNumber || contact.mobile;

      if (!isValidMobile(whatsappValue)) {
        setFormError("Enter a valid WhatsApp number or disable WhatsApp updates.");
        return;
      }
    }

    if (!agreedToFare) {
      setFormError("Please accept fare rules and terms.");
      return;
    }

    setFormError("");
    setShowConfirmation(true);
  };

  const handleProceedPayment = () => {
    const payload = {
      ...flowState,
      passengers,
      contact,
      couponCode: couponCode.trim().toUpperCase(),
      agreedToFare,
      payableAmount: estimatedTotal,
    };

    writeBusBookingFlowState(payload);
    navigate("/bus/payment", { state: payload });
  };

  return (
    <main className="bus-flow-page">
      <div className="bus-flow-shell">
        <section className="bus-passenger-layout">
          <div className="bus-passenger-main">
            <article className="flow-card">
              <header>Bus Details</header>
              <div className="flow-card-body bus-journey-grid">
                <div>
                  <small>{bus.fromCity} - {bus.toCity}</small>
                  <strong>{formatDateLabel(flowState.searchContext?.departureDate || bus.departureDate)}</strong>
                </div>
                <div>
                  <small>Depart Time</small>
                  <strong>{bus.departureTime}</strong>
                </div>
                <div className="journey-duration">
                  <Clock3 size={16} />
                  <strong>{bus.duration}</strong>
                </div>
                <div>
                  <small>Arrival Time</small>
                  <strong>{bus.arrivalTime}</strong>
                </div>
                <div>
                  <small>Seat No</small>
                  <strong>{selectedSeats.map((seat) => seat.label).join(", ")}</strong>
                </div>
                <div className="journey-point">
                  <span>Boarding Time & Address</span>
                  <strong>{boardingPoint.time}</strong>
                  <p>{boardingPoint.name}</p>
                  <small>{boardingPoint.address}</small>
                </div>
                <div className="journey-point">
                  <span>Dropping Time & Address</span>
                  <strong>{droppingPoint.time}</strong>
                  <p>{droppingPoint.name}</p>
                  <small>{droppingPoint.address}</small>
                </div>
              </div>
            </article>

            <article className="flow-card">
              <header>Passenger Details</header>
              <div className="flow-card-body">
                {passengers.map((passenger, index) => (
                  <div className="passenger-row" key={passenger.id}>
                    <h4>
                      Passenger {index + 1} <span>Seat {passenger.seatNumber}</span>
                    </h4>
                    <div className="passenger-fields">
                      <select
                        value={passenger.gender}
                        onChange={(event) => updatePassenger(index, "gender", event.target.value)}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={passenger.fullName}
                        onChange={(event) => updatePassenger(index, "fullName", event.target.value)}
                        style={{ gridColumn: "2 / -1" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="flow-card">
              <header>Contact Details</header>
              <div className="flow-card-body contact-grid">
                <label>
                  <span>Enter Your Email:</span>
                  <div className="contact-input">
                    <Mail size={14} />
                    <input
                      type="email"
                      placeholder="Email id"
                      value={contact.email}
                      onChange={(event) =>
                        setContact((previous) => ({ ...previous, email: event.target.value }))
                      }
                    />
                  </div>
                </label>
                <label>
                  <span>Enter Your Mobile:</span>
                  <div className="contact-input">
                    <Phone size={14} />
                    <input
                      type="text"
                      placeholder="Mobile"
                      value={contact.mobile}
                      onChange={(event) =>
                        setContact((previous) => ({
                          ...previous,
                          mobile: event.target.value,
                          whatsappNumber:
                            previous.whatsappUpdates && !previous.whatsappNumber
                              ? event.target.value
                              : previous.whatsappNumber,
                        }))
                      }
                    />
                  </div>
                </label>

                <label style={{ gridColumn: "1 / -1" }}>
                  <span>WhatsApp Updates:</span>
                  <div className="contact-input" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                    <input
                      type="checkbox"
                      checked={contact.whatsappUpdates}
                      onChange={(event) =>
                        setContact((previous) => ({
                          ...previous,
                          whatsappUpdates: event.target.checked,
                          whatsappNumber:
                            event.target.checked && !previous.whatsappNumber
                              ? previous.mobile
                              : previous.whatsappNumber,
                        }))
                      }
                      style={{ width: 16, height: 16, margin: 0 }}
                    />
                    <input
                      type="text"
                      placeholder="WhatsApp no. (defaults to mobile)"
                      value={contact.whatsappNumber}
                      onChange={(event) =>
                        setContact((previous) => ({
                          ...previous,
                          whatsappNumber: event.target.value,
                        }))
                      }
                      disabled={!contact.whatsappUpdates}
                    />
                  </div>
                </label>
              </div>
            </article>

            <article className="flow-card">
              <header>Acknowledgement</header>
              <div className="flow-card-body acknowledgement">
                <label className="ack-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToFare}
                    onChange={(event) => setAgreedToFare(event.target.checked)}
                  />
                  <span>I agree to the rules and restrictions of this fare, and the terms of this fare.</span>
                </label>

                <div className="ack-pay-strip">
                  <span>Travel....</span>
                  <small>VISA  Mastercard  RuPay  UPI</small>
                </div>

                {formError && <p className="flow-error">{formError}</p>}

                <button
                  type="button"
                  className="flow-continue-btn align-right"
                  onClick={handleOpenConfirmation}
                >
                  Continue
                </button>
              </div>
            </article>
          </div>

          <aside className="bus-passenger-side">
            <article className="flow-card">
              <header>Fare Details</header>
              <div className="flow-card-body fare-list">
                <div><span>Base Fare</span><strong>{formatCurrency(fareSummary.baseFare)}</strong></div>
                <div><span>Tax</span><strong>(+) {formatCurrency(fareSummary.tax)}</strong></div>
                <div><span>Convenience Fee</span><strong>(+) {formatCurrency(fareSummary.convenienceFee)}</strong></div>
                <div className="grand-total">
                  <span>Estimated Total</span>
                  <strong>{formatCurrency(estimatedTotal)}</strong>
                </div>
              </div>
            </article>

            <article className="flow-card">
              <header>Apply Coupon</header>
              <div className="flow-card-body coupon-box">
                <input
                  type="text"
                  placeholder="Enter Coupon code"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <button type="button" onClick={handleApplyCoupon}>APPLY</button>
              </div>
            </article>
          </aside>
        </section>

        {showConfirmation && (
          <div className="flow-modal-backdrop" onClick={() => setShowConfirmation(false)}>
            <section className="flow-modal" onClick={(event) => event.stopPropagation()}>
              <header className="flow-modal-header">
                <h3>Please Confirm your Bus</h3>
                <button type="button" onClick={() => setShowConfirmation(false)}>
                  <X size={16} />
                </button>
              </header>

              <div className="flow-modal-grid">
                <div className="flow-modal-main">
                  <article className="flow-card compact">
                    <header>Journey Details</header>
                    <div className="flow-card-body">
                      <p><strong>{bus.fromCity} - {bus.toCity}</strong></p>
                      <p>{bus.departureTime} to {bus.arrivalTime} | {bus.duration}</p>
                      <p>Boarding: {boardingPoint.name} ({boardingPoint.time})</p>
                      <p>Dropping: {droppingPoint.name} ({droppingPoint.time})</p>
                    </div>
                  </article>

                  <article className="flow-card compact">
                    <header>Passenger Detail</header>
                    <div className="flow-card-body detail-list">
                      {passengers.map((passenger) => (
                        <div key={passenger.id}>
                          <User size={14} />
                          <span>
                            {passenger.fullName} ({normalizeGender(passenger.gender) || "Male"}) (Seat {passenger.seatNumber})
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="flow-card compact">
                    <header>Contact Detail</header>
                    <div className="flow-card-body detail-list">
                      <div><Mail size={14} /><span>{contact.email}</span></div>
                      <div><Phone size={14} /><span>{contact.mobile}</span></div>
                    </div>
                  </article>
                </div>

                <aside className="flow-modal-side">
                  <article className="flow-card compact">
                    <header>Fare Details</header>
                    <div className="flow-card-body fare-list">
                      <div><span>Base Fare</span><strong>{formatCurrency(fareSummary.baseFare)}</strong></div>
                      <div><span>Tax</span><strong>(+) {formatCurrency(fareSummary.tax)}</strong></div>
                      <div><span>Convenience Fee</span><strong>(+) {formatCurrency(fareSummary.convenienceFee)}</strong></div>
                      <div className="grand-total">
                        <span>Estimated Total</span>
                        <strong>{formatCurrency(estimatedTotal)}</strong>
                      </div>
                    </div>
                  </article>

                  <div className="flow-modal-actions">
                    <button type="button" onClick={() => setShowConfirmation(false)}>Close</button>
                    <button type="button" className="proceed" onClick={handleProceedPayment}>
                      Proceed Payment
                    </button>
                  </div>
                </aside>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
