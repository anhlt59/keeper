import { type NextRequest, NextResponse } from "next/server";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");
  return response;
}

export async function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    return redirectToLogin(request);
  }

  try {
    const origin = request.nextUrl.origin;
    const sessionResponse = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });

    if (!sessionResponse.ok) {
      return redirectToLogin(request);
    }
  } catch {
    // Fetch failed (network error, self-referencing issue, etc.) — treat as unauthorized
    return redirectToLogin(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
