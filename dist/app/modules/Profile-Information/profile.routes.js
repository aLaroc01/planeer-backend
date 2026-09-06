"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const profile_controller_1 = require("./profile.controller");
const router = express_1.default.Router();
// create profile information
router.post("/profile/create", auth_middleware_1.auth, profile_controller_1.createProfile);
// update profile information
router.post("/profile/update", auth_middleware_1.auth, profile_controller_1.UpdateProfile);
// get profile information
router.get("/GetProfile", auth_middleware_1.auth, profile_controller_1.GetProfileData);
router.patch("/profile/suggestions/:key", auth_middleware_1.auth, profile_controller_1.updateSuggestionStatus);
exports.profileRoutes = router;
