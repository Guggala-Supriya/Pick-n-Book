import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaCheckCircle
} from "react-icons/fa";
import "../STYLES/Register.css";
// import flightCarImage from "../IMAGES/flightcar.png";
import flightCarImage from "../IMAGES/loginimage.png";
import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "../api/apiBaseUrl";

const COUNTRY_CODE_OPTIONS = [
  { value: "", label: "Select code", mobileLength: null },
  { value: "+91", label: "+91 (India)", mobileLength: 10 },
  // { value: "+1", label: "+1 (USA/Canada)", mobileLength: 10 },
  // { value: "+44", label: "+44 (UK)", mobileLength: 10 },
  // { value: "+61", label: "+61 (Australia)", mobileLength: 9 },
  // { value: "+971", label: "+971 (UAE)", mobileLength: 9 }
];

const CURRENCY_OPTIONS = ["INR"];

const COUNTRY_CODE_MAP = COUNTRY_CODE_OPTIONS.reduce((map, option) => {
  if (option.value) {
    map.set(option.value, option);
  }
  return map;
}, new Map());

const NAME_REGEX = /^[A-Za-z]+$/;
const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const normalizeForm = (form) => ({
  ...form,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  mobile: form.mobile.trim(),
  email: form.email.trim(),
  password: form.password.trim(),
  confirmPassword: form.confirmPassword.trim()
});

const validateRegisterForm = (form) => {
  const nextErrors = {};

  if (!form.firstName) {
    nextErrors.firstName = "First name is required";
  } else if (form.firstName.length < 6) {
    nextErrors.firstName = "First name must be at least 6 characters";
  } else if (form.firstName.length > 18) {
    nextErrors.firstName = "First name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.firstName)) {
    nextErrors.firstName = "Only letters are allowed";
  }

  if (!form.lastName) {
    nextErrors.lastName = "Last name is required";
  } else if (form.lastName.length < 6) {
    nextErrors.lastName = "Last name must be at least 6 characters";
  } else if (form.lastName.length > 18) {
    nextErrors.lastName = "Last name cannot exceed 18 characters";
  } else if (!NAME_REGEX.test(form.lastName)) {
    nextErrors.lastName = "Only letters are allowed";
  }

  if (!form.countryCode) {
    nextErrors.countryCode = "Please select a country code";
  } else if (!COUNTRY_CODE_MAP.has(form.countryCode)) {
    nextErrors.countryCode = "Invalid country code";
  }

  if (!form.mobile) {
    nextErrors.mobile = "Mobile number is required";
  } else if (!/^\d+$/.test(form.mobile)) {
    nextErrors.mobile = "Only numbers are allowed";
  } else {
    const countryConfig = COUNTRY_CODE_MAP.get(form.countryCode);
    const expectedLength = countryConfig?.mobileLength;

    if (expectedLength && form.mobile.length !== expectedLength) {
      nextErrors.mobile = `Mobile number must contain ${expectedLength} digits`;
    } else if (form.countryCode === "+91" && !/^[6-9]/.test(form.mobile)) {
      nextErrors.mobile = "Enter a valid mobile number";
    } else if (!expectedLength && (form.mobile.length < 6 || form.mobile.length > 15)) {
      nextErrors.mobile = "Enter a valid mobile number";
    }
  }

  if (!form.email) {
    nextErrors.email = "Email address is required";
  } else if (/\s/.test(form.email)) {
    nextErrors.email = "Email format is incorrect";
  } else if (/[A-Z]/.test(form.email)) {
    nextErrors.email = "Only lowercase letters are allowed";
  } else if (!EMAIL_REGEX.test(form.email)) {
    nextErrors.email = "Enter a valid email address";
  }

  if (!form.password) {
    nextErrors.password = "Password is required";
  } else if (form.password.length < 8) {
    nextErrors.password = "Password must be at least 8 characters";
  } else if (form.password.length > 64) {
    nextErrors.password = "Password cannot exceed 64 characters";
  } else if (/\s/.test(form.password)) {
    nextErrors.password = "Password cannot contain spaces";
  } else if (!STRONG_PASSWORD_REGEX.test(form.password)) {
    nextErrors.password =
      "Password must include uppercase, lowercase, number and special character";
  }

  if (!form.confirmPassword) {
    nextErrors.confirmPassword = "Please confirm your password";
  } else if (form.confirmPassword !== form.password) {
    nextErrors.confirmPassword = "Passwords do not match";
  }

  if (!form.agree) {
    nextErrors.agree = "Please accept terms & conditions";
  }

  return nextErrors;
};

