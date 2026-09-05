"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeautoRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const homeauto_controller_1 = require("./homeauto.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/CreateHomeAuto", auth_middleware_1.auth, homeauto_controller_1.HomeAutoUpdate);
//update Financial Information
router.post("/UpdateHomeAuto", auth_middleware_1.auth, homeauto_controller_1.HomeAutoUpdate);
//get Financial Information
router.get("/GetHomeautoData", auth_middleware_1.auth, homeauto_controller_1.GetHomeautoData);
exports.homeautoRoutes = router;
