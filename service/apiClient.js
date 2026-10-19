const baseUrl = process.env.BASE_URL?.replace(/\/$/, "");

/** Server-side API client. BASE_URL never reaches the browser bundle. */
export async function apiClient(path, options = {}) {
  if (!baseUrl) throw new Error("BASE_URL is not configured");

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { Accept: "application/json", ...options.headers },
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
    error.status = response.status;
    // Keep the API's error body (e.g. 422 field errors) for callers that surface it.
    error.body = await response.json().catch(() => null);
    throw error;
  }

  return response.json();
}
