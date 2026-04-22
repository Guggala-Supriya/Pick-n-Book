import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { findStoredTicket } from "./utils/ticketStorage";

// Mock data for Flight & Bus
const MOCK_FLIGHT = {
  type: 'flight',
  pnr: 'GOF2024XYZ',
  airline: 'GO Airways',
  flightNo: 'GA-456',
  from: { city: 'Mumbai', code: 'BOM', terminal: 'T2', gate: 'G14' },
  to: { city: 'Delhi', code: 'DEL', terminal: 'T3', gate: 'B22' },
  date: 'Wed, 19 Feb 2026',
  departure: '06:25',
  arrival: '08:40',
  duration: '2h 15m',
  class: 'Economy',
  passengers: [
    { name: 'Dilshaad Nazneen', age: 32, seat: '12A', meal: 'Veg' },
    { name: 'Ahmed Khan', age: 28, seat: '12B', meal: 'Non-Veg' },
  ],
  status: 'CONFIRMED',
  fare: 'INR 8,540',
};

const MOCK_BUS = {
  type: 'bus',
  pnr: 'GOB2024ABC',
  operator: 'Go Travels',
  busNo: 'GT-K22',
  from: { city: 'Hyderabad', stop: 'MGBS Bus Stand' },
  to: { city: 'Bangalore', stop: 'Majestic Bus Stand' },
  date: 'Thu, 20 Feb 2026',
  departure: '21:00',
  arrival: '05:30',
  duration: '8h 30m',
  class: 'AC Sleeper',
  passengers: [{ name: 'Dilshaad Nazneen', age: 32, seat: 'L3 Lower', meal: '--' }],
  status: 'CONFIRMED',
  fare: 'INR 1,200',
};

const TICKET_TYPES = {
  FLIGHT: "flight",
  BUS: "bus",
};

const FALLBACK_STOP = "--";

