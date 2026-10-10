
import express from "express";
import { auth, isAdminOrSuperAdmin } from "../../middleware/auth.middleware";
import {
  createProxyConnection,
  createDirectProxyConnectionService,
  validateProxyInvite,
  // acceptProxyInvite,
  requestGrantorArchive,
  getMyGrantorArchiveRequest,
  reviewGrantorArchiveRequest,
  getConnectionsForUser,
  connectionSearcher,
  acceptProxyDirectly,
  denyProxyDirectly,
  sendConnectionRequest,
} from "../connections/connection.controller";
import { get } from "mongoose";
import { requireEntitledGrantor } from "../../middleware/requireEntitledGrantor";

const connectionRoutes = express.Router();

// Route to create a proxy connection (invite)
connectionRoutes.post("/connections/proxy-invite", auth, requireEntitledGrantor, createProxyConnection);

// Route to get connection for users??
connectionRoutes.get("/connections", auth, getConnectionsForUser);

// Route to accept connection direct invite
connectionRoutes.post("/connections/setProxy", auth, acceptProxyDirectly);

// Route to deny connection direct invite
connectionRoutes.post("/connections/denyProxy", auth, denyProxyDirectly);

// Route to search proxy connection
connectionRoutes.post("/connections/search", auth, connectionSearcher);

// Route to create a direct proxy connection (direct)
connectionRoutes.post("/connections/request", auth, requireEntitledGrantor, sendConnectionRequest);

// Route to validate proxy invite token (called when user clicks email link)
connectionRoutes.get("/connections/proxy/invite/:token", validateProxyInvite);

// Route for proxy user to accept invite after authenticating (called from client after validating token)
// connectionRoutes.post("/connections/accept-proxy-invite", auth, acceptProxyInvite);

// Route for proxy user to update information on connections
// connectionRoutes.post("/connections/proxy/update", auth, updateConnectionProxyInfo)

// Route for proxy user to update preauthorized release information on connections
connectionRoutes.post("/connections/:connectionId/request-archive", auth, requestGrantorArchive);

// Route to get a specific archive request for a connection
connectionRoutes.get(
  "/connections/:connectionId/archive-request",
  auth,
  getMyGrantorArchiveRequest,
);
// Admin approves or rejects a specific request.
connectionRoutes.post(
  "/archive-requests/:requestId/review",
  auth,
  isAdminOrSuperAdmin,
  reviewGrantorArchiveRequest,
);

connectionRoutes.post("/connections/:connectionId/verify-release", auth, isAdminOrSuperAdmin, reviewGrantorArchiveRequest);



export default connectionRoutes;