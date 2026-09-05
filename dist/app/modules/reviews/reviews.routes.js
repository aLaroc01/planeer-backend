"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewRoutes = void 0;
const express_1 = __importDefault(require("express"));
const reviews_controller_1 = require("./reviews.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
// create Financial Information 
router.post("/create-review", auth_middleware_1.auth, reviews_controller_1.ReviewController);
router.get("/all-reviews", auth_middleware_1.auth, auth_middleware_1.isAdmin, reviews_controller_1.GetAllReviewsController);
// Only admins can update reports
router.put("/reviews/:id", auth_middleware_1.auth, auth_middleware_1.isAdmin, reviews_controller_1.updateReportAdminController);
exports.ReviewRoutes = router;