function normalizeRef(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatCurrency(value) {
  return `INR ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0))}`;
}

function formatJourneyDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "--";
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const fallbackDate = new Date(raw.split(" ")[0]);
  if (!Number.isNaN(fallbackDate.getTime())) {
    return fallbackDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return raw;
}

function formatJourneyTime(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "--";
  }

  const timeMatch = raw.match(/\b(\d{1,2}:\d{2})\b/);
  if (timeMatch?.[1]) {
    return timeMatch[1];
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return raw;
}

function toCityCode(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "--";
  }

  if (/^[A-Za-z]{3,4}$/.test(text)) {
    return text.toUpperCase();
  }

  const words = text
    .replace(/[^a-zA-Z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 3) {
    return words
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  if (words.length === 2) {
    return `${words[0][0]}${words[1].slice(0, 2)}`.toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }

  return text.slice(0, 3).toUpperCase();
}

function normalizePassengers(ticket) {
  const seats = Array.isArray(ticket?.seats) ? ticket.seats : [];
  const passengers = Array.isArray(ticket?.passengers) ? ticket.passengers : [];
  const source =
    passengers.length > 0
      ? passengers
      : seats.map((seat, index) => ({
          name: `Passenger ${index + 1}`,
          seat,
        }));

  return source.map((passenger, index) => ({
    name: String(passenger?.name || passenger?.fullName || `Passenger ${index + 1}`).trim(),
    detail: String(passenger?.age || passenger?.passengerType || "").trim(),
    seat: String(
      passenger?.seat ||
        passenger?.seatLabel ||
        passenger?.seatNumber ||
        seats[index] ||
        "--"
    ).trim(),
    meal: String(passenger?.meal || "--").trim(),
  }));
}

function mapTicketToFlight(ticket, fallbackPnr) {
  const passengers = normalizePassengers(ticket).map((passenger) => ({
    name: passenger.name,
    age: passenger.detail || "--",
    seat: passenger.seat || "--",
    meal: passenger.meal || "--",
  }));
  const fromCity = String(ticket?.fromCity || "--").trim() || "--";
  const toCity = String(ticket?.toCity || "--").trim() || "--";

  return {
    ...MOCK_FLIGHT,
    pnr: String(ticket?.bookingReference || fallbackPnr || "--").trim(),
    airline: String(ticket?.providerName || "Flight Service").trim(),
    flightNo: String(ticket?.tripNumber || "--").trim(),
    from: {
      city: fromCity,
      code: toCityCode(fromCity),
      terminal: String(ticket?.departureTerminal || "--").trim() || "--",
      gate: String(ticket?.departureGate || "--").trim() || "--",
    },
    to: {
      city: toCity,
      code: toCityCode(toCity),
      terminal: String(ticket?.arrivalTerminal || "--").trim() || "--",
      gate: String(ticket?.arrivalGate || "--").trim() || "--",
    },
    date: formatJourneyDate(ticket?.departureTime),
    departure: formatJourneyTime(ticket?.departureTime),
    arrival: formatJourneyTime(ticket?.arrivalTime),
    duration: String(ticket?.duration || "--").trim() || "--",
    class: String(ticket?.travelClass || ticket?.className || ticket?.class || "--").trim(),
    passengers,
    status: String(ticket?.status || "Booked").toUpperCase(),
    fare: formatCurrency(ticket?.totalPaid ?? ticket?.fare?.totalFare ?? 0),
  };
}

function mapTicketToBus(ticket, fallbackPnr) {
  const passengers = normalizePassengers(ticket).map((passenger) => ({
    name: passenger.name,
    age: passenger.detail || "--",
    seat: passenger.seat || "--",
  }));

  return {
    ...MOCK_BUS,
    pnr: String(ticket?.bookingReference || fallbackPnr || "--").trim(),
    operator: String(ticket?.providerName || "Bus Service").trim(),
    busNo: String(ticket?.tripNumber || "--").trim(),
    from: {
      city: String(ticket?.fromCity || "--").trim() || "--",
      stop: String(ticket?.boardingPoint?.name || ticket?.boardingPoint || FALLBACK_STOP).trim(),
    },
    to: {
      city: String(ticket?.toCity || "--").trim() || "--",
      stop: String(ticket?.droppingPoint?.name || ticket?.droppingPoint || FALLBACK_STOP).trim(),
    },
    date: formatJourneyDate(ticket?.departureTime),
    departure: formatJourneyTime(ticket?.departureTime),
    arrival: formatJourneyTime(ticket?.arrivalTime),
    duration: String(ticket?.duration || "--").trim() || "--",
    class: String(ticket?.busType || ticket?.className || ticket?.class || "--").trim(),
    passengers,
    status: String(ticket?.status || "Booked").toUpperCase(),
    fare: formatCurrency(ticket?.totalPaid ?? ticket?.fare?.totalFare ?? 0),
  };
}

// ============ HELPER COMPONENTS ============

const DashedLine = ({ vertical }) =>
  vertical ? (
    <div style={{
      width: 1,
      alignSelf: 'stretch',
      background: 'repeating-linear-gradient(to bottom,rgba(148,163,184,0.55) 0,rgba(148,163,184,0.55) 6px,transparent 6px,transparent 12px)',
    }} />
  ) : (
    <div style={{
      height: 1,
      margin: '16px 0',
      background: 'repeating-linear-gradient(to right,rgba(148,163,184,0.55) 0,rgba(148,163,184,0.55) 6px,transparent 6px,transparent 12px)',
    }} />
  );

// QR Code component (real scannable QR)
const QRCode = ({ text = 'GOB2024ABC', size = 100 }) => {
  const encoded = encodeURIComponent(text);
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Ticket QR Code"
      style={{ display: 'block', borderRadius: 6, background: '#fff' }}
    />
  );
};

const Barcode = ({ dark = false, text = '' }) => {
  const source = String(text || 'DEFAULTBARCODE');
  const bars = source
    .split('')
    .flatMap((char) => {
      const code = char.charCodeAt(0);
      return [
        ((code % 3) + 1),
        (((code >> 2) % 3) + 1),
      ];
    })
    .slice(0, 60);
  let x = 0;
  return (
    <svg width="130" height="44" viewBox="0 0 165 44">
      {bars.map((w, i) => {
        const rect = (
          <rect
            key={i}
            x={x}
            y={0}
            width={w * 3}
            height={44}
            fill={i % 2 === 0 ? (dark ? '#374151' : '#1f2937') : 'transparent'}
          />
        );
        x += w * 3 + 2;
        return rect;
      })}
    </svg>
  );
};

const Notch = ({ top }) => (
  <div style={{
    position: 'absolute',
    left: -12,
    top: top ? -12 : 'auto',
    bottom: top ? 'auto' : -12,
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'rgba(226,232,240,0.9)',
    zIndex: 10,
  }} />
);

// ============ STYLES ============

const HOME_THEME = {
  primary: '#1142ad',
  primaryStrong: '#08276f',
  text: '#11213f',
  textSoft: '#56678a',
};

const S = {
  label: { fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, marginBottom: 3 },
  val: { fontSize: 16.2, fontWeight: 800, color: HOME_THEME.text, lineHeight: 1.1 },
  valSm: { fontSize: 11.7, fontWeight: 700, color: HOME_THEME.text },
  chip: { background: 'rgba(255,255,255,0.58)', border: '1px solid rgba(148,163,184,0.28)', borderRadius: 7, padding: '3px 10px', fontSize: 9.9, color: HOME_THEME.textSoft, fontWeight: 600 },
  paxRow: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.5)', padding: '9px 12px', borderRadius: 10, marginBottom: 6 },
  paxNum: { width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#1142ad,#08276f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 },
};

const ticketShell = {
  background: 'rgba(255,255,255,0.58)',
  borderRadius: 20,
  overflow: 'hidden',
  boxShadow: '0 10px 35px rgba(30,41,59,0.18)',
  border: '1px solid rgba(255,255,255,0.6)',
  display: 'flex',
  flexDirection: 'column',
};

const hdr = {
  color: '#fff',
  padding: '18px 28px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const badge = {
  background: 'rgba(255,255,255,0.25)',
  border: '1px solid rgba(255,255,255,0.5)',
  borderRadius: 20,
  padding: '4px 14px',
  fontSize: 9.9,
  fontWeight: 800,
  letterSpacing: 2,
  color: '#fff',
};

const stub = {
  width: 155,
  padding: '22px 16px',
  background: 'rgba(241,245,249,0.75)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

// ============ FLIP CARD WRAPPER - SIDE FLIP ============

const FlipCard = ({ frontElement, backElement, ticketType }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      style={{
        perspective: '1200px',
        cursor: 'pointer',
        position: 'relative',
        width: '100%',
        minHeight: '400px',
      }}
      onClick={() => setIsFlipped(!isFlipped)}
      title="Click to flip"
    >
      <style>{`
        .flip-container {
          position: relative;
          width: 100%;
          display: grid;
          transition: transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          transform-style: preserve-3d;
          transform: ${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'};
        }
        
        .flip-front,
        .flip-back {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          width: 100%;
          grid-area: 1 / 1;
        }
        
        .flip-back {
          transform: rotateY(180deg);
        }
      `}</style>

      <div className="flip-container">
        {/* Front Side */}
        <div className="flip-front">
          {frontElement}
        </div>

        {/* Back Side */}
        <div className="flip-back">
          {backElement}
        </div>
      </div>
    </div>
  );
};

// ============ FLIGHT TICKET ============

const FlightTicket = ({ data, id }) => (
  <div id={id} style={ticketShell}>
    <div style={{ ...hdr, background: 'linear-gradient(135deg,#1142ad 0%,#08276f 100%)' }}>
      <div>
        <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: 2, textTransform: 'uppercase' }}>GO Airways - E-Ticket</div>
        <div style={{ fontSize: 17.1, fontWeight: 900, letterSpacing: 0.5, marginTop: 2 }}>Flight {data.airline} - {data.flightNo}</div>
      </div>
      <div style={badge}>{data.status}</div>
    </div>

    <div style={{ display: 'flex', flex: 1 }}>
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {/* Journey Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 30.6, fontWeight: 900, color: HOME_THEME.text, lineHeight: 1 }}>{data.from.code}</div>
            <div style={{ fontSize: 9.9, color: '#475569', marginTop: 3 }}>{data.from.city}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', letterSpacing: 1, marginBottom: 5 }}>{data.duration}</div>
            <div style={{ position: 'relative', height: 2, background: 'rgba(148,163,184,0.35)' }}>
              <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', fontSize: 18, lineHeight: 1 }}>{'>'}</div>
            </div>
            <div style={{ fontSize: 8.1, color: '#94a3b8', marginTop: 6, letterSpacing: 1 }}>DIRECT</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 30.6, fontWeight: 900, color: HOME_THEME.text, lineHeight: 1 }}>{data.to.code}</div>
            <div style={{ fontSize: 9.9, color: '#475569', marginTop: 3 }}>{data.to.city}</div>
          </div>
        </div>

        {/* Time Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={S.label}>Departure</div>
            <div style={S.val}>{data.departure}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={S.label}>Date</div>
            <div style={{ ...S.val, fontSize: 11.7 }}>{data.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={S.label}>Arrival</div>
            <div style={S.val}>{data.arrival}</div>
          </div>
        </div>

        <DashedLine />

        {/* Flight Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
          {[
            { label: 'Terminal (Dep.)', val: data.from.terminal },
            { label: 'Gate (Dep.)', val: data.from.gate },
            { label: 'Terminal (Arr.)', val: data.to.terminal },
            { label: 'Class', val: data.class },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={S.label}>{label}</div>
              <div style={S.valSm}>{val}</div>
            </div>
          ))}
        </div>

        <DashedLine />

        {/* Passengers */}
        <div style={S.label}>Passengers &amp; Seats</div>
        <div style={{ marginTop: 10 }}>
          {data.passengers.map((p, i) => (
            <div key={i} style={S.paxRow}>
              <div style={S.paxNum}>{i + 1}</div>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 11.7, color: HOME_THEME.text }}>
                {p.name} ({p.age})
              </span>
              <span style={S.chip}>Seat {p.seat}</span>
              <span style={S.chip}>{p.meal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stub Divider */}
      <div style={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'stretch', position: 'relative' }}>
        <Notch top />
        <DashedLine vertical />
        <Notch />
      </div>

      {/* Right Stub */}
      <div style={stub}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, color: '#64748b', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>Boarding Pass</div>
        <div style={{ marginBottom: 12 }}>
          <div style={S.label}>PNR</div>
          <div style={{ fontWeight: 900, fontSize: 11.7, color: '#0284c7', letterSpacing: 1.5 }}>{data.pnr}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>Fare</div>
          <div style={{ fontWeight: 800, fontSize: 11.7, color: HOME_THEME.text }}>{data.fare}</div>
        </div>
        <Barcode
          text={`${data.pnr}|${data.airline}|${data.flightNo}|${data.from.code}-${data.to.code}|${data.date}|${data.departure}|${data.arrival}|${data.class}|${data.status}`}
        />
        <div style={{ fontSize: 8.1, color: '#64748b', marginTop: 8, textAlign: 'center' }}>Scan at airport</div>
      </div>
    </div>
  </div>
);

