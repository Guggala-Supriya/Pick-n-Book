import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaSyncAlt,
  FaPlaneDeparture,
  FaCheckCircle, FaBus,
} from "react-icons/fa";
import "../STYLES/Login.css";
// import flightCarImage from "../IMAGES/flightcar.png";
import flightCarImage from "../IMAGES/loginimage.png";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../api/apiBaseUrl";
import {
  setAdminChallengeId,
  setAdminRole,
  setAuthToken,
  setAuthUser,
} from "../api/authSession";


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

function buildUserFromLoginResponse(responseData, emailInput) {
  const token = responseData?.token || responseData?.Token || "";
  const tokenPayload = decodeJwtPayload(token);
  const nestedUser =
    responseData?.user ||
    responseData?.User ||
    responseData?.data?.user ||
    responseData?.data?.User ||
    {};

  const email = pickFirst(
    [
      nestedUser.email,
      nestedUser.Email,
      responseData?.email,
      responseData?.Email,
      tokenPayload.email,
      tokenPayload.upn,
      tokenPayload.unique_name,
      emailInput,
    ],
    ""
  );

  const firstName = pickFirst(
    [
      nestedUser.firstName,
      nestedUser.FirstName,
      responseData?.firstName,
      responseData?.FirstName,
      tokenPayload.given_name,
      tokenPayload.firstName,
    ],
    ""
  );

  const lastName = pickFirst(
    [
      nestedUser.lastName,
      nestedUser.LastName,
      responseData?.lastName,
      responseData?.LastName,
      tokenPayload.family_name,
      tokenPayload.lastName,
    ],
    ""
  );

  const name = pickFirst(
    [
      nestedUser.name,
      nestedUser.Name,
      responseData?.name,
      responseData?.Name,
      tokenPayload.name,
      `${firstName} ${lastName}`.trim(),
      email.split("@")[0],
    ],
    "User"
  );

  return {
    userId: pickFirst(
      [
        nestedUser.userId,
        nestedUser.UserId,
        nestedUser.id,
        nestedUser.Id,
        responseData?.userId,
        responseData?.UserId,
        tokenPayload.sub,
        tokenPayload.nameid,
      ],
      ""
    ),
    firstName,
    lastName,
    name,
    email,
    role: pickFirst(
      [
        nestedUser.role,
        nestedUser.Role,
        responseData?.role,
        responseData?.Role,
        tokenPayload.role,
        tokenPayload.roles,
        tokenPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
      ],
      ""
    ),
    mobile: pickFirst(
      [
        nestedUser.mobile,
        nestedUser.Mobile,
        nestedUser.phoneNo,
        nestedUser.PhoneNo,
        nestedUser.phoneNumber,
        nestedUser.PhoneNumber,
      ],
      ""
    ),
  };
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [generatedCaptcha, setGeneratedCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const requestTimeoutMs = 20_000;
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let captchaValue = "";
    for (let i = 0; i < 5; i += 1) {
      captchaValue += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedCaptcha(captchaValue);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";

    if (!captcha.trim()) {
      newErrors.captcha = "Captcha is required";
    } else if (captcha.trim().toUpperCase() !== generatedCaptcha) {
      newErrors.captcha = "Captcha does not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    setApiMessage("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const requestPath = "/api/Auth/login";
      const normalizedEmail = email.trim();

      const response = await fetch(toApiUrl(requestPath), {
        method: "POST",
        signal: controller.signal,
        headers: withNgrokSkipWarningHeader(requestPath, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const payload = await readResponsePayload(response);

      if (response.ok) {
        const token = payload?.token || payload?.Token || "";
        const userProfile = buildUserFromLoginResponse(payload, normalizedEmail);

        setAdminRole("");
        setAdminChallengeId("");

        if (token) {
          setAuthToken(token);
        }

        setAuthUser(userProfile);

        setApiMessage("Login Successful");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        const message = normalizeResponseMessage(
          payload,
          "Username And Password Wrong !"
        );
        setApiMessage(message || "Username And Password Wrong !");

        if (
          response.status === 403 &&
          /admin/i.test(message) &&
          /(otp|one[-\s]?time|pin)/i.test(message)
        ) {
          setTimeout(() => {
            navigate("/admin/login");
          }, 1200);
        }
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        setApiMessage(
          "Login request timed out. Check that the backend is running and REACT_APP_API_PROXY_TARGET (or ngrok URL) is correct."
        );
      } else {
        setApiMessage("Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div
      className="travel-auth-page travel-auth-login"
      style={authPageStyle}
    >
       {/* <div className="travel-bg-text">LOGIN</div> */}
      <div className="travel-auth-card">
        <aside className="travel-auth-brand">
          <p className="travel-auth-kicker">Welcome to</p>
          <div className="travel-auth-logo">
            <FaPlaneDeparture />< FaBus/>
          </div>
          <h1 className="travel-auth-brand-name">Travling</h1>
          <p className="travel-auth-brand-copy">
            Plan flights,buses hotels and holiday trips with one secure traveler
            account.
          </p>
          <p className="travel-auth-brand-meta">
            Travel smarter. Manage bookings faster.
          </p>
        </aside>

        <section className="travel-auth-form-panel">
          <h2 className="travel-auth-heading">Sign in to your account</h2>
          <p className="travel-auth-subheading">
            Access tickets, vouchers and trip updates instantly.
          </p>

          {apiMessage && (
            <p
              className={`travel-auth-status ${
                apiMessage.toLowerCase().includes("successful")
                  ? "is-success"
                  : "is-error"
              }`}
            >
              {apiMessage}
            </p>
          )}

          <form className="travel-auth-form" onSubmit={handleSubmit}>
            <div className="travel-field">
              <label htmlFor="login-email">E-mail Address</label>
              <div className="travel-field-line">
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your e-mail"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                    setApiMessage("");
                  }}
                />
                {email.trim() && (
                  <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                )}
              </div>
              <p className="travel-field-error">{errors.email || "\u00A0"}</p>
            </div>

            <div className="travel-field">
              <label htmlFor="login-password">Password</label>
              <div className="travel-field-line">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                    setApiMessage("");
                  }}
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
              <label htmlFor="login-captcha">Captcha</label>
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
                  id="login-captcha"
                  type="text"
                  placeholder="Enter captcha code"
                  value={captcha}
                  onChange={(e) => {
                    setCaptcha(e.target.value);
                    setErrors((prev) => ({ ...prev, captcha: "" }));
                    setApiMessage("");
                  }}
                />
              </div>
              <p className="travel-field-error">{errors.captcha || "\u00A0"}</p>
            </div>

            <div className="travel-auth-links">
              <button type="button" onClick={() => navigate("/forgot-password")}>
                Forgot Password
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
                {loading ? "Signing In..." : "Sign In"}
              </button>
              <button
                type="button"
                className="travel-btn travel-btn-secondary"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </button>
            </div>

            <p className="travel-auth-footnote">
              Your details are protected with secure authentication.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
