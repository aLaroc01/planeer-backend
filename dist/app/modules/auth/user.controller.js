"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUser = exports.getSystemPerformance = exports.adminLoginController = exports.getUsersWhoSetMyProxy = exports.getUsersWhoAddedMeAsProxyController = exports.getAllUserDataController = exports.getAllOwnUserDataController = exports.UserAnalysisController = exports.getCounts = exports.updateUserController = exports.getNewUsersLast10Days = exports.UserList = exports.forgetPassword = exports.codeverify = exports.AdminEmail = exports.alldatapercentage = exports.getAllProxysetController = exports.ProxysetController = exports.searchUsersController = exports.GetAllProfile = exports.adminDeleteUser = exports.userSelfUpdate = exports.GetProfileData = exports.loginUser = exports.registerUser = void 0;
const user_service_1 = require("./user.service");
const user_model_1 = require("./user.model");
const successLogger_1 = require("../../../helpers/successLogger");
const logger_1 = __importDefault(require("../../../helpers/logger"));
const errorCounter_1 = require("../../../helpers/errorCounter");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("./../../config/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const registerUser = async (req, res, next) => {
    try {
        const user = await (0, user_service_1.existingUser)(req.body);
        // password get করা
        const { password } = req.body;
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid password");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, index_1.config.jwt_secret, { expiresIn: "1d" });
        (0, successLogger_1.logSuccess)(req, "User registered successfully", { userId: user._id, email: user.email });
        return res.status(201).json({ success: true, message: "User registered successfully", statusCode: 201, data: { _id: user._id, phoneNumber: user.phoneNumber, email: user.email, role: user.role, userPercentage: user.userPercentage, token: token }, meta: null });
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const { user, token } = await (0, user_service_1.LoginInUser)(email, password);
        // 🔹 Success log
        (0, successLogger_1.logSuccess)(req, "User logged in successfully", { userId: user._id, email: user.email });
        return res.status(200).json({ success: true, message: "User logged in successfully", statusCode: 200, data: { _id: user._id, phoneNumber: user.phoneNumber, email: user.email, role: user.role, token: token },
            meta: null
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const GetProfileData = async (req, res, next) => {
    let result = await (0, user_service_1.getprofileService)(req);
    // 🔹 Success log
    (0, successLogger_1.logSuccess)(req, "Fetched user profile");
    res.json(result);
};
exports.GetProfileData = GetProfileData;
const userSelfUpdate = async (req, res) => {
    const result = await (0, user_service_1.userSelfUpdateService)(req);
    if (result.status === "success") {
        (0, successLogger_1.logSuccess)(req, "User updated own profile", {
            userId: req.user?.id,
        });
    }
    res.json(result);
};
exports.userSelfUpdate = userSelfUpdate;
const adminDeleteUser = async (req, res) => {
    const result = await (0, user_service_1.adminDeleteUserService)(req);
    if (result.status === "success") {
        (0, successLogger_1.logSuccess)(req, "Admin deleted a user", {
            adminId: req.user?.id,
            deletedUserId: req.params.id,
        });
    }
    res.json(result);
};
exports.adminDeleteUser = adminDeleteUser;
const GetAllProfile = async (req, res) => {
    let result = await (0, user_service_1.getallUsers)();
    res.json(result);
};
exports.GetAllProfile = GetAllProfile;
const searchUsersController = async (req, res, next) => {
    const searchTerm = req.query.searchTerm;
    if (!searchTerm || typeof searchTerm !== "string") {
        return res.status(400).json({ message: "Search term is required and must be a string" });
    }
    try {
        const users = await (0, user_service_1.searchUsersService)(searchTerm);
        if (!users || users.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        // 🔹 Success log
        (0, successLogger_1.logSuccess)(req, "Search users successfully", { searchTerm, count: users.length });
        return res.status(200).json({
            status: "success",
            message: "Search results successfully fetched",
            data: users,
        });
    }
    catch (error) {
        return res.status(500).json({ status: "failed", data: error });
    }
};
exports.searchUsersController = searchUsersController;
const ProxysetController = async (req, res) => {
    const result = await (0, user_service_1.ProxysetService)(req);
    (0, successLogger_1.logSuccess)(req, "Proxy set fetched successfully");
    return res.json(result);
};
exports.ProxysetController = ProxysetController;
// export const getAllProxysetController = async (req: Request, res: Response) => {
//   const { id } = req.params; 
//   const result = await getProxysetData(id);
//   logSuccess(req, "User updated successfully", { userId: req.user?.id || req.params.id });
//   return res.json(result);
// };
const getAllProxysetController = async (req, res) => {
    // ✅ Convert id safely
    const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await (0, user_service_1.getProxysetData)(idStr);
    (0, successLogger_1.logSuccess)(req, "User updated successfully", { userId: req.user?.id ?? idStr });
    return res.json(result);
};
exports.getAllProxysetController = getAllProxysetController;
// export const alldatapercentage = async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const userProfile = await getUserFullProfileService(userId);
//     // 🔹 Success log
//     logSuccess(req, "Fetched full user profile", { userId });
//     if (!userProfile) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     return res.status(200).json({
//       success: true,
//       data: userProfile,
//     });
//   } catch (error) {
//     console.error("Error fetching user profile:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };
const alldatapercentage = async (req, res) => {
    try {
        // ✅ Handle string | string[] safely
        const userId = Array.isArray(req.params.userId)
            ? req.params.userId[0]
            : req.params.userId;
        const userProfile = await (0, user_service_1.getUserFullProfileService)(userId);
        // 🔹 Success log
        (0, successLogger_1.logSuccess)(req, "Fetched full user profile", { userId });
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            data: userProfile,
        });
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.alldatapercentage = alldatapercentage;
// Example: Admin Email
const AdminEmail = async (req, res, next) => {
    try {
        const result = await (0, user_service_1.adminEmailService)(req);
        (0, successLogger_1.logSuccess)(req, "Admin email fetched");
        res.json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.AdminEmail = AdminEmail;
const codeverify = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and otp are required" });
        }
        const result = await (0, user_service_1.codeVerification)(email, otp);
        (0, successLogger_1.logSuccess)(req, "OTP code verified", { email });
        return res.json({ status: "success", message: result.message });
    }
    catch (error) {
        next(error);
    }
};
exports.codeverify = codeverify;
const forgetPassword = async (req, res, next) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and new password are required" });
        }
        // If OTP is "0" or not provided, skip verification
        if (otp !== "0" && otp) {
            const result = await (0, user_service_1.codeVerification)(email, otp);
            if (result.message !== "Code verified successfully") {
                return res.status(400).json({ message: result.message });
            }
        }
        await (0, user_service_1.updatePassword)(email, password);
        (0, successLogger_1.logSuccess)(req, "User password updated", { email });
        return res.json({ status: "success", message: "Password updated successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.forgetPassword = forgetPassword;
const UserList = async (req, res) => {
    try {
        const pageNo = Number(req.query.pageNo) || 1;
        const perPage = Number(req.query.perPage) || 10;
        const searchKeyword = req.query.searchKeyword || "";
        let matchStage = {};
        let addFieldsStage = {};
        if (searchKeyword && searchKeyword !== "0") {
            const regex = new RegExp(searchKeyword, "i");
            addFieldsStage = {
                isMatched: {
                    $cond: [
                        {
                            $or: [
                                { $regexMatch: { input: "$firstName", regex } },
                                { $regexMatch: { input: "$lastName", regex } },
                                { $regexMatch: { input: "$email", regex } },
                                { $regexMatch: { input: "$phoneNumber", regex } },
                                { $regexMatch: { input: "$company", regex } },
                            ],
                        },
                        1,
                        0,
                    ],
                },
            };
        }
        else {
            addFieldsStage = { isMatched: 0 };
        }
        const total = await user_model_1.User.countDocuments();
        const users = await user_model_1.User.aggregate([
            { $addFields: addFieldsStage },
            { $sort: { isMatched: -1, createdAt: -1 } },
            { $skip: (pageNo - 1) * perPage },
            { $limit: perPage },
        ]);
        res.status(200).json({
            status: "success",
            data: {
                total,
                rows: users,
                currentPage: pageNo,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        });
    }
    catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message,
        });
    }
};
exports.UserList = UserList;
const getNewUsersLast10Days = async (req, res) => {
    try {
        const newUserCount = await (0, user_service_1.getNewUsersLast10DaysService)();
        return res.status(200).json({
            success: true,
            message: "Last 10 days new user count fetched successfully",
            count: newUserCount,
        });
    }
    catch (error) {
        console.error("Error counting last 10 days users:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while counting last 10 days users",
        });
    }
};
exports.getNewUsersLast10Days = getNewUsersLast10Days;
const updateUserController = async (req, res) => {
    let result = await (0, user_service_1.updateUserService)(req);
    res.json(result);
};
exports.updateUserController = updateUserController;
const getCounts = async (req, res) => {
    try {
        const result = await (0, user_service_1.getCountsService)(req);
        if (result.status) {
            res.status(200).json({ status: "success", data: result.data });
        }
        else {
            res.status(500).json({ status: "error", message: "Failed to fetch counts", error: result.data });
        }
    }
    catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
};
exports.getCounts = getCounts;
class UserAnalysisController {
    static async getAnalysis(req, res) {
        try {
            const daily = await user_service_1.UserAnalysisService.getDailyAnalysis();
            const monthly = await user_service_1.UserAnalysisService.getMonthlyAnalysis();
            const yearly = await user_service_1.UserAnalysisService.getYearlyAnalysis();
            res.json({
                success: true,
                daily,
                monthly,
                yearly
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
}
exports.UserAnalysisController = UserAnalysisController;
//proxysetId  data 
// export const getAllOwnUserDataController = async (req: Request, res: Response) => {
//   try {
//     const loggedInUserId = req.user?.id;
//     const data = await getAllOwnUserDataService(loggedInUserId);
//     res.status(200).json({
//       success: true,
//       data
//     });
//   } catch (error: any) {
//     if (error.message === "USER_NOT_FOUND") {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
const getAllOwnUserDataController = async (req, res) => {
    try {
        // ✅ Handle string | string[] safely
        const loggedInUserId = Array.isArray(req.user?.id)
            ? req.user?.id[0]
            : req.user?.id || "";
        if (!loggedInUserId) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }
        const data = await (0, user_service_1.getAllOwnUserDataService)(loggedInUserId);
        res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getAllOwnUserDataController = getAllOwnUserDataController;
const getAllUserDataController = async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedInUserId = req.user?.id;
        // 🔒 userId validation
        if (!userId || Array.isArray(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id"
            });
        }
        // 🔒 logged in user check
        if (!loggedInUserId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const data = await (0, user_service_1.getAllUserDataService)(userId, loggedInUserId);
        return res.status(200).json({
            success: true,
            data
        });
    }
    catch (error) {
        if (error.message === "ACCESS_DENIED") {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }
        if (error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
exports.getAllUserDataController = getAllUserDataController;
// export const getAllUserDataController = async (req: Request, res: Response) => {
//   try {
//     const requestedUserId = req.params.userId;
//     const loggedInUserId = req.user?.id; 
//     const data = await getAllUserDataService(requestedUserId, loggedInUserId);
//     res.status(200).json({
//       success: true,
//       data
//     });
//   } catch (error: any) {
//     if (error.message === "ACCESS_DENIED") {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }
//     if (error.message === "USER_NOT_FOUND") {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
const getUsersWhoAddedMeAsProxyController = async (req, res) => {
    try {
        const myUserId = req.user?.id;
        const users = await (0, user_service_1.getUsersWhoAddedMeAsProxyService)(myUserId);
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
exports.getUsersWhoAddedMeAsProxyController = getUsersWhoAddedMeAsProxyController;
const getUsersWhoSetMyProxy = async (req, res) => {
    try {
        const myUserId = req.user?.id;
        if (!myUserId) {
            res.status(401).json({
                status: "error",
                message: "Unauthorized"
            });
            return;
        }
        const result = await (0, user_service_1.getUsersWhoSetMyProxyService)(myUserId);
        if (!result.status) {
            res.status(500).json({
                status: "error",
                message: "Failed to fetch users"
            });
            return;
        }
        res.status(200).json({
            status: "success",
            total: result.data.length,
            data: result.data
        });
        // এখানে আর return করা হয়নি → void safe
    }
    catch (err) {
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
};
exports.getUsersWhoSetMyProxy = getUsersWhoSetMyProxy;
const adminLoginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }
        const { user, token } = await (0, user_service_1.adminLoginService)(email, password);
        (0, successLogger_1.logSuccess)(req, "Admin logged in successfully", { userId: user._id, email });
        return res.status(200).json({
            success: true,
            message: "Admin logged in successfully",
            statusCode: 200,
            data: {
                _id: user._id,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                token,
            },
            meta: null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.adminLoginController = adminLoginController;
const getSystemPerformance = async (req, res, next) => {
    try {
        const memoryUsage = process.memoryUsage(); // memory info
        const uptime = process.uptime(); // seconds
        const cpuUsage = process.cpuUsage(); // microseconds
        const performanceData = {
            memory: {
                rss: memoryUsage.rss,
                heapTotal: memoryUsage.heapTotal,
                heapUsed: memoryUsage.heapUsed,
                external: memoryUsage.external,
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system,
            },
            uptime: `${Math.floor(uptime)}s`,
            timestamp: new Date(),
        };
        // 🔹 Success log
        (0, successLogger_1.logSuccess)(req, "System performance fetched successfully", performanceData);
        res.status(200).json({
            status: "success",
            message: "System performance fetched successfully",
            data: performanceData,
            meta: {
                totalErrors: (0, errorCounter_1.getErrorCount)(), // এখন পর্যন্ত কতবার error হয়েছে
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        (0, errorCounter_1.incrementErrorCount)(); // 🔹 error count বৃদ্ধি
        logger_1.default.error("Error fetching system performance", {
            error: error.message,
            stack: error.stack,
            route: req.originalUrl,
            method: req.method,
        });
        res.status(500).json({
            status: "error",
            message: "Internal Server Error",
            meta: {
                timestamp: new Date(),
                errorStack: process.env.NODE_ENV === "production" ? undefined : error.stack,
            },
        });
    }
};
exports.getSystemPerformance = getSystemPerformance;
const adminUpdateUser = async (req, res) => {
    const result = await (0, user_service_1.adminUpdateUserService)(req);
    if (result.status === "success") {
        (0, successLogger_1.logSuccess)(req, "Admin updated user data", {
            adminId: req.user?.id,
            updatedUserId: req.params.id,
        });
    }
    res.json(result);
};
exports.adminUpdateUser = adminUpdateUser;
