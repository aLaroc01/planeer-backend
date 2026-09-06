"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const personal_controller_1 = require("./personal.controller");
const router = express_1.default.Router();
// create personal Information 
// router.post("/CreateFinancial",auth,UpdatePersonal)
// update personal info
router.post("/updatePersonal", auth_middleware_1.auth, personal_controller_1.UpdatePersonal);
// get personal info
router.get("/getPersonalData", auth_middleware_1.auth, personal_controller_1.GetPersonalData);
exports.personalRoutes = router;
