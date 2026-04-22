import React, { useMemo, useState } from "react";
import { List } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./BusEditConvenienceFee.css";
import { getItem, setItem } from "../../../utils/memoryStorage";

const CONVENIENCE_FEE_STORAGE_KEY = "admin_convenience_fee_records";

const DEFAULT_CONVENIENCE_FEES = [
  {
    id: "119",
    amountType: "Fix",
    value: 500,
    entryDateUtc: "2026-03-16T11:56:00+05:30",
    updatedAtUtc: "2026-03-16T11:56:00+05:30",
    updatedBy: "Pick N Book",
    status: "Active",
  },
];

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeFeeRecord = (record, index = 0) => {
  const fallback = DEFAULT_CONVENIENCE_FEES[index] || DEFAULT_CONVENIENCE_FEES[0];

  return {
    id: normalizeText(record?.id, normalizeText(fallback.id, `${index + 1}`)),
    amountType: normalizeText(record?.amountType, normalizeText(fallback.amountType, "Fix")),
    value: toSafeNumber(record?.value, toSafeNumber(fallback.value, 0)),
    entryDateUtc: normalizeText(record?.entryDateUtc, normalizeText(fallback.entryDateUtc, "")),
    updatedAtUtc: normalizeText(record?.updatedAtUtc, normalizeText(fallback.updatedAtUtc, "")),
    updatedBy: normalizeText(record?.updatedBy, normalizeText(fallback.updatedBy, "Travel Admin")),
    status: normalizeText(record?.status, normalizeText(fallback.status, "Active")),
  };
};

const readFeeRecords = () => {
  try {
    const raw = getItem(CONVENIENCE_FEE_STORAGE_KEY) || "";
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CONVENIENCE_FEES;
    }

    return parsed.map((record, index) => normalizeFeeRecord(record, index));
  } catch {
    return DEFAULT_CONVENIENCE_FEES;
  }
};

const writeFeeRecords = (records) => {
  try {
    setItem(
      CONVENIENCE_FEE_STORAGE_KEY,
      JSON.stringify(records.map((record, index) => normalizeFeeRecord(record, index)))
    );
  } catch {
    // Ignore storage write failures.
  }
};

const listConvenienceFees = () => {
  const records = readFeeRecords();
  writeFeeRecords(records);
  return records;
};

const getConvenienceFeeById = (feeId) => {
  const normalizedId = normalizeText(feeId, "");
  if (!normalizedId) {
    return null;
  }

  return (
    listConvenienceFees().find((record) => normalizeText(record.id, "") === normalizedId) ||
    null
  );
};

const updateConvenienceFeeById = (feeId, updates) => {
  const normalizedId = normalizeText(feeId, "");
  if (!normalizedId) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const currentRecords = listConvenienceFees();
  let updatedRecord = null;

  const nextRecords = currentRecords.map((record, index) => {
    if (normalizeText(record.id, "") !== normalizedId) {
      return record;
    }

    updatedRecord = normalizeFeeRecord(
      {
        ...record,
        ...updates,
        updatedAtUtc: nowIso,
      },
      index
    );

    return updatedRecord;
  });

  writeFeeRecords(nextRecords);
  return updatedRecord;
};

export default function AdminEditConvenienceFeePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refId = normalizeText(searchParams.get("ref_id"), "");

  const feeRecord = useMemo(() => getConvenienceFeeById(refId), [refId]);
  const [amountType, setAmountType] = useState(
    normalizeText(feeRecord?.amountType, "Fix")
  );
  const [value, setValue] = useState(() => {
    const initial = Number(feeRecord?.value);
    return Number.isFinite(initial) ? String(initial) : "";
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUpdate = () => {
    setStatusMessage("");
    setErrorMessage("");

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMessage("Enter a valid value greater than 0.");
      return;
    }

    const updatedBy = "Travel Admin";
    const updated = updateConvenienceFeeById(refId, {
      amountType,
      value: numericValue,
      updatedBy,
    });

    if (!updated) {
      setErrorMessage("Unable to update convenience fee.");
      return;
    }

    setStatusMessage("Convenience fee updated successfully.");
  };

  if (!feeRecord) {
    return (
      <section className="admin-b2c-page admin-convenience-edit-page">
        <header className="admin-b2c-header admin-convenience-edit-header">
          <h1>Edit B2C Bus Convenience Fee</h1>
        </header>
        <div className="admin-data-error">Convenience fee record not found.</div>
        <div className="admin-convenience-edit-actions">
          <button
            type="button"
            className="admin-convenience-update-btn"
            onClick={() => navigate("/admin/b2c-bus/convenience-fee")}
          >
            Convenience Fee List
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-b2c-page admin-convenience-edit-page">
      <div className="admin-convenience-edit-head-row">
        <header className="admin-b2c-header admin-convenience-edit-header">
          <h1>Edit B2C Bus Convenience Fee</h1>
        </header>

        <button
          type="button"
          className="admin-convenience-list-btn"
          onClick={() => navigate("/admin/b2c-bus/convenience-fee")}
        >
          <List size={14} />
          Convenience Fee List
        </button>
      </div>

      <section className="admin-convenience-edit-shell">
        <div className="admin-convenience-edit-row">
          <div className="admin-convenience-edit-label">Amount Type</div>
          <div className="admin-convenience-edit-field">
            <select value={amountType} onChange={(event) => setAmountType(event.target.value)}>
              <option value="Fix">Fix</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>

          <div className="admin-convenience-edit-label">Value</div>
          <div className="admin-convenience-edit-field">
            <input
              type="number"
              min="0"
              step={amountType === "Percentage" ? "0.01" : "1"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={amountType === "Percentage" ? "Enter percentage" : "Enter fixed value"}
            />
          </div>
        </div>

        <div className="admin-convenience-edit-actions">
          <button type="button" className="admin-convenience-update-btn" onClick={handleUpdate}>
            Update
          </button>
        </div>
      </section>

      {errorMessage ? <div className="admin-data-error">{errorMessage}</div> : null}
      {statusMessage ? <div className="admin-data-info">{statusMessage}</div> : null}
    </section>
  );
}


