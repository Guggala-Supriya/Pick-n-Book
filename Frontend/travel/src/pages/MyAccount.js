import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import "../STYLES/myAccount.css";

const accountCards = [
  {
    id: "booking",
    icon: "BK",
    title: "Booking",
    desc: "Manage and access the history of your bookings.",
    action: "booking",
  },
  {
    id: "Dashboard",
    icon: "DB",
    title: "Dashboard",
    desc: "Manage and add markups in items.",
    action: "dashboard",
  },
  {
    id: "Traveler List",
    icon: "PD",
    title: "Traveler Details",
    desc: "Manage and add passenger details.",
    action: "passenger",
  },
  {
    id: "Deposit Request",
    icon: "PW",
    title: "Deposit and Wallet",
    desc: "Review payments, wallet history and add funds.",
    action: "payments",
  },
  {
    id: "personal",
    icon: "PI",
    title: "Personal Info",
    desc: "Provide personal details and contact information.",
    action: "personal",
  },
  {
    id: "Change Password",
    icon: "CP",
    title: "Change Password",
    desc: "Update your password and secure your account.",
    action: "security",
  },
];

const MyAccount = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const readValue = (value) => (String(value || "").trim() ? String(value).trim() : "Not Added");

  const userName =
    userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : "User";

  const userLocation = "India";
  const profileInitial = userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  const personalDetails = [
    { label: "First Name", value: readValue(userData.firstName) },
    { label: "Last Name", value: readValue(userData.lastName) },
    { label: "Email", value: readValue(userData.email) },
    { label: "Mobile", value: readValue(userData.mobile) },
    { label: "Location", value: userLocation },
  ];

  const handleCardClick = (action) => {
    if (action === "booking") {
      navigate("/dashboard/flight-bookings");
      return;
    }

    if (action === "passenger") {
      navigate("/dashboard/traveler-list");
      return;
    }

    if (action === "payments") {
      navigate("/dashboard/deposit-request");
      return;
    }

    if (action === "personal") {
      navigate("/edit-profile");
      return;
    }

    if (action === "security") {
      navigate("/change-password");
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="account-page">
      <div className="account-shell">
        <aside className="account-sidebar">
          <div className="account-profile-card">
            <div className="account-profile-image">
              {userData.profileImage ? (
                <img src={userData.profileImage} className="account-profile-image-img" alt="Profile" />
              ) : (
                <span className="account-profile-placeholder">{profileInitial}</span>
              )}
            </div>

            <h3 className="account-user-name">{userName}</h3>

            <div className="account-personal-info">
              <div className="account-info-head">
                <h4>Personal Information</h4>
              </div>

              {personalDetails.map((item) => (
                <div className="account-info-row" key={item.label}>
                  <span className="account-info-label">{item.label}</span>
                  <span className="account-info-value">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="account-profile-actions">
              <button type="button" className="account-primary-btn" onClick={() => navigate("/edit-profile")}>
                Edit Profile
              </button>
              <button type="button" className="account-secondary-btn" onClick={() => navigate("/change-password")}>
                Change Password
              </button>
            </div>
          </div>
        </aside>

        <main className="account-main">
          <div className="account-header">
            <h1>Your Account</h1>
            <p>Manage your account and settings here.</p>
          </div>

          <div className="account-grid">
            {accountCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="account-card"
                onClick={() => handleCardClick(card.action)}
              >
                <div className="account-card-icon">{card.icon}</div>
                <h3 className="account-card-title">{card.title}</h3>
                <p className="account-card-desc">{card.desc}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyAccount;
