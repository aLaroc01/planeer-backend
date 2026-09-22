"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digitalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const digital_controller_1 = require("./digital.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/CreateDigitalInfo", auth_middleware_1.auth, digital_controller_1.DigitalInformation);
router.post("/UpdateDigitalInfo", auth_middleware_1.auth, digital_controller_1.DigitalInformation);
router.get("/GetDigitalData", auth_middleware_1.auth, digital_controller_1.GetDigitalData);
exports.digitalRoutes = router;
