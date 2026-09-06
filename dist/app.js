"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const user_routes_1 = require("./app/modules/auth/user.routes");
const errorHandler_1 = __importDefault(require("./app/middleware/errorHandler"));
const financial_routes_1 = require("./app/modules/financial-Information/financial.routes");
const medical_routes_1 = require("./app/modules/medical-Information/medical.routes");
const social_routes_1 = require("./app/modules/social-Information/social.routes");
const personal_routes_1 = require("./app/modules/personal-Information/personal.routes");
const homeauto_routes_1 = require("./app/modules/homeAuto-Information/homeauto.routes");
const report_routes_1 = require("./app/modules/report-Information/report.routes");
const package_routes_1 = require("./app/modules/package/package.routes");
const subscriptions_routes_1 = require("./app/modules/subscriptions-information/subscriptions.routes");
const subscriptionExpire_cron_1 = require("./app/modules/subscriptions-information/subscriptionExpire.cron");
const requestLogger_1 = require("./helpers/requestLogger");
const dotenv_1 = __importDefault(require("dotenv"));
const profile_routes_1 = require("./app/modules/Profile-Information/profile.routes");
const reviews_routes_1 = require("./app/modules/reviews/reviews.routes");
const connection_routes_1 = __importDefault(require("./app/modules/connections/connection.routes"));
// express-fileupload does not ship TypeScript declarations.
// @ts-expect-error -- the package is used as middleware at runtime.
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const auditLog_routes_1 = require("./app/modules/audit-log/auditLog.routes");
const support_routes_1 = require("./app/modules/support/support.routes");
const checklist_routes_1 = require("./app/modules/checklist/checklist.routes");
const subscriptions_controller_1 = require("./app/modules/subscriptions-information/subscriptions.controller");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.post("/api/v1/subscriptions/webhook", express_1.default.raw({ type: "application/json" }), subscriptions_controller_1.SubscriptionController.stripeWebhookHandler);
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.LOCAL_FRONTEND_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allows Postman, curl, and server-to-server requests
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked this origin: ${origin}`));
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
}));
app.use(express_1.default.json({ limit: "50mb" }));
// app.use(cors());
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
const limiter = (0, express_rate_limit_1.default)({ windowMs: 20 * 60 * 1000, max: 100, });
app.use(limiter);
app.use(requestLogger_1.requestLogger);
app.use((0, express_fileupload_1.default)({
    createParentPath: true,
}));
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
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    },
}));
//routes
app.use("/api/v1", user_routes_1.userRoutes);
app.use("/api/v1", financial_routes_1.financialRoutes);
app.use("/api/v1", medical_routes_1.medicalRoutes);
app.use("/api/v1", profile_routes_1.profileRoutes);
app.use("/api/v1", personal_routes_1.personalRoutes);
app.use("/api/v1", homeauto_routes_1.homeautoRoutes);
app.use("/api/v1", report_routes_1.ReportRoutes);
app.use("/api/v1", package_routes_1.PackageRoutes);
app.use("/api/v1", subscriptions_routes_1.SubscriptionRoutes);
app.use("/api/v1", reviews_routes_1.ReviewRoutes);
app.use("/api/v1", connection_routes_1.default);
app.use("/api/v1", social_routes_1.socialRoutes);
app.use("/api/v1/audit-logs", auditLog_routes_1.AuditLogRoutes);
app.use("/api/v1", support_routes_1.SupportRoutes);
app.use("/api/v1", checklist_routes_1.ChecklistRoutes);
app.use(express_1.default.json());
//error handling middleware
app.use(errorHandler_1.default);
(0, subscriptionExpire_cron_1.startSubscriptionExpireCron)();
app.get("/", (req, res) => {
    res.send("Hello from Vercel!");
});
app.get("/test-error", (req, res) => {
    throw new Error("This is a test error");
});
exports.default = app; // trigger redeploy
