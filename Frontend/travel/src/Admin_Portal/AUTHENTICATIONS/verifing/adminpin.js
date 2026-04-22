import React, { useEffect, useState } from "react";
import "./adminpin.css";
import { useNavigate } from "react-router-dom";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../../../api/apiBaseUrl";
import {
  getAdminChallengeId,
  setAdminChallengeId,
  setAdminRole,
  setAuthToken,
  setAuthUser,
} from "../../../api/authSession";

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

export default function AdminPin() {

  const navigate = useNavigate();

  const [captcha, setCaptcha] = useState(() => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return num.toString();
  });

  const [pin, setPin] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestTimeoutMs = 20_000;


  

  const challengeId = getAdminChallengeId();

  useEffect(() => {
    if (String(challengeId || "").trim()) {
      return;
    }

    setError("Session expired. Please login again.");
    const timer = setTimeout(() => navigate("/admin/login"), 1200);
    return () => clearTimeout(timer);
  }, [challengeId, navigate]);


  const refreshCaptcha = () => {

    const num = Math.floor(1000 + Math.random() * 9000);

    setCaptcha(num.toString());

  };


  const handleVerify = async (e) => {

    e.preventDefault();

    if (loading) {
      return;
    }

    const otp = String(pin || "").trim();

    if (!otp) {
      setError("Enter OTP");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP");
      return;
    }

    if (String(captchaInput || "").trim() !== String(captcha || "").trim()) {
      setError("Captcha incorrect");
      return;
    }

    let timeoutId = null;
    const controller = new AbortController();

    try {

      setLoading(true);
      timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      const currentChallengeId = String(getAdminChallengeId() || "").trim();
      if (!currentChallengeId) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/admin/login"), 1200);
        return;
      }

      const requestPath = "/api/Auth/admin/login/verify-otp";

      const res = await fetch(
        toApiUrl(requestPath),
        {
          method: "POST",
          signal: controller.signal,
          headers: withNgrokSkipWarningHeader(requestPath, {
            "Content-Type": "application/json",
          }),

          body: JSON.stringify({
            challengeId: currentChallengeId,
            otp,
          }),
        }
      );

      const payload = await readResponsePayload(res);

      if (res.ok) {

        const token = pickFirst([payload?.token, payload?.Token, payload?.data?.token], "");
        const role = pickFirst([payload?.role, payload?.Role, payload?.data?.role], "");

        if (!token || !role) {
          setError("Login succeeded but token/role missing from server response.");
          return;
        }

        setAuthUser(null);
        setAuthToken(token);
        setAdminRole(role);
        setAdminChallengeId("");

        navigate("/admin");

      } else {

        setError(
          normalizeResponseMessage(payload, "Invalid OTP")
        );

      }

    } catch (err) {

      setError(
        err?.name === "AbortError"
          ? "Request timed out. Check backend / proxy URL and try again."
          : "Server error"
      );

    } finally {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);

    }

  };


  return (

    <div className="pin-wrapper">


      <h2 className="top-title">
        Travel
      </h2>



      <div className="pin-box">


        <h2 className="pin-title">
          PIN
        </h2>


        <div className="info">

          Please enter PIN sent to email

        </div>



        <form onSubmit={handleVerify}>


          {/* OTP */}

          <input
            placeholder="Enter OTP"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError("");
            }}
          />

          <div className="captcha-row">

            <div className="captcha-code">
              {captcha}
            </div>

            <button
              type="button"
              className="refresh-btn"
              onClick={refreshCaptcha}
            >
              Refresh
            </button>

          </div>



          <input
            placeholder="Enter Captcha"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value);
              setError("");
            }}
          />


          {error && (
            <div className="error">
              {error}
            </div>
          )}


          <button className="verify-btn">

            {loading ? "Verifying..." : "Verify"}

          </button>


        </form>


      </div>


    </div>

  );

}