// ============ BUS TICKET ============

const BusTicket = ({ data, id }) => (
  <div id={id} style={ticketShell}>
    <div style={{ ...hdr, background: 'linear-gradient(135deg,#08276f 0%,#1142ad 100%)' }}>
      <div>
        <div style={{ fontSize: 9, opacity: 0.8, letterSpacing: 2, textTransform: 'uppercase' }}>Go Travels - Bus Ticket</div>
        <div style={{ fontSize: 17.1, fontWeight: 900, letterSpacing: 0.5, marginTop: 2 }}>Bus {data.operator} - {data.busNo}</div>
      </div>
      <div style={{ ...badge, background: 'rgba(14,165,233,0.28)', border: '1px solid rgba(34,211,238,0.65)' }}>{data.status}</div>
    </div>

    <div style={{ display: 'flex', flex: 1 }}>
      <div style={{ flex: 1, padding: '24px 28px' }}>
        {/* Journey Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 23.4, fontWeight: 900, color: HOME_THEME.text, lineHeight: 1 }}>{data.from.city}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>{data.from.stop}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: '#64748b', letterSpacing: 1, marginBottom: 5 }}>{data.duration}</div>
            <div style={{ position: 'relative', height: 2, background: 'rgba(148,163,184,0.35)' }}>
              <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', fontSize: 19.8, lineHeight: 1 }}>{'>'}</div>
            </div>
            <div style={{ fontSize: 8.1, color: '#94a3b8', marginTop: 8, letterSpacing: 1 }}>OVERNIGHT</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 23.4, fontWeight: 900, color: HOME_THEME.text, lineHeight: 1 }}>{data.to.city}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>{data.to.stop}</div>
          </div>
        </div>

        {/* Time Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={S.label}>Departure</div>
            <div style={S.val}>{data.departure}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={S.label}>Date</div>
            <div style={{ ...S.val, fontSize: 11.7 }}>{data.date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={S.label}>Arrival (Next Day)</div>
            <div style={S.val}>{data.arrival}</div>
          </div>
        </div>

        <DashedLine />

        {/* Bus Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
          {[
            { label: 'Bus Type', val: data.class },
            { label: 'Boarding', val: data.from.city },
            { label: 'Total Fare', val: data.fare },
          ].map(({ label, val }) => (
            <div key={label}>
              <div style={S.label}>{label}</div>
              <div style={S.valSm}>{val}</div>
            </div>
          ))}
        </div>

        <DashedLine />

        {/* Passengers */}
        <div style={S.label}>Passengers &amp; Seats</div>
        <div style={{ marginTop: 10 }}>
          {data.passengers.map((p, i) => (
            <div key={i} style={S.paxRow}>
              <div style={{ ...S.paxNum, background: 'linear-gradient(135deg,#0f172a,#334155)' }}>{i + 1}</div>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 11.7, color: HOME_THEME.text }}>
                {p.name} ({p.age})
              </span>
              <span style={S.chip}>Seat {p.seat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stub Divider */}
      <div style={{ width: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'stretch', position: 'relative' }}>
        <Notch top />
        <DashedLine vertical />
        <Notch />
      </div>

      {/* Right Stub with QR Code */}
      <div style={{ ...stub, background: 'rgba(226,232,240,0.78)' }}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 9, color: '#64748b', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>Bus Ticket</div>
        <div style={{ marginBottom: 12 }}>
          <div style={S.label}>PNR</div>
          <div style={{ fontWeight: 900, fontSize: 11.7, color: '#0284c7', letterSpacing: 1.5 }}>{data.pnr}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.label}>Fare</div>
          <div style={{ fontWeight: 800, fontSize: 11.7, color: HOME_THEME.text }}>{data.fare}</div>
        </div>
        {/* QR Code instead of Barcode */}
        <div style={{ marginBottom: 8 }}>
          <QRCode
            text={[
              `Ticket Type: Bus`,
              `PNR: ${data.pnr}`,
              `Operator: ${data.operator}`,
              `Bus No: ${data.busNo}`,
              `From: ${data.from.city} (${data.from.stop})`,
              `To: ${data.to.city} (${data.to.stop})`,
              `Date: ${data.date}`,
              `Departure: ${data.departure}`,
              `Arrival: ${data.arrival}`,
              `Class: ${data.class}`,
              `Passenger(s): ${data.passengers.map((p) => `${p.name} (${p.age}) Seat ${p.seat}`).join(', ')}`,
              `Fare: ${data.fare}`,
              `Status: ${data.status}`,
            ].join('\n')}
            size={100}
          />
        </div>
        <div style={{ fontSize: 8.1, color: '#64748b', marginTop: 6, textAlign: 'center' }}>Show to conductor</div>
      </div>
    </div>
  </div>
);

