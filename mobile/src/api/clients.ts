import { API_URL } from "@env";
type FetchOptions = RequestInit & {
  timeout?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 2;

export async function apiClient(
  endpoint: string,
  options: FetchOptions = {}
): Promise<any> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    headers = {},
    ...rest
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      signal: controller.signal,
    });

    // 🧩 Response Interceptor
    if (!response.ok) {
      const errorBody = await safeParseJSON(response);

      throw new Error(
        `❌ API Error ${response.status}: ${
          errorBody?.message || response.statusText
        }`
      );
    }

    const contentType = response.headers.get("content-type") || "";

    let data;

    if (contentType.includes("application/json")) {
      data = await response.json(); // ✅ safely parse JSON
    } else if (contentType.includes("text/")) {
      data = await response.text(); // handle text/plain, text/html etc
    } else {
      data = await response.arrayBuffer(); // fallback for binary responses
    }

    return { ok: true, status: response.status, data };

    // return await safeParseJSON(response);
    // return data;
  } catch (error: any) {
    console.log("for: ", endpoint);
    console.log("Error in fetch: ", error);
    // ⏱ Timeout or network errors
    if (error.name === "AbortError") {
      console.error("⏱ Request timed out.");
      throw new Error("Request timed out. Please try again.");
    }

    // 🌐 Network error
    if (
      error.message === "Failed to fetch" ||
      error.message.includes("NetworkError")
    ) {
      console.error("🌐 Network error.");
      throw new Error("Request timed out. Please try again.");
    }

    // 🚨 Other errors
    console.error("Unexpected error:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ✅ Helper: safely parse JSON or return null if empty
async function safeParseJSON(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
