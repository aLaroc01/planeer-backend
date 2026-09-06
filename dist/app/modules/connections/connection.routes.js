"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const connection_controller_1 = require("../connections/connection.controller");
const connectionRoutes = express_1.default.Router();
// Route to create a proxy connection (invite)
connectionRoutes.post("/connections/proxy-invite", auth_middleware_1.auth, connection_controller_1.createProxyConnection);
// Route to get connection for users??
connectionRoutes.get("/connections", auth_middleware_1.auth, connection_controller_1.getConnectionsForUser);
// Route to accept connection direct invite
connectionRoutes.post("/connections/setProxy", auth_middleware_1.auth, connection_controller_1.acceptProxyDirectly);
// Route to deny connection direct invite
connectionRoutes.post("/connections/denyProxy", auth_middleware_1.auth, connection_controller_1.denyProxyDirectly);
// Route to search proxy connection
connectionRoutes.post("/connections/search", auth_middleware_1.auth, connection_controller_1.connectionSearcher);
// Route to create a direct proxy connection (direct)
connectionRoutes.post("/connections/request", auth_middleware_1.auth, connection_controller_1.sendConnectionRequest);
// Route to validate proxy invite token (called when user clicks email link)
connectionRoutes.get("/connections/proxy/invite/:token", connection_controller_1.validateProxyInvite);
// Route for proxy user to accept invite after authenticating (called from client after validating token)
// connectionRoutes.post("/connections/accept-proxy-invite", auth, acceptProxyInvite);
// Route for proxy user to update information on connections
connectionRoutes.post("/connections/proxy/update", auth_middleware_1.auth, connection_controller_1.updateConnectionProxyInfo);
connectionRoutes.post("/connections/:connectionId/request-release", connection_controller_1.requestEmergencyRelease);
connectionRoutes.post("/connections/:connectionId/verify-release", connection_controller_1.verifyEmergencyRelease);
exports.default = connectionRoutes;
