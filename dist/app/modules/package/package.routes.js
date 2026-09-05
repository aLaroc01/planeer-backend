"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageRoutes = void 0;
const express_1 = __importDefault(require("express"));
const package_controller_1 = require("./package.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/packages-create", auth_middleware_1.auth, package_controller_1.PackageController.createPackage);
// Update a package
router.put("/packages/:id", auth_middleware_1.auth, package_controller_1.PackageController.updatePackage);
// Get all packages (with query params)
router.get("/packages", auth_middleware_1.auth, package_controller_1.PackageController.getPackage);
// Get package details by ID
router.get("/packages/:id", auth_middleware_1.auth, package_controller_1.PackageController.packageDetails);
// Delete a package
router.delete("/packages/:id", auth_middleware_1.auth, package_controller_1.PackageController.deletePackage);
// Get packages by user (with query params)
router.get("/packages/user", auth_middleware_1.auth, package_controller_1.PackageController.getPackageByUser);
exports.PackageRoutes = router;
