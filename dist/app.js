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
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const user_routes_1 = require("./app/modules/auth/user.routes");
const financial_routes_1 = require("./app/modules/financial-Information/financial.routes");
const medical_routes_1 = require("./app/modules/medical-Information/medical.routes");
const social_routes_1 = require("./app/modules/social-Information/social.routes");
const personal_routes_1 = require("./app/modules/personal-Information/personal.routes");
const homeauto_routes_1 = require("./app/modules/homeAuto-Information/homeauto.routes");
const report_routes_1 = require("./app/modules/report-Information/report.routes");
const package_routes_1 = require("./app/modules/package/package.routes");
const subscriptions_routes_1 = require("./app/modules/subscriptions-information/subscriptions.routes");
const profile_routes_1 = require("./app/modules/Profile-Information/profile.routes");
const reviews_routes_1 = require("./app/modules/reviews/reviews.routes");
const connection_routes_1 = __importDefault(require("./app/modules/connections/connection.routes"));
const auditLog_routes_1 = require("./app/modules/audit-log/auditLog.routes");
const support_routes_1 = require("./app/modules/support/support.routes");
const checklist_routes_1 = require("./app/modules/checklist/checklist.routes");
// Controllers / middleware / helpers
const subscriptions_controller_1 = require("./app/modules/subscriptions-information/subscriptions.controller");
const subscriptionExpire_cron_1 = require("./app/modules/subscriptions-information/subscriptionExpire.cron");
const errorHandler_1 = __importDefault(require("./app/middleware/errorHandler"));
const requestLogger_1 = require("./helpers/requestLogger");
// express-fileupload does not ship TypeScript declarations.
// @ts-expect-error -- package is used as runtime Express middleware.
const express_fileupload_1 = __importDefault(require("express-fileupload"));
dotenv_1.default.config();
const app = (0, express_1.default)();
/*
|--------------------------------------------------------------------------
| Stripe webhook
|--------------------------------------------------------------------------
| Stripe requires the unparsed raw request body. This must remain before
| express.json(), otherwise webhook signature verification can break.
|--------------------------------------------------------------------------
*/
app.post("/api/v1/subscriptions/webhook", express_1.default.raw({ type: "application/json" }), subscriptions_controller_1.SubscriptionController.stripeWebhookHandler);
/*
|--------------------------------------------------------------------------
| App settings
|--------------------------------------------------------------------------
*/
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
/*
|--------------------------------------------------------------------------
| CORS — must run before normal middleware, auth, rate limiting, and routes
|--------------------------------------------------------------------------
*/
const allowedOrigins = [
    "https://planeer-frontend.vercel.app",
    "http://localhost:5173",
];
const corsOptions = {
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
app.use((0, cors_1.default)(corsOptions));
// Explicitly finish all CORS preflights before they reach rate limits,
// IP rules, file uploads, auth middleware, or API routes.
app.options(/.*/, (0, cors_1.default)(corsOptions));
/*
|--------------------------------------------------------------------------
| Body parsing and security
|--------------------------------------------------------------------------
*/
app.use(express_1.default.json({ limit: "50mb" }));
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
}));
/*
|--------------------------------------------------------------------------
| Rate limiting and request logging
|--------------------------------------------------------------------------
*/
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 20 * 60 * 1000,
    max: 100,
});
app.use(limiter);
app.use(requestLogger_1.requestLogger);
/*
|--------------------------------------------------------------------------
| File uploads
|--------------------------------------------------------------------------
*/
app.use((0, express_fileupload_1.default)({
    createParentPath: true,
}));
/*
|--------------------------------------------------------------------------
| Optional IP allowlist
|--------------------------------------------------------------------------
*/
const allowedIPs = (process.env.ALLOWED_TEST_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
app.use((req, res, next) => {
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
app.use("/uploads", (req, res, next) => {
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
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
}));
/*
|--------------------------------------------------------------------------
| Health check
|--------------------------------------------------------------------------
| Use this for a lightweight service-status check and potential keep-alive.
|--------------------------------------------------------------------------
*/
app.get("/health", (_req, res) => {
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
/*
|--------------------------------------------------------------------------
| Basic routes
|--------------------------------------------------------------------------
*/
app.get("/", (_req, res) => {
    return res.send("Hello from Render!");
});
app.get("/test-error", (_req, _res) => {
    throw new Error("This is a test error");
});
/*
|--------------------------------------------------------------------------
| Error handler — must be last
|--------------------------------------------------------------------------
*/
app.use(errorHandler_1.default);
/*
|--------------------------------------------------------------------------
| Background jobs
|--------------------------------------------------------------------------
*/
(0, subscriptionExpire_cron_1.startSubscriptionExpireCron)();
exports.default = app;
