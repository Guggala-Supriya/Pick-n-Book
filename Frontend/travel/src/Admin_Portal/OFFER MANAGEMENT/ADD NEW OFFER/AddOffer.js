import React, { useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  CaseSensitive,
  Clipboard,
  Copy,
  FileText,
  Flag,
  Globe,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  Maximize2,
  Omega,
  Paintbrush,
  Printer,
  Quote,
  Redo2,
  Save,
  Scissors,
  Search,
  SpellCheck,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  TextCursorInput,
  Underline,
  Unlink2,
  Undo2,
} from "lucide-react";
import {
  FaAlignJustify,
  FaCheckSquare,
  FaCode,
  FaDotCircle,
  FaEraser,
  FaFile,
  FaFont,
  FaLanguage,
  FaParagraph,
  FaPaste,
  FaQuestionCircle,
  FaSmile,
  FaSquare,
  FaThLarge,
  FaTint,
} from "react-icons/fa";
import "./AddOffer.css";
import { getNextNumericId, useAdminList } from "../../../adminPortalStorage";

const DEFAULT_FORM = {
  title: "",
  slug: "",
  url: "",
  couponCode: "",
  category: "",
  shortDescription: "",
  longDescription: "",
  imageName: "",
};

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_DSA = "Pick N Book (180242)";

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
        Admin portal preview
      </text>
      <rect x="78" y="434" width="244" height="68" rx="16" fill="#ffffff" />
      <text x="136" y="478" font-size="30" font-family="Segoe UI, Arial, sans-serif" fill="${accentEnd}" font-weight="800">
        Limited Offer
      </text>
    </svg>
  `)}`;

const toEntryDate = (date = new Date()) =>
  date
    .toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .replace(",", "");

const PRIMARY_EDITOR_TOOL_GROUPS = [
  [
    { label: "Source", kind: "text", icon: FaCode },
    { label: "Save", icon: Save },
    { label: "New Document", icon: FileText },
    { label: "Preview", icon: Search },
    { label: "Print", icon: Printer },
    { label: "Templates", icon: FaFile },
  ],
  [
    { label: "Cut", icon: Scissors },
    { label: "Copy", icon: Copy },
    { label: "Paste", icon: FaPaste },
    { label: "Paste as text", icon: Clipboard },
    { label: "Paste from Word", icon: Clipboard },
  ],
  [
    { label: "Undo", icon: Undo2 },
    { label: "Redo", icon: Redo2 },
  ],
  [
    { label: "Find", icon: Search },
    { label: "Replace", icon: SpellCheck },
  ],
  [
    { label: "Forms", icon: FaThLarge },
    { label: "Checkbox", icon: FaCheckSquare },
    { label: "Radio button", icon: FaDotCircle },
    { label: "Text field", icon: TextCursorInput },
    { label: "Textarea", icon: FaParagraph },
    { label: "Select field", icon: FaSquare },
    { label: "Button", icon: Baseline },
    { label: "Hidden field", icon: CaseSensitive },
  ],
];

const SECONDARY_EDITOR_SELECTS = [
  {
    ariaLabel: "Styles",
    options: ["Styles", "Paragraph", "Heading 1", "Heading 2"],
  },
  {
    ariaLabel: "Format",
    options: ["Format", "Normal", "Code", "Blockquote"],
  },
  {
    ariaLabel: "Font",
    options: ["Font", "Arial", "Georgia", "Verdana"],
  },
  {
    ariaLabel: "Size",
    options: ["Size", "12", "14", "16", "18"],
  },
];

const SECONDARY_EDITOR_TOOL_GROUPS = [
  [
    { label: "Bold", icon: Bold },
    { label: "Italic", icon: Italic },
    { label: "Underline", icon: Underline },
    { label: "Strikethrough", icon: Strikethrough },
    { label: "Subscript", icon: Subscript },
    { label: "Superscript", icon: Superscript },
    { label: "Clear formatting", icon: FaEraser },
    { label: "Special characters", icon: Omega },
  ],
  [
    { label: "Text styles", icon: Paintbrush },
    { label: "Text tools", icon: TextCursorInput },
    { label: "Numbered list", icon: ListOrdered },
    { label: "Bulleted list", icon: List },
    { label: "Decrease indent", icon: ListIndentDecrease },
    { label: "Increase indent", icon: ListIndentIncrease },
    { label: "Quote", icon: Quote },
  ],
  [
    { label: "Align left", icon: AlignLeft },
    { label: "Align center", icon: AlignCenter },
    { label: "Align right", icon: AlignRight },
    { label: "Justify", icon: FaAlignJustify },
  ],
  [
    { label: "Language", icon: FaLanguage },
    { label: "Link", icon: Link2 },
    { label: "Unlink", icon: Unlink2 },
    { label: "Anchor", icon: Flag },
    { label: "Image", icon: ImageIcon },
    { label: "Globe", icon: Globe },
    { label: "Table", icon: Table2 },
    { label: "Emoji", icon: FaSmile },
  ],
];

