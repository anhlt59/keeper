/**
 * Fetch wrapper that redirects to login on 401 Unauthorized responses.
 * Use this for all authenticated API calls to ensure client-side auth protection.
 */
export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, { credentials: "include", ...init });

  if (res.status === 401) {
    window.location.href = "/login";
    // Throw to prevent further processing in the calling code
    throw new Error("Unauthorized");
  }

  return res;
}
