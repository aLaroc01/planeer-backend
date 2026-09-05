"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCorporate = exports.isAdmin = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const user_model_1 = require("../modules/auth/user.model");
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt_secret);
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = {
            id: user._id,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`.trim()
        };
        next();
    }
    catch (error) {
        return res.status(403).json({ message: "Invalid token" });
    }
};
exports.auth = auth;
const isAdmin = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};
exports.isAdmin = isAdmin;
const isCorporate = (req, res, next) => {
    if (req.user?.role !== "corporate") {
        return res.status(403).json({ message: "Access denied. Corporate users only." });
    }
    next();
};
exports.isCorporate = isCorporate;
