import React, { useState } from "react";
import "../STYLES/QR.css";

const AddQR = ({ onAdd, onBack, isBusy = false }) => {
  const [formData, setFormData] = useState({
    bankName: "",
    companyName: "",
    upiId: "",
    mobile: "",
    file: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormBusy = isSubmitting || isBusy;

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: files ? files[0] : value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.bankName.trim()) {
      nextErrors.bankName = "Bank Name is required";
    }

    if (!formData.companyName.trim()) {
      nextErrors.companyName = "Company Name is required";
    }

    if (!formData.upiId.trim()) {
      nextErrors.upiId = "UPI ID is required";
    } else if (!formData.upiId.includes("@")) {
      nextErrors.upiId = "UPI ID must contain @";
    }

    if (!formData.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      nextErrors.mobile = "Mobile must be 10 digits";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onAdd({
        bankName: formData.bankName,
        accountName: formData.companyName,
        upiId: formData.upiId,
        mobile: formData.mobile,
        file: formData.file,
      });

      setFormData({
        bankName: "",
        companyName: "",
        upiId: "",
        mobile: "",
        file: null,
      });
      setErrors({});
    } catch {
      // Parent shows the API error state.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <button onClick={onBack} className="btn-back" type="button" disabled={isFormBusy}>
        Back
      </button>

      <h2 className="form-title">Add QR</h2>

      <form onSubmit={handleSubmit}>
        <div className="grid-form">
          <div>
            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              className="input-style"
              disabled={isFormBusy}
            />
            {errors.companyName && <p className="error-text">{errors.companyName}</p>}
          </div>

          <div>
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
              className="input-style"
              disabled={isFormBusy}
            />
            {errors.bankName && <p className="error-text">{errors.bankName}</p>}
          </div>

          <div>
            <input
              type="text"
              name="upiId"
              placeholder="UPI ID (example@bank)"
              value={formData.upiId}
              onChange={handleChange}
              className="input-style"
              disabled={isFormBusy}
            />
            {errors.upiId && <p className="error-text">{errors.upiId}</p>}
          </div>

          <div>
            <input
              type="text"
              name="mobile"
              placeholder="Mobile Number"
              maxLength="10"
              value={formData.mobile}
              onChange={handleChange}
              className="input-style"
              disabled={isFormBusy}
            />
            {errors.mobile && <p className="error-text">{errors.mobile}</p>}
          </div>

          <div className="col-span-full">
            <input
              type="file"
              name="file"
              accept="image/*"
              onChange={handleChange}
              className="input-style"
              disabled={isFormBusy}
            />
          </div>
        </div>

        <div className="qr-form-actions">
          <button type="submit" className="btn-save" disabled={isFormBusy}>
            {isFormBusy ? "Saving..." : "Save QR"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQR;
