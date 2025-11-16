/**
 *
 * @param {*} err
 * @returns an object containing formatted error detail
 * Universal function to parse error
 */
function parseError(err) {
  if (!err) return "Unknown error occurred.";

  // --- 1️⃣ Axios / HTTP Errors ---
  if (err.isAxiosError) {
    const method = err.config?.method?.toUpperCase() || "REQUEST";
    const url = err.config?.url || "";
    const status = err.response?.status;
    const statusText = err.response?.statusText;

    if (err.code === "ENOTFOUND")
      return `DNS Error: Unable to resolve host (${url}).`;
    if (err.code === "ECONNREFUSED") return `Connection refused: ${url}`;
    if (err.code === "ECONNABORTED") return `Timeout: ${method} ${url}`;
    if (err.code === "ETIMEDOUT")
      return `Network timeout while accessing ${url}`;
    if (err.code === "EAI_AGAIN") return `Temporary DNS failure for ${url}`;

    if (status) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        statusText ||
        "Unknown server error";
      return `HTTP ${status}: ${msg} [${method} ${url}]`;
    }

    return `AxiosError: ${err.message}`;
  }

  // --- 2️⃣ MongoDB / Mongoose Errors ---
  if (err.name === "MongoError" || err.name === "MongoServerError") {
    if (err.code === 11000)
      return "Duplicate key error: record already exists.";
    return `MongoDB Error: ${err.message}`;
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return `Validation Error: ${messages.join(", ")}`;
  }

  // --- 3️⃣ Node.js System / Network Errors ---
  if (err.code && typeof err.code === "string") {
    switch (err.code) {
      case "ECONNRESET":
        return "Connection reset by peer.";
      case "EPIPE":
        return "Broken pipe — likely due to abrupt connection close.";
      case "EADDRINUSE":
        return "Port already in use.";
      default:
        return `System Error [${err.code}]: ${err.message}`;
    }
  }

  // --- 4️⃣ Runtime Errors (TypeError, ReferenceError, etc.) ---
  if (err instanceof TypeError) {
    return { type: "Type Error", message: err.message };
  }
  if (err instanceof ReferenceError) {
    return `Reference Error: ${err.message}`;
  }
  if (err instanceof SyntaxError) {
    return `Syntax Error: ${err.message}`;
  }
  if (err instanceof RangeError) {
    return `Range Error: ${err.message}`;
  }

  // --- 5️⃣ Catch-all fallback ---
  return err.message || "Unexpected error occurred.";
}

module.exports = { parseError };
