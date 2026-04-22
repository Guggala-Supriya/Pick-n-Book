
import React, { useState, useEffect } from "react";
import "./login admin.css";
import Adminlogo from "../adminlogo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../../../api/apiBaseUrl";
import { setAdminChallengeId } from "../../../api/authSession";

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

export default function Adminlogin() {

  const navigate = useNavigate();

  const [captcha, setCaptcha] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    captchaInput: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const requestTimeoutMs = 20_000;

  const generateCaptcha = () => {

    const chars = "ABCDEFG123456789";

    let code = "";

    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    setCaptcha(code);
  };


  useEffect(() => {
    generateCaptcha();
  }, []);


  const refreshCaptcha = () => {
    generateCaptcha();
  };


  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      api: "",
    }));

  };


  const validate = () => {

    let err = {};

    if (!String(form.username || "").trim()) err.username = "Email required";

    if (!String(form.password || "").trim()) err.password = "Password required";

    if (!String(form.captchaInput || "").trim()) {
      err.captchaInput = "Enter captcha";
    }
    else if (
      String(form.captchaInput || "").trim().toUpperCase() !==
      String(captcha || "").trim().toUpperCase()
    ) {
      err.captchaInput = "Captcha incorrect";
    }

    setErrors(err);

    return Object.keys(err).length === 0;

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (loading) return;
    if (!validate()) return;

    let timeoutId = null;
    const controller = new AbortController();

    try {

      setLoading(true);

      const requestPath = "/api/Auth/admin/login/request-otp";
      const email = String(form.username || "").trim();
      const password = String(form.password || "");
      timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

      const res = await fetch(toApiUrl(requestPath), {
        method: "POST",
        signal: controller.signal,
        headers: withNgrokSkipWarningHeader(requestPath, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await readResponsePayload(res);

      if (res.ok) {

        const challengeId = pickFirst(
          [payload?.challengeId, payload?.ChallengeId, payload?.data?.challengeId],
          ""
        );

        if (!challengeId) {
          setErrors({
            api: "OTP sent but missing challengeId from server. Please try again.",
          });
          return;
        }

        setAdminChallengeId(challengeId);

        navigate("/admin/pin");

      } else {

        setErrors({
          api: normalizeResponseMessage(payload, "Login failed"),
        });

      }

    } catch (error) {

      setErrors({
        api:
          error?.name === "AbortError"
            ? "Request timed out. Check backend / proxy URL and try again."
            : "Invalid credentials",
      });

    } finally {

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);

    }

  };


  return (

    <div className="login-wrapper">

      <div className="left-side">

        <div className="logo-box">

          <img
            src={Adminlogo}
            alt="logo"
            className="logo-img"
          />

          <h1 className="logo-text">
            travel
          </h1>

        </div>

      </div>



      <div className="middle-line"></div>

      <div className="right-side">

        <div className="login-box">

          <h2 className="title">Welcome</h2>

          <p>Please login to Admin Dashboard</p>

          <form onSubmit={handleSubmit}>


            <label>Username</label>

            <input
              name="username"
              value={form.username}
              onChange={handleChange}
            />

            {errors.username &&
              <div className="error">
                {errors.username}
              </div>
            }


           <label>Password</label>

<div className="password-box">

  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={form.password}
    onChange={handleChange}
    className="password-input"
  />

  <button
    type="button"
    className="eye-btn"
    onClick={() =>
      setShowPassword(!showPassword)
    }
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>

</div>

{errors.password &&
  <div className="error">
    {errors.password}
  </div>
}


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
              name="captchaInput"
              placeholder="Enter captcha"
              value={form.captchaInput}
              onChange={handleChange}
            />

            {errors.captchaInput &&
              <div className="error">
                {errors.captchaInput}
              </div>
            }


            {errors.api &&
              <div className="error">
                {errors.api}
              </div>
            }


            <button className="login-btn">

              {loading ? "Sending OTP..." : "Login"}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

}
