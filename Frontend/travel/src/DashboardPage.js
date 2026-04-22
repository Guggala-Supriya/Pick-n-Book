import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Clock4,
  Route,
  TicketX,
  WalletCards,
} from "lucide-react";
import { getAuthUserId } from "./api/authSession";
import "./DashboardPage.css";

const FALLBACK_API_BASE_URL =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const DASHBOARD_SUMMARY_PATH = "/api/Dashboard/summary";
const RECENT_LIMIT = 10;
const TRAVELER_PENDING_DAYS = 7;

const BOOKING_COLORS = {
  Completed: "#1d8f5f",
  Upcoming: "#dc8a14",
  Cancelled: "#d35454",
};

const QUICK_LINKS = [
  { id: "quick-1", label: "Flight Bookings", to: "/dashboard/flight-bookings" },
  { id: "quick-2", label: "Bus Bookings", to: "/dashboard/bus-bookings" },
  { id: "quick-3", label: "Account Statement", to: "/dashboard/account-statement" },
  { id: "quick-4", label: "QR List", to: "/dashboard/qr-list" },
];

const OFFER_MESSAGES = [
  "Flat INR 500 off on international flight bookings this week.",
  "Save up to 20% on selected intercity bus routes.",
  "Zero convenience fee on same-day domestic flights.",
  "Instant cashback on eligible UPI and card transactions.",
];

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
    process.env.REACT_APP_FLIGHT_API_BASE_URL ||
    process.env.REACT_APP_BUS_API_BASE_URL;

  if (explicitBase && explicitBase.trim()) {
    return explicitBase.trim();
  }

  return FALLBACK_API_BASE_URL;
}

function toAbsoluteUrl(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/+$/, "")}/${urlOrPath.replace(/^\/+/, "")}`;
  }

  return urlOrPath;
}

function buildUrl(path, query = {}) {
  const base = toAbsoluteUrl(path);
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const text = typeof value === "string" ? value.trim() : String(value);
    if (text) {
      params.set(key, text);
    }
  });

  return params.toString() ? `${base}?${params.toString()}` : base;
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

function getCurrentUserId() {
  return String(getAuthUserId() || "").trim();
}

function getColor(statusName) {
  return BOOKING_COLORS[statusName] || "#5f7399";
}

function formatCurrencyCompact(value) {
  const amount = Number(value) || 0;

  if (amount >= 1000000) {
    return `INR ${(amount / 1000000).toFixed(2)}M`;
  }

  if (amount >= 1000) {
    return `INR ${(amount / 1000).toFixed(1)}K`;
  }

  return `INR ${Math.round(amount)}`;
}

function formatPercent(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "0%";
  const fixed = amount.toFixed(2);
  return `${fixed.replace(/\.00$/, "")}%`;
}

function formatUpdateMeta(type, occurredAtUtc) {
  const safeType = String(type || "Update").replace(/([a-z])([A-Z])/g, "$1 $2");
  const date = new Date(occurredAtUtc);

  if (Number.isNaN(date.getTime())) {
    return safeType;
  }

  return `${safeType} | ${date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function mapUpdateState(type) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("cancel")) return "Pending";
  if (normalized.includes("traveler")) return "Review";
  if (normalized.includes("payment")) return "Approved";
  return "Updated";
}

