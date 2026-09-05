"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const financial_controller_1 = require("./financial.controller");
const router = express_1.default.Router();
// create Financial Information 
router.post("/CreateFinancial", auth_middleware_1.auth, financial_controller_1.UpdateFinancial);
router.post("/UpdateFinancial", auth_middleware_1.auth, financial_controller_1.UpdateFinancial);
router.get("/GetFinancialData", auth_middleware_1.auth, financial_controller_1.GetFinancialData);
exports.financialRoutes = router;
