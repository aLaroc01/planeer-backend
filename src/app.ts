import express, { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import path from "path";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Routes
import { userRoutes } from "./app/modules/auth/user.routes";
import { financialRoutes } from "./app/modules/financial-Information/financial.routes";
import { medicalRoutes } from "./app/modules/medical-Information/medical.routes";
import { socialRoutes } from "./app/modules/social-Information/social.routes";
import { personalRoutes } from "./app/modules/personal-Information/personal.routes";
import { homeautoRoutes } from "./app/modules/homeAuto-Information/homeauto.routes";
import { ReportRoutes } from "./app/modules/report-Information/report.routes";
import { PackageRoutes } from "./app/modules/package/package.routes";
import { SubscriptionRoutes } from "./app/modules/subscriptions-information/subscriptions.routes";
import { profileRoutes } from "./app/modules/Profile-Information/profile.routes";
import { ReviewRoutes } from "./app/modules/reviews/reviews.routes";
import connectionRoutes from "./app/modules/connections/connection.routes";
import { AuditLogRoutes } from "./app/modules/audit-log/auditLog.routes";
import { SupportRoutes } from "./app/modules/support/support.routes";
import { ChecklistRoutes } from "./app/modules/checklist/checklist.routes";

// Controllers / middleware / helpers
import { SubscriptionController } from "./app/modules/subscriptions-information/subscriptions.controller";
import { startSubscriptionExpireCron } from "./app/modules/subscriptions-information/subscriptionExpire.cron";
import errorHandler from "./app/middleware/errorHandler";
import { requestLogger } from './helpers/requestLogger';

// express-fileupload does not ship TypeScript declarations.
// @ts-expect-error -- package is used as runtime Express middleware.
import fileUpload from "express-fileupload";

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| Stripe webhook
|--------------------------------------------------------------------------
| Stripe requires the unparsed raw request body. This must remain before
| express.json(), otherwise webhook signature verification can break.
|--------------------------------------------------------------------------
*/
app.post(
  "/api/v1/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  SubscriptionController.stripeWebhookHandler
);

/*
|--------------------------------------------------------------------------
| App settings
|--------------------------------------------------------------------------
*/
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/*
|--------------------------------------------------------------------------
| CORS — must run before normal middleware, auth, rate limiting, and routes
|--------------------------------------------------------------------------
*/
const allowedOrigins = [
  "https://planeer-frontend.vercel.app",
  "http://localhost:5173",
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allows curl, Postman, Render checks, and server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked this origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Explicitly finish all CORS preflights before they reach rate limits,
// IP rules, file uploads, auth middleware, or API routes.
app.options(/.*/, cors(corsOptions));

/*
|--------------------------------------------------------------------------
| Body parsing and security
|--------------------------------------------------------------------------
*/
app.use(express.json({ limit: "50mb" }));

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

/*
|--------------------------------------------------------------------------
| Rate limiting and request logging
|--------------------------------------------------------------------------
*/
const limiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(requestLogger);

/*
|--------------------------------------------------------------------------
| File uploads
|--------------------------------------------------------------------------
*/
app.use(
  fileUpload({
    createParentPath: true,
  })
);

/*
|--------------------------------------------------------------------------
| Optional IP allowlist
|--------------------------------------------------------------------------
*/
const allowedIPs = (process.env.ALLOWED_TEST_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

app.use((req: Request, res: Response, next: NextFunction) => {
  // CORS preflight must never be blocked here.
  if (req.method === "OPTIONS") {
    return next();
  }

  // If no IP list is configured, allow all requests.
  if (allowedIPs.length === 0) {
    return next();
  }

  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.toString().split(",")[0].trim()
    : req.socket.remoteAddress || "";

  if (allowedIPs.includes(ip)) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied",
    message: "Your IP is not authorized to access this API.",
  });
});

/*
|--------------------------------------------------------------------------
| Uploaded files
|--------------------------------------------------------------------------
*/
app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  return next();
});

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res: Response) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
| Use this for a lightweight service-status check and potential keep-alive.
|--------------------------------------------------------------------------
*/
app.get("/health", (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
*/
app.use("/api/v1", userRoutes);
app.use("/api/v1", financialRoutes);
app.use("/api/v1", medicalRoutes);
app.use("/api/v1", profileRoutes);
app.use("/api/v1", personalRoutes);
app.use("/api/v1", homeautoRoutes);
app.use("/api/v1", ReportRoutes);
app.use("/api/v1", PackageRoutes);
app.use("/api/v1", SubscriptionRoutes);
app.use("/api/v1", ReviewRoutes);
app.use("/api/v1", connectionRoutes);
app.use("/api/v1", socialRoutes);
app.use("/api/v1/audit-logs", AuditLogRoutes);
app.use("/api/v1", SupportRoutes);
app.use("/api/v1", ChecklistRoutes);

/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/
app.get("/", (_req: Request, res: Response) => {
  return res.send("Hello from Render!");
});

app.get("/test-error", (_req: Request, _res: Response) => {
  throw new Error("This is a test error");
});

/*
|--------------------------------------------------------------------------
| Error handler — must be last
|--------------------------------------------------------------------------
*/
app.use(errorHandler);

/*
|--------------------------------------------------------------------------
| Background jobs
|--------------------------------------------------------------------------
*/
startSubscriptionExpireCron();

export default app;