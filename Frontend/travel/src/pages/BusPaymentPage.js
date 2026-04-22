import React, { useState } from "react";
import {
  CreditCard,
  Landmark,
  Loader2,
  Smartphone,
  Wallet,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookBus } from "../api/busBookingsApi";
import { sendBookingNotifications } from "../api/bookingNotificationsApi";
import "../STYLES/BusBookingFlow.css";
import { upsertStoredTicket, writeLatestStoredTicket } from "../utils/ticketStorage";
import {
  clearBusBookingFlowState,
  readBusBookingFlowState,
} from "./busBookingFlowStore";

function formatCurrency(amount) {
  return `\u20b9 ${new Intl.NumberFormat("en-IN").format(Number(amount) || 0)}`;
}

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", icon: Landmark },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

function normalizeGender(value, fallback = "Male") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "female") {
    return "Female";
  }
  if (normalized === "male") {
    return "Male";
  }
  return fallback;
}

function buildBookingPayload(flowState) {
  const selectedSeats = Array.isArray(flowState.selectedSeats)
    ? flowState.selectedSeats
    : [];
  const selectedSeatLabels = Array.isArray(flowState.selectedSeatLabels)
    ? flowState.selectedSeatLabels
    : [];

  const selectedSeatNumbers = selectedSeatLabels
    .map((seat) => String(seat || "").trim())
    .filter(Boolean);
  const selectedSeatNumbersFallback =
    selectedSeatNumbers.length > 0
      ? selectedSeatNumbers
      : selectedSeats
          .map((seat) => String(seat?.label || seat || "").trim())
          .filter(Boolean);
  const passengersFromFlow =
    Array.isArray(flowState.passengers) && flowState.passengers.length > 0
      ? flowState.passengers
      : [];

  const fallbackPassengers = selectedSeatNumbersFallback.map((seatNumber, index) => ({
    fullName: `Passenger ${index + 1}`,
    gender: "Male",
    seatNumber,
  }));

  const passengers =
    passengersFromFlow.length > 0
      ? passengersFromFlow.map((passenger, index) => {
          const fullName = String(passenger?.fullName || "").trim() || `Passenger ${index + 1}`;
          const gender = normalizeGender(passenger?.gender, "Male");
          const seatNumberFromSelection = String(selectedSeatNumbersFallback[index] || "").trim();
          const seatNumber = String(
            seatNumberFromSelection || passenger?.seatNumber || selectedSeats[index]?.label || ""
          ).trim();

          return {
            fullName,
            gender,
            ...(seatNumber ? { seatNumber } : {}),
          };
        })
      : fallbackPassengers;

  const passengerName = String(
    flowState.passengerName || passengers[0]?.fullName || ""
  ).trim();
  const passengerPhone = String(flowState.contact?.mobile || "").trim();
  const passengerEmail = String(flowState.contact?.email || "").trim();
  const couponCode = String(flowState.couponCode || "").trim().toUpperCase();

  return {
    ...(passengerName ? { passengerName } : {}),
    passengerPhone,
    ...(passengerEmail ? { passengerEmail } : {}),
    ...(couponCode ? { couponCode } : {}),
    passengers,
  };
}

function isPaymentInputValid(method, formValues) {
  if (method === "upi") {
    return /\S+@\S+/.test(formValues.upiId || "");
  }

  if (method === "card") {
    return (
      String(formValues.cardNumber || "").replace(/\D/g, "").length >= 12 &&
      String(formValues.nameOnCard || "").trim().length >= 2 &&
      String(formValues.expiry || "").trim().length >= 4 &&
      String(formValues.cvv || "").replace(/\D/g, "").length >= 3
    );
  }

  if (method === "netbanking") {
    return Boolean(formValues.bankName);
  }

  if (method === "wallet") {
    return Boolean(formValues.walletProvider);
  }

  return false;
}

