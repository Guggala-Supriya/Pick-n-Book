const { createProxyMiddleware } = require("http-proxy-middleware");

const FALLBACK_PROXY_TARGET =
  "https://undogmatically-knotlike-evita.ngrok-free.dev";
const DEFAULT_PROXY_TIMEOUT_MS = 20_000;

function normalizeHttpUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : "";
}

function isFrontendHost(urlValue) {
  try {
    const parsed = new URL(urlValue);
    const host = String(parsed.hostname || "").toLowerCase();
    const port = String(parsed.port || (parsed.protocol === "https:" ? "443" : "80"));

    return (
      (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") &&
      port === "3000"
    );
  } catch {
    return false;
  }
}

function resolveProxyTarget() {
  const candidates = [
    process.env.REACT_APP_API_PROXY_TARGET,
    process.env.REACT_APP_API_BASE_URL,
    process.env.REACT_APP_FLIGHT_API_BASE_URL,
    process.env.REACT_APP_BUS_API_BASE_URL,
    process.env.REACT_APP_PLACES_API_URL,
  ];

  const explicit = candidates
    .map((candidate) => normalizeHttpUrl(candidate))
    .filter((candidate) => !isFrontendHost(candidate))
    .find(Boolean);

  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // Fall through to fallback target.
    }
  }

  return FALLBACK_PROXY_TARGET;
}

module.exports = function setupProxy(app) {
  const target = resolveProxyTarget();
  const timeoutMs = Number.parseInt(process.env.REACT_APP_PROXY_TIMEOUT_MS, 10);
  const effectiveTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? timeoutMs
    : DEFAULT_PROXY_TIMEOUT_MS;

  // Helpful when debugging "API not hitting" reports.
  // Shows where `/api/*` requests are actually forwarded.
  console.log(`[proxy] /api -> ${target}`);

  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
      logLevel: "warn",
      timeout: effectiveTimeoutMs,
      proxyTimeout: effectiveTimeoutMs,
      onProxyReq(proxyReq) {
        proxyReq.setHeader("ngrok-skip-browser-warning", "true");
      },
      onError(err, req, res) {
        const code = err?.code ? String(err.code) : "";
        const message = err?.message ? String(err.message) : "Proxy error";
        const details = [code, message].filter(Boolean).join(": ");

        const payload = JSON.stringify({
          message: `API proxy failed (${details}). Proxy target: ${target}. Check that the backend is running and update REACT_APP_API_PROXY_TARGET if needed.`,
        });

        res.writeHead(502, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        });
        res.end(payload);
      },
    })
  );
};