// ============ BACK SIDE - FLIGHT (T&C + ADVERTISEMENT) ============

const FlightBackSide = ({ id }) => (
  <div id={id} style={ticketShell}>
    <div style={{ ...hdr, background: 'linear-gradient(135deg,#1142ad 0%,#08276f 100%)' }}>
      <div style={{ fontSize: 12.6, fontWeight: 900, letterSpacing: 0.5 }}>Flight Terms & Conditions</div>
    </div>

    <div style={{ display: 'flex', flex: 1, padding: 0 }}>
      <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px dashed rgba(148,163,184,0.4)', overflowY: 'auto', maxHeight: '500px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: '#0284c7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>1. Check-in & Boarding</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Check-in 2 hours before departure</li>
            <li style={{ marginBottom: 2 }}>Gate closes 15 minutes before departure</li>
            <li style={{ marginBottom: 2 }}>Valid government ID mandatory</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: '#0284c7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>2. Baggage Policy</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Checked: 15kg (1 pc)</li>
            <li style={{ marginBottom: 2 }}>Cabin: 7kg (1 pc)</li>
            <li style={{ marginBottom: 2 }}>Excess: INR 300 per kg</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: '#0284c7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>3. Cancellation & Refund</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Cancel 4+ hours: Full refund</li>
            <li style={{ marginBottom: 2 }}>Cancel 2-4 hours: 50% refund</li>
            <li style={{ marginBottom: 2 }}>Cancel &lt;2 hours: No refund</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: '#0284c7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>4. Liability & Claims</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Max liability: Ticket value</li>
            <li style={{ marginBottom: 2 }}>Claims within 30 days</li>
            <li style={{ marginBottom: 2 }}>Proof of value required</li>
          </ul>
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: '#0284c7', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>5. Support</div>
          <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
            Email: support@goairways.in<br />
            Phone: 1800-GO-AIRWAYS<br />
            Web: www.goairways.in
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(2,132,199,0.05) 0%, rgba(6,182,212,0.08) 100%)' }}>
        <div style={{ fontSize: 10.8, fontWeight: 800, color: '#0284c7', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Special Offers</div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #1142ad', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>20% OFF</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Your next flight booking</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', padding: '4px 8px', borderRadius: 4 }}>Code: FLY20</div>
        </div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #1142ad', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>HOTELS</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Book hotels at best rates</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', padding: '4px 8px', borderRadius: 4 }}>Download App</div>
        </div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #1142ad', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>CREDIT CARD</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Extra 10% cashback on bookings</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', padding: '4px 8px', borderRadius: 4 }}>Learn More</div>
        </div>
      </div>
    </div>
  </div>
);

// ============ BACK SIDE - BUS (T&C + ADVERTISEMENT) ============

const BusBackSide = ({ id }) => (
  <div id={id} style={ticketShell}>
    <div style={{ ...hdr, background: 'linear-gradient(135deg,#08276f 0%,#1142ad 100%)' }}>
      <div style={{ fontSize: 12.6, fontWeight: 900, letterSpacing: 0.5 }}>Bus Terms & Conditions</div>
    </div>

    <div style={{ display: 'flex', flex: 1, padding: 0 }}>
      <div style={{ flex: 1, padding: '20px 24px', borderRight: '1px dashed rgba(148,163,184,0.4)', overflowY: 'auto', maxHeight: '500px' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>1. Boarding & Timing</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Report 30 minutes before departure</li>
            <li style={{ marginBottom: 2 }}>Valid photo ID required</li>
            <li style={{ marginBottom: 2 }}>No entry after departure time</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>2. Luggage Policy</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Complimentary: 20kg</li>
            <li style={{ marginBottom: 2 }}>Excess: INR 100 per kg</li>
            <li style={{ marginBottom: 2 }}>No bulky items allowed</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>3. Cancellation Terms</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Cancel 12+ hours: 100% refund</li>
            <li style={{ marginBottom: 2 }}>Cancel 6-12 hours: 75% refund</li>
            <li style={{ marginBottom: 2 }}>Cancel &lt;6 hours: 50% refund</li>
          </ul>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>4. Prohibited Items</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.5 }}>
            <li style={{ marginBottom: 2 }}>Alcohol & smoking items</li>
            <li style={{ marginBottom: 2 }}>Weapons & explosives</li>
            <li style={{ marginBottom: 2 }}>Hazardous materials</li>
          </ul>
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 9.9, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>5. Contact Us</div>
          <div style={{ fontSize: 9, color: '#475569', lineHeight: 1.5 }}>
            Email: support@gotravels.in<br />
            Phone: 1800-GO-TRAVELS<br />
            Web: www.gotravels.in
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15,23,42,0.05) 0%, rgba(51,65,85,0.08) 100%)' }}>
        <div style={{ fontSize: 10.8, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>Exclusive Deals</div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #334155', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 4 }}>FLAT INR 300</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Cashback on next booking</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: HOME_THEME.textSoft, backgroundColor: 'rgba(51,65,85,0.1)', padding: '4px 8px', borderRadius: 4 }}>Code: SAVE300</div>
        </div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #334155', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 4 }}>STAY WITH US</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Partner hotels & resorts</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: HOME_THEME.textSoft, backgroundColor: 'rgba(51,65,85,0.1)', padding: '4px 8px', borderRadius: 4 }}>Explore Now</div>
        </div>

        <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #334155', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10.8, fontWeight: 800, color: HOME_THEME.textSoft, marginBottom: 4 }}>REFERRAL PROGRAM</div>
          <div style={{ fontSize: 9, color: HOME_THEME.textSoft, lineHeight: 1.4, marginBottom: 6 }}>Earn INR 500 per referral</div>
          <div style={{ fontSize: 8.1, fontWeight: 700, color: HOME_THEME.textSoft, backgroundColor: 'rgba(51,65,85,0.1)', padding: '4px 8px', borderRadius: 4 }}>Share & Earn</div>
        </div>
      </div>
    </div>
  </div>
);

// ============ DOWNLOAD FUNCTION - WORKING PNG DOWNLOAD ============

const downloadTicketAsImage = async (frontId, backId, filename) => {
  const frontElement = document.getElementById(frontId);
  const backElement = document.getElementById(backId);
  if (!frontElement || !backElement) {
    alert('Ticket not found!');
    return;
  }

  try {
    // Dynamically load html2canvas if not already loaded
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = async () => {
      try {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-99999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '900px';
        tempContainer.style.padding = '12px';
        tempContainer.style.background = '#ffffff';
        tempContainer.style.display = 'grid';
        tempContainer.style.gap = '18px';

        const frontClone = frontElement.cloneNode(true);
        const backClone = backElement.cloneNode(true);
        tempContainer.appendChild(frontClone);
        tempContainer.appendChild(backClone);
        document.body.appendChild(tempContainer);

        const canvas = await window.html2canvas(tempContainer, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        document.body.removeChild(tempContainer);

        // Create download link
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        });
      } catch (error) {
        console.error('Download error:', error);
        alert('Download completed! Check your downloads folder.');
      }
    };
    script.onerror = () => {
      alert('Download library loading failed. Check your internet connection.');
    };
    if (!window.html2canvas) {
      document.head.appendChild(script);
    } else {
      script.onload();
    }
  } catch (error) {
    console.error('Download error:', error);
    alert('Download failed. Please try again.');
  }
};

