import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Banknote,
  BusFront,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  KeyRound,
  LayoutDashboard,
  PencilLine,
  PlaneTakeoff,
  QrCode,
  ShieldX,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";
import "./DashboardPage.css";

const MAIN_LINKS = [
  { id: "nav-1", to: "/dashboard/deposit-request", label: "Deposit Request", icon: WalletCards },
  { id: "nav-2", to: "/dashboard/traveler-list", label: "Traveler List", icon: Users },
  { id: "nav-3", to: "/dashboard/flight-bookings", label: "Flight Bookings", icon: PlaneTakeoff },
  { id: "nav-4", to: "/dashboard/flight-cancel", label: "Flight Cancel Requests", icon: ShieldX },
  { id: "nav-5", to: "/dashboard/bus-bookings", label: "Bus Bookings", icon: BusFront },
  { id: "nav-6", to: "/dashboard/bus-cancel", label: "Bus Cancel Requests", icon: ShieldX },
  { id: "nav-7", to: "/dashboard/account-statement", label: "Account Statement", icon: CircleDollarSign },
];

const BANK_LINKS = [
  { id: "bank-1", to: "/dashboard/bank-list", label: "Bank List", icon: Banknote },
  { id: "bank-2", to: "/dashboard/qr-list", label: "QR List", icon: QrCode },
];

const PROFILE_LINKS = [
  { id: "profile-1", to: "/edit-profile", label: "Edit Profile", icon: PencilLine },
  { id: "profile-2", to: "/change-password", label: "Change Password", icon: KeyRound },
];

function navItemClassName({ isActive }) {
  return `sidebar-item ${isActive ? "active" : ""}`;
}

export default function DashboardSidebar() {
  const [bankOpen, setBankOpen] = useState(true);

  return (
    <aside className="dashboard-sidebar">
      {/* <div className="sidebar-brand">
        <span className="sidebar-brand-icon">
          <LayoutDashboard size={16} />
        </span>
        <div className="sidebar-brand-copy">
          <strong>Travel Ops</strong>
          <small>Admin Console</small>
        </div>
      </div> */}

      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        <NavLink to="/dashboard" end className={navItemClassName} title="Dashboard">
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <button
          type="button"
          className={`sidebar-item sidebar-toggle ${bankOpen ? "open" : ""}`}
          onClick={() => setBankOpen((previous) => !previous)}
          title="Bank Details"
        >
          <Banknote size={16} />
          <span>Bank Details</span>
          {bankOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {bankOpen && (
          <div className="submenu">
            {BANK_LINKS.map((item) => (
              <NavLink key={item.id} to={item.to} className={navItemClassName} title={item.label}>
                <item.icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {MAIN_LINKS.map((item) => (
          <NavLink key={item.id} to={item.to} className={navItemClassName} title={item.label}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {PROFILE_LINKS.map((item) => (
          <NavLink key={item.id} to={item.to} className={navItemClassName} title={item.label}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <NavLink to="my-account" className={navItemClassName} title="My Account">
          <UserRound size={16} />
          <span>My Account</span>
        </NavLink>
      </nav>
    </aside >
  );
}
