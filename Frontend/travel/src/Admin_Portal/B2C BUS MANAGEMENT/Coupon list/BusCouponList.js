import React, { useMemo, useState } from "react";
import {
  Check,
  Download,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import "./BusCouponList.css";
import { csvCell, formatCouponDate, formatCouponDateTime } from "../../../adminPortalUtils";
import { useAdminList } from "../../../adminPortalStorage";

const INITIAL_COUPONS = [
  {
    id: 2832,
    value: 200,
    cpnType: "Fix",
    couponCode: "XUS6FVEI",
    startDate: "2026-03-13",
    expiryDate: "2026-03-14",
    useLimit: 2,
    status: "inactive",
    entryDate: "2026-03-13T12:32:00.000Z",
    remark: "testing",
  },
  {
    id: 2815,
    value: 100,
    cpnType: "Fix",
    couponCode: "9X7UE28C",
    startDate: "2025-11-21",
    expiryDate: "2025-11-21",
    useLimit: 1,
    status: "active",
    entryDate: "2025-11-21T14:32:00.000Z",
    remark: "testing",
  },
];

const DEFAULT_COUPON_SORT_BY = "entryDate";
const DEFAULT_COUPON_SORT_ORDER = "desc";

function getCouponSortValue(coupon, sortBy) {
  if (sortBy === "id") {
    return Number(coupon.id) || 0;
  }

  if (sortBy === "value") {
    return Number(coupon.value) || 0;
  }

  if (sortBy === "useLimit") {
    return Number(coupon.useLimit) || 0;
  }

  if (sortBy === "startDate" || sortBy === "expiryDate" || sortBy === "entryDate") {
    const timestamp = new Date(coupon[sortBy]).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  return String(coupon[sortBy] || "").toLowerCase();
}

function generateCouponCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 8; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function toInputDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function createDefaultCouponForm() {
  return {
    value: "",
    cpnType: "",
    startDate: "",
    expiryDate: "",
    couponCode: generateCouponCode(),
    useLimit: "",
    remark: "",
  };
}


export default function AdminBusCouponListPage() {
  const [coupons, setCoupons] = useAdminList("bus-coupons", INITIAL_COUPONS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState(DEFAULT_COUPON_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_COUPON_SORT_ORDER);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cpnTypeFilter, setCpnTypeFilter] = useState("all");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState(createDefaultCouponForm);
  const [generateError, setGenerateError] = useState("");
  const [editCoupon, setEditCoupon] = useState(null);
  const [editError, setEditError] = useState("");
  const [deleteCoupon, setDeleteCoupon] = useState(null);

  const availableStatuses = useMemo(() => {
    const uniqueStatus = new Set(
      coupons.map((coupon) => String(coupon.status || "").toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueStatus);
  }, [coupons]);

  const availableCouponTypes = useMemo(() => {
    const uniqueTypes = new Set(
      coupons.map((coupon) => String(coupon.cpnType || "").toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueTypes);
  }, [coupons]);

  const visibleCoupons = useMemo(() => {
    const filteredCoupons = coupons.filter((coupon) => {
      const matchesStatus =
        statusFilter === "all" || String(coupon.status || "").toLowerCase() === statusFilter;
      const matchesType =
        cpnTypeFilter === "all" || String(coupon.cpnType || "").toLowerCase() === cpnTypeFilter;

      return matchesStatus && matchesType;
    });

    return [...filteredCoupons].sort((leftCoupon, rightCoupon) => {
      const leftValue = getCouponSortValue(leftCoupon, sortBy);
      const rightValue = getCouponSortValue(rightCoupon, sortBy);

      let result = 0;
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        result = leftValue - rightValue;
      } else {
        result = String(leftValue).localeCompare(String(rightValue), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortOrder === "asc" ? result : -result;
    });
  }, [coupons, cpnTypeFilter, sortBy, sortOrder, statusFilter]);

  const hasActiveFilters =
    sortBy !== DEFAULT_COUPON_SORT_BY ||
    sortOrder !== DEFAULT_COUPON_SORT_ORDER ||
    statusFilter !== "all" ||
    cpnTypeFilter !== "all";

  const handleClearFilters = () => {
    setSortBy(DEFAULT_COUPON_SORT_BY);
    setSortOrder(DEFAULT_COUPON_SORT_ORDER);
    setStatusFilter("all");
    setCpnTypeFilter("all");
  };

  const handleExport = () => {
    if (visibleCoupons.length === 0) {
      return;
    }

    const header = [
      "ID",
      "CPN Value",
      "CPN Type",
      "Coupon Code",
      "Start Date",
      "Expiry Date",
      "Use Limit",
      "Status",
      "Entry Date",
      "Remark",
    ];

    const csvRows = visibleCoupons.map((coupon) => [
      coupon.id,
      `INR ${coupon.value}`,
      coupon.cpnType,
      coupon.couponCode,
      formatCouponDate(coupon.startDate),
      formatCouponDate(coupon.expiryDate),
      coupon.useLimit,
      coupon.status,
      formatCouponDateTime(coupon.entryDate),
      coupon.remark,
    ]);

    const csv = [header, ...csvRows]
      .map((line) => line.map((cell) => csvCell(cell)).join(","))
      .join("\n");

    const fileBlob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const fileUrl = URL.createObjectURL(fileBlob);
    const link = document.createElement("a");

    link.href = fileUrl;
    link.download = `admin-coupon-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  const openGenerateModal = () => {
    setGenerateError("");
    setGenerateForm(createDefaultCouponForm());
    setIsGenerateModalOpen(true);
  };

  const handleGenerateCoupon = () => {
    const amount = Number(generateForm.value);
    const useLimit = Number(generateForm.useLimit);
    const couponCode = String(generateForm.couponCode || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    const startTimestamp = new Date(generateForm.startDate).getTime();
    const expiryTimestamp = new Date(generateForm.expiryDate).getTime();

    if (!String(generateForm.cpnType || "").trim()) {
      setGenerateError("Select coupon type.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setGenerateError("Enter a valid coupon value.");
      return;
    }

    if (!Number.isFinite(useLimit) || useLimit <= 0) {
      setGenerateError("Use limit must be greater than zero.");
      return;
    }

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(expiryTimestamp)) {
      setGenerateError("Choose valid start and expiry dates.");
      return;
    }

    if (startTimestamp > expiryTimestamp) {
      setGenerateError("Expiry date should be the same or after start date.");
      return;
    }

    const nextId =
      coupons.reduce((highest, coupon) => Math.max(highest, Number(coupon.id) || 0), 0) + 1;
    const existingCodes = new Set(
      coupons.map((coupon) => String(coupon.couponCode || "").toUpperCase())
    );

    if (!couponCode) {
      setGenerateError("Coupon code is required.");
      return;
    }

    if (existingCodes.has(couponCode)) {
      setGenerateError("Coupon code already exists. Use a different code.");
      return;
    }

    const newCoupon = {
      id: nextId,
      value: amount,
      cpnType: generateForm.cpnType,
      couponCode,
      startDate: generateForm.startDate,
      expiryDate: generateForm.expiryDate,
      useLimit,
      status: "active",
      entryDate: new Date().toISOString(),
      remark: generateForm.remark.trim(),
    };

    setCoupons((previous) => [newCoupon, ...previous]);
    setIsGenerateModalOpen(false);
    setGenerateError("");
  };

  const openEditModal = (coupon) => {
    setEditError("");
    setEditCoupon({
      ...coupon,
      value: String(coupon.value),
      useLimit: String(coupon.useLimit),
      startDate: toInputDate(coupon.startDate),
      expiryDate: toInputDate(coupon.expiryDate),
      remark: coupon.remark || "",
    });
  };

  const handleEditSave = () => {
    if (!editCoupon) {
      return;
    }

    const amount = Number(editCoupon.value);
    const useLimit = Number(editCoupon.useLimit);
    const startTimestamp = new Date(editCoupon.startDate).getTime();
    const expiryTimestamp = new Date(editCoupon.expiryDate).getTime();

    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Enter a valid coupon value.");
      return;
    }

    if (!Number.isFinite(useLimit) || useLimit <= 0) {
      setEditError("Use limit must be greater than zero.");
      return;
    }

    if (!Number.isFinite(startTimestamp) || !Number.isFinite(expiryTimestamp)) {
      setEditError("Choose valid start and expiry dates.");
      return;
    }

    if (startTimestamp > expiryTimestamp) {
      setEditError("Expiry date should be the same or after start date.");
      return;
    }

    setCoupons((previous) =>
      previous.map((coupon) =>
        coupon.id === editCoupon.id
          ? {
              ...coupon,
              value: amount,
              cpnType: editCoupon.cpnType,
              startDate: editCoupon.startDate,
              expiryDate: editCoupon.expiryDate,
              useLimit,
              status: editCoupon.status,
              remark: editCoupon.remark.trim(),
              entryDate: new Date().toISOString(),
            }
          : coupon
      )
    );

    setEditCoupon(null);
    setEditError("");
  };

  const handleDeleteCoupon = () => {
    if (!deleteCoupon) {
      return;
    }

    setCoupons((previous) => previous.filter((coupon) => coupon.id !== deleteCoupon.id));
    setDeleteCoupon(null);
  };

  const handleCouponStatusToggle = (couponId) => {
    setCoupons((previous) =>
      previous.map((coupon) =>
        coupon.id === couponId
          ? {
              ...coupon,
              status: coupon.status === "active" ? "inactive" : "active",
            }
          : coupon
      )
    );
  };

  return (
    <>
      <section className="admin-markup-coupon-shell">
        <header className="admin-markup-coupon-header">
          <div className="admin-markup-coupon-title-wrap">
            <h1>
              <strong>B2C Bus</strong> Coupon List
            </h1>
            <span className="admin-markup-coupon-title-line" />
          </div>

          <div className="admin-markup-coupon-actions">
            <button
              type="button"
              className={`admin-markup-coupon-btn filter ${isFilterPanelOpen ? "active" : ""}`}
              onClick={() => setIsFilterPanelOpen((previous) => !previous)}
              aria-expanded={isFilterPanelOpen}
              aria-controls="admin-markup-coupon-filter"
            >
              <SlidersHorizontal size={15} />
              <span>Filter</span>
            </button>

            <button
              type="button"
              className="admin-markup-coupon-btn clear"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              <X size={15} />
              <span>Clear Filter</span>
            </button>

            <button
              type="button"
              className="admin-markup-coupon-btn generate"
              onClick={openGenerateModal}
            >
              <Plus size={15} />
              <span>Generate Coupon</span>
            </button>

            <button
              type="button"
              className="admin-markup-coupon-btn export"
              onClick={handleExport}
              disabled={visibleCoupons.length === 0}
            >
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>
        </header>

        {isFilterPanelOpen && (
          <section className="admin-markup-coupon-filter" id="admin-markup-coupon-filter">
            <div className="admin-markup-coupon-filter-grid">
              <label>
                <span>Sort By</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="entryDate">Entry Date</option>
                  <option value="id">ID</option>
                  <option value="value">CPN Value</option>
                  <option value="startDate">Start Date</option>
                  <option value="expiryDate">Expiry Date</option>
                  <option value="useLimit">Use Limit</option>
                  <option value="couponCode">Coupon Code</option>
                  <option value="status">Status</option>
                </select>
              </label>

              <label>
                <span>Order</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>

              <label>
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">All</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>CPN Type</span>
                <select
                  value={cpnTypeFilter}
                  onChange={(event) => setCpnTypeFilter(event.target.value)}
                >
                  <option value="all">All</option>
                  {availableCouponTypes.map((couponType) => (
                    <option key={couponType} value={couponType}>
                      {couponType}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        )}

        <section className="admin-markup-coupon-table-wrap">
          <table className="admin-markup-coupon-table">
            <colgroup>
              <col className="col-id" />
              <col className="col-value" />
              <col className="col-type" />
              <col className="col-code" />
              <col className="col-start" />
              <col className="col-expiry" />
              <col className="col-limit" />
              <col className="col-status" />
              <col className="col-entry" />
              <col className="col-remark" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>CPN Value</th>
                <th>CPN Type</th>
                <th>Coupon Code</th>
                <th>Start Date</th>
                <th>Expiry Date</th>
                <th>Use Limit</th>
                <th className="status-col">Status</th>
                <th>Entry Date</th>
                <th>Remark</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleCoupons.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <p className="admin-markup-coupon-empty">No coupons found for current filters.</p>
                  </td>
                </tr>
              ) : (
                visibleCoupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>{coupon.id}</td>
                    <td>{`INR ${coupon.value}`}</td>
                    <td>{coupon.cpnType}</td>
                    <td>
                      <span className="admin-markup-coupon-code">{coupon.couponCode}</span>
                    </td>
                    <td>{formatCouponDate(coupon.startDate)}</td>
                    <td>{formatCouponDate(coupon.expiryDate)}</td>
                    <td>{coupon.useLimit}</td>
                    <td className="status-col">
                      <button
                        type="button"
                        className={`admin-markup-coupon-status ${coupon.status}`}
                        onClick={() => handleCouponStatusToggle(coupon.id)}
                        aria-label={`Set coupon ${coupon.couponCode} to ${
                          coupon.status === "active" ? "inactive" : "active"
                        }`}
                      >
                        {coupon.status === "active" ? <Check size={14} /> : <X size={14} />}
                        <span>{coupon.status === "active" ? "Active" : "Inactive"}</span>
                      </button>
                    </td>
                    <td>{formatCouponDateTime(coupon.entryDate)}</td>
                    <td className="admin-markup-coupon-remark">
                      <span>{coupon.remark || "--"}</span>
                    </td>
                    <td className="action-col">
                      <div className="admin-markup-coupon-action-group">
                        <button
                          type="button"
                          title="Edit"
                          aria-label={`Edit coupon ${coupon.id}`}
                          onClick={() => openEditModal(coupon)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          aria-label={`Delete coupon ${coupon.id}`}
                          className="danger"
                          onClick={() => setDeleteCoupon(coupon)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </section>

      {isGenerateModalOpen && (
        <div className="admin-markup-coupon-backdrop" onClick={() => setIsGenerateModalOpen(false)}>
          <section
            className="admin-markup-coupon-modal generate"
            role="dialog"
            aria-modal="true"
            aria-label="Generate coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="generate-header">
              <h2>Add B2C Bus Coupon</h2>
            </header>

            <div className="admin-markup-coupon-form admin-markup-coupon-generate-form">
              <label>
                <span>Coupon Type :</span>
                <select
                  value={generateForm.cpnType}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="">---Select Amount Type---</option>
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>Value:</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter value"
                  value={generateForm.value}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({ ...previous, value: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Start Date :</span>
                <input
                  type="date"
                  placeholder="Select Start Date"
                  value={generateForm.startDate}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({ ...previous, startDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Expiry Date :</span>
                <input
                  type="date"
                  placeholder="Select Expiry Date"
                  value={generateForm.expiryDate}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({
                      ...previous,
                      expiryDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Coupon Code :</span>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={generateForm.couponCode}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({
                      ...previous,
                      couponCode: event.target.value.toUpperCase().replace(/\s+/g, ""),
                    }))
                  }
                />
              </label>
              <label>
                <span>Coupon Use Limit:</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter use limit"
                  value={generateForm.useLimit}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({ ...previous, useLimit: event.target.value }))
                  }
                />
              </label>
              <label className="remark-field">
                <span>Coupon Remark:</span>
                <input
                  type="text"
                  placeholder="Enter remark"
                  value={generateForm.remark}
                  onChange={(event) =>
                    setGenerateForm((previous) => ({ ...previous, remark: event.target.value }))
                  }
                />
              </label>
            </div>

            {generateError && <p className="admin-markup-coupon-error">{generateError}</p>}

            <div className="admin-markup-coupon-modal-actions generate-actions">
              <button
                type="button"
                className="primary generate-submit"
                onClick={handleGenerateCoupon}
              >
                <Check size={16} />
                <span>Generate</span>
              </button>
              <button
                type="button"
                className="danger generate-cancel"
                onClick={() => setIsGenerateModalOpen(false)}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {editCoupon && (
        <div className="admin-markup-coupon-backdrop" onClick={() => setEditCoupon(null)}>
          <section
            className="admin-markup-coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Coupon</h2>
              <button type="button" onClick={() => setEditCoupon(null)} aria-label="Close edit">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-coupon-form">
              <label>
                <span>ID</span>
                <input type="text" value={editCoupon.id} disabled />
              </label>
              <label>
                <span>Coupon Code</span>
                <input type="text" value={editCoupon.couponCode} disabled />
              </label>
              <label>
                <span>CPN Value</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editCoupon.value}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, value: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Type</span>
                <select
                  value={editCoupon.cpnType}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  value={editCoupon.startDate}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, startDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Expiry Date</span>
                <input
                  type="date"
                  value={editCoupon.expiryDate}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, expiryDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Use Limit</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editCoupon.useLimit}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, useLimit: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={editCoupon.status}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, status: event.target.value }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="wide">
                <span>Remark</span>
                <textarea
                  value={editCoupon.remark}
                  onChange={(event) =>
                    setEditCoupon((previous) => ({ ...previous, remark: event.target.value }))
                  }
                />
              </label>
            </div>

            {editError && <p className="admin-markup-coupon-error">{editError}</p>}

            <div className="admin-markup-coupon-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditCoupon(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteCoupon && (
        <div className="admin-markup-coupon-backdrop" onClick={() => setDeleteCoupon(null)}>
          <section
            className="admin-markup-coupon-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Coupon</h2>
              <button
                type="button"
                onClick={() => setDeleteCoupon(null)}
                aria-label="Close delete dialog"
              >
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-coupon-delete-copy">
              Are you sure you want to delete coupon <strong>{deleteCoupon.couponCode}</strong>?
            </p>

            <div className="admin-markup-coupon-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteCoupon(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteCoupon}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}


