"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("./user.controller");
const auth_middleware_1 = require("./../../middleware/auth.middleware");
const router = express_1.default.Router();
// User Registration 
router.post("/registerUser", user_controller_1.registerUser);
// User  Login
router.post("/login", user_controller_1.loginUser);
// User ProfileDetails
router.get("/ProfileDetails", auth_middleware_1.auth, user_controller_1.GetProfileData);
// User Profile Update
router.put("/ProfileUpdate", auth_middleware_1.auth, user_controller_1.userSelfUpdate);
// Get All User Profile
router.get("/GetAllProfile", auth_middleware_1.auth, user_controller_1.GetAllProfile);
// GET request route for search
router.get("/search", auth_middleware_1.auth, user_controller_1.searchUsersController);
router.get("/alldata-percentage/:userId", auth_middleware_1.auth, user_controller_1.alldatapercentage);
// proxyset user
router.post("/proxyset/:proxysetId", auth_middleware_1.auth, user_controller_1.ProxysetController);
router.get("/getAllProxyset/:id", auth_middleware_1.auth, user_controller_1.getAllProxysetController);
// GET all user data (HomeAuto + Medical + Financial)
router.get("/proxyset-call-api/:userId", auth_middleware_1.auth, user_controller_1.getAllUserDataController);
router.get("/alluser-data", auth_middleware_1.auth, user_controller_1.getAllOwnUserDataController);
//all proxyset set user
router.get("/alluser-set-data", auth_middleware_1.auth, user_controller_1.getUsersWhoAddedMeAsProxyController);
// GET /api/users/my-proxy-users?userId=...
router.get("/my-proxy-users", auth_middleware_1.auth, user_controller_1.getUsersWhoSetMyProxy);
//admin routes
// admin Registration 
router.post("/adminregister", user_controller_1.registerUser);
// admin  routes
router.post("/adminlogin", user_controller_1.adminLoginController);
// admin  routes
router.post("/AdminEmail", user_controller_1.AdminEmail);
// codeverify  routes
router.post("/codeverify", user_controller_1.codeverify);
// codeverify  routes
router.post("/forgetPassword", user_controller_1.forgetPassword);
// User List with Pagination
// router.get("/pagenationlist/:pageNo/:perPage/:searchKeyword",auth,isAdmin, UserList);
router.get("/pagenationlist", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.UserList);
// New Users in Last 10 Days
router.get("/new-user-last", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.getNewUsersLast10Days);
// Update User by Admin
router.put("/updateUser/:id", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.updateUserController);
// User Analysis
router.get("/users/analysis", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.UserAnalysisController.getAnalysis);
//count
router.get("/counts-user-report", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.getCounts);
router.delete("/deleteUser/:id", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.adminDeleteUser);
// User Profile Update
router.put("/adminUpdateUser/:id", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.adminUpdateUser);
// system performance api 
router.get("/performance", auth_middleware_1.auth, auth_middleware_1.isAdmin, user_controller_1.getSystemPerformance);
exports.userRoutes = router;
