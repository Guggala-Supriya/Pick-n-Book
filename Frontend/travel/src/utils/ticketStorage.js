const LATEST_TICKET_STORAGE_KEY = "latest_ticket_confirmation_v1";
const TICKET_HISTORY_STORAGE_KEY = "ticket_confirmation_history_v1";
const HISTORY_LIMIT = 40;

function isBrowser() {
  return typeof window !== "undefined";
}

function toObject(value) {
  return value && typeof value === "object" ? value : null;
}

function readJsonFromSessionStorage(key) {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJsonToSessionStorage(key, value) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures.
  }
}

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

export function readLatestStoredTicket() {
  return toObject(readJsonFromSessionStorage(LATEST_TICKET_STORAGE_KEY));
}

export function writeLatestStoredTicket(ticket) {
  if (!toObject(ticket)) {
    return;
  }

  writeJsonToSessionStorage(LATEST_TICKET_STORAGE_KEY, ticket);
}

export function readStoredTicketHistory() {
  const parsed = readJsonFromSessionStorage(TICKET_HISTORY_STORAGE_KEY);
  return Array.isArray(parsed) ? parsed.filter((item) => toObject(item)) : [];
}

export function writeStoredTicketHistory(history) {
  if (!Array.isArray(history)) {
    return;
  }

  writeJsonToSessionStorage(TICKET_HISTORY_STORAGE_KEY, history);
}

export function upsertStoredTicket(ticket) {
  if (!toObject(ticket)) {
    return;
  }

  const nextReference = normalizeRef(ticket.bookingReference || ticket.pnr);
  const nextType = String(ticket.ticketType || "").trim().toLowerCase();
  if (!nextReference || !nextType) {
    return;
  }

  const deduped = readStoredTicketHistory().filter((item) => {
    const itemReference = normalizeRef(item.bookingReference || item.pnr);
    const itemType = String(item.ticketType || "").trim().toLowerCase();
    return !(itemReference === nextReference && itemType === nextType);
  });

  const nextHistory = [ticket, ...deduped].slice(0, HISTORY_LIMIT);
  writeStoredTicketHistory(nextHistory);
}

export function findStoredTicket({ pnr, email, bookingType }) {
  const wantedReference = normalizeRef(pnr);
  const wantedEmail = normalizeEmail(email);
  const wantedType = String(bookingType || "").trim().toLowerCase();

  if (!wantedReference || !wantedType) {
    return null;
  }

  const latest = readLatestStoredTicket();
  const searchPool = latest
    ? [latest, ...readStoredTicketHistory()]
    : readStoredTicketHistory();

  return (
    searchPool.find((ticket) => {
      const ticketReference = normalizeRef(
        ticket.bookingReference || ticket.pnr || ticket.reference
      );
      if (ticketReference !== wantedReference) {
        return false;
      }

      const ticketType = String(ticket.ticketType || ticket.type || "")
        .trim()
        .toLowerCase();
      if (ticketType !== wantedType) {
        return false;
      }

      const ticketEmail = normalizeEmail(ticket.contact?.email);
      if (wantedEmail && ticketEmail && ticketEmail !== wantedEmail) {
        return false;
      }

      return true;
    }) || null
  );
}
