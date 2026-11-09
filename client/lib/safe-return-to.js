const adminRoutes = ["/dashboard", "/doctors", "/patients", "/registration_request"];
const portalRoutes = ["/portal"];
const portalRoles = new Set(["doctor", "patient"]);

export function homeForRole(role) {
  if (role === "admin") {
    return "/dashboard";
  }
  if (portalRoles.has(role)) {
    return "/portal";
  }
  return "/access-denied";
}

export function safeReturnTo(value, role = "admin") {
  const fallback = homeForRole(role);

  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  if (value.includes("\\") || /[\u0000-\u001f]/.test(value)) {
    return fallback;
  }

  let destination;
  try {
    destination = new URL(value, "http://doctor-tracker.local");
  } catch {
    return fallback;
  }

  if (destination.origin !== "http://doctor-tracker.local") {
    return fallback;
  }

  const matchesRoute = (route) =>
    destination.pathname === route || destination.pathname.startsWith(`${route}/`);
  const isAdminRoute = adminRoutes.some(matchesRoute);
  const isPortalRoute = portalRoutes.some(matchesRoute);

  if (!isAdminRoute && !isPortalRoute) {
    return fallback;
  }

  if (role === "admin" && isPortalRoute) {
    return fallback;
  }

  if (portalRoles.has(role) && isAdminRoute) {
    return fallback;
  }

  if (!portalRoles.has(role) && role !== "admin") {
    return fallback;
  }

  return `${destination.pathname}${destination.search}${destination.hash}`;
}