const TERTIARY_EDITOR_TOOL_GROUPS = [
  [
    { label: "Text color", icon: FaFont },
    { label: "Background color", icon: FaTint },
    { label: "Fullscreen", icon: Maximize2 },
    { label: "Show blocks", icon: FaThLarge },
    { label: "Help", icon: FaQuestionCircle },
  ],
];

export default function AdminAddOfferPage({ onBack }) {
  const [offers, setOffers] = useAdminList("offers", []);
  const [formValues, setFormValues] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [slugLocked, setSlugLocked] = useState(false);
  const fileInputRef = useRef(null);

  const categoryOptions = useMemo(() => ["Bus Offer", "Flight Offers"], []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;

    setFormValues((previous) => {
      if (field === "title" && !slugLocked) {
        return {
          ...previous,
          title: value,
          slug: toSlug(value),
        };
      }

      return { ...previous, [field]: value };
    });
  };

  const handleSlugChange = (event) => {
    setSlugLocked(true);
    setFormValues((previous) => ({ ...previous, slug: toSlug(event.target.value) }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    setFormValues((previous) => ({ ...previous, imageName: file?.name || "" }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(false);

    const title = String(formValues.title || "").trim();
    const category = String(formValues.category || "").trim();

    if (!title || !category) {
      setFormError("Offer name and category are required.");
      return;
    }

    const slug = formValues.slug?.trim() ? formValues.slug.trim() : toSlug(title);
    const now = new Date();
    const entryDate = toEntryDate(now);
    const offerUrl = String(formValues.url || "").trim() || (slug ? `https://picknbook.com/offers/${slug}` : "");

    const newOffer = {
      id: getNextNumericId(offers, 1),
      entryDate,
      updatedDate: entryDate,
      title,
      category,
      status: "active",
      description: String(formValues.shortDescription || formValues.longDescription || "").trim(),
      shortDescription: String(formValues.shortDescription || "").trim(),
      longDescription: String(formValues.longDescription || "").trim(),
      slug,
      offerUrl,
      dsa: DEFAULT_DSA,
      imageUrl: createOfferPreview(title || "New Offer", "#18b0e3", "#2d6fe9"),
    };

    setOffers((previous) => [newOffer, ...previous]);
    setFormError("");
    setSaved(true);
  };

  return (
    <section className="flight-markup-panel offer-add-page">
      <header className="flight-markup-toolbar offer-add-page-toolbar">
        <div className="flight-markup-title">
          <h1>
            <strong>Add</strong> Offer
          </h1>
          <div className="flight-markup-title-underline" aria-hidden="true" />
        </div>

        {onBack && (
          <div className="flight-markup-actions">
            <button
              type="button"
              className="flight-markup-action-btn primary offer-add-list-btn"
              onClick={onBack}
            >
              <List size={16} />
              <span>Offer List</span>
            </button>
          </div>
        )}
      </header>

      <section className="menu-form-shell offer-add-shell">
        <form className="offer-add-form" onSubmit={handleSubmit}>
          <div className="offer-add-grid">
            <label className="offer-add-label" htmlFor="offer-name">
              Offer Name <span aria-hidden="true">*</span>
            </label>
            <div className="offer-add-control">
              <input
                id="offer-name"
                type="text"
                placeholder="Enter Offer name"
                value={formValues.title}
                onChange={handleChange("title")}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-slug">
              Offer Slug
            </label>
            <div className="offer-add-control">
              <input
                id="offer-slug"
                type="text"
                placeholder="Auto generated slug"
                value={formValues.slug}
                onChange={handleSlugChange}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-url">
              Offer URL
            </label>
            <div className="offer-add-control">
              <input id="offer-url" type="text" value={formValues.url} onChange={handleChange("url")} />
            </div>

            <label className="offer-add-label" htmlFor="offer-image">
              Image [max_size: 1MB]
            </label>
            <div className="offer-add-control file">
              <input
                ref={fileInputRef}
                id="offer-image"
                className="offer-add-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="offer-add-file-picker">
                <button
                  type="button"
                  className="offer-add-file-trigger"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </button>
                <span
                  className={`offer-add-file-name${
                    formValues.imageName ? " has-selection" : ""
                  }`}
                >
                  {formValues.imageName || "No file chosen"}
                </span>
              </div>
            </div>

            <label className="offer-add-label" htmlFor="coupon-code">
              Coupon Code
            </label>
            <div className="offer-add-control">
              <input
                id="coupon-code"
                type="text"
                placeholder="Enter Coupon Code"
                value={formValues.couponCode}
                onChange={handleChange("couponCode")}
              />
            </div>

            <label className="offer-add-label" htmlFor="offer-category">
              Category <span aria-hidden="true">*</span>
            </label>
            <div className="offer-add-control">
              <select
                id="offer-category"
                value={formValues.category}
                onChange={handleChange("category")}
              >
                <option value="">--Select--</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="offer-add-section-bar">
            <span>Short Description</span>
          </div>
          <textarea
            className="offer-add-short-textarea"
            placeholder="Write the short description..."
            value={formValues.shortDescription}
            onChange={handleChange("shortDescription")}
          />

          <div className="offer-add-section-bar">
            <span>Long Description</span>
          </div>
          <section className="offer-add-editor-shell" aria-label="Long description editor">
            <div className="offer-add-editor-toolbar offer-add-editor-toolbar-primary">
              {PRIMARY_EDITOR_TOOL_GROUPS.map((group, groupIndex) => (
                <div key={`primary-group-${groupIndex}`} className="offer-add-editor-toolbar-group">
                  {group.map((tool) => {
                    const Icon = tool.icon;
                    const isTextTool = tool.kind === "text";

                    return (
                      <button
                        key={`${tool.label}-${groupIndex}`}
                        type="button"
                        className={`offer-add-editor-btn${isTextTool ? " text" : " icon-only"}`}
                        aria-label={tool.label}
                        title={tool.label}
                      >
                        {Icon ? <Icon size={15} /> : null}
                        {isTextTool ? <span>{tool.label}</span> : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="offer-add-editor-toolbar offer-add-editor-toolbar-secondary">
              {SECONDARY_EDITOR_TOOL_GROUPS.map((group, groupIndex) => (
                <div key={`secondary-group-${groupIndex}`} className="offer-add-editor-toolbar-group">
                  {group.map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <button
                        key={`${tool.label}-${groupIndex}`}
                        type="button"
                        className="offer-add-editor-btn icon-only"
                        aria-label={tool.label}
                        title={tool.label}
                      >
                        <Icon size={15} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="offer-add-editor-toolbar offer-add-editor-toolbar-tertiary">
              <div className="offer-add-editor-selects">
                {SECONDARY_EDITOR_SELECTS.map((selectConfig) => (
                  <label
                    key={selectConfig.ariaLabel}
                    className="offer-add-editor-select-wrap"
                    aria-label={selectConfig.ariaLabel}
                  >
                    <select defaultValue={selectConfig.options[0]} aria-label={selectConfig.ariaLabel}>
                      {selectConfig.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {TERTIARY_EDITOR_TOOL_GROUPS.map((group, groupIndex) => (
                <div key={`tertiary-group-${groupIndex}`} className="offer-add-editor-toolbar-group">
                  {group.map((tool) => {
                    const Icon = tool.icon;

                    return (
                      <button
                        key={`${tool.label}-${groupIndex}`}
                        type="button"
                        className="offer-add-editor-btn icon-only"
                        aria-label={tool.label}
                        title={tool.label}
                      >
                        <Icon size={15} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="offer-add-editor-surface">
              <textarea
                placeholder="Write the long description..."
                value={formValues.longDescription}
                onChange={handleChange("longDescription")}
              />
            </div>
          </section>

          {formError && <p className="admin-markup-form-error">{formError}</p>}
          {saved && <p className="menu-form-success">Offer saved locally.</p>}

          <div className="admin-markup-modal-actions menu-form-actions offer-add-actions">
            <button type="submit" className="primary">
              Submit
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
