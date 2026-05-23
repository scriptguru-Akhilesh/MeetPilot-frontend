export async function apiFetch<T>(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
   const message =
  payload?.message ||
  payload?.error?.message ||
  response.statusText ||
  "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {},
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("mom_token") : null;
  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return apiFetch<T>(endpoint, { ...options, headers });
}
