
import express from "express";
import { auth } from "../../middleware/auth.middleware";
import {
  createProxyConnection,
  createDirectProxyConnectionService,
  validateProxyInvite,
  // acceptProxyInvite,
  requestEmergencyRelease,
  verifyEmergencyRelease,
  updateConnectionProxyInfo,
  getConnectionsForUser,
  connectionSearcher,
  acceptProxyDirectly,
  denyProxyDirectly,
  sendConnectionRequest,
} from "../connections/connection.controller";
import { get } from "mongoose";

const connectionRoutes = express.Router();

// Route to create a proxy connection (invite)
connectionRoutes.post("/connections/proxy-invite", auth, createProxyConnection);

// Route to get connection for users??
connectionRoutes.get("/connections", auth, getConnectionsForUser);

// Route to accept connection direct invite
connectionRoutes.post("/connections/setProxy", auth, acceptProxyDirectly);

// Route to deny connection direct invite
connectionRoutes.post("/connections/denyProxy", auth, denyProxyDirectly);

// Route to search proxy connection
connectionRoutes.post("/connections/search", auth, connectionSearcher);

// Route to create a direct proxy connection (direct)
connectionRoutes.post("/connections/request", auth, sendConnectionRequest);

// Route to validate proxy invite token (called when user clicks email link)
connectionRoutes.get("/connections/proxy/invite/:token", validateProxyInvite);

// Route for proxy user to accept invite after authenticating (called from client after validating token)
// connectionRoutes.post("/connections/accept-proxy-invite", auth, acceptProxyInvite);

// Route for proxy user to update information on connections
connectionRoutes.post("/connections/proxy/update", auth, updateConnectionProxyInfo)


connectionRoutes.post("/connections/:connectionId/request-release", requestEmergencyRelease);

connectionRoutes.post("/connections/:connectionId/verify-release", verifyEmergencyRelease);

export default connectionRoutes;