function buildBusTicketPayloadFromBooking(
  flowState,
  bookingRecord,
  bookingReference,
  paymentMethod,
  mode = "live"
) {
  const bus = flowState.bus || {};
  const selectedSeats = Array.isArray(flowState.selectedSeats)
    ? flowState.selectedSeats
    : [];
  const passengersFromFlow = Array.isArray(flowState.passengers) ? flowState.passengers : [];
  const fareSummary = flowState.fareSummary || {};
  const apiPassengers = Array.isArray(bookingRecord?.passengers) ? bookingRecord.passengers : [];
  const apiSeatAssignments = apiPassengers
    .map((passenger) => passenger?.seatNumber)
    .filter(Boolean);

  const resolvedReference = String(
    bookingRecord?.bookingReference || bookingReference || ""
  ).trim();
  const departureTimeRaw =
    bookingRecord?.departureTimeUtc ||
    bookingRecord?.departureTimeIst ||
    [flowState.searchContext?.departureDate, bus.departureTime || ""]
      .filter(Boolean)
      .join(" ")
      .trim();
  const bookedAtRaw = bookingRecord?.bookedAtUtc || new Date().toISOString();

  const contact =
    flowState.contact && typeof flowState.contact === "object" ? { ...flowState.contact } : {};
  if (!String(contact.email || "").trim() && bookingRecord?.passengerEmail) {
    contact.email = bookingRecord.passengerEmail;
  }
  if (!String(contact.mobile || "").trim() && bookingRecord?.passengerPhone) {
    contact.mobile = bookingRecord.passengerPhone;
  }

  const resolvedTotalPaid = Number(
    bookingRecord?.totalPriceInr || flowState.payableAmount || fareSummary.totalFare || 0
  );

  return {
    ticketType: "bus",
    bookingReference: resolvedReference || bookingReference,
    status: bookingRecord?.status || "Booked",
    providerName: bookingRecord?.providerName || bus.operatorName || "Bus Service",
    tripNumber: bookingRecord?.tripNumber || bus.busNumber || "--",
    fromCity:
      bookingRecord?.fromCity ||
      bus.fromCity ||
      flowState.searchContext?.source ||
      "--",
    toCity:
      bookingRecord?.toCity ||
      bus.toCity ||
      flowState.searchContext?.destination ||
      "--",
    departureTime: departureTimeRaw || "--",
    arrivalTime:
      bookingRecord?.arrivalTimeUtc ||
      bookingRecord?.arrivalTimeIst ||
      bus.arrivalTime ||
      "--",
    duration: bus.duration || "--",
    bookedAt: bookedAtRaw,
    passengers:
      apiPassengers.length > 0
        ? apiPassengers.map((passenger, index) => ({
            name: passenger.fullName || `Passenger ${index + 1}`,
            passengerType: "Adult",
            seat: passenger.seatNumber || "",
          }))
        : passengersFromFlow.map((passenger, index) => ({
            name: String(passenger?.fullName || "").trim() || `Passenger ${index + 1}`,
            passengerType: "Adult",
            seat: String(passenger?.seatNumber || passenger?.seatLabel || "").trim(),
          })),
    seats:
      apiSeatAssignments.length > 0
        ? apiSeatAssignments
        : selectedSeats.map((seat) => seat.label || seat),
    contact,
    paymentMethod:
      PAYMENT_METHODS.find((method) => method.id === paymentMethod)?.label ||
      paymentMethod,
    fare: {
      baseFare: Number(bookingRecord?.netFareInr || fareSummary.baseFare || 0),
      tax: 0,
      convenienceFee: Number(
        bookingRecord?.convenienceFeeInr || fareSummary.convenienceFee || 0
      ),
      discount: Number(bookingRecord?.discountAmountInr || 0),
      totalFare: resolvedTotalPaid,
    },
    totalPaid: resolvedTotalPaid,
    notifications: {
      email: "Queued",
      sms: "Queued",
      whatsapp: contact?.whatsappUpdates ? "Queued" : "Skipped",
    },
    mode,
  };
}

function navigateToBusPrintTicket(navigate, ticketPayload) {
  const bookingReference = String(ticketPayload?.bookingReference || "").trim();
  const contactEmail = String(ticketPayload?.contact?.email || "").trim();

  navigate("/print-ticket", {
    replace: true,
    state: {
      pnr: bookingReference,
      email: contactEmail,
      bookingType: "bus",
      ticket: {
        ...ticketPayload,
        bookingReference,
        ticketType: "bus",
      },
    },
  });
}

