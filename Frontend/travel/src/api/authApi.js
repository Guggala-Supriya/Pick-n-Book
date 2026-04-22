import {
  toApiUrl,
  withNgrokSkipWarningHeader,
  readResponsePayload,
  normalizeResponseMessage,
} from "./apiBaseUrl";

export function toAuthUrl(urlOrPath) {
  return toApiUrl(urlOrPath);
}

export function readApiMessage(payload, fallback = "") {
  return normalizeResponseMessage(payload, fallback);
}

export async function requestAuth(
  urlOrPath,
  options = {},
  fallbackMessage = "Request failed. Please try again."
) {
  const isFormDataBody =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  const headers = {
    Accept: "application/json, text/plain, */*",
    ...(options.headers || {}),
  };

  if (options.body && !isFormDataBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(toApiUrl(urlOrPath), {
    ...options,
    headers: withNgrokSkipWarningHeader(urlOrPath, headers),
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const message = normalizeResponseMessage(payload, fallbackMessage);
    throw new Error(message || fallbackMessage);
  }

  return payload;
}

