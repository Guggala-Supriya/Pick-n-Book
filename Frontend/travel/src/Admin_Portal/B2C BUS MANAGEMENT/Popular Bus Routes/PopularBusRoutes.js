import React, { useState } from "react";
import { Check, Download, Eye, Pencil, Plus, Trash2, X } from "lucide-react";
import "./PopularBusRoutes.css";
import { csvCell } from "../../../adminPortalUtils";
import { useAdminList } from "../../../adminPortalStorage";

const INITIAL_POPULAR_BUS_ROUTES = [
  {
    id: 29,
    fromCity: "Hyderabad(8875)",
    toCity: "Vijayawada (9382)",
    imageLabel: "View",
    imageName: "",
    imageUrl: "",
    status: "active",
    startPrice: 2000,
  },
];

function createDefaultPopularRouteForm() {
  return {
    fromCity: "",
    toCity: "",
    imageName: "",
    imagePreview: "",
    status: "active",
    startPrice: "",
  };
}

export default function AdminBusPopularRoutesPage() {
  const [routes, setRoutes] = useAdminList("bus-popular-routes", INITIAL_POPULAR_BUS_ROUTES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(createDefaultPopularRouteForm);
  const [addError, setAddError] = useState("");
  const [viewRoute, setViewRoute] = useState(null);
  const [editRoute, setEditRoute] = useState(null);
  const [editError, setEditError] = useState("");
  const [deleteRoute, setDeleteRoute] = useState(null);

  const handleOpenAddModal = () => {
    setAddError("");
    setAddForm(createDefaultPopularRouteForm());
    setIsAddModalOpen(true);
  };

  const handleSaveNewRoute = () => {
    const fromCity = String(addForm.fromCity || "").trim();
    const toCity = String(addForm.toCity || "").trim();
    const imageName = String(addForm.imageName || "").trim();
    const imageUrl = String(addForm.imagePreview || "").trim();
    const startPrice = Number(addForm.startPrice);

    if (!fromCity || !toCity) {
      setAddError("From City and To City are required.");
      return;
    }

    if (!imageName || !imageUrl) {
      setAddError("Image is required.");
      return;
    }

    if (!Number.isFinite(startPrice) || startPrice <= 0) {
      setAddError("Enter a valid Start Price.");
      return;
    }

    const nextId =
      routes.reduce((highest, route) => Math.max(highest, Number(route.id) || 0), 0) + 1;

    setRoutes((previous) => [
      ...previous,
      {
        id: nextId,
        fromCity,
        toCity,
        imageLabel: "View",
        imageName,
        imageUrl,
        status: addForm.status,
        startPrice,
      },
    ]);

    setIsAddModalOpen(false);
    setAddError("");
  };

  const openEditModal = (route) => {
    setEditError("");
    setEditRoute({
      ...route,
      startPrice: String(route.startPrice),
      imagePreview: route.imageUrl || "",
    });
  };

  const handleSaveEditedRoute = () => {
    if (!editRoute) {
      return;
    }

    const fromCity = String(editRoute.fromCity || "").trim();
    const toCity = String(editRoute.toCity || "").trim();
    const imageName = String(editRoute.imageName || "").trim();
    const imageUrl = String(editRoute.imagePreview || "").trim();
    const startPrice = Number(editRoute.startPrice);

    if (!fromCity || !toCity) {
      setEditError("From City and To City are required.");
      return;
    }

    if (!Number.isFinite(startPrice) || startPrice <= 0) {
      setEditError("Enter a valid Start Price.");
      return;
    }

    setRoutes((previous) =>
      previous.map((route) =>
        route.id === editRoute.id
          ? {
              ...route,
              fromCity,
              toCity,
              imageName,
              imageUrl,
              status: editRoute.status,
              startPrice,
            }
          : route
      )
    );

    setEditRoute(null);
    setEditError("");
  };

  const handleDeleteRoute = () => {
    if (!deleteRoute) {
      return;
    }

    setRoutes((previous) => previous.filter((route) => route.id !== deleteRoute.id));
    setDeleteRoute(null);
  };

  const handleToggleStatus = (routeId) => {
    setRoutes((previous) =>
      previous.map((route) =>
        route.id === routeId
          ? { ...route, status: route.status === "active" ? "inactive" : "active" }
          : route
      )
    );
  };

  const handleAddImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    if (addForm.imagePreview && addForm.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(addForm.imagePreview);
    }

    setAddForm((previous) => ({
      ...previous,
      imageName: file.name,
      imagePreview: nextPreview,
    }));
  };

  const handleEditImageChange = (event) => {
    if (!editRoute) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreview = URL.createObjectURL(file);
    if (editRoute.imagePreview && editRoute.imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editRoute.imagePreview);
    }

    setEditRoute((previous) => ({
      ...previous,
      imageName: file.name,
      imagePreview: nextPreview,
    }));
  };

  const handleExport = () => {
    if (routes.length === 0) {
      return;
    }

    const header = [
      "SN",
      "ID",
      "From City",
      "To City",
      "Image",
      "Status",
      "Start Price",
    ];

    const csvRows = routes.map((route, index) => [
      index + 1,
      route.id,
      route.fromCity,
      route.toCity,
      route.imageName || route.imageLabel,
      route.status,
      route.startPrice,
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
    link.download = `admin-popular-bus-routes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(fileUrl);
  };

  return (
    <>
      <section className="admin-markup-popular-shell">
        <header className="admin-markup-popular-header">
          <div className="admin-markup-popular-title-wrap">
            <h1>
              <strong>B2C Popular</strong> Bus Routes
            </h1>
            <span className="admin-markup-popular-title-line" />
          </div>

          <div className="admin-markup-popular-actions">
            <button type="button" className="admin-markup-popular-btn add" onClick={handleOpenAddModal}>
              <Plus size={15} />
              <span>Add Popular Bus Route</span>
            </button>
            <button
              type="button"
              className="admin-markup-popular-btn export"
              onClick={handleExport}
              disabled={routes.length === 0}
            >
              <Download size={15} />
              <span>Export</span>
            </button>
          </div>
        </header>

        <section className="admin-markup-popular-table-wrap">
          <table className="admin-markup-popular-table">
            <colgroup>
              <col className="col-sn" />
              <col className="col-id" />
              <col className="col-from" />
              <col className="col-to" />
              <col className="col-image" />
              <col className="col-status" />
              <col className="col-price" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th>SN</th>
                <th>ID</th>
                <th>From City</th>
                <th>To City</th>
                <th>Image</th>
                <th>Status</th>
                <th>Start Price</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr className="admin-markup-popular-blank-row">
                  <td colSpan={8} />
                </tr>
              ) : (
                routes.map((route, index) => (
                  <tr key={route.id}>
                    <td>{index + 1}</td>
                    <td>{route.id}</td>
                    <td>{route.fromCity}</td>
                    <td>{route.toCity}</td>
                    <td>
                      <div className="markup-action-group">
                        <button
                          type="button"
                          title="View"
                          aria-label={`View route ${route.id}`}
                          onClick={() => setViewRoute(route)}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-markup-popular-status ${route.status}`}
                        onClick={() => handleToggleStatus(route.id)}
                        aria-label={`Set status to ${route.status === "active" ? "inactive" : "active"}`}
                      >
                        {route.status === "active" ? <Check size={14} /> : <X size={14} />}
                        <span>{route.status === "active" ? "Active" : "Inactive"}</span>
                      </button>
                    </td>
                    <td>{route.startPrice}</td>
                    <td className="action-col">
                      <div className="admin-markup-popular-action-group">
                        <button
                          type="button"
                          className="edit"
                          onClick={() => openEditModal(route)}
                          aria-label={`Edit route ${route.id}`}
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          className="delete"
                          onClick={() => setDeleteRoute(route)}
                          aria-label={`Delete route ${route.id}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
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

      {isAddModalOpen && (
        <div className="admin-markup-coupon-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <section
            className="admin-markup-coupon-modal generate"
            role="dialog"
            aria-modal="true"
            aria-label="Add popular bus route"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="generate-header">
              <h2>Add B2C Bus Route</h2>
            </header>

            <div className="admin-markup-coupon-form admin-markup-coupon-generate-form">
              <label>
                <span>From City :</span>
                <input
                  type="text"
                  placeholder="Enter from city"
                  value={addForm.fromCity}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, fromCity: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>To City :</span>
                <input
                  type="text"
                  placeholder="Enter to city"
                  value={addForm.toCity}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, toCity: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Status :</span>
                <select
                  value={addForm.status}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, status: event.target.value }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                <span>Start Price :</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Enter start price"
                  value={addForm.startPrice}
                  onChange={(event) =>
                    setAddForm((previous) => ({ ...previous, startPrice: event.target.value }))
                  }
                />
              </label>
              <label className="wide">
                <span>Image :</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImageChange}
                />
                {addForm.imagePreview ? (
                  <img
                    src={addForm.imagePreview}
                    alt="Preview"
                    className="admin-markup-popular-image-preview"
                  />
                ) : (
                  <span className="admin-markup-popular-image-empty">No image uploaded.</span>
                )}
              </label>
            </div>

            {addError && <p className="admin-markup-coupon-error">{addError}</p>}

            <div className="admin-markup-coupon-modal-actions generate-actions">
              <button type="button" className="primary generate-submit" onClick={handleSaveNewRoute}>
                <Check size={16} />
                <span>Submit</span>
              </button>
              <button
                type="button"
                className="danger generate-cancel"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {editRoute && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditRoute(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Edit popular bus route"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Popular Bus Route</h2>
              <button type="button" onClick={() => setEditRoute(null)} aria-label="Close edit route">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>ID</span>
                <input type="text" value={editRoute.id} disabled />
              </label>
              <label>
                <span>From City</span>
                <input
                  type="text"
                  value={editRoute.fromCity}
                  onChange={(event) =>
                    setEditRoute((previous) => ({ ...previous, fromCity: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>To City</span>
                <input
                  type="text"
                  value={editRoute.toCity}
                  onChange={(event) =>
                    setEditRoute((previous) => ({ ...previous, toCity: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={editRoute.status}
                  onChange={(event) =>
                    setEditRoute((previous) => ({ ...previous, status: event.target.value }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                <span>Start Price</span>
                <input
                  type="number"
                  min="1"
                  value={editRoute.startPrice}
                  onChange={(event) =>
                    setEditRoute((previous) => ({ ...previous, startPrice: event.target.value }))
                  }
                />
              </label>
              <label className="wide">
                <span>Image</span>
                <input type="file" accept="image/*" onChange={handleEditImageChange} />
                {editRoute.imagePreview ? (
                  <img
                    src={editRoute.imagePreview}
                    alt="Route"
                    className="admin-markup-popular-image-preview"
                  />
                ) : (
                  <span className="admin-markup-popular-image-empty">No image uploaded.</span>
                )}
              </label>
            </div>

            {editError && <p className="admin-markup-form-error">{editError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditRoute(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveEditedRoute}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteRoute && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteRoute(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete popular bus route"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Popular Bus Route</h2>
              <button
                type="button"
                onClick={() => setDeleteRoute(null)}
                aria-label="Close delete route dialog"
              >
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete route <strong>{deleteRoute.fromCity}</strong> to{" "}
              <strong>{deleteRoute.toCity}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteRoute(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={handleDeleteRoute}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}

      {viewRoute && (
        <div className="admin-markup-modal-backdrop" onClick={() => setViewRoute(null)}>
          <section
            className="admin-markup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="View bus route"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Popular Bus Route</h2>
              <button type="button" onClick={() => setViewRoute(null)} aria-label="Close view">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-popular-view-body">
              <div className="admin-markup-popular-view-meta">
                <div>
                  <span>From</span>
                  <strong>{viewRoute.fromCity}</strong>
                </div>
                <div>
                  <span>To</span>
                  <strong>{viewRoute.toCity}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{viewRoute.status === "active" ? "Active" : "Inactive"}</strong>
                </div>
                <div>
                  <span>Start Price</span>
                  <strong>{viewRoute.startPrice}</strong>
                </div>
              </div>

              <div className="admin-markup-popular-view-image">
                {viewRoute.imageUrl ? (
                  <img src={viewRoute.imageUrl} alt={`${viewRoute.fromCity} to ${viewRoute.toCity}`} />
                ) : (
                  <span>No image uploaded.</span>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}