const Register = () => {
  const navigate = useNavigate();
  const firstNameRef = useRef(null);
  const authPageStyle = {
    backgroundImage: `url(${flightCarImage})`
  };

  useEffect(() => {
    firstNameRef.current.focus();
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [serverErrors, setServerErrors] = useState({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    countryCode: "",
    mobile: "",
    email: "",
    currency: "INR",
    password: "",
    confirmPassword: "",
    agree: false
  });

  const [touched, setTouched] = useState({});

  const normalizedForm = useMemo(() => normalizeForm(form), [form]);
  const validationErrors = useMemo(
    () => validateRegisterForm(normalizedForm),
    [normalizedForm]
  );
  const isFormValid = Object.keys(validationErrors).length === 0;
  const selectedCountry = COUNTRY_CODE_MAP.get(form.countryCode);
  const mobileMaxLength = selectedCountry?.mobileLength || 15;

  const getVisibleError = (fieldName) => {
    if (serverErrors[fieldName]) {
      return serverErrors[fieldName];
    }

    if (!touched[fieldName]) {
      return "";
    }

    return validationErrors[fieldName] || "";
  };

  const getStatusMessage = () => {
    if (apiMessage) {
      return apiMessage;
    }

    return "";
  };

  const statusMessage = getStatusMessage();

  const sanitizeValue = (name, value) => {
    if (name === "firstName" || name === "lastName") {
      return value.replace(/\s+/g, "").slice(0, 18);
    }

    if (name === "mobile") {
      return value.replace(/\s+/g, "").slice(0, 15);
    }

    if (name === "email") {
      return value.replace(/\s+/g, "");
    }

    return value;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === "checkbox" ? checked : sanitizeValue(name, value);

    setForm((prev) => ({
      ...prev,
      [name]: nextValue
    }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    setServerErrors((prev) => ({ ...prev, [name]: "" }));
    setApiMessage("");
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const cleanedForm = normalizeForm(form);
    setForm(cleanedForm);

    const nextErrors = validateRegisterForm(cleanedForm);
    const formIsValid = Object.keys(nextErrors).length === 0;
    if (!formIsValid) {
      setTouched({
        firstName: true,
        lastName: true,
        countryCode: true,
        mobile: true,
        email: true,
        password: true,
        confirmPassword: true,
        agree: true
      });
      return;
    }

    setLoading(true);
    setApiMessage("");
    setServerErrors({});

    try {
      const response = await fetch(
        toApiUrl("/api/Auth/register"),
        {
          method: "POST",
          headers: withNgrokSkipWarningHeader("/api/Auth/register", {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({
            firstName: cleanedForm.firstName,
            lastName: cleanedForm.lastName,
            phoneNumber: cleanedForm.countryCode + cleanedForm.mobile,
            email: cleanedForm.email,
            password: cleanedForm.password
          })
        }
      );

      const payload = await readResponsePayload(response);
      const message = normalizeResponseMessage(payload, "Registration failed");

      if (response.ok) {
        setApiMessage("User registered successfully");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else if (/already/i.test(message)) {
        setServerErrors({
          email: "Email already registered"
        });
        setTouched((prev) => ({ ...prev, email: true }));
        setApiMessage("Email already registered");
      } else {
        setApiMessage(message || "Registration failed");
      }
    } catch (error) {
      setApiMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const hasValue = (value) => value.trim().length > 0;

  return (
    <div className="travel-auth-page travel-auth-register" style={authPageStyle}>
      <div className="travel-auth-card">
        <section className="travel-auth-form-panel">
          <h2 className="travel-auth-heading">Create Account</h2>
          <p className="travel-auth-subheading">
            Sign up to book bus seats, flights and more
          </p>

          {statusMessage && (
            <p
              className={`travel-auth-status ${
                statusMessage.toLowerCase().includes("success")
                  ? "is-success"
                  : "is-error"
              }`}
            >
              {statusMessage}
            </p>
          )}

          <form className="travel-auth-form" onSubmit={handleSubmit}>
            <div className="travel-register-grid">
              <div className="travel-field">
                <label htmlFor="register-first-name">First Name</label>
                <div className="travel-field-line">
                  <input
                    ref={firstNameRef}
                    id="register-first-name"
                    name="firstName"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="given-name"
                    maxLength={18}
                  />
                  {hasValue(form.firstName) && !getVisibleError("firstName") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getVisibleError("firstName")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-last-name">Last Name</label>
                <div className="travel-field-line">
                  <input
                    id="register-last-name"
                    name="lastName"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="family-name"
                    maxLength={18}
                  />
                  {hasValue(form.lastName) && !getVisibleError("lastName") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getVisibleError("lastName")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-country-code">Country Code</label>
                <div className="travel-field-line">
                  <select
                    id="register-country-code"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    {COUNTRY_CODE_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="travel-field-error">{getVisibleError("countryCode")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-mobile">Mobile Number</label>
                <div className="travel-field-line">
                  <input
                    id="register-mobile"
                    name="mobile"
                    placeholder="Mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={mobileMaxLength}
                  />
                  {hasValue(form.mobile) && !getVisibleError("mobile") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getVisibleError("mobile")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-email">E-mail Address</label>
                <div className="travel-field-line">
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="email"
                  />
                  {hasValue(form.email) && !getVisibleError("email") && (
                    <FaCheckCircle className="travel-field-check" aria-hidden="true" />
                  )}
                </div>
                <p className="travel-field-error">{getVisibleError("email")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-currency">Preferred Currency</label>
                <div className="travel-field-line">
                  <select
                    id="register-currency"
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="travel-field-error" />
              </div>

              <div className="travel-field">
                <label htmlFor="register-password">Password</label>
                <div className="travel-field-line">
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    maxLength={64}
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
                <p className="travel-field-error">{getVisibleError("password")}</p>
              </div>

              <div className="travel-field">
                <label htmlFor="register-confirm-password">Confirm Password</label>
                <div className="travel-field-line">
                  <input
                    id="register-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="new-password"
                    maxLength={64}
                  />
                  <button
                    type="button"
                    className="travel-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="travel-field-error">
                  {getVisibleError("confirmPassword")}
                </p>
              </div>
            </div>

            <div className="travel-terms-wrap">
              <label className="travel-terms">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <span>
                  I agree with{" "}
                  <span className="travel-terms-link">Terms & Conditions</span>
                </span>
              </label>
              <p className="travel-field-error">{getVisibleError("agree")}</p>
            </div>

            <div className="travel-auth-actions">
              <button
                type="submit"
                className="travel-btn travel-btn-primary"
                disabled={loading || !isFormValid}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>

            <p className="travel-auth-footnote">
              Already have account?{" "}
              <button
                type="button"
                className="travel-footnote-link"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Register;
