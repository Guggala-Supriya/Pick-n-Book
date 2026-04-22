import React, { useEffect, useState } from "react";
import { CheckCircle2, Eye, PencilLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./BusConvenienceFee.css";
import { getItem, setItem } from "../../../utils/memoryStorage";

const safeValue = (value, fallback = "--") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

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

const formatConvenienceDateTime = (value) => {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatFeeLabel(record) {
  const amountType = safeValue(record?.amountType, "Fix").toLowerCase();
  const value = Number(record?.value) || 0;

  if (amountType === "percentage") {
    return `${value}%`;
  }

  return inrFormatter.format(value);
}

export default function AdminConvenienceFeePage() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [selectedFee, setSelectedFee] = useState(null);

  useEffect(() => {
    setFees(listConvenienceFees());
  }, []);

  return (
    <section className="admin-b2c-page admin-convenience-page">
      <header className="admin-b2c-header admin-convenience-header">
        <h1>B2C Bus Convenience Fee</h1>
      </header>

      <section className="admin-convenience-table-shell">
        <header className="admin-convenience-table-head">
          <span>ID</span>
          <span>Fee</span>
          <span>Entry Date</span>
          <span>Update Date</span>
          <span>Updated By</span>
          <span>Status</span>
          <span>Action</span>
        </header>

        <div className="admin-convenience-table-body">
          {fees.map((item) => (
            <article key={item.id} className="admin-convenience-table-row">
              <div className="admin-convenience-cell">
                <strong>{safeValue(item.id)}</strong>
              </div>

              <div className="admin-convenience-cell">
                <strong>{formatFeeLabel(item)}</strong>
              </div>

              <div className="admin-convenience-cell">
                <strong>{formatConvenienceDateTime(item.entryDateUtc)}</strong>
              </div>

              <div className="admin-convenience-cell">
                <strong>{formatConvenienceDateTime(item.updatedAtUtc)}</strong>
              </div>

              <div className="admin-convenience-cell">
                <strong>{safeValue(item.updatedBy)}</strong>
              </div>

              <div className="admin-convenience-cell admin-convenience-status-cell">
                <span className="admin-convenience-status active">
                  <CheckCircle2 size={14} />
                  {safeValue(item.status)}
                </span>
              </div>

              <div className="admin-convenience-cell admin-convenience-action-cell">
                <button
                  type="button"
                  className="admin-convenience-icon-btn view"
                  aria-label={`View convenience fee ${item.id}`}
                  onClick={() => setSelectedFee(item)}
                >
                  <Eye size={15} />
                </button>
                <button
                  type="button"
                  className="admin-convenience-icon-btn edit"
                  aria-label={`Edit convenience fee ${item.id}`}
                  onClick={() =>
                    navigate(
                      `/admin/b2c-bus/convenience-fee/edit?ref_id=${encodeURIComponent(
                        String(item.id)
                      )}`
                    )
                  }
                >
                  <PencilLine size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedFee ? (
        <div className="admin-view-backdrop" onClick={() => setSelectedFee(null)}>
          <article
            className="admin-view-card"
            role="dialog"
            aria-modal="true"
            aria-label="Convenience fee details"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-view-header">
              <div className="admin-view-header-main">
                <h2>Convenience Fee Detail</h2>
                <p className="admin-view-header-subtitle">
                  ID {safeValue(selectedFee.id)} | {safeValue(selectedFee.updatedBy)}
                </p>
                <div className="admin-view-meta-row">
                  <span className="admin-view-meta-chip success">
                    {safeValue(selectedFee.status)}
                  </span>
                  <span className="admin-view-meta-chip">
                    Fee {formatFeeLabel(selectedFee)}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedFee(null)}>
                Close
              </button>
            </header>

            <section className="admin-view-grid">
              <div>
                <span>ID</span>
                <strong>{safeValue(selectedFee.id)}</strong>
              </div>
              <div>
                <span>Fee</span>
                <strong>{formatFeeLabel(selectedFee)}</strong>
              </div>
              <div>
                <span>Amount Type</span>
                <strong>{safeValue(selectedFee.amountType, "Fix")}</strong>
              </div>
              <div>
                <span>Entry Date</span>
                <strong>{formatConvenienceDateTime(selectedFee.entryDateUtc)}</strong>
              </div>
              <div>
                <span>Update Date</span>
                <strong>{formatConvenienceDateTime(selectedFee.updatedAtUtc)}</strong>
              </div>
              <div>
                <span>Updated By</span>
                <strong>{safeValue(selectedFee.updatedBy)}</strong>
              </div>
              <div className="admin-view-highlight-card">
                <span>Status</span>
                <strong>{safeValue(selectedFee.status)}</strong>
              </div>
            </section>
          </article>
        </div>
      ) : null}
    </section>
  );
}


