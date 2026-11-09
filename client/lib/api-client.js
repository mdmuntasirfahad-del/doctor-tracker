export class ApiError extends Error {
  constructor(message, { status = 0, code = "INTERNAL_ERROR", details } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.fieldErrors = details?.fieldErrors ?? {};
  }
}

function buildQuery(params) {
  if (!params) {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
}

export async function apiRequest(path, { method = "GET", body, params, signal } = {}) {
  const response = await fetch(`/api/v1${path}${buildQuery(params)}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
    cache: "no-store",
  });

  let payload = null;
  try {
    payload = await parseResponse(response);
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const error = new ApiError(payload?.error?.message ?? "The request could not be completed.", {
      status: response.status,
      code: payload?.error?.code ?? "INTERNAL_ERROR",
      details: payload?.error?.details,
    });

    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    } else if (response.status === 403 && typeof window !== "undefined") {
      window.location.replace("/access-denied");
    }

    throw error;
  }

  return payload;
}

export const api = {
  get(path, params, signal) {
    return apiRequest(path, { params, signal });
  },
  post(path, body) {
    return apiRequest(path, { method: "POST", body });
  },
  patch(path, body) {
    return apiRequest(path, { method: "PATCH", body });
  },
  delete(path) {
    return apiRequest(path, { method: "DELETE" });
  },
};
