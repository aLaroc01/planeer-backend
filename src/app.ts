import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from "path";
import rateLimit from 'express-rate-limit';
import { userRoutes } from './app/modules/auth/user.routes';
import errorHandler from './app/middleware/errorHandler';
import { financialRoutes } from './app/modules/financial-Information/financial.routes';
import { medicalRoutes } from './app/modules/medical-Information/medical.routes';
import { socialRoutes } from './app/modules/social-Information/social.routes';
import { personalRoutes } from './app/modules/personal-Information/personal.routes';
import { homeautoRoutes } from './app/modules/homeAuto-Information/homeauto.routes';
import { ReportRoutes } from './app/modules/report-Information/report.routes';
import { PackageRoutes } from './app/modules/package/package.routes';
import { SubscriptionRoutes } from './app/modules/subscriptions-information/subscriptions.routes';
import { startSubscriptionExpireCron } from './app/modules/subscriptions-information/subscriptionExpire.cron';
import { requestLogger } from './helpers/requestLogger';
import dotenv from "dotenv";
import { profileRoutes } from './app/modules/Profile-Information/profile.routes';
import { ReviewRoutes } from './app/modules/reviews/reviews.routes';
import connectionRoutes  from './app/modules/connections/connection.routes';
// express-fileupload does not ship TypeScript declarations.
// @ts-expect-error -- the package is used as middleware at runtime.
import fileUpload from 'express-fileupload';
import { AuditLogRoutes } from './app/modules/audit-log/auditLog.routes';
import { SupportRoutes } from "./app/modules/support/support.routes";
import { ChecklistRoutes } from "./app/modules/checklist/checklist.routes";
import { SubscriptionController } from './app/modules/subscriptions-information/subscriptions.controller';

dotenv.config();


const app = express();

app.post(
  "/api/v1/subscriptions/webhook",
  express.raw({ type: "application/json" }),
  SubscriptionController.stripeWebhookHandler,
);

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LOCAL_FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allows Postman, curl, and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked this origin: ${origin}`),
      );
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

app.use(express.json({ limit: "50mb" }));
// app.use(cors());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);
const limiter = rateLimit({windowMs: 20 * 60 * 1000, max: 100, });
app.use(limiter);
app.use(requestLogger);

app.use(
  fileUpload({
    createParentPath: true,
  })
);

const allowedIPs = (process.env.ALLOWED_TEST_IPS || "")
  .split(",")
  .map((ip) => ip.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  // Get the real client IP. Behind Render, use x-forwarded-for.
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded
    ? forwarded.toString().split(",")[0].trim()
    : req.socket.remoteAddress || "";

  // If no list is configured, allow everything (safety fallback).
  if (allowedIPs.length === 0) {
    return next();
  }

  if (allowedIPs.includes(ip)) {
    return next();
  }

  return res.status(403).json({
    error: "Access denied",
    message: "Your IP is not authorized to access this API.",
  });
});

// Serve uploaded files
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use("/uploads", (req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  next();
});

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res: Response) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    },
  })
);


//routes

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

app.use(express.json());


//error handling middleware
 app.use(errorHandler); 

startSubscriptionExpireCron();


app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Vercel!");
});


app.get("/test-error", (req, res) => {
  throw new Error("This is a test error");
});


export default app;