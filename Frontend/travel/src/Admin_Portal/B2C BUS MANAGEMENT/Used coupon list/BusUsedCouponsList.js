import React, { useMemo, useState } from "react";
import { Download, Pencil, SlidersHorizontal, Trash2, X } from "lucide-react";
import "./BusUsedCouponsList.css";
import { csvCell, formatCouponDateTime, formatCurrency } from "../../../adminPortalUtils";
import { getNextNumericId, useAdminList } from "../../../adminPortalStorage";

const INITIAL_USED_COUPONS = [
  {
    id: 1201,
    bookingId: "BUS-90231",
    couponCode: "WEEKEND20",
    usedDate: "2026-03-20T11:20:00.000Z",
    totalFare: 3200,
    cpnType: "Fix",
    cpnValue: 200,
    cpnAmount: 200,
    bookingStatus: "Booked",
  },
];
const DEFAULT_USED_COUPON_SORT_BY = "usedDate";
const DEFAULT_USED_COUPON_SORT_ORDER = "desc";

function getUsedCouponSortValue(record, sortBy) {
  if (sortBy === "id") {
    return Number(record.id) || 0;
  }

  if (sortBy === "totalFare" || sortBy === "cpnValue" || sortBy === "cpnAmount") {
    return Number(record[sortBy]) || 0;
  }

  if (sortBy === "usedDate") {
    const timestamp = new Date(record.usedDate).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  return String(record[sortBy] || "").toLowerCase();
}


export default function AdminBusUsedCouponListPage() {
  const [usedCoupons, setUsedCoupons] = useAdminList("bus-used-coupons", INITIAL_USED_COUPONS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState(DEFAULT_USED_COUPON_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_USED_COUPON_SORT_ORDER);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [cpnTypeFilter, setCpnTypeFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    bookingId: "",
    couponCode: "",
    usedDate: "",
    totalFare: "",
    cpnType: "Fix",
    cpnValue: "",
    cpnAmount: "",
    bookingStatus: "Booked",
  });
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [formError, setFormError] = useState("");

  const availableBookingStatuses = useMemo(() => {
    const uniqueStatuses = new Set(
      usedCoupons.map((record) => String(record.bookingStatus || "").toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueStatuses);
  }, [usedCoupons]);

  const availableCouponTypes = useMemo(() => {
    const uniqueTypes = new Set(
      usedCoupons.map((record) => String(record.cpnType || "").toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueTypes);
  }, [usedCoupons]);

  const visibleUsedCoupons = useMemo(() => {
    const filteredRecords = usedCoupons.filter((record) => {
      const matchesBookingStatus =
        bookingStatusFilter === "all" ||
        String(record.bookingStatus || "").toLowerCase() === bookingStatusFilter;
      const matchesCouponType =
        cpnTypeFilter === "all" || String(record.cpnType || "").toLowerCase() === cpnTypeFilter;

      return matchesBookingStatus && matchesCouponType;
    });

    return [...filteredRecords].sort((leftRecord, rightRecord) => {
      const leftValue = getUsedCouponSortValue(leftRecord, sortBy);
      const rightValue = getUsedCouponSortValue(rightRecord, sortBy);

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
  }, [usedCoupons, bookingStatusFilter, cpnTypeFilter, sortBy, sortOrder]);

  const hasActiveFilters =
    sortBy !== DEFAULT_USED_COUPON_SORT_BY ||
    sortOrder !== DEFAULT_USED_COUPON_SORT_ORDER ||
    bookingStatusFilter !== "all" ||
    cpnTypeFilter !== "all";

  const handleClearFilters = () => {
    setSortBy(DEFAULT_USED_COUPON_SORT_BY);
    setSortOrder(DEFAULT_USED_COUPON_SORT_ORDER);
    setBookingStatusFilter("all");
    setCpnTypeFilter("all");
  };

  const handleExport = () => {
    if (visibleUsedCoupons.length === 0) {
      return;
    }

    const header = [
      "ID",
      "Booking ID",
      "Coupon Code",
      "Used Date",
      "Total Fare",
      "CPN Type",
      "CPN Value",
      "CPN Amount",
      "Booking Status",
    ];

    const csvRows = visibleUsedCoupons.map((record) => [
      record.id,
      record.bookingId,
      record.couponCode,
      formatCouponDateTime(record.usedDate),
      formatCurrency(record.totalFare),
      record.cpnType,
      formatCurrency(record.cpnValue),
      formatCurrency(record.cpnAmount),
      record.bookingStatus,
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
    link.download = `admin-used-coupon-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  const openAddModal = () => {
    setFormError("");
    setAddForm({
      bookingId: "",
      couponCode: "",
      usedDate: "",
      totalFare: "",
      cpnType: "Fix",
      cpnValue: "",
      cpnAmount: "",
      bookingStatus: "Booked",
    });
    setIsAddOpen(true);
  };

  const handleSaveNew = () => {
    const bookingId = String(addForm.bookingId || "").trim();
    const couponCode = String(addForm.couponCode || "").trim();
    const usedDate = addForm.usedDate ? new Date(addForm.usedDate).toISOString() : new Date().toISOString();
    const totalFare = Number(addForm.totalFare);
    const cpnValue = Number(addForm.cpnValue);
    const cpnAmount = Number(addForm.cpnAmount);

    if (!bookingId || !couponCode) {
      setFormError("Booking ID and Coupon Code are required.");
      return;
    }

    if (!Number.isFinite(totalFare) || totalFare <= 0) {
      setFormError("Enter a valid total fare.");
      return;
    }

    if (!Number.isFinite(cpnValue) || cpnValue <= 0) {
      setFormError("Enter a valid coupon value.");
      return;
    }

    const newRecord = {
      id: getNextNumericId(usedCoupons, 1),
      bookingId,
      couponCode,
      usedDate,
      totalFare,
      cpnType: addForm.cpnType,
      cpnValue,
      cpnAmount: Number.isFinite(cpnAmount) ? cpnAmount : cpnValue,
      bookingStatus: addForm.bookingStatus,
    };

    setUsedCoupons((previous) => [newRecord, ...previous]);
    setIsAddOpen(false);
    setFormError("");
  };

  const openEditModal = (record) => {
    setFormError("");
    setEditRecord({
      ...record,
      totalFare: String(record.totalFare ?? ""),
      cpnValue: String(record.cpnValue ?? ""),
      cpnAmount: String(record.cpnAmount ?? ""),
      usedDate: record.usedDate ? record.usedDate.slice(0, 16) : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editRecord) {
      return;
    }

    const bookingId = String(editRecord.bookingId || "").trim();
    const couponCode = String(editRecord.couponCode || "").trim();
    const totalFare = Number(editRecord.totalFare);
    const cpnValue = Number(editRecord.cpnValue);
    const cpnAmount = Number(editRecord.cpnAmount);

    if (!bookingId || !couponCode) {
      setFormError("Booking ID and Coupon Code are required.");
      return;
    }

    if (!Number.isFinite(totalFare) || totalFare <= 0) {
      setFormError("Enter a valid total fare.");
      return;
    }

    if (!Number.isFinite(cpnValue) || cpnValue <= 0) {
      setFormError("Enter a valid coupon value.");
      return;
    }

    setUsedCoupons((previous) =>
      previous.map((record) =>
        record.id === editRecord.id
          ? {
              ...record,
              bookingId,
              couponCode,
              usedDate: editRecord.usedDate ? new Date(editRecord.usedDate).toISOString() : record.usedDate,
              totalFare,
              cpnType: editRecord.cpnType,
              cpnValue,
              cpnAmount: Number.isFinite(cpnAmount) ? cpnAmount : cpnValue,
              bookingStatus: editRecord.bookingStatus,
            }
          : record
      )
    );

    setEditRecord(null);
    setFormError("");
  };

  const handleDelete = () => {
    if (!deleteRecord) {
      return;
    }

    setUsedCoupons((previous) => previous.filter((record) => record.id !== deleteRecord.id));
    setDeleteRecord(null);
  };

  return (
    <>
      <section className="admin-markup-used-shell">
      <header className="admin-markup-used-header">
        <div className="admin-markup-used-title-wrap">
          <h1>
            <strong>B2C Bus Used</strong> Coupon List
          </h1>
          <span className="admin-markup-used-title-line" />
        </div>

        <div className="admin-markup-used-actions">
          <button
            type="button"
            className={`admin-markup-used-btn filter ${isFilterPanelOpen ? "active" : ""}`}
            onClick={() => setIsFilterPanelOpen((previous) => !previous)}
            aria-expanded={isFilterPanelOpen}
            aria-controls="admin-markup-used-filter"
          >
            <SlidersHorizontal size={15} />
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="admin-markup-used-btn clear"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
          >
            <X size={15} />
            <span>Clear Filter</span>
          </button>

          <button type="button" className="admin-markup-used-btn" onClick={openAddModal}>
            <span>Add Used Coupon</span>
          </button>

          <button
            type="button"
            className="admin-markup-used-btn export"
            onClick={handleExport}
            disabled={visibleUsedCoupons.length === 0}
          >
            <Download size={15} />
            <span>Export</span>
          </button>
        </div>
      </header>

      {isFilterPanelOpen && (
        <section className="admin-markup-used-filter" id="admin-markup-used-filter">
          <div className="admin-markup-used-filter-grid">
            <label>
              <span>Sort By</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="usedDate">Used Date</option>
                <option value="id">ID</option>
                <option value="bookingId">Booking ID</option>
                <option value="couponCode">Coupon Code</option>
                <option value="totalFare">Total Fare</option>
                <option value="cpnType">CPN Type</option>
                <option value="cpnValue">CPN Value</option>
                <option value="cpnAmount">CPN Amount</option>
                <option value="bookingStatus">Booking Status</option>
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
              <span>Booking Status</span>
              <select
                value={bookingStatusFilter}
                onChange={(event) => setBookingStatusFilter(event.target.value)}
              >
                <option value="all">All</option>
                {availableBookingStatuses.map((status) => (
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
                {availableCouponTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="admin-markup-used-table-wrap">
        <table className="admin-markup-used-table">
          <colgroup>
            <col className="col-id" />
            <col className="col-booking" />
            <col className="col-code" />
            <col className="col-date" />
            <col className="col-total" />
          <col className="col-type" />
          <col className="col-value" />
          <col className="col-amount" />
          <col className="col-status" />
          <col className="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Booking ID</th>
              <th>Coupon Code</th>
              <th>Used Date</th>
              <th>Total Fare</th>
              <th>CPN Type</th>
              <th>CPN Value</th>
              <th>CPN Amount</th>
              <th>Booking Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsedCoupons.length === 0 ? (
              <tr className="admin-markup-used-blank-row">
                <td colSpan={10} />
              </tr>
            ) : (
              visibleUsedCoupons.map((record) => (
                <tr key={`${record.id}-${record.bookingId}`}>
                  <td>{record.id}</td>
                  <td>{record.bookingId}</td>
                  <td>{record.couponCode}</td>
                  <td>{formatCouponDateTime(record.usedDate)}</td>
                  <td>{formatCurrency(record.totalFare)}</td>
                  <td>{record.cpnType}</td>
                  <td>{formatCurrency(record.cpnValue)}</td>
                  <td>{formatCurrency(record.cpnAmount)}</td>
                  <td>
                    <span className={`admin-markup-used-status ${record.bookingStatus || ""}`}>
                      {record.bookingStatus || "--"}
                    </span>
                  </td>
                  <td className="action-col">
                    <div className="markup-action-group">
                      <button
                        type="button"
                        title="Edit"
                        aria-label={`Edit used coupon ${record.id}`}
                        onClick={() => openEditModal(record)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        aria-label={`Delete used coupon ${record.id}`}
                        className="danger"
                        onClick={() => setDeleteRecord(record)}
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

      {isAddOpen && (
        <div className="admin-markup-modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Add used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Add Used Coupon</h2>
              <button type="button" onClick={() => setIsAddOpen(false)} aria-label="Close add used coupon">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>Booking ID</span>
                <input
                  type="text"
                  value={addForm.bookingId}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, bookingId: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Coupon Code</span>
                <input
                  type="text"
                  value={addForm.couponCode}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, couponCode: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Used Date</span>
                <input
                  type="datetime-local"
                  value={addForm.usedDate}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, usedDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Total Fare</span>
                <input
                  type="number"
                  min="1"
                  value={addForm.totalFare}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, totalFare: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Type</span>
                <select
                  value={addForm.cpnType}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>CPN Value</span>
                <input
                  type="number"
                  min="1"
                  value={addForm.cpnValue}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Amount</span>
                <input
                  type="number"
                  min="0"
                  value={addForm.cpnAmount}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, cpnAmount: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Booking Status</span>
                <select
                  value={addForm.bookingStatus}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, bookingStatus: event.target.value }))
                  }
                >
                  <option value="Booked">Booked</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {formError && <p className="admin-markup-form-error">{formError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setIsAddOpen(false)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveNew}>
                Save
              </button>
            </div>
          </section>
        </div>
      )}

      {editRecord && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditRecord(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Used Coupon</h2>
              <button type="button" onClick={() => setEditRecord(null)} aria-label="Close edit used coupon">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>ID</span>
                <input type="text" value={editRecord.id} disabled />
              </label>
              <label>
                <span>Booking ID</span>
                <input
                  type="text"
                  value={editRecord.bookingId}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, bookingId: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Coupon Code</span>
                <input
                  type="text"
                  value={editRecord.couponCode}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, couponCode: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Used Date</span>
                <input
                  type="datetime-local"
                  value={editRecord.usedDate}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, usedDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Total Fare</span>
                <input
                  type="number"
                  min="1"
                  value={editRecord.totalFare}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, totalFare: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Type</span>
                <select
                  value={editRecord.cpnType}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnType: event.target.value }))
                  }
                >
                  <option value="Fix">Fix</option>
                  <option value="Percent">Percent</option>
                </select>
              </label>
              <label>
                <span>CPN Value</span>
                <input
                  type="number"
                  min="1"
                  value={editRecord.cpnValue}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnValue: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>CPN Amount</span>
                <input
                  type="number"
                  min="0"
                  value={editRecord.cpnAmount}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, cpnAmount: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Booking Status</span>
                <select
                  value={editRecord.bookingStatus}
                  onChange={(event) =>
                    setEditRecord((previous) => ({ ...previous, bookingStatus: event.target.value }))
                  }
                >
                  <option value="Booked">Booked</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            {formError && <p className="admin-markup-form-error">{formError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditRecord(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteRecord && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRecord(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete used coupon"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Used Coupon</h2>
              <button type="button" onClick={() => setDeleteRecord(null)} aria-label="Close delete dialog">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete coupon <strong>{deleteRecord.couponCode}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRecord(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}


