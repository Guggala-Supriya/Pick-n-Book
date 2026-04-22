const FALLBACK_API_BASE_URL =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function normalizeApiBaseUrlCandidate(candidate) {
  const trimmed = String(candidate ?? "").trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      let pathname = String(parsed.pathname || "/");

      pathname = pathname.replace(/\/+$/, "");
      if (!pathname) {
        pathname = "/";
      }

      if (/\/api$/i.test(pathname)) {
        pathname = pathname.replace(/\/api$/i, "");
        pathname = pathname.replace(/\/+$/, "");

        if (!pathname) {
          pathname = "/";
        }
      }

      if (pathname === "/") {
        return parsed.origin;
      }

      return `${parsed.origin}${pathname}`;
    } catch {
      return trimmed;
    }
  }

  let relative = trimmed.replace(/\/+$/, "");

  if (/\/api$/i.test(relative)) {
    relative = relative.replace(/\/api$/i, "");
    relative = relative.replace(/\/+$/, "");
  }

  if (!relative || relative === "/") {
    return "";
  }

  return relative;
}

export function isLocalDevelopment() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

export function resolveApiBaseUrl() {
  const preferProxyInDev =
    isLocalDevelopment() &&
    String(process.env.REACT_APP_USE_DIRECT_API_IN_DEV || "").toLowerCase() !==
      "true";

  if (preferProxyInDev) {
    return "";
  }

  const explicitBase =
    process.env.REACT_APP_API_BASE_URL ||
    process.env.REACT_APP_AUTH_API_BASE_URL ||
    process.env.REACT_APP_API_PROXY_TARGET;

  if (explicitBase && explicitBase.trim()) {
    return normalizeApiBaseUrlCandidate(explicitBase);
  }

  // When a Places API host is configured, reuse it so all APIs stay on the same backend.
  const placesUrl = process.env.REACT_APP_PLACES_API_URL;
  if (placesUrl && placesUrl.trim()) {
    try {
      return new URL(placesUrl.trim()).origin;
    } catch {
      // Fall through to fallback.
    }
  }

  return FALLBACK_API_BASE_URL;
}

export function toApiUrl(urlOrPath) {
  if (/^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }

  const apiBaseUrl = resolveApiBaseUrl();
  if (apiBaseUrl) {
    return `${apiBaseUrl.replace(/\/+$/, "")}/${String(urlOrPath).replace(
      /^\/+/,
      ""
    )}`;
  }

  return urlOrPath;
}

export function withNgrokSkipWarningHeader(urlOrPath, headers = {}) {
  if (typeof window === "undefined") {
    return headers;
  }

  try {
    const parsed = new URL(toApiUrl(urlOrPath), window.location.origin);
    const hostname = String(parsed.hostname || "");

    if (hostname.includes("ngrok-free.dev") || hostname.includes("ngrok.io")) {
      return { ...headers, "ngrok-skip-browser-warning": "true" };
    }
  } catch {
    // Ignore header injection when URL parsing fails.
  }

  return headers;
}

export async function readResponsePayload(response) {
  const contentType = response?.headers?.get?.("content-type") || "";
  const normalizedType = String(contentType || "").toLowerCase();

  if (normalizedType.includes("json")) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  try {
    return await response.text();
  } catch {
    return "";
  }
}

export function normalizeResponseMessage(payload, fallbackMessage = "") {
  if (payload && typeof payload === "object") {
    return String(payload.message || payload.Message || fallbackMessage || "").trim();
  }

  const text = String(payload || "").trim();
  if (!text) {
    return String(fallbackMessage || "").trim();
  }

  const lower = text.toLowerCase();
  const ngrokEndpointMatch = text.match(
    /The endpoint\s+([^\s<]+)\s+is offline\.?\s*\(ERR_NGROK_3200\)/i
  );

  if (ngrokEndpointMatch?.[1] || lower.includes("err_ngrok_3200")) {
    const endpoint = String(ngrokEndpointMatch?.[1] || "").trim();
    return [
      "Ngrok tunnel is offline (ERR_NGROK_3200).",
      endpoint ? `Endpoint: ${endpoint}.` : "",
      "If your backend is running, update your ngrok URL / proxy target and restart the frontend dev server.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  const dataPayloadMatch = text.match(/data-payload="([^"]+)"/i);
  const dataPayloadRaw = String(dataPayloadMatch?.[1] || "").trim();
  if (dataPayloadRaw && typeof atob === "function") {
    try {
      const decoded = atob(dataPayloadRaw);
      const parsed = JSON.parse(decoded) || {};
      const code = String(parsed.code || "").trim();

      if (code === "3200") {
        const message = String(parsed.message || "").trim();
        return [
          "Ngrok tunnel is offline (code 3200).",
          message ? `${message}` : "",
          "If your backend is running, update your ngrok URL / proxy target and restart the frontend dev server.",
        ]
          .filter(Boolean)
          .join(" ");
      }
    } catch {
      // Ignore decode failures.
    }
  }

  if (lower.includes("<!doctype html") || lower.includes("<html")) {
    const noTags = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return noTags || String(fallbackMessage || "").trim();
  }

  return text;
}
