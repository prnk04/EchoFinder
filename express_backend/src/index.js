const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

const routes = require("./routes/main");
const { connectMongo } = require("./mongo");

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .filter(Boolean);
app.use(
  cors({
    origin: function (origin, cb) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin)
      )
        return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Basic rate-limit
const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// Health
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/api", routes);
const PORT = process.env.PORT || 3000;

(async () => {
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
