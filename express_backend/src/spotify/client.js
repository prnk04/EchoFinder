const axios = require("axios");
const axiosRetry = require("axios-retry").default;

let token = null;
let tokenExpiresAt = 0;

async function getAppToken() {
  const now = Date.now();

  if (token && now < tokenExpiresAt - 30 * 1000) {
    return token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret)
    throw new Error("Missing Spotify Credentials");

  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const resp = await axios.post(
    process.env.SPOTIFY_TOKEN_URL,
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
    }
  );

  token = resp?.data?.access_token;
  const expiresIn = resp?.data?.expires_in || 3600;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
  return token;
}

function spotifyAxios() {
  const instance = axios.create({ baseURL: process.env.SPOTIFY_BASE_URL });

  instance.interceptors.request.use(async (config) => {
    const t = await getAppToken();
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
    config.headers.Accept = "application/json";
    config.headers["Content-Type"] = "application/json";
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config || {};
      if (
        error.response &&
        error.response.status === 401 &&
        !original.__retried
      ) {
        original.__retried = true;
        token = null;
        await getAppToken();
        return instance(original);
      }
      return Promise.reject(error);
    }
  );

  // Add Axios Retry
  axiosRetry(instance, {
    retries: 3, // number of retry attempts
    retryDelay: (retryCount) => {
      console.warn(`⏳ Retry attempt #${retryCount}`);
      return retryCount * 1000; // exponential backoff (1s, 2s, 3s)
    },
    retryCondition: (error) => {
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        (error.response && error.response.status >= 500)
      );
    },
  });

  // Response Interceptor for Global Error Handling
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log("spotify error: ", error);
      if (error.code === "ENOTFOUND") {
        console.error(
          "❌ DNS lookup failed. Please check your internet connection or API domain."
        );
      } else if (error.code === "ECONNREFUSED") {
        console.error("🚫 Connection refused. The server might be down.");
      } else if (error.code === "ECONNABORTED") {
        console.error("⏰ Request timed out. Try again later.");
      } else if (error.message.includes("Network Error")) {
        console.error("🌐 Network error. Please check your connection.");
      } else if (error.response) {
        // The request was made and server responded with an error
        console.error(
          `⚠️ Server responded with ${error.response.status}: ${error.response.statusText}`
        );
      } else {
        console.error("❗ Unexpected error:", error.message);
      }

      return Promise.reject({
        message: error.message,
        status: error.response?.status,
        code: error.code,
        isRetryable: axiosRetry.isNetworkError(error),
      });
    }
  );

  return instance;
}

module.exports = { spotifyAxios, getAppToken };
