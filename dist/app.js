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
const homeauto_routes_1 = require("./app/modules/homeAuto-Information/homeauto.routes");
const report_routes_1 = require("./app/modules/report-Information/report.routes");
const package_routes_1 = require("./app/modules/package/package.routes");
const subscriptions_routes_1 = require("./app/modules/subscriptions-information/subscriptions.routes");
const subscriptionExpire_cron_1 = require("./app/modules/subscriptions-information/subscriptionExpire.cron");
const requestLogger_1 = require("./helpers/requestLogger");
const dotenv_1 = __importDefault(require("dotenv"));
const reviews_routes_1 = require("./app/modules/reviews/reviews.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.use((0, cors_1.default)({
    origin: "*"
}));
// app.use(cors());
app.use(express_1.default.json({ limit: '50mb' }));
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({ windowMs: 20 * 60 * 1000, max: 100, });
app.use(limiter);
app.use(requestLogger_1.requestLogger);
//routes
app.use("/api/v1", user_routes_1.userRoutes);
app.use("/api/v1", financial_routes_1.financialRoutes);
app.use("/api/v1", medical_routes_1.medicalRoutes);
app.use("/api/v1", social_routes_1.socialRoutes);
app.use("/api/v1", homeauto_routes_1.homeautoRoutes);
app.use("/api/v1", report_routes_1.ReportRoutes);
app.use("/api/v1", package_routes_1.PackageRoutes);
app.use("/api/v1", subscriptions_routes_1.SubscriptionRoutes);
app.use("/api/v1", reviews_routes_1.ReviewRoutes);
//error handling middleware
app.use(errorHandler_1.default);
(0, subscriptionExpire_cron_1.startSubscriptionExpireCron)();
app.get("/", (req, res) => {
    res.send("Hello from Vercel!");
});
app.get("/test-error", (req, res) => {
    throw new Error("This is a test error");
});
exports.default = app;
