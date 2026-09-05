"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const social_controller_1 = require("./social.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/CreateSocialInfo", auth_middleware_1.auth, social_controller_1.SocialInformation);
router.post("/UpdateSocialInfo", auth_middleware_1.auth, social_controller_1.SocialInformation);
router.get("/GetSocialData", auth_middleware_1.auth, social_controller_1.GetSocialData);
exports.socialRoutes = router;
