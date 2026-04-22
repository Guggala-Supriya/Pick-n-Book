import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture, FaEye, FaEyeSlash,FaBus } from "react-icons/fa";
import "../STYLES/Login.css";
import "../STYLES/Verify.css";
// import flightCarImage from "../IMAGES/flightcar.png";
import flightCarImage from "../IMAGES/loginimage.png";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../api/apiBaseUrl";

const VerifyOtp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    otp: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));

    setApiMessage("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.otp.trim()) newErrors.otp = "OTP is required.";

    if (!form.password) {
      newErrors.password = "New Password is required.";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required.";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Confirm Password is required.";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiMessage("");

    try {
      const response = await fetch(
        toApiUrl("/api/Auth/reset-password"),
        {
          method: "POST",
          headers: withNgrokSkipWarningHeader("/api/Auth/reset-password", {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({
            otp: form.otp,
            newPassword: form.password
          })
        }
      );

      const payload = await readResponsePayload(response);
      const message = normalizeResponseMessage(
        payload,
        response.ok ? "Password reset successful." : "Reset failed. Please try again."
      );

      if (response.ok) {
        setApiMessage(message || "Password reset successful.");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        setApiMessage(message || "Reset failed. Please try again.");
      }
    } catch (error) {
      setApiMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="travel-auth-page travel-auth-verify"
      style={authPageStyle}
    >
      <div className="travel-auth-card">
        <aside className="travel-auth-brand">
          <p className="travel-auth-kicker">Welcome to</p>
          <div className="travel-auth-logo">
            <FaPlaneDeparture />< FaBus/>
          </div>
          <h1 className="travel-auth-brand-name">Travling</h1>
          <p className="travel-auth-brand-copy">
            Verify OTP and set a secure password to access your account.
          </p>
          <p className="travel-auth-brand-meta">Safe password reset</p>
        </aside>

        <section className="travel-auth-form-panel">
          <h2 className="travel-auth-heading">Verify OTP</h2>
          <p className="travel-auth-subheading">
            Enter OTP and set your new account password.
          </p>

          {apiMessage && (
            <p
              className={`travel-auth-status ${
                apiMessage.toLowerCase().includes("success")
                  ? "is-success"
                  : "is-error"
              }`}
            >
              {apiMessage}
            </p>
          )}

          <form className="travel-auth-form" onSubmit={handleSubmit}>
            <div className="travel-field">
              <label htmlFor="verify-otp">OTP</label>
              <div className="travel-field-line">
                <input
                  id="verify-otp"
                  type="text"
                  name="otp"
                  placeholder="Enter OTP"
                  value={form.otp}
                  onChange={handleChange}
                />
              </div>
              <p className="travel-field-error">{errors.otp || "\u00A0"}</p>
            </div>

            <div className="travel-field">
              <label htmlFor="verify-new-password">New Password</label>
              <div className="travel-field-line">
                <input
                  id="verify-new-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="travel-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="travel-field-error">{errors.password || "\u00A0"}</p>
            </div>

            <div className="travel-field">
              <label htmlFor="verify-confirm-password">Confirm Password</label>
              <div className="travel-field-line">
                <input
                  id="verify-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="travel-eye-btn"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="travel-field-error">
                {errors.confirmPassword || "\u00A0"}
              </p>
            </div>

            <div className="travel-auth-links">
              <button type="button" onClick={() => navigate("/forgot-password")}>
                Back to Forgot Page
              </button>
              <button type="button" onClick={() => navigate("/login")}>
                Back to Login
              </button>
            </div>

            <div className="travel-auth-actions">
              <button
                type="submit"
                className="travel-btn travel-btn-primary"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button
                type="button"
                className="travel-btn travel-btn-secondary"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default VerifyOtp;
