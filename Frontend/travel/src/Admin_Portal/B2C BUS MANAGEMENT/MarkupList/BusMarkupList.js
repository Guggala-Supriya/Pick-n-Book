import React, { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  List,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import "./BusMarkupList.css";
import { csvCell, formatCurrency, formatDateTime, toViewId } from "../../../adminPortalUtils";
import { useAdminList } from "../../../adminPortalStorage";

const INITIAL_ROWS = [
  {
    id: "Q419",
    value: 100,
    markupType: "fix",
    entryDate: "2025-11-21T14:30:00.000Z",
    updatedOn: "2025-11-21T14:30:00.000Z",
    updatedBy: "Pick N Book",
    remark: "testing",
    status: "active",
  },
  {
    id: "Q520",
    value: 3,
    markupType: "percent",
    entryDate: "2025-12-05T10:20:00.000Z",
    updatedOn: "2025-12-05T10:20:00.000Z",
    updatedBy: "Admin",
    remark: "festival window",
    status: "inactive",
  },
];

const DEFAULT_SORT_BY = "updatedOn";
const DEFAULT_SORT_ORDER = "desc";

function getSortValue(row, sortBy) {
  if (sortBy === "id") {
    return String(row.id ?? "");
  }

  if (sortBy === "value") {
    return Number(row.value) || 0;
  }

  if (sortBy === "updatedOn") {
    const timestamp = new Date(row.updatedOn).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  return String(row[sortBy] ?? "").toLowerCase();
}

export default function AdminBusMarkupListPage() {
  const [rows, setRows] = useAdminList("bus-markup", INITIAL_ROWS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT_ORDER);
  const [statusFilter, setStatusFilter] = useState("all");
  const [markupTypeFilter, setMarkupTypeFilter] = useState("all");
  const [viewRow, setViewRow] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [editError, setEditError] = useState("");

  const availableMarkupTypes = useMemo(() => {
    const uniqueTypes = new Set(
      rows.map((row) => String(row.markupType || "").trim().toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueTypes);
  }, [rows]);

  const availableStatuses = useMemo(() => {
    const uniqueStatuses = new Set(
      rows.map((row) => String(row.status || "").trim().toLowerCase()).filter(Boolean)
    );

    return Array.from(uniqueStatuses);
  }, [rows]);

  const visibleRows = useMemo(() => {
    const filteredRows = rows.filter((row) => {
      const rowStatus = String(row.status || "").toLowerCase();
      const rowMarkupType = String(row.markupType || "").toLowerCase();

      const matchesStatus = statusFilter === "all" || rowStatus === statusFilter;
      const matchesMarkupType = markupTypeFilter === "all" || rowMarkupType === markupTypeFilter;

      return matchesStatus && matchesMarkupType;
    });

    const sortedRows = [...filteredRows].sort((leftRow, rightRow) => {
      const leftValue = getSortValue(leftRow, sortBy);
      const rightValue = getSortValue(rightRow, sortBy);

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

    return sortedRows;
  }, [rows, markupTypeFilter, sortBy, sortOrder, statusFilter]);

  const handleResetFilters = () => {
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
    setStatusFilter("all");
    setMarkupTypeFilter("all");
  };

  const handleExport = () => {
    if (visibleRows.length === 0) {
      return;
    }

    const header = [
      "ID",
      "Value",
      "Markup Type",
      "Updated On",
      "Updated By",
      "Remark",
      "Status",
    ];

    const csvRows = visibleRows.map((row) => [
      row.id,
      formatCurrency(row.value),
      row.markupType,
      formatDateTime(row.updatedOn),
      row.updatedBy,
      row.remark,
      row.status,
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
    link.download = `admin-markup-list-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  const handleStatusToggle = (id) => {
    setRows((previous) =>
      previous.map((row) => {
        if (row.id !== id) {
          return row;
        }

        return {
          ...row,
          status: row.status === "active" ? "inactive" : "active",
          updatedOn: new Date().toISOString(),
          updatedBy: "Admin",
        };
      })
    );
  };

  const openEditModal = (row) => {
    setEditError("");
    setEditRow({
      ...row,
      value: String(row.value),
      remark: row.remark || "",
      updatedBy: row.updatedBy || "",
    });
  };

  const handleEditSave = () => {
    if (!editRow) {
      return;
    }

    const amount = Number(editRow.value);
    if (!Number.isFinite(amount) || amount < 0) {
      setEditError("Enter a valid markup value.");
      return;
    }

    if (!String(editRow.updatedBy).trim()) {
      setEditError("Updated by is required.");
      return;
    }

    setRows((previous) =>
      previous.map((row) =>
        row.id === editRow.id
          ? {
              ...row,
              value: amount,
              markupType: editRow.markupType,
              updatedBy: editRow.updatedBy.trim(),
              remark: editRow.remark.trim(),
              updatedOn: new Date().toISOString(),
            }
          : row
      )
    );
    setEditRow(null);
    setEditError("");
  };

  const handleDeleteConfirm = () => {
    if (!deleteRow) {
      return;
    }

    setRows((previous) => previous.filter((row) => row.id !== deleteRow.id));
    setDeleteRow(null);
    setViewRow((previous) => (previous?.id === deleteRow.id ? null : previous));
  };

  return (
    <>
      {viewRow ? (
        <section className="admin-markup-view-screen">
          <header className="admin-markup-view-top">
            <h2>
              <strong>View B2C Bus</strong> Markup Details
            </h2>

            <div className="admin-markup-view-actions">
              <button
                type="button"
                className="admin-markup-view-btn primary"
                onClick={() => {
                  openEditModal(viewRow);
                  setViewRow(null);
                }}
              >
                <Pencil size={14} />
                <span>Edit B2C Markup</span>
              </button>
              <button type="button" className="admin-markup-view-btn secondary" onClick={() => setViewRow(null)}>
                <List size={14} />
                <span>B2C Bus Markup List</span>
              </button>
            </div>
          </header>

          <div className="admin-markup-view-underline" />

          <div className="admin-markup-view-card">
            <div className="admin-markup-view-band">
              <span>Basic</span>
              <strong>Details</strong>
            </div>

            <div className="admin-markup-view-table-wrap">
              <table className="admin-markup-view-table">
                <tbody>
                  <tr>
                    <td className="label">ID</td>
                    <td className="value">{toViewId(viewRow.id)}</td>
                    <td className="label">Markup Type</td>
                    <td className="value">{viewRow.markupType}</td>
                    <td className="label">Fix</td>
                    <td className="value">{Number(viewRow.value) || 0}</td>
                    <td className="label">Status</td>
                    <td className="value">{viewRow.status}</td>
                  </tr>
                  <tr>
                    <td className="label">Entry Date</td>
                    <td className="value">{formatDateTime(viewRow.entryDate || viewRow.updatedOn)}</td>
                    <td className="label">Update Date</td>
                    <td className="value">{formatDateTime(viewRow.updatedOn)}</td>
                    <td className="label">Markup Module</td>
                    <td className="value">b2c</td>
                    <td className="label">Updated By Module</td>
                    <td className="value">Admin</td>
                  </tr>
                  <tr>
                    <td className="label">Updated By Name</td>
                    <td className="value">{viewRow.updatedBy}</td>
                    <td className="label">Remark</td>
                    <td className="value remark-value" colSpan={5}>
                      <span className="remark-text">{viewRow.remark || "--"}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <>
          <header className="admin-markup-header">
            <div className="admin-markup-header-copy">
              <h1>
                <strong>B2C Bus</strong> Markup List
              </h1>
            </div>

            <div className="admin-markup-header-actions">
              <button
                type="button"
                className={`admin-markup-filter-btn ${isFilterPanelOpen ? "active" : ""}`}
                onClick={() => setIsFilterPanelOpen((previous) => !previous)}
                aria-expanded={isFilterPanelOpen}
                aria-controls="admin-markup-filter-panel"
              >
                <SlidersHorizontal size={15} />
                <span>Filter</span>
                <ChevronDown
                  size={15}
                  className={`filter-chevron ${isFilterPanelOpen ? "open" : ""}`}
                />
              </button>

              <button
                type="button"
                className="admin-markup-export-btn"
                onClick={handleExport}
                disabled={visibleRows.length === 0}
              >
                <Download size={15} />
                <span>Export</span>
              </button>
            </div>
          </header>

          {isFilterPanelOpen && (
            <section className="admin-markup-filter-panel" id="admin-markup-filter-panel">
              <div className="admin-markup-filter-grid">
                <label>
                  <span>Sort By</span>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                    <option value="updatedOn">Updated On</option>
                    <option value="id">ID</option>
                    <option value="value">Value</option>
                    <option value="markupType">Markup Type</option>
                    <option value="updatedBy">Updated By</option>
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
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">All</option>
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Markup Type</span>
                  <select
                    value={markupTypeFilter}
                    onChange={(event) => setMarkupTypeFilter(event.target.value)}
                  >
                    <option value="all">All</option>
                    {availableMarkupTypes.map((markupType) => (
                      <option key={markupType} value={markupType}>
                        {markupType}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="admin-markup-filter-actions">
                <button type="button" className="admin-markup-filter-reset" onClick={handleResetFilters}>
                  Reset Filters
                </button>
              </div>
            </section>
          )}

          <section className="admin-markup-table-wrap">
            <table className="admin-markup-table">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Value</th>
                  <th>Markup Type</th>
                  <th>Updated On</th>
                  <th>Updated By</th>
                  <th>Remark</th>
                  <th>Status</th>
                  <th className="action-col">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <p className="admin-markup-empty">No markup records found.</p>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <button
                          type="button"
                          className="markup-id-chip"
                          onClick={() => setViewRow(row)}
                          aria-label={`Open basic details for ${row.id}`}
                        >
                          <span className="markup-id-chip-icon" aria-hidden="true">
                            +
                          </span>
                          <span>{row.id}</span>
                        </button>
                      </td>
                      <td>{formatCurrency(row.value)}</td>
                      <td>{row.markupType}</td>
                      <td>{formatDateTime(row.updatedOn)}</td>
                      <td>{row.updatedBy}</td>
                      <td className="markup-remark-cell">
                        <span className="markup-remark-text">{row.remark || "--"}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`markup-status-toggle ${row.status}`}
                          onClick={() => handleStatusToggle(row.id)}
                          aria-label={`Set ${row.id} status to ${row.status === "active" ? "inactive" : "active"}`}
                        >
                          {row.status === "active" ? <Check size={14} /> : <X size={14} />}
                          <span>{row.status}</span>
                        </button>
                      </td>
                      <td className="action-col">
                        <div className="markup-action-group">
                          <button type="button" title="View" aria-label={`View ${row.id}`} onClick={() => setViewRow(row)}>
                            <Eye size={14} />
                          </button>
                          <button type="button" title="Edit" aria-label={`Edit ${row.id}`} onClick={() => openEditModal(row)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${row.id}`}
                            className="danger"
                            onClick={() => setDeleteRow(row)}
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
        </>
      )}

      {editRow && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditRow(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit markup"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Markup</h2>
              <button type="button" onClick={() => setEditRow(null)} aria-label="Close edit dialog">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>ID</span>
                <input type="text" value={editRow.id} disabled />
              </label>
              <label>
                <span>Value</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editRow.value}
                  onChange={(event) =>
                    setEditRow((previous) => ({ ...previous, value: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Markup Type</span>
                <select
                  value={editRow.markupType}
                  onChange={(event) =>
                    setEditRow((previous) => ({
                      ...previous,
                      markupType: event.target.value,
                    }))
                  }
                >
                  <option value="fix">fix</option>
                  <option value="percent">percent</option>
                </select>
              </label>
              <label>
                <span>Updated By</span>
                <input
                  type="text"
                  value={editRow.updatedBy}
                  onChange={(event) =>
                    setEditRow((previous) => ({
                      ...previous,
                      updatedBy: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="wide">
                <span>Remark</span>
                <textarea
                  value={editRow.remark}
                  onChange={(event) =>
                    setEditRow((previous) => ({
                      ...previous,
                      remark: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            {editError && <p className="admin-markup-form-error">{editError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditRow(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteRow && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRow(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete markup"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Markup</h2>
              <button type="button" onClick={() => setDeleteRow(null)} aria-label="Close delete dialog">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete <strong>{deleteRow.id}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRow(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

