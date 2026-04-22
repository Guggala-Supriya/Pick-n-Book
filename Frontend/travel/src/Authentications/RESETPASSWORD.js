import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture, FaSyncAlt,FaBus } from "react-icons/fa";
import "../STYLES/Login.css";
import "../STYLES/RESETPASSWORD.css";
// import flightCarImage from "../IMAGES/flightcar.png";
import flightCarImage from "../IMAGES/loginimage.png";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../api/apiBaseUrl";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const navigate = useNavigate();
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let value = "";
    for (let i = 0; i < 5; i += 1) {
      value += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(value);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required.";

    if (!captchaInput.trim()) {
      newErrors.captcha = "Captcha is required.";
    } else if (captchaInput.trim().toUpperCase() !== generatedCaptcha) {
      newErrors.captcha = "Invalid captcha.";
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
        toApiUrl("/api/Auth/forgot-password"),
        {
          method: "POST",
          headers: withNgrokSkipWarningHeader("/api/Auth/forgot-password", {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({ email })
        }
      );

      const payload = await readResponsePayload(response);
      const message = normalizeResponseMessage(
        payload,
        response.ok ? "OTP sent successfully." : "Failed to send OTP."
      );

      if (response.ok) {
        setApiMessage(message || "OTP sent successfully.");
        setTimeout(() => {
          navigate("/verify");
        }, 1200);
      } else {
        setApiMessage(message || "Failed to send OTP.");
      }
    } catch (error) {
      setApiMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="travel-auth-page travel-auth-forgot"
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
            Recover your traveler account and continue managing your bookings.
          </p>
          <p className="travel-auth-brand-meta">Secure account recovery</p>
        </aside>

        <section className="travel-auth-form-panel">
          <h2 className="travel-auth-heading">Forgot password</h2>
          <p className="travel-auth-subheading">
            Enter your registered email and we will send an OTP.
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
              <label htmlFor="forgot-email">E-mail Address</label>
              <div className="travel-field-line">
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your registered e-mail"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                    setApiMessage("");
                  }}
                />
              </div>
              <p className="travel-field-error">{errors.email || "\u00A0"}</p>
            </div>

            <div className="travel-field">
              <label htmlFor="forgot-captcha">Captcha</label>
              <div className="travel-captcha-row">
                <div className="travel-captcha-display">{generatedCaptcha}</div>
                <button
                  type="button"
                  className="travel-captcha-refresh"
                  onClick={generateCaptcha}
                >
                  <FaSyncAlt />
                  <span>Refresh</span>
                </button>
              </div>
              <div className="travel-field-line">
                <input
                  id="forgot-captcha"
                  type="text"
                  placeholder="Enter captcha code"
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setErrors((prev) => ({ ...prev, captcha: "" }));
                    setApiMessage("");
                  }}
                />
              </div>
              <p className="travel-field-error">{errors.captcha || "\u00A0"}</p>
            </div>

            <div className="travel-auth-links">
              <button type="button" onClick={() => navigate("/login")}>
                Back to Login
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                Create Account
              </button>
            </div>

            <div className="travel-auth-actions">
              <button
                type="submit"
                className="travel-btn travel-btn-primary"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <button
                type="button"
                className="travel-btn travel-btn-secondary"
                onClick={() => navigate("/verify")}
              >
                Verify OTP
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
