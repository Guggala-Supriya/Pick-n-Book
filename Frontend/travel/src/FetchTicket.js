import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./IMAGES/printticket.png";
import "./FetchTicket.css";
import { findStoredTicket } from "./utils/ticketStorage";

const FetchTicket = () => {
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState("flight");
  const [pnr, setPnr] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    let nextError = "";

    if (!pnr.trim()) {
      nextError = "PNR is required";
    } else if (pnr.trim().length < 6) {
      nextError = "PNR must be at least 6 characters";
    }

    if (!email.trim()) {
      nextError = nextError || "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextError = nextError || "Please enter a valid email";
    }

    setError(nextError);
    return !nextError;
  };

  const handleFetchBooking = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const trimmedPnr = pnr.trim();
    const trimmedEmail = email.trim();
    const matchedTicket = findStoredTicket({
      pnr: trimmedPnr,
      email: trimmedEmail,
      bookingType,
    });
    const alternateType = bookingType === "flight" ? "bus" : "flight";
    const alternateTicket = matchedTicket
      ? null
      : findStoredTicket({
          pnr: trimmedPnr,
          email: trimmedEmail,
          bookingType: alternateType,
        });
    const resolvedType = matchedTicket ? bookingType : alternateTicket ? alternateType : "";
    const resolvedTicket = matchedTicket || alternateTicket;

    if (!resolvedTicket) {
      setLoading(false);
      setError(
        "No booking found for this PNR and email. Check details and try again."
      );
      return;
    }

    setLoading(false);
    setError("");
    navigate("/print-ticket", {
      state: {
        pnr: trimmedPnr,
        email: trimmedEmail,
        bookingType: resolvedType,
        ticket: resolvedTicket,
      },
    });
  };

  return (
    <div className="fetch-ticket-page">
      <section className="fetch-ticket-card">
        <div className="fetch-ticket-visual">
          <img src={logo} alt="Fetch ticket" />
        </div>

        <div className="fetch-ticket-form-wrap">
          <span className="fetch-ticket-kicker">Ticket Access</span>
          <h1>Fetch Ticket</h1>
          <p>Enter your booking details to open your flight or bus ticket.</p>

          <div className="fetch-ticket-type-switch">
            <button
              type="button"
              className={bookingType === "flight" ? "active" : ""}
              onClick={() => {
                setBookingType("flight");
                if (error) setError("");
              }}
            >
              Flight
            </button>
            <button
              type="button"
              className={bookingType === "bus" ? "active" : ""}
              onClick={() => {
                setBookingType("bus");
                if (error) setError("");
              }}
            >
              Bus
            </button>
          </div>

          <form onSubmit={handleFetchBooking} className="fetch-ticket-form">
            <label htmlFor="fetch-ticket-pnr">PNR / Booking ID</label>
            <input
              id="fetch-ticket-pnr"
              type="text"
              value={pnr}
              onChange={(event) => {
                setPnr(event.target.value);
                if (error) setError("");
              }}
              placeholder="Enter PNR"
              className={error.toLowerCase().includes("pnr") ? "input-error" : ""}
              disabled={loading}
            />

            <label htmlFor="fetch-ticket-email">Email</label>
            <input
              id="fetch-ticket-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="Enter booking email"
              className={error.toLowerCase().includes("email") ? "input-error" : ""}
              disabled={loading}
            />

            {error && <div className="fetch-ticket-error">{error}</div>}

            <button type="submit" className="fetch-ticket-submit" disabled={loading}>
              {loading ? "Fetching..." : "Fetch Booking"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default FetchTicket;
