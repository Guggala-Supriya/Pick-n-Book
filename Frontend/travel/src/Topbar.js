import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BusFront,
  ChevronDown,
  CircleUserRound,
  Compass,
  LayoutDashboard,
  LogIn,
  LogOut,
  PlaneTakeoff,
  Ticket,
  User,
} from "lucide-react";
import { clearAuthSession, useAuthSession } from "./api/authSession";
import "./Topbar.css";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") {
    return {};
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = atob(padded);
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function pickFirst(values, fallback = "") {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function buildAuthProfile(session) {
  const user = session?.user && typeof session.user === "object" ? session.user : {};
  const token = typeof session?.token === "string" ? session.token : "";
  const tokenPayload = decodeJwtPayload(token);

  const email = pickFirst(
    [
      user.email,
      user.Email,
      tokenPayload.email,
      tokenPayload.upn,
      tokenPayload.unique_name,
    ],
    ""
  );
  const displayName = pickFirst(
    [
      user.firstName,
      user.FirstName,
      user.name,
      user.Name,
      tokenPayload.given_name,
      tokenPayload.name,
      email.split("@")[0],
    ],
    "User"
  );

  const normalizedDisplayName = displayName
    ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
    : "User";

  return {
    isLoggedIn: Boolean(token || session?.user),
    displayName: normalizedDisplayName,
    email,
  };
}

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const authSession = useAuthSession();
  const authProfile = useMemo(
    () => buildAuthProfile(authSession),
    [authSession]
  );
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith("/dashboard");
  const currentHomeTab =
    new URLSearchParams(location.search).get("tab") === "buses"
      ? "buses"
      : "flights";
  const isHome = location.pathname === "/";

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setOpen(false);
    navigate("/login");
  };

  const handleLogin = () => {
    setOpen(false);
    navigate("/login");
  };

  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => navigate("/?tab=flights")}>
        <span className="brand-icon">
          <Compass size={18} />
        </span>
        <span className="brand-copy">
          <span className="brand-title">
            Travel<span className="brand-title-accent">....</span>
          </span>
          <span className="brand-subtitle">Flights and Buses</span>
        </span>
      </button>

      <div className="right-section">
        <div className="menu">
          <Link
            to="/?tab=flights"
            className={`menu-item ${isHome && currentHomeTab === "flights" ? "active" : ""}`}
          >
            <PlaneTakeoff size={16} />
            <span>Flights</span>
          </Link>
          <Link
            to="/?tab=buses"
            className={`menu-item ${isHome && currentHomeTab === "buses" ? "active" : ""}`}
          >
            <BusFront size={16} />
            <span>Buses</span>
          </Link>
          <NavLink
            to="/web-checkin"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <Ticket size={16} />
            <span>Web Check-in</span>
          </NavLink>
          <NavLink
            to="/fetch-ticket"
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <Ticket size={16} />
            <span>Print Ticket</span>
          </NavLink>
        </div>

        <div className="user-section" ref={dropdownRef}>
          <button
            type="button"
            className={`user-name ${authProfile.isLoggedIn ? "authenticated" : "guest"}`}
            onClick={() => setOpen((previous) => !previous)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={authProfile.isLoggedIn ? `${authProfile.displayName} menu` : "Account menu"}
          >
            {!authProfile.isLoggedIn && <CircleUserRound size={18} />}
            {authProfile.isLoggedIn && (
              <span className="user-trigger-name">{authProfile.displayName}</span>
            )}
            <ChevronDown size={16} className={`dropdown-caret ${open ? "open" : ""}`} />
          </button>

          {open && (
            <div className="dropdown" role="menu">
              {!authProfile.isLoggedIn && (
                <button type="button" className="dropdown-item" onClick={handleLogin}>
                  <LogIn size={15} />
                  Login
                </button>
              )}

              {authProfile.isLoggedIn && !isDashboard && (
                <>
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setOpen(false)}>
                    <LayoutDashboard size={15} />
                    Dashboard
                  </Link>

                  <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              )}

              {authProfile.isLoggedIn && isDashboard && (
                <>
                  <Link to="/dashboard/my-account" className="dropdown-item" onClick={() => setOpen(false)}>
                    <User size={15} />
                    My Account
                  </Link>

                  <button type="button" className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={15} />
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
