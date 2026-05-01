import { rateLimit } from "express-rate-limit";

export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    ok: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Limit: 100 requests per 15 minutes.",
    },
  },
  skip: (req) => req.path === "/v1" || req.path === "/v1/",
});
