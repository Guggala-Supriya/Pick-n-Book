import React, { useState } from "react";
import "../STYLES/traveller.css";

const AddTravelerForm = ({ onBack, onSubmit }) => {
  const [form, setForm] = useState({
    type: "",
    title: "",
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    passportNo: "",
    country: "",
    passportIssue: "",
    passportExpiry: "",
  });

  const [errors, setErrors] = useState({});

  const countries = [
    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "UAE",
    "Saudi Arabia",
    "Singapore",
  ];

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.type) newErrors.type = "Select traveler type";
    if (!form.title) newErrors.title = "Select title";
    if (!form.firstName) newErrors.firstName = "First name required";
    if (!form.gender) newErrors.gender = "Select gender";
    if (!form.dob) newErrors.dob = "Date of birth required";

    if (!form.email) {
      newErrors.email = "Email required";
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(form.email)) {
      newErrors.email = "Must be @gmail.com email";
    }

    if (!form.phone) {
      newErrors.phone = "Phone number required";
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = "Must be 10 digits";
    }

    if (!form.country) newErrors.country = "Select country";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    if (typeof onSubmit === "function") onSubmit(form);

    setForm({
      type: "",
      title: "",
      firstName: "",
      lastName: "",
      gender: "",
      dob: "",
      email: "",
      phone: "",
      passportNo: "",
      country: "",
      passportIssue: "",
      passportExpiry: "",
    });
    setErrors({});
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h2 className="title-text">Add Traveler</h2>
        <button onClick={onBack} type="button" className="btn btn-red">
          Traveler List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid-3">
        <div>
          <select name="type" value={form.type} onChange={handleChange} className="input-field">
            <option value="">Select Type</option>
            <option>Adult</option>
            <option>Child</option>
          </select>
          {errors.type && <p className="error-text">{errors.type}</p>}
        </div>

        <div>
          <select name="title" value={form.title} onChange={handleChange} className="input-field">
            <option value="">Select Title</option>
            <option>Mr</option>
            <option>Mrs</option>
            <option>Ms</option>
          </select>
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        <div>
          <input
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            className="input-field"
          />
          {errors.firstName && <p className="error-text">{errors.firstName}</p>}
        </div>

        <input
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleChange}
          className="input-field"
        />

        <div>
          <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
          {errors.gender && <p className="error-text">{errors.gender}</p>}
        </div>

        <div>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} className="input-field" />
          {errors.dob && <p className="error-text">{errors.dob}</p>}
        </div>

        <div>
          <input
            name="email"
            placeholder="Email (@gmail.com)"
            value={form.email}
            onChange={handleChange}
            className="input-field"
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div>
          <input
            name="phone"
            placeholder="Phone (10 digits)"
            value={form.phone}
            onChange={handleChange}
            maxLength="10"
            className="input-field"
          />
          {errors.phone && <p className="error-text">{errors.phone}</p>}
        </div>

        <input
          name="passportNo"
          placeholder="Passport No"
          value={form.passportNo}
          onChange={handleChange}
          className="input-field"
        />

        <div>
          <select name="country" value={form.country} onChange={handleChange} className="input-field">
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
          {errors.country && <p className="error-text">{errors.country}</p>}
        </div>

        <input
          type="date"
          name="passportIssue"
          value={form.passportIssue}
          onChange={handleChange}
          className="input-field"
        />
        <input
          type="date"
          name="passportExpiry"
          value={form.passportExpiry}
          onChange={handleChange}
          className="input-field"
        />

        <div className="span-full submit-wrap">
          <button type="submit" className="btn btn-orange">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTravelerForm;
