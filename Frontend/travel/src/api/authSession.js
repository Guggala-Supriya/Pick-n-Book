import { useSyncExternalStore } from "react";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function decodeJwtPayload(token) {
  const rawToken = normalizeText(token);
  if (!rawToken) {
    return {};
  }

  const parts = rawToken.split(".");
  if (parts.length < 2) {
    return {};
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    if (typeof atob !== "function") {
      return {};
    }

    const payload = atob(padded);
    return JSON.parse(payload) || {};
  } catch {
    return {};
  }
}

function pickFirst(source, keys, fallback = "") {
  if (!source || typeof source !== "object") {
    return fallback;
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      const text = normalizeText(source[key]);
      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

let session = {
  token: "",
  user: null,
  adminRole: "",
  adminChallengeId: "",
};

const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener errors.
    }
  });
}

function setSession(nextSession) {
  session = nextSession;
  emitChange();
}

function updateSession(partial, options) {
  void options;
  setSession({ ...session, ...partial });
}

export function subscribeAuthSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthSessionSnapshot() {
  return session;
}

export function useAuthSession() {
  return useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getAuthSessionSnapshot
  );
}

export function getAuthToken() {
  return session.token;
}

export function setAuthToken(token) {
  updateSession({ token: normalizeText(token) });
}

export function getAuthUser() {
  return session.user;
}

export function setAuthUser(user) {
  updateSession({ user: user && typeof user === "object" ? user : null });
}

export function getAuthUserId() {
  const directUserId = pickFirst(
    session.user,
    ["userId", "UserId", "id", "Id", "uid", "Uid", "userID", "UserID"],
    ""
  );

  if (directUserId) {
    return directUserId;
  }

  const payload = decodeJwtPayload(session.token);
  return pickFirst(
    payload,
    [
      "userId",
      "UserId",
      "uid",
      "Uid",
      "sub",
      "nameid",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid",
      "email",
      "upn",
      "unique_name",
      "preferred_username",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    ],
    ""
  );
}

export function getAdminRole() {
  return session.adminRole;
}

export function setAdminRole(role) {
  updateSession({ adminRole: normalizeText(role) });
}

export function getAdminChallengeId() {
  return session.adminChallengeId;
}

export function setAdminChallengeId(challengeId) {
  updateSession({ adminChallengeId: normalizeText(challengeId) });
}

export function clearAuthSession() {
  updateSession({
    token: "",
    user: null,
    adminRole: "",
    adminChallengeId: "",
  });
}