function ChartCard({ title, subtitle, data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="chart-card">
      <header className="chart-card-head">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>

      <div className="chart-content">
        <div className="chart-visual">
          <ResponsiveContainer width="100%" height={176}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={getColor(item.name)} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}`, "Bookings"]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #d9e2f2",
                  boxShadow: "0 10px 24px rgba(13, 27, 52, 0.14)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="chart-center-copy">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>

        <ul className="chart-legend-list">
          {data.map((item) => (
            <li key={item.name}>
              <span className="legend-left">
                <i style={{ backgroundColor: getColor(item.name) }} />
                {item.name}
              </span>
              <b>{item.value}</b>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const [currentOffer, setCurrentOffer] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  useEffect(() => {
    const slider = setInterval(() => {
      setCurrentOffer((previous) => (previous + 1) % OFFER_MESSAGES.length);
    }, 3500);

    return () => clearInterval(slider);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchDashboardSummary() {
      setLoadingSummary(true);
      setSummaryError("");

      try {
        const url = buildUrl(DASHBOARD_SUMMARY_PATH, {
          recentLimit: RECENT_LIMIT,
          travelerPendingDays: TRAVELER_PENDING_DAYS,
        });
        const userId = getCurrentUserId();
        const headers = {
          Accept: "application/json",
        };

        if (userId) {
          headers["X-User-Id"] = userId;
        }

        if (shouldUseNgrokBypass(url)) {
          headers["ngrok-skip-browser-warning"] = "true";
        }

        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.message || "Unable to load dashboard summary.");
        }

        setSummary(payload || {});
        setLastSyncedAt(
          new Date().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (error) {
        if (error?.name === "AbortError") return;
        setSummaryError(error?.message || "Unable to load dashboard summary.");
      } finally {
        setLoadingSummary(false);
      }
    }

    fetchDashboardSummary();
    return () => controller.abort();
  }, []);

  const flightBookingStatus = useMemo(() => {
    const source = summary?.flightBookings || {};
    return [
      { name: "Completed", value: Number(source.completed) || 0 },
      { name: "Upcoming", value: Number(source.upcoming) || 0 },
      { name: "Cancelled", value: Number(source.cancelled) || 0 },
    ];
  }, [summary]);

  const busBookingStatus = useMemo(() => {
    const source = summary?.busBookings || {};
    return [
      { name: "Completed", value: Number(source.completed) || 0 },
      { name: "Upcoming", value: Number(source.upcoming) || 0 },
      { name: "Cancelled", value: Number(source.cancelled) || 0 },
    ];
  }, [summary]);

  const dashboardStats = useMemo(() => {
    const pending = summary?.pendingActions || {};
    const revenue = summary?.revenueSnapshot || {};
    const flightCompleted = Number(summary?.flightBookings?.completed) || 0;
    const busCompleted = Number(summary?.busBookings?.completed) || 0;
    const totalBookings = Number(summary?.totalBookings) || 0;

    return [
      {
        id: "kpi-1",
        label: "Total Bookings",
        value: totalBookings.toLocaleString("en-IN"),
        hint: "Flights and buses in current cycle",
        icon: CalendarClock,
      },
      {
        id: "kpi-2",
        label: "Completion Rate",
        value: formatPercent(summary?.completionRatePercent),
        hint: `${(flightCompleted + busCompleted).toLocaleString("en-IN")} completed journeys`,
        icon: BadgeCheck,
      },
      {
        id: "kpi-3",
        label: "Pending Actions",
        value: String(Number(pending.total) || 0),
        hint: "Cancellations, deposits, traveler updates",
        icon: Clock4,
      },
      {
        id: "kpi-4",
        label: "Revenue Snapshot",
        value: formatCurrencyCompact(revenue.totalRevenueInr),
        hint: `Savings ${formatCurrencyCompact(revenue.totalSavingsInr)} | Cancelled ${formatCurrencyCompact(
          revenue.cancelledValueInr
        )}`,
        icon: CircleDollarSign,
      },
    ];
  }, [summary]);

  const actionItems = useMemo(() => {
    const pending = summary?.pendingActions || {};
    return [
      {
        id: "action-1",
        title: "Cancellation Queue",
        detail: `${Number(pending.cancellations) || 0} cancellation requests pending approval.`,
        to: "/dashboard/flight-cancel",
        cta: "Review now",
      },
      {
        id: "action-2",
        title: "Deposit Approvals",
        detail: `${Number(pending.deposits) || 0} deposit requests waiting for verification.`,
        to: "/dashboard/deposit-request",
        cta: "Open deposits",
      },
      {
        id: "action-3",
        title: "Traveler Data Updates",
        detail: `${Number(pending.travelerUpdates) || 0} traveler updates pending review.`,
        to: "/dashboard/traveler-list",
        cta: "View travelers",
      },
    ];
  }, [summary]);

  const recentUpdates = useMemo(() => {
    const updates = Array.isArray(summary?.recentUpdates) ? summary.recentUpdates : [];
    return updates.map((item, index) => ({
      id: `update-${index + 1}`,
      title: item.message || "Activity update",
      meta: formatUpdateMeta(item.type, item.occurredAtUtc),
      state: mapUpdateState(item.type),
    }));
  }, [summary]);

  const topRoutes = useMemo(() => {
    const routes = Array.isArray(summary?.topRoutes) ? summary.topRoutes : [];
    const maxScore = Math.max(
      1,
      ...routes.map((route) => Number(route.score) || Number(route.bookingCount) || 0)
    );

    return routes.map((route, index) => {
      const score = Number(route.score) || Number(route.bookingCount) || 0;
      const share = Math.max(8, Math.round((score / maxScore) * 100));

      return {
        id: `route-${index + 1}`,
        label: `${route.fromCity || "--"} to ${route.toCity || "--"}`,
        share,
        tripType: route.tripType || "Route",
        bookingCount: Number(route.bookingCount) || 0,
      };
    });
  }, [summary]);

  const recentCounters = summary?.recentUpdateCounters || {};

  return (
    <div className="dashboard-content dashboard-home">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">Operations Center</span>
          <h1>Travel Booking Dashboard</h1>
          <p>
            Track booking health, monitor pending actions, and quickly navigate
            to operational modules.
          </p>
          {summaryError && <p style={{ color: "#b42318", marginTop: 10 }}>{summaryError}</p>}
        </div>
        <div className="dashboard-header-meta">
          <span>{loadingSummary ? "Syncing..." : "Live API View"}</span>
          <span>{lastSyncedAt ? `Updated ${lastSyncedAt}` : "Rolling 30-Day Window"}</span>
        </div>
      </header>

      <section className="dashboard-kpi-grid">
        {dashboardStats.map((stat) => (
          <article className="metric-card" key={stat.id}>
            <div className="metric-icon">
              <stat.icon size={17} />
            </div>
            <div className="metric-copy">
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <span>{stat.hint}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-panel">
          <header className="panel-head">
            <h2>Booking Status Overview</h2>
            <span>Operational split from summary API</span>
          </header>
          <div className="dashboard-chart-grid">
            <ChartCard
              title="Flight Bookings"
              subtitle="Completed vs upcoming vs cancelled"
              data={flightBookingStatus}
            />
            <ChartCard
              title="Bus Bookings"
              subtitle="Completed vs upcoming vs cancelled"
              data={busBookingStatus}
            />
          </div>
        </div>

        <aside className="dashboard-panel action-panel">
          <header className="panel-head">
            <h2>Action Center</h2>
            <span>Tasks that need attention</span>
          </header>
          <div className="action-list">
            {actionItems.map((item) => (
              <article key={item.id} className="action-item">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <Link to={item.to}>
                  {item.cta}
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="dashboard-lower-grid">
        <article className="dashboard-panel">
          <header className="panel-head">
            <h2>Recent Updates</h2>
            <span>Latest activity feed</span>
          </header>
          <ul className="updates-list">
            {recentUpdates.length > 0 ? (
              recentUpdates.map((update) => (
                <li key={update.id}>
                  <div>
                    <strong>{update.title}</strong>
                    <span>{update.meta}</span>
                  </div>
                  <em>{update.state}</em>
                </li>
              ))
            ) : (
              <li>
                <div>
                  <strong>No recent updates</strong>
                  <span>Activity feed will appear here after new events.</span>
                </div>
                <em>Idle</em>
              </li>
            )}
          </ul>
        </article>

        <article className="dashboard-panel">
          <header className="panel-head">
            <h2>Top Routes</h2>
            <span>Most searched and booked sectors</span>
          </header>
          <ul className="route-list">
            {topRoutes.length > 0 ? (
              topRoutes.map((route) => (
                <li key={route.id}>
                  <div className="route-copy">
                    <Route size={14} />
                    <span>
                      {route.label} ({route.tripType}) - {route.bookingCount} bookings
                    </span>
                  </div>
                  <div className="route-progress">
                    <i style={{ width: `${route.share}%` }} />
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="route-copy">
                  <Route size={14} />
                  <span>No top routes available yet</span>
                </div>
                <div className="route-progress">
                  <i style={{ width: "0%" }} />
                </div>
              </li>
            )}
          </ul>
        </article>

        <article className="dashboard-panel quick-panel">
          <header className="panel-head">
            <h2>Quick Access</h2>
            <span>Jump to frequent modules</span>
          </header>
          <div className="quick-link-grid">
            {QUICK_LINKS.map((item) => (
              <Link key={item.id} to={item.to} className="quick-link-card">
                <span>{item.label}</span>
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panel offers-panel">
        <header className="panel-head">
          <h2>Promotions and Revenue Levers</h2>
          <span>Campaigns currently running</span>
        </header>
        <div className="offer-slider-box">
          <div className="offer-slider-icon">
            <WalletCards size={18} />
          </div>
          <p>{OFFER_MESSAGES[currentOffer]}</p>
          <div className="offer-dots">
            {OFFER_MESSAGES.map((offerText, index) => (
              <button
                key={offerText}
                type="button"
                aria-label={`Offer ${index + 1}`}
                className={index === currentOffer ? "active" : ""}
                onClick={() => setCurrentOffer(index)}
              />
            ))}
          </div>
        </div>
        <div className="offers-footer">
          <div>
            <TicketX size={14} />
            <span>
              Booking updates: {Number(recentCounters.bookingUpdates) || 0} | Cancellation updates:{" "}
              {Number(recentCounters.cancellationUpdates) || 0}
            </span>
          </div>
          <div>
            <BadgeCheck size={14} />
            <span>
              Traveler updates: {Number(recentCounters.travelerUpdates) || 0} | Wallet updates:{" "}
              {Number(recentCounters.walletPaymentUpdates) || 0}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
