import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;
  const returnTo = `${pathname}${request.nextUrl.search}`;

  if (!sessionCookie && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  // Do not redirect /login -> /dashboard based only on cookie presence.
  // getSessionCookie is optimistic; an expired cookie would loop forever
  // with the authoritative session check in the dashboard layout.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-doctor-tracker-return-to", returnTo);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/doctors/:path*",
    "/patients/:path*",
    "/registration_request/:path*",
    "/portal/:path*",
  ],
};
