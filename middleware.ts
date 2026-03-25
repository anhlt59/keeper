import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ??
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session via better-auth's built-in session endpoint
  const origin = request.nextUrl.origin;
  const sessionResponse = await fetch(`${origin}/api/auth/get-session`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
  });

  if (!sessionResponse.ok) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("better-auth.session_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