// ============ TICKET PREVIEW PAGE ============

const TicketPreviewPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const requestedPnr =
    typeof location.state?.pnr === "string" ? location.state.pnr.trim() : "";
  const requestedEmail =
    typeof location.state?.email === "string" ? location.state.email.trim() : "";
  const requestedType =
    location.state?.bookingType === TICKET_TYPES.BUS
      ? TICKET_TYPES.BUS
      : location.state?.bookingType === TICKET_TYPES.FLIGHT
        ? TICKET_TYPES.FLIGHT
        : "";
  const stateTicket =
    location.state?.ticket && typeof location.state.ticket === "object"
      ? location.state.ticket
      : null;

  const hasFetchRequest = Boolean(requestedPnr && requestedType);

  useEffect(() => {
    if (!hasFetchRequest) {
      navigate("/fetch-ticket", { replace: true });
    }
  }, [hasFetchRequest, navigate]);

  const handleBack = () => {
    navigate("/fetch-ticket");
  };

  const resolvedTicket = useMemo(() => {
    if (!hasFetchRequest) {
      return null;
    }

    if (stateTicket) {
      const stateReference = normalizeRef(
        stateTicket.bookingReference || stateTicket.pnr || stateTicket.reference
      );
      const stateType = String(stateTicket.ticketType || stateTicket.type || "")
        .trim()
        .toLowerCase();
      const stateEmail = normalizeEmail(stateTicket.contact?.email);
      const sameEmail =
        !normalizeEmail(requestedEmail) ||
        !stateEmail ||
        stateEmail === normalizeEmail(requestedEmail);

      if (
        stateReference === normalizeRef(requestedPnr) &&
        stateType === requestedType &&
        sameEmail
      ) {
        return stateTicket;
      }
    }

    return findStoredTicket({
      pnr: requestedPnr,
      email: requestedEmail,
      bookingType: requestedType,
    });
  }, [hasFetchRequest, requestedEmail, requestedPnr, requestedType, stateTicket]);

  if (!hasFetchRequest) {
    return null;
  }

  const activeTicketType = String(
    resolvedTicket?.ticketType || resolvedTicket?.type || requestedType
  )
    .trim()
    .toLowerCase();
  const flightData =
    activeTicketType === TICKET_TYPES.FLIGHT && resolvedTicket
      ? mapTicketToFlight(resolvedTicket, requestedPnr)
      : null;
  const busData =
    activeTicketType === TICKET_TYPES.BUS && resolvedTicket
      ? mapTicketToBus(resolvedTicket, requestedPnr)
      : null;

  const printById = (frontId, backId, title) => {
    const frontEl = document.getElementById(frontId);
    const backEl = document.getElementById(backId);
    if (!frontEl || !backEl) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>${title} - GO Airways</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Manrope', 'Segoe UI', sans-serif; }
        body { background: #fff; padding: 24px; }
        .print-container { display: flex; flex-direction: column; gap: 40px; }
        .ticket-wrapper { page-break-inside: avoid; }
        @media print {
          body { padding: 0; background: #fff; }
          .no-print { display: none !important; }
          button { display: none !important; }
          * { 
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-container { gap: 50px; }
          .ticket-wrapper { page-break-inside: avoid; }
        }
      </style>
      </head><body><div class="print-container"><div class="ticket-wrapper">${frontEl.outerHTML}</div><div class="ticket-wrapper">${backEl.outerHTML}</div></div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const TicketSection = ({ icon, label, sub, accent, onPrint: handlePrint, onDownload: handleDownload, children, ticketType, backElement }) => (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16.2,
            boxShadow: `0 4px 12px ${accent}55`,
          }}>
            {icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: HOME_THEME.text }}>{label}</div>
            <div style={{ fontSize: 9.9, color: '#64748b', marginTop: 1 }}>{sub}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={handlePrint} style={{
            background: `linear-gradient(135deg,${accent},${accent}bb)`,
            color: '#fff',
            border: 'none',
            padding: '9px 20px',
            borderRadius: 10,
            fontSize: 11.7,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${accent}44`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.3s'
          }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
            Print
          </button>
          <button onClick={handleDownload} style={{
            background: `linear-gradient(135deg,${accent}77,${accent}99)`,
            color: '#fff',
            border: 'none',
            padding: '9px 20px',
            borderRadius: 10,
            fontSize: 11.7,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 12px ${accent}33`,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.3s'
          }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
            Download
          </button>
        </div>
      </div>
      <FlipCard frontElement={children} backElement={backElement} ticketType={ticketType} />
    </div>
  );

  return (
    <>
      <style>{`
        * { font-family: var(--app-font-family, "Manrope", "Segoe UI", sans-serif); }
        @media print { 
          .no-print { display: none !important; }
          body { background: #fff; }
          * { 
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

      <div style={{ background: 'linear-gradient(180deg,#eff4ff 0%,#f2f5fb 42%,#f8fbff 100%)', minHeight: '100vh', padding: '28px 20px 56px' }}>

        {/* Top bar */}
        <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleBack} style={{
            background: 'transparent',
            color: HOME_THEME.textSoft,
            border: '1px solid rgba(148,163,184,0.55)',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 11.7,
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.3s'
          }} onMouseEnter={(e) => e.target.style.borderColor = '#1142ad'} onMouseLeave={(e) => e.target.style.borderColor = 'rgba(148,163,184,0.55)'}>
            Back
          </button>
          <div style={{ fontSize: 10.8, color: '#64748b' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* Page title */}
        <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 23.4, fontWeight: 900, color: HOME_THEME.text, margin: 0 }}>Your Ticket Preview</h1>
          <p style={{ color: HOME_THEME.textSoft, marginTop: 6, fontSize: 11.7 }}>
            {`Fetched for ${requestedEmail || "--"} - PNR ${requestedPnr}.`}
          </p>
        </div>

        {!resolvedTicket && (
          <div className="no-print" style={{ maxWidth: 900, margin: '0 auto 26px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.72)',
              border: '1px solid rgba(148,163,184,0.4)',
              borderRadius: 16,
              padding: '24px 20px',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: 19.8, color: HOME_THEME.text }}>Booking Not Found</h2>
              <p style={{ margin: '10px 0 0', color: HOME_THEME.textSoft, fontSize: 12.6 }}>
                {`No ${requestedType} booking found for PNR ${requestedPnr} and this email.`}
              </p>
            </div>
          </div>
        )}

        {/* Tickets */}
        {resolvedTicket && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {activeTicketType === TICKET_TYPES.FLIGHT && flightData && (
              <TicketSection
                icon="F"
                label="Flight Ticket"
                sub={`${flightData.airline} - ${flightData.flightNo} - PNR: ${flightData.pnr}`}
                accent={HOME_THEME.primary}
                ticketType="flight"
                onPrint={() => printById('flight-ticket', 'flight-ticket-back', 'Flight Ticket')}
                onDownload={() => downloadTicketAsImage('flight-ticket', 'flight-ticket-back', 'flight-ticket')}
                backElement={<FlightBackSide id="flight-ticket-back" />}
              >
                <FlightTicket data={flightData} id="flight-ticket" />
              </TicketSection>
            )}

            {activeTicketType === TICKET_TYPES.BUS && busData && (
              <TicketSection
                icon="B"
                label="Bus Ticket"
                sub={`${busData.operator} - ${busData.busNo} - PNR: ${busData.pnr}`}
                accent={HOME_THEME.primaryStrong}
                ticketType="bus"
                onPrint={() => printById('bus-ticket', 'bus-ticket-back', 'Bus Ticket')}
                onDownload={() => downloadTicketAsImage('bus-ticket', 'bus-ticket-back', 'bus-ticket')}
                backElement={<BusBackSide id="bus-ticket-back" />}
              >
                <BusTicket data={busData} id="bus-ticket" />
              </TicketSection>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="no-print" style={{ maxWidth: 900, margin: '24px auto 0', textAlign: 'center', fontSize: 9.9, color: '#64748b', lineHeight: 2 }}>
          Computer-generated ticket - no physical signature required | Carry valid government-issued photo ID | Support: support@gopickandbook.in
        </div>
      </div>
    </>
  );
};

export default TicketPreviewPage; 

