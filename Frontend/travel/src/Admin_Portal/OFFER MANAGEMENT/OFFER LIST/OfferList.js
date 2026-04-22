import React, { useMemo, useState } from "react";
import { Check, Filter, Pencil, Plus, Trash2, X, ZoomIn } from "lucide-react";
import "./OfferList.css";
import { useAdminList } from "../../../adminPortalStorage";

const createOfferPreview = (title, accentStart, accentEnd) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <defs>
        <linearGradient id="offerBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accentStart}" />
          <stop offset="100%" stop-color="${accentEnd}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="700" rx="32" fill="url(#offerBg)" />
      <circle cx="1035" cy="148" r="120" fill="rgba(255,255,255,0.18)" />
      <circle cx="160" cy="580" r="140" fill="rgba(255,255,255,0.16)" />
      <rect x="78" y="78" width="236" height="54" rx="27" fill="rgba(255,255,255,0.2)" />
      <text x="118" y="114" font-size="28" font-family="Segoe UI, Arial, sans-serif" fill="#ffffff" font-weight="700">
        Pick N Book Offer
      </text>
      <text x="78" y="270" font-size="74" font-family="Segoe UI, Arial, sans-serif" fill="#ffffff" font-weight="800">
        ${title}
      </text>
      <text x="78" y="352" font-size="28" font-family="Segoe UI, Arial, sans-serif" fill="rgba(255,255,255,0.9)">
        Built for the admin portal preview
      </text>
      <rect x="78" y="434" width="244" height="68" rx="16" fill="#ffffff" />
      <text x="136" y="478" font-size="30" font-family="Segoe UI, Arial, sans-serif" fill="${accentEnd}" font-weight="800">
        Limited Offer
      </text>
    </svg>
  `)}`;

const DEFAULT_DSA = "Pick N Book (180242)";

const createOfferRecord = ({
  id,
  entryDate,
  updatedDate,
  title,
  category,
  status,
  description,
  shortDescription,
  longDescription,
  slug,
  dsa = DEFAULT_DSA,
  imageUrl,
}) => ({
  id,
  entryDate,
  updatedDate,
  title,
  category,
  status,
  description,
  shortDescription: shortDescription || description,
  longDescription: longDescription || description,
  offerUrl: `https://picknbook.com/offers/${slug}`,
  dsa,
  imageUrl,
});

const formatStatusLabel = (status) => (status === "active" ? "Active" : "Inactive");

const INITIAL_OFFERS = [
  createOfferRecord({
    id: 1,
    entryDate: "13 Sep 2025 03:29",
    updatedDate: "21 Nov 2025 02:32",
    title: "Weekend Wheels - Bus Deals for Getaways!",
    category: "Bus Offer",
    status: "active",
    slug: "weekend-wheels-bus-deals-for-getaways",
    description: "Weekend campaign focused on bus routes with getaway-friendly discounts.",
    shortDescription:
      "Offer Details: Up to 20% off on weekend bus travel. Travel must start between Friday 6 PM and Sunday 11 PM.",
    longDescription:
      "Weekend Wheels is built for quick bus getaways and late-week planners. Travelers can unlock discounted fares on eligible weekend routes, improve conversion on high-intent searches, and promote repeat bookings during the Friday to Sunday booking window.",
    imageUrl: createOfferPreview("Weekend Wheels", "#16b7ec", "#2f7cf0"),
  }),
  createOfferRecord({
    id: 2,
    entryDate: "13 Sep 2025 03:28",
    updatedDate: "21 Nov 2025 02:20",
    title: "BusBuddy - Flat Fare Fiesta!",
    category: "Bus Offer",
    status: "active",
    slug: "busbuddy-flat-fare-fiesta",
    description: "Flat fare offer for popular B2C bus searches and repeat travelers.",
    shortDescription:
      "Flat fare campaign for select bus corridors with clear price-led messaging for returning users.",
    longDescription:
      "BusBuddy keeps pricing simple by highlighting flat-fare deals on high-volume routes. The offer is aimed at faster purchase decisions, higher repeat usage, and stronger weekend and commuter route visibility across the portal.",
    imageUrl: createOfferPreview("BusBuddy Fiesta", "#27c2de", "#3086d2"),
  }),
  createOfferRecord({
    id: 3,
    entryDate: "13 Sep 2025 03:26",
    updatedDate: "20 Nov 2025 11:15",
    title: "Weekend Wings - Special Fare Fridays!",
    category: "Flight Offers",
    status: "active",
    slug: "weekend-wings-special-fare-fridays",
    description: "Friday flight deal campaign designed to lift weekend airline bookings.",
    shortDescription:
      "A Friday-first airfare campaign promoting special weekend departure pricing for domestic flyers.",
    longDescription:
      "Weekend Wings focuses on passengers planning last-minute or short-lead weekend trips. The offer highlights limited-time fares, encourages urgency near payday and weekend browsing peaks, and supports higher booking conversion on domestic routes.",
    imageUrl: createOfferPreview("Weekend Wings", "#30c6ef", "#4564e6"),
  }),
  createOfferRecord({
    id: 4,
    entryDate: "13 Sep 2025 03:25",
    updatedDate: "19 Nov 2025 09:42",
    title: "Midnight Flyer - Exclusive Late Night Deals!",
    category: "Flight Offers",
    status: "active",
    slug: "midnight-flyer-exclusive-late-night-deals",
    description: "Late-night fare drops targeting off-peak flight inventory.",
    shortDescription:
      "Late-night booking offer created for users searching after business hours and during low-competition windows.",
    longDescription:
      "Midnight Flyer helps move off-peak inventory by spotlighting special fares during late-night sessions. It supports users who browse after work, creates urgency with narrow booking windows, and improves exposure for red-eye and off-hour departures.",
    imageUrl: createOfferPreview("Midnight Flyer", "#17b1e8", "#2554da"),
  }),
  createOfferRecord({
    id: 5,
    entryDate: "13 Sep 2025 03:24",
    updatedDate: "18 Nov 2025 07:18",
    title: "Save More When You Book Early!",
    category: "Flight Offers",
    status: "active",
    slug: "save-more-when-you-book-early",
    description: "Early booking incentive aimed at domestic and international planners.",
    shortDescription:
      "Advance booking discount intended to reward users planning their travel ahead of peak pricing periods.",
    longDescription:
      "This early-booking offer encourages travelers to commit sooner, improves forecasting for popular sectors, and creates a stronger value message for both domestic and international itineraries booked well ahead of departure.",
    imageUrl: createOfferPreview("Book Early", "#3dc8ef", "#4a88ef"),
  }),
  createOfferRecord({
    id: 6,
    entryDate: "13 Sep 2025 03:22",
    updatedDate: "17 Nov 2025 06:05",
    title: "SkySaver - Domestic Flight Sale!",
    category: "Flight Offers",
    status: "active",
    slug: "skysaver-domestic-flight-sale",
    description: "Domestic airfare promotion for quick conversion during search peaks.",
    shortDescription:
      "Domestic sale campaign built to support broad fare discovery and quick booking decisions.",
    longDescription:
      "SkySaver is positioned as a flexible domestic sale banner for high-volume search windows. It emphasizes price visibility, broad route appeal, and lightweight messaging that works well across both homepage and results-page placements.",
    imageUrl: createOfferPreview("SkySaver", "#46cfe8", "#2e73f1"),
  }),
];

const DEFAULT_FILTERS = {
  query: "",
  category: "all",
  status: "all",
};

const DEFAULT_EDIT_FORM = {
  entryDate: "",
  title: "",
  category: "Bus Offer",
  status: "active",
  description: "",
};

const COL_WIDTHS = ["6%", "18%", "12%", "24%", "14%", "10%", "16%"];
const HEADERS = ["SN", "Entry Date", "Image", "Name", "Category", "Status", "Action"];

export default function AdminOfferListPage({ onAddOffer }) {
  const [offers, setOffers] = useAdminList("offers", INITIAL_OFFERS);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [imageOffer, setImageOffer] = useState(null);
  const [detailsOffer, setDetailsOffer] = useState(null);
  const [editOffer, setEditOffer] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);
  const [editError, setEditError] = useState("");
  const [deleteOffer, setDeleteOffer] = useState(null);

  const filteredOffers = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return offers.filter((offer) => {
      const matchesQuery =
        !query ||
        offer.title.toLowerCase().includes(query) ||
        offer.category.toLowerCase().includes(query) ||
        offer.entryDate.toLowerCase().includes(query);
      const matchesCategory = filters.category === "all" || offer.category === filters.category;
      const matchesStatus = filters.status === "all" || offer.status === filters.status;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [filters, offers]);

  const handleFilterChange = (field) => (event) => {
    setFilters((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setShowFilters(false);
  };

  const handleToggleStatus = (id) => {
    setOffers((previous) =>
      previous.map((offer) =>
        offer.id === id
          ? { ...offer, status: offer.status === "active" ? "inactive" : "active" }
          : offer
      )
    );

    setDetailsOffer((previous) =>
      previous?.id === id
        ? { ...previous, status: previous.status === "active" ? "inactive" : "active" }
        : previous
    );
  };

  const openEditModal = (offer) => {
    setEditError("");
    setEditOffer(offer);
    setEditForm({
      entryDate: offer.entryDate || "",
      title: offer.title || "",
      category: offer.category || "Bus Offer",
      status: offer.status || "active",
      description: offer.description || "",
    });
  };

  const handleEditSave = () => {
    const title = String(editForm.title || "").trim();
    const category = String(editForm.category || "").trim();
    const entryDate = String(editForm.entryDate || "").trim();
    const description = String(editForm.description || "").trim();

    if (!title || !category || !entryDate) {
      setEditError("Entry date, name, and category are required.");
      return;
    }

    setOffers((previous) =>
      previous.map((offer) =>
        offer.id === editOffer.id
          ? {
              ...offer,
              entryDate,
              title,
              category,
              status: editForm.status,
              description,
              shortDescription: description || offer.shortDescription,
            }
          : offer
      )
    );

    setDetailsOffer((previous) =>
      previous?.id === editOffer.id
        ? {
            ...previous,
            entryDate,
            title,
            category,
            status: editForm.status,
            description,
            shortDescription: description || previous.shortDescription,
          }
        : previous
    );

    setEditOffer(null);
    setEditError("");
  };

  const handleDeleteConfirm = () => {
    if (!deleteOffer) {
      return;
    }

    setOffers((previous) => previous.filter((offer) => offer.id !== deleteOffer.id));
    setDeleteOffer(null);
    setImageOffer((previous) => (previous?.id === deleteOffer.id ? null : previous));
    setDetailsOffer((previous) => (previous?.id === deleteOffer.id ? null : previous));
  };

  return (
    <>
      {detailsOffer ? (
        <section className="flight-markup-panel offer-details-page">
          <header className="flight-markup-toolbar offer-details-toolbar">
            <div className="flight-markup-title">
              <h1>
                <strong>View Offer</strong> Details
              </h1>
              <div className="flight-markup-title-underline" aria-hidden="true" />
            </div>

            <button
              type="button"
              className="offer-details-close-btn"
              onClick={() => setDetailsOffer(null)}
            >
              Close Tab
            </button>
          </header>

          <section className="offer-details-shell">
            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Basic Details</span>
              </div>

              <div className="offer-details-grid">
                <div className="offer-details-label">ID</div>
                <div className="offer-details-value">
                  {detailsOffer.id} ({formatStatusLabel(detailsOffer.status)})
                </div>

                <div className="offer-details-label">Offer Name</div>
                <div className="offer-details-value">{detailsOffer.title}</div>

                <div className="offer-details-label">Category</div>
                <div className="offer-details-value">{detailsOffer.category}</div>

                <div className="offer-details-label">Offer URL</div>
                <div className="offer-details-value offer-details-link">
                  {detailsOffer.offerUrl || "--"}
                </div>

                <div className="offer-details-label">Image</div>
                <div className="offer-details-value">
                  <button
                    type="button"
                    className="offer-details-image-btn"
                    onClick={() => setImageOffer(detailsOffer)}
                  >
                    View
                  </button>
                </div>

                <div className="offer-details-label">Entry Date</div>
                <div className="offer-details-value">{detailsOffer.entryDate}</div>

                <div className="offer-details-label">Update Date</div>
                <div className="offer-details-value">
                  {detailsOffer.updatedDate || detailsOffer.entryDate}
                </div>

                <div className="offer-details-label">DSA</div>
                <div className="offer-details-value">{detailsOffer.dsa || DEFAULT_DSA}</div>
              </div>
            </div>

            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Short Description</span>
              </div>
              <div className="offer-details-copy">
                {detailsOffer.shortDescription || detailsOffer.description || "--"}
              </div>
            </div>

            <div className="offer-details-section">
              <div className="offer-details-section-bar">
                <span>Long Description</span>
              </div>
              <div className="offer-details-copy offer-details-long-copy">
                {detailsOffer.longDescription || detailsOffer.description || "--"}
              </div>
            </div>
          </section>
        </section>
      ) : (
        <section className="flight-markup-panel">
          <header className="flight-markup-toolbar">
            <div className="flight-markup-title">
              <h1>
                <strong>Offer</strong> List
              </h1>
              <div className="flight-markup-title-underline" aria-hidden="true" />
            </div>

            <div className="admin-markup-coupon-actions">
              <button
                type="button"
                className={`admin-markup-coupon-btn filter ${showFilters ? "active" : ""}`}
                onClick={() => setShowFilters((previous) => !previous)}
              >
                <Filter size={16} />
                <span>Filter</span>
              </button>
              <button type="button" className="admin-markup-coupon-btn clear" onClick={handleClearFilters}>
                <X size={16} />
                <span>Clear Filter</span>
              </button>
              {onAddOffer && (
                <button type="button" className="admin-markup-coupon-btn generate" onClick={onAddOffer}>
                  <Plus size={16} />
                  <span>Add Offer</span>
                </button>
              )}
            </div>
          </header>

          {showFilters && (
            <section className="flight-destination-filter-panel">
              <div className="flight-destination-filter-grid">
                <label>
                  <span>Search</span>
                  <input
                    type="text"
                    value={filters.query}
                    onChange={handleFilterChange("query")}
                    placeholder="Search offers..."
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select value={filters.category} onChange={handleFilterChange("category")}>
                    <option value="all">All</option>
                    <option value="Bus Offer">Bus Offer</option>
                    <option value="Flight Offers">Flight Offers</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={filters.status} onChange={handleFilterChange("status")}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </section>
          )}

          <section className="admin-markup-table-wrap">
            <table className="admin-markup-table">
              <colgroup>
                {COL_WIDTHS.map((width, index) => (
                  <col key={`${width}-${index}`} style={{ width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {HEADERS.map((header) => (
                    <th key={header} className={header === "Action" ? "action-col" : undefined}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length}>
                      <p className="admin-markup-empty">No offer records found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer, index) => (
                    <tr key={offer.id}>
                      <td>{index + 1}</td>
                      <td>{offer.entryDate}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-markup-popular-view-btn"
                          onClick={() => setImageOffer(offer)}
                        >
                          View
                        </button>
                      </td>
                      <td>{offer.title}</td>
                      <td>{offer.category}</td>
                      <td>
                        <button
                          type="button"
                          className={`markup-status-toggle ${offer.status}`}
                          onClick={() => handleToggleStatus(offer.id)}
                          aria-label={`Set offer ${offer.id} status to ${
                            offer.status === "active" ? "inactive" : "active"
                          }`}
                        >
                          {offer.status === "active" ? <Check size={14} /> : <X size={14} />}
                          <span>{formatStatusLabel(offer.status)}</span>
                        </button>
                      </td>
                      <td className="action-col">
                        <div className="markup-action-group" aria-label="Offer actions">
                          <button
                            type="button"
                            className="offer-details-trigger"
                            title="Zoom In"
                            aria-label={`Open details for ${offer.title}`}
                            onClick={() => setDetailsOffer(offer)}
                          >
                            <ZoomIn size={14} />
                          </button>
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${offer.title}`}
                            onClick={() => openEditModal(offer)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${offer.title}`}
                            className="danger"
                            onClick={() => setDeleteOffer(offer)}
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
      )}

      {imageOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setImageOffer(null)}>
          <section
            className="admin-markup-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Offer image preview"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Offer Image Preview</h2>
              <button type="button" onClick={() => setImageOffer(null)} aria-label="Close image preview">
                <X size={16} />
              </button>
            </header>

            <div className="flight-route-image-body">
              <img src={imageOffer.imageUrl} alt={imageOffer.title} />
            </div>
          </section>
        </div>
      )}

      {editOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setEditOffer(null)}>
          <section
            className="admin-markup-modal fullscreen"
            role="dialog"
            aria-modal="true"
            aria-label="Edit offer"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Edit Offer</h2>
              <button type="button" onClick={() => setEditOffer(null)} aria-label="Close edit offer">
                <X size={16} />
              </button>
            </header>

            <div className="admin-markup-form-grid">
              <label>
                <span>Entry Date</span>
                <input
                  type="text"
                  value={editForm.entryDate}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, entryDate: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>Category</span>
                <select
                  value={editForm.category}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, category: event.target.value }))
                  }
                >
                  <option value="Bus Offer">Bus Offer</option>
                  <option value="Flight Offers">Flight Offers</option>
                </select>
              </label>
              <label className="wide">
                <span>Offer Name</span>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, title: event.target.value }))}
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={editForm.status}
                  onChange={(event) => setEditForm((previous) => ({ ...previous, status: event.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="wide">
                <span>Description</span>
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((previous) => ({ ...previous, description: event.target.value }))
                  }
                />
              </label>
            </div>

            {editError && <p className="admin-markup-form-error">{editError}</p>}

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setEditOffer(null)}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleEditSave}>
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteOffer && (
        <div className="admin-markup-modal-backdrop" onClick={() => setDeleteOffer(null)}>
          <section
            className="admin-markup-modal small"
            role="dialog"
            aria-modal="true"
            aria-label="Delete offer"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>Delete Offer</h2>
              <button type="button" onClick={() => setDeleteOffer(null)} aria-label="Close delete offer">
                <X size={16} />
              </button>
            </header>

            <p className="admin-markup-delete-copy">
              Are you sure you want to delete <strong>{deleteOffer.title}</strong>?
            </p>

            <div className="admin-markup-modal-actions">
              <button type="button" className="secondary" onClick={() => setDeleteOffer(null)}>
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
