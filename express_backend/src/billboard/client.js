const axios = require("axios");
const axiosRetry = require("axios-retry").default;

function billboardAxios() {
  const instance = axios.create({
    baseURL: process.env.BILLBOARD_BASE_URL,
  });

  instance.interceptors.request.use(async (config) => {
    config.headers = config.headers || {};
    return config;
  });

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
module.exports = { billboardAxios };