export default function BusPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const persistedState = readBusBookingFlowState();
  const incomingState = location.state || {};
  const flowState = incomingState.bus ? incomingState : persistedState || {};

  const bus = flowState.bus || null;
  const selectedSeats = flowState.selectedSeats || [];
  const boardingPoint = flowState.boardingPoint || null;
  const droppingPoint = flowState.droppingPoint || null;
  const passengers = flowState.passengers || [];
  const fareSummary = flowState.fareSummary || {};
  const payableAmount = Number(flowState.payableAmount || fareSummary.totalFare || 0);

  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [formValues, setFormValues] = useState({
    upiId: "",
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
    cvv: "",
    bankName: "",
    walletProvider: "",
  });
  const [paymentError, setPaymentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!bus || !boardingPoint || !droppingPoint || selectedSeats.length === 0) {
    return (
      <main className="bus-flow-page">
        <div className="bus-flow-shell">
          <section className="bus-flow-empty">
            <h2>Payment details unavailable</h2>
            <p>Complete seat and passenger details before opening payment.</p>
            <button type="button" onClick={() => navigate("/bus/passenger-details")}>
              Back to Passenger Details
            </button>
          </section>
        </div>
      </main>
    );
  }

  const handlePayNow = async () => {
    if (!isPaymentInputValid(selectedMethod, formValues)) {
      setPaymentError("Enter valid payment details for the selected method.");
      return;
    }

    setPaymentError("");
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });

      const bookingRecord = await bookBus({
        busId: bus.id,
        payload: buildBookingPayload(flowState),
      });

      const bookingReference =
        bookingRecord?.bookingReference || `BS-${Date.now().toString().slice(-8)}`;
      const ticketPayload = buildBusTicketPayloadFromBooking(
        flowState,
        bookingRecord,
        bookingReference,
        selectedMethod,
        "live"
      );
      const notificationStatus = await sendBookingNotifications({
        bookingReference,
        ticketType: "bus",
        providerName: ticketPayload.providerName,
        fromCity: ticketPayload.fromCity,
        toCity: ticketPayload.toCity,
        departureTime: ticketPayload.departureTime,
        contact: ticketPayload.contact,
      });
      ticketPayload.notifications = notificationStatus;

      writeLatestStoredTicket(ticketPayload);
      upsertStoredTicket(ticketPayload);

      clearBusBookingFlowState();
      navigateToBusPrintTicket(navigate, ticketPayload);
    } catch (error) {
      setPaymentError(error.message || "Unable to process payment right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bus-flow-page">
      <div className="bus-flow-shell">
        <section className="flow-payment-layout">
          <div className="flow-payment-main">
            <article className="flow-card">
              <header>Select Payment Method</header>
              <div className="flow-card-body">
                <div className="payment-method-grid">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      className={selectedMethod === method.id ? "active" : ""}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <method.icon size={16} />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </article>

            <article className="flow-card">
              <header>Enter Payment Details</header>
              <div className="flow-card-body payment-form-grid">
                {selectedMethod === "upi" && (
                  <label>
                    <span>UPI ID</span>
                    <input
                      type="text"
                      placeholder="name@bank"
                      value={formValues.upiId}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, upiId: event.target.value }))
                      }
                    />
                  </label>
                )}

                {selectedMethod === "card" && (
                  <>
                    <label>
                      <span>Card Number</span>
                      <input
                        type="text"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={formValues.cardNumber}
                        onChange={(event) =>
                          setFormValues((previous) => ({
                            ...previous,
                            cardNumber: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Name on Card</span>
                      <input
                        type="text"
                        placeholder="Card holder name"
                        value={formValues.nameOnCard}
                        onChange={(event) =>
                          setFormValues((previous) => ({
                            ...previous,
                            nameOnCard: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Expiry (MM/YY)</span>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={formValues.expiry}
                        onChange={(event) =>
                          setFormValues((previous) => ({
                            ...previous,
                            expiry: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>CVV</span>
                      <input
                        type="password"
                        placeholder="CVV"
                        value={formValues.cvv}
                        onChange={(event) =>
                          setFormValues((previous) => ({ ...previous, cvv: event.target.value }))
                        }
                      />
                    </label>
                  </>
                )}

                {selectedMethod === "netbanking" && (
                  <label>
                    <span>Select Bank</span>
                    <select
                      value={formValues.bankName}
                      onChange={(event) =>
                        setFormValues((previous) => ({ ...previous, bankName: event.target.value }))
                      }
                    >
                      <option value="">Choose bank</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="axis">Axis Bank</option>
                    </select>
                  </label>
                )}

                {selectedMethod === "wallet" && (
                  <label>
                    <span>Select Wallet</span>
                    <select
                      value={formValues.walletProvider}
                      onChange={(event) =>
                        setFormValues((previous) => ({
                          ...previous,
                          walletProvider: event.target.value,
                        }))
                      }
                    >
                      <option value="">Choose wallet</option>
                      <option value="paytm">Paytm</option>
                      <option value="amazonpay">Amazon Pay</option>
                      <option value="phonepe">PhonePe Wallet</option>
                    </select>
                  </label>
                )}
              </div>
            </article>
          </div>

          <aside className="flow-payment-side">
            <article className="flow-card">
              <header>Booking Summary</header>
              <div className="flow-card-body summary-list">
                <p><strong>{bus.operatorName}</strong></p>
                <p>{bus.fromCity} -> {bus.toCity}</p>
                <p>Seat(s): {selectedSeats.map((seat) => seat.label).join(", ")}</p>
                <p>Boarding: {boardingPoint.name} ({boardingPoint.time})</p>
                <p>Dropping: {droppingPoint.name} ({droppingPoint.time})</p>
                <p>Passengers: {passengers.length}</p>
              </div>
            </article>

            <article className="flow-card">
              <header>Fare Details</header>
              <div className="flow-card-body fare-list">
                <div><span>Base Fare</span><strong>{formatCurrency(fareSummary.baseFare)}</strong></div>
                <div><span>Tax</span><strong>(+) {formatCurrency(fareSummary.tax)}</strong></div>
                <div><span>Convenience Fee</span><strong>(+) {formatCurrency(fareSummary.convenienceFee)}</strong></div>
                <div className="grand-total">
                  <span>Payable Amount</span>
                  <strong>{formatCurrency(payableAmount)}</strong>
                </div>
              </div>
            </article>

            {paymentError && <p className="flow-error">{paymentError}</p>}

            <button
              type="button"
              className="flow-pay-btn"
              onClick={handlePayNow}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Processing...</span>
                </>
              ) : (
                `Pay ${formatCurrency(payableAmount)}`
              )}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
