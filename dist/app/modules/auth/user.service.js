"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminLoginService = exports.getUsersWhoSetMyProxyService = exports.UserAnalysisService = exports.getCountsService = exports.adminUpdateUserService = exports.updateUserService = exports.getNewUsersLast10DaysService = exports.updatePassword = exports.codeVerification = exports.adminEmailService = exports.getUsersWhoAddedMeAsProxyService = exports.getAllUserDataService = exports.getAllOwnUserDataService = exports.getUserFullProfileService = exports.getProxysetData = exports.ProxysetService = exports.searchUsersService = exports.getallUsers = exports.userSelfUpdateService = exports.adminDeleteUserService = exports.getprofileService = exports.LoginInUser = exports.existingUser = void 0;
const user_model_1 = require("./user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("./../../config/index");
const mongoose_1 = __importStar(require("mongoose"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const report_model_1 = require("../report-Information/report.model");
const financial_model_1 = require("../financial-Information/financial.model");
const medical_model_1 = require("../medical-Information/medical.model");
const homeauto_model_1 = require("../homeAuto-Information/homeauto.model");
const social_model_1 = require("../social-Information/social.model");
const user_interface_1 = require("./user.interface");
//  export const existingUser=async (phoneNumber: string, email: string, password: string) => {
//     // Check if user already exists
//     const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
//     if (user) {
//         throw new Error("User already exists");
//     }
//     const hsedpassword = await bcrypt.hash(password, 10);
//     // Create new user
//     const newUser = new User({ phoneNumber, email, password:hsedpassword });
//     await newUser.save();
//     return newUser;
// }
const existingUser = async (body) => {
    const { phoneNumber, email, password } = body;
    // Check if user already exists
    const user = await user_model_1.User.findOne({ $or: [{ phoneNumber }, { email }] });
    if (user) {
        throw new Error("User already exists");
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    // 🔹 Inline percentage calculation
    const FIELDS = [
        "firstName",
        "lastName",
        "dateOfBirth",
        "city",
        "state",
        "company",
        "yearStarted",
        "phoneNumber",
        "imgUrl"
    ];
    const filledFields = FIELDS.filter(field => {
        const value = body[field];
        if (!value)
            return false;
        if (typeof value === "string" && value.trim() === "")
            return false;
        return true;
    }).length;
    const userPercentage = Math.round((filledFields / FIELDS.length) * 100);
    // Create new user with calculated percentage
    const newUser = new user_model_1.User({
        ...body,
        password: hashedPassword,
        userPercentage: userPercentage
    });
    await newUser.save();
    return newUser;
};
exports.existingUser = existingUser;
const LoginInUser = async (email, password) => {
    // Check if user exists
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    // Check password
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid password");
    }
    const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, index_1.config.jwt_secret, { expiresIn: "30d" });
    return {
        user, token
    };
};
exports.LoginInUser = LoginInUser;
const getprofileService = async (req) => {
    try {
        let user_id = req.user?.id;
        let data = await user_model_1.User.findOne({ "_id": user_id });
        return ({ status: "success", message: "User profile successfully", data: data });
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.getprofileService = getprofileService;
const adminDeleteUserService = async (req) => {
    try {
        const adminId = req.user?.id;
        const adminRole = req.user?.role;
        const deleteUserId = req.params.id;
        // 🔐 Auth check
        if (!adminId) {
            return { status: "failed", message: "Unauthorized" };
        }
        // 🔐 Role check
        if (adminRole !== user_interface_1.Role.ADMIN) {
            return {
                status: "failed",
                message: "Only admin can delete users",
            };
        }
        if (!deleteUserId) {
            return {
                status: "failed",
                message: "User id is required",
            };
        }
        // ❌ Admin cannot delete himself
        if (adminId === deleteUserId) {
            return {
                status: "failed",
                message: "Admin cannot delete himself",
            };
        }
        const user = await user_model_1.User.findById(deleteUserId);
        if (!user) {
            return {
                status: "failed",
                message: "User not found",
            };
        }
        await user_model_1.User.deleteOne({ _id: deleteUserId });
        return {
            status: "success",
            message: "User deleted successfully",
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message,
        };
    }
};
exports.adminDeleteUserService = adminDeleteUserService;
// export const userSelfUpdateService = async (req: Request) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return {
//         status: "failed",
//         message: "Unauthorized",
//       };
//     }
//     const reqBody = { ...req.body };
//     // 🔒 STRICT: User cannot update role
//     if ("role" in reqBody) {
//       delete reqBody.role;
//     }
//     const user = await User.findById(userId);
//     if (!user) {
//       return {
//         status: "failed",
//         message: "User not found",
//       };
//     }
//     const data = await User.updateOne(
//       { _id: userId },
//       { $set: reqBody }
//     );
//     return {
//       status: "success",
//       message: "Profile updated successfully",
//       data,
//     };
//   } catch (error: any) {
//     return {
//       status: "failed",
//       message: error.message,
//     };
//   }
// };
const userSelfUpdateService = async (req) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return {
                status: "failed",
                message: "Unauthorized",
            };
        }
        const reqBody = { ...req.body };
        // 🔒 STRICT: User cannot update role
        if ("role" in reqBody) {
            delete reqBody.role;
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return {
                status: "failed",
                message: "User not found",
            };
        }
        // 🔹 Inline percentage calculation for profile fields
        const FIELDS = [
            "firstName",
            "lastName",
            "dateOfBirth",
            "city",
            "state",
            "company",
            "yearStarted",
            "imgUrl" // ✅ included
        ];
        // Merge current user data with new updates
        const mergedData = { ...user.toObject(), ...reqBody };
        const filledFields = FIELDS.filter((field) => {
            const value = mergedData[field];
            if (!value)
                return false;
            if (typeof value === "string" && value.trim() === "")
                return false;
            return true;
        }).length;
        const userPercentage = Math.round((filledFields / FIELDS.length) * 100);
        // 🔹 Add userPercentage to update
        reqBody.userPercentage = userPercentage;
        // 🔹 Update user in DB
        const data = await user_model_1.User.updateOne({ _id: userId }, { $set: reqBody });
        return {
            status: "success",
            message: "Profile updated successfully",
            data,
            userPercentage, // ✅ return updated percentage
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message,
        };
    }
};
exports.userSelfUpdateService = userSelfUpdateService;
const getallUsers = async () => {
    try {
        const users = await user_model_1.User.find();
        return ({ status: "success", Message: "Get All User Data successfully", data: users });
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.getallUsers = getallUsers;
const searchUsersService = async (searchTerm) => {
    const users = await user_model_1.User.find({
        $or: [
            { email: { $regex: searchTerm, $options: "i" } },
            { phoneNumber: { $regex: searchTerm, $options: "i" } },
        ],
    }, { _id: 1, firstName: 1, lastName: 1, email: 1, phoneNumber: 1 });
    return users;
};
exports.searchUsersService = searchUsersService;
// export const ProxysetService = async (req: Request) => {
//   try {
//     const userId = req.user?.id; 
//     const ProxysetUserId = req.params.proxysetId;
//     if (!userId || !ProxysetUserId || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ProxysetUserId)) {
//       return { status: 'failed', message: 'Invalid user or followed user ID' };
//     }
//     if (userId === ProxysetUserId) {
//       return { status: 'failed', message: "You cannot follow yourself" };
//     }
//     const ProxysetUserIdObjectId = new mongoose.Types.ObjectId(ProxysetUserId);
//     const user = await User.findById(userId);
//     if (!user) {
//       return { status: 'failed', message: 'User not found' };
//     }
//   console.log("ProxysetId:", user?.proxysetId);
//     const followedUser = await User.findById(ProxysetUserIdObjectId);
//     if (!followedUser) {
//       return { status: 'failed', message: "Followed user not found" };
//     }
//     if (user.proxysetId.length >= 2) {
//       user.proxysetId[0] = ProxysetUserIdObjectId; 
//       await user.save();
//       return { status: 'success', message: 'User followed successfully, updated first ProxySet', data: user };
//     }
//     if (user.proxysetId.includes(ProxysetUserIdObjectId)) {
//       return { status: 'failed', message: "You are already following this user" };
//     }
//     user.proxysetId.push(ProxysetUserIdObjectId);
//     await user.save();
//     return { status: 'success', message: 'User followed successfully', data: user };
//   } catch (error) {
//       return {status:'failed', data: error};
//   }
// };
const ProxysetService = async (req) => {
    try {
        const userId = req.user?.id;
        const ProxysetUserIdStr = Array.isArray(req.params.proxysetId)
            ? req.params.proxysetId[0]
            : req.params.proxysetId;
        if (!userId || !ProxysetUserIdStr || !mongoose_1.default.Types.ObjectId.isValid(userId) || !mongoose_1.default.Types.ObjectId.isValid(ProxysetUserIdStr)) {
            return { status: 'failed', message: 'Invalid user or followed user ID' };
        }
        if (userId === ProxysetUserIdStr) {
            return { status: 'failed', message: "You cannot follow yourself" };
        }
        const ProxysetUserIdObjectId = new mongoose_1.default.Types.ObjectId(ProxysetUserIdStr);
        const user = await user_model_1.User.findById(userId);
        if (!user)
            return { status: 'failed', message: 'User not found' };
        const followedUser = await user_model_1.User.findById(ProxysetUserIdObjectId);
        if (!followedUser)
            return { status: 'failed', message: "Followed user not found" };
        if (user.proxysetId.length >= 2) {
            user.proxysetId[0] = ProxysetUserIdObjectId;
            await user.save();
            return { status: 'success', message: 'User followed successfully, updated first ProxySet', data: user };
        }
        if (user.proxysetId.includes(ProxysetUserIdObjectId)) {
            return { status: 'failed', message: "You are already following this user" };
        }
        user.proxysetId.push(ProxysetUserIdObjectId);
        await user.save();
        return { status: 'success', message: 'User followed successfully', data: user };
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.ProxysetService = ProxysetService;
const getProxysetData = async (userId) => {
    try {
        const user = await user_model_1.User.aggregate([
            {
                $match: {
                    _id: new mongoose_1.default.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "proxysetId",
                    foreignField: "_id",
                    as: "proxysetDetails",
                },
            },
            {
                $project: {
                    _id: 0,
                    proxysetDetails: {
                        email: 1,
                        phoneNumber: 1,
                        imgUrl: 1,
                        role: 1,
                        followers: 1,
                    },
                },
            },
        ]);
        if (user.length === 0) {
            return { status: "failed", message: "User not found" };
        }
        return { status: "success", data: user[0] };
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.getProxysetData = getProxysetData;
const getUserFullProfileService = async (userId) => {
    const result = await user_model_1.User.aggregate([
        {
            $match: { _id: new mongoose_1.Types.ObjectId(userId) },
        },
        {
            $lookup: {
                from: "financials",
                localField: "_id",
                foreignField: "userID",
                as: "financialInfo",
            },
        },
        {
            $lookup: {
                from: "socialinfos",
                localField: "_id",
                foreignField: "userID",
                as: "socialInfo",
            },
        },
        {
            $lookup: {
                from: "homeautos",
                localField: "_id",
                foreignField: "userID",
                as: "homeAutoInfo",
            },
        },
        {
            $lookup: {
                from: "medicals",
                localField: "_id",
                foreignField: "userID",
                as: "medicalsInfo",
            },
        },
        {
            $project: {
                _id: 0,
                name: 1,
                email: 1,
                financialPercentage: { $arrayElemAt: ["$financialInfo.financialPercentage", 0] },
                socialInfo: { $arrayElemAt: ["$socialInfo.socialInfoPercentage", 0] },
                homeAutoInfo: { $arrayElemAt: ["$homeAutoInfo.homeautoPercentage", 0] },
                medicalsInfo: { $arrayElemAt: ["$medicalsInfo.medicalsPercentage", 0] },
            },
        },
    ]);
    return result[0] || null;
};
exports.getUserFullProfileService = getUserFullProfileService;
//proxysetId  data 
const getAllOwnUserDataService = async (loggedInUserId) => {
    const user = await user_model_1.User.findById(loggedInUserId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const [homeauto, medical, financial, socialInfo,] = await Promise.all([
        homeauto_model_1.HomeAutoModel.find({ userID: loggedInUserId }),
        medical_model_1.MedicalModel.find({ userID: loggedInUserId }),
        financial_model_1.FinancialModel.find({ userID: loggedInUserId }),
        social_model_1.SocialInfoModel.find({ userID: loggedInUserId }),
        // User.find({ userID: loggedInUserId }),
    ]);
    // 🔢 Calculate percentages
    const homeautoPercentage = homeauto.reduce((sum, item) => sum + (item.homeautoPercentage || 0), 0);
    const medicalPercentage = medical.reduce((sum, item) => sum + (item.medicalsPercentage || 0), 0);
    const financialPercentage = financial.reduce((sum, item) => sum + (item.financialPercentage || 0), 0);
    const socialInfoPercentage = socialInfo.reduce((sum, item) => sum + (item.socialInfoPercentage || 0), 0);
    // userPercentage runtime only
    const userPercentage = user.userPercentage || 0;
    const totalPercentage = homeautoPercentage +
        medicalPercentage +
        financialPercentage +
        socialInfoPercentage + userPercentage;
    // 💡 Suggestion logic (3 suggestions for every case)
    let suggestions = [];
    if (totalPercentage === 100) {
        suggestions = [
            "Profile is fully completed",
            "You can now access all features without any limitation",
            "Keep your profile updated for better experience"
        ];
    }
    else if (totalPercentage >= 71) {
        suggestions = [
            "Your profile is almost completed",
            "Complete remaining sections to reach 100%",
            "Review and submit missing information"
        ];
    }
    else if (totalPercentage >= 41) {
        suggestions = [
            "Your profile is partially completed",
            "Add more information to improve profile strength",
            "Completing all sections helps better service"
        ];
    }
    else {
        suggestions = [
            "Your profile is very incomplete",
            "Please start adding your personal information",
            "Completing your profile unlocks more features"
        ];
    }
    return { user, homeauto, medical, financial, socialInfo, percentages: {
            homeautoPercentage,
            medicalPercentage,
            financialPercentage,
            socialInfoPercentage,
            userPercentage,
            totalPercentage
        }, suggestions };
};
exports.getAllOwnUserDataService = getAllOwnUserDataService;
const getAllUserDataService = async (requestedUserId, loggedInUserId) => {
    const user = await user_model_1.User.findById(requestedUserId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const isOwnData = requestedUserId.toString() === loggedInUserId.toString();
    const isProxyUser = user.proxysetId.some((id) => id.toString() === loggedInUserId.toString());
    if (!isOwnData && !isProxyUser)
        throw new Error("ACCESS_DENIED");
    const [homeauto, medical, financial, socialInfo] = await Promise.all([
        homeauto_model_1.HomeAutoModel.find({ userID: user._id }),
        medical_model_1.MedicalModel.find({ userID: user._id }),
        financial_model_1.FinancialModel.find({ userID: user._id }),
        social_model_1.SocialInfoModel.find({ userID: user._id }),
    ]);
    return {
        user,
        homeauto,
        medical,
        financial,
        socialInfo
    };
};
exports.getAllUserDataService = getAllUserDataService;
const getUsersWhoAddedMeAsProxyService = async (myUserId) => {
    const users = await user_model_1.User.find({
        proxysetId: myUserId
    })
        .select("_id firstName lastName email imgUrl role");
    return users;
};
exports.getUsersWhoAddedMeAsProxyService = getUsersWhoAddedMeAsProxyService;
//admin routes
const adminEmailService = async (req) => {
    try {
        let { email } = req.body;
        let code = Math.floor(100000 + Math.random() * 900000);
        let EmailTo = email;
        let EmailText = `Your code is= ${code}`;
        let EmailSubject = `PlainB E-commerce Website Email Verification Code `;
        await (0, emailHelper_1.SendEmail)(EmailTo, EmailText, EmailSubject);
        await user_model_1.User.updateOne({ email: email }, { otp: code }, { upsert: true });
        return { status: "success", message: "6 digit code send successfully" };
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.adminEmailService = adminEmailService;
const codeVerification = async (email, code) => {
    const user = await user_model_1.User.findOne({ email: email, otp: code });
    if (!user) {
        throw new Error("User not found");
    }
    if (user.otp !== code) {
        throw new Error("Invalid code");
    }
    return { message: "Code verified successfully" };
};
exports.codeVerification = codeVerification;
const updatePassword = async (email, password) => {
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const user = await user_model_1.User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });
    if (!user) {
        throw new Error("User not found");
    }
    return { message: "Password updated successfully" };
};
exports.updatePassword = updatePassword;
// export const getUserList = async (
//   pageNo: number,
//   perPage: number,
//   searchKeyword: string
// ) => {
//   const skipRow = (pageNo - 1) * perPage;
//   let data;
//   if (searchKeyword !== "0") {
//     const searchRegex = { $regex: searchKeyword, $options: "i" };
//     const searchQuery = {
//       $or: [
//         { firstName: searchRegex },
//         { lastName: searchRegex },
//         { email: searchRegex },
//         { phoneNumber: searchRegex },
//         { company: searchRegex },
//       ],
//     };
//     const pipeline: PipelineStage[] = [
//       {
//         $facet: {
//           Total: [{ $match: searchQuery }, { $count: "count" }],
//           Rows: [{ $match: searchQuery }, { $skip: skipRow }, { $limit: perPage }],
//         },
//       },
//     ];
//     data = await User.aggregate(pipeline);
//   } else {
//     const pipeline: PipelineStage[] = [
//       {
//         $facet: {
//           Total: [{ $count: "count" }],
//           Rows: [{ $skip: skipRow }, { $limit: perPage }],
//         },
//       },
//     ];
//     data = await User.aggregate(pipeline);
//   }
//   return data;
// };
const getNewUsersLast10DaysService = async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const count = await user_model_1.User.countDocuments({
        createdAt: { $gte: tenDaysAgo },
    });
    return count;
};
exports.getNewUsersLast10DaysService = getNewUsersLast10DaysService;
const updateUserService = async (req) => {
    try {
        let user_id = req.params.id;
        let requestBody = req.body;
        await user_model_1.User.updateOne({ _id: user_id }, requestBody, { upsert: true });
        return ({ status: true, message: "User Update successfully" });
    }
    catch (error) {
        return { status: false, data: error };
    }
};
exports.updateUserService = updateUserService;
const adminUpdateUserService = async (req) => {
    try {
        const adminId = req.user?.id;
        const adminRole = req.user?.role;
        const userId = req.params.id;
        // 🔐 Auth check
        if (!adminId) {
            return { status: "failed", message: "Unauthorized" };
        }
        // 🔐 Admin check
        if (adminRole !== user_interface_1.Role.ADMIN) {
            return {
                status: "failed",
                message: "Only admin can update user",
            };
        }
        if (!userId) {
            return {
                status: "failed",
                message: "User id is required",
            };
        }
        const reqBody = { ...req.body }; // ✅ ALL fields allowed
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return {
                status: "failed",
                message: "User not found",
            };
        }
        const data = await user_model_1.User.updateOne({ _id: userId }, { $set: reqBody });
        return {
            status: "success",
            message: "User updated successfully",
            data,
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message,
        };
    }
};
exports.adminUpdateUserService = adminUpdateUserService;
const getCountsService = async (req) => {
    try {
        const days = Number(req.query.days) || 30;
        // Last N days
        const nDaysAgo = new Date();
        nDaysAgo.setDate(nDaysAgo.getDate() - days);
        // Last Month Range
        const startOfLastMonth = new Date();
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1, 1);
        startOfLastMonth.setHours(0, 0, 0, 0);
        const endOfLastMonth = new Date();
        endOfLastMonth.setDate(0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        // Current month range
        const startOfThisMonth = new Date();
        startOfThisMonth.setDate(1);
        startOfThisMonth.setHours(0, 0, 0, 0);
        const endOfThisMonth = new Date();
        endOfThisMonth.setHours(23, 59, 59, 999);
        const [totalUsers, newUsersLastNDays, lastMonthUsers, currentMonthUsers, totalReports] = await Promise.all([
            user_model_1.User.countDocuments(),
            user_model_1.User.countDocuments({ createdAt: { $gte: nDaysAgo } }),
            user_model_1.User.countDocuments({
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
            }),
            user_model_1.User.countDocuments({
                createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth }
            }),
            report_model_1.ReportModel.countDocuments()
        ]);
        const calculatePercentage = (current, previous) => {
            if (previous === 0)
                return 100;
            return ((current - previous) / previous) * 100;
        };
        const newUsersPercent = parseFloat(calculatePercentage(newUsersLastNDays, lastMonthUsers).toFixed(2));
        const activeUsersPercent = parseFloat(calculatePercentage(currentMonthUsers, lastMonthUsers).toFixed(2));
        // Example: inactive users = total - active
        const inactiveUsers = totalUsers - currentMonthUsers;
        const inactiveUsersPercent = parseFloat(calculatePercentage(inactiveUsers, lastMonthUsers - currentMonthUsers).toFixed(2));
        return {
            status: true,
            data: {
                totalUsers,
                newUsersLastNDays,
                newUsersPercent,
                currentMonthUsers,
                activeUsersPercent,
                inactiveUsers,
                inactiveUsersPercent,
                totalReports
            }
        };
    }
    catch (error) {
        return { status: false, data: error };
    }
};
exports.getCountsService = getCountsService;
class UserAnalysisService {
    // Daily analysis (last 7 days)
    static async getDailyAnalysis() {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const data = await user_model_1.User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo, $lte: today }
                }
            },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 2 = Monday...
                    users: { $sum: 1 }
                }
            }
        ]);
        // Map numbers to weekday names
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result = weekdays.map((day, index) => {
            const found = data.find(d => d._id === index + 1);
            return { name: day, users: found ? found.users : 0 };
        });
        return result;
    }
    // Monthly analysis (last 12 months)
    static async getMonthlyAnalysis() {
        const today = new Date();
        const lastYear = new Date();
        lastYear.setFullYear(today.getFullYear() - 1);
        const data = await user_model_1.User.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastYear, $lte: today }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    users: { $sum: 1 }
                }
            }
        ]);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = months.map((month, index) => {
            const found = data.find(d => d._id === index + 1);
            return { name: month, users: found ? found.users : 0 };
        });
        return result;
    }
    // Yearly analysis (last 5 years)
    static async getYearlyAnalysis() {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4; // last 5 years
        const data = await user_model_1.User.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(`${startYear}-01-01`), $lte: new Date() }
                }
            },
            {
                $group: {
                    _id: { $year: "$createdAt" },
                    users: { $sum: 1 }
                }
            }
        ]);
        const result = [];
        for (let year = startYear; year <= currentYear; year++) {
            const found = data.find(d => d._id === year);
            result.push({ name: year.toString(), users: found ? found.users : 0 });
        }
        return result;
    }
}
exports.UserAnalysisService = UserAnalysisService;
const getUsersWhoSetMyProxyService = async (myUserId) => {
    try {
        const objectId = new mongoose_1.Types.ObjectId(myUserId);
        const users = await user_model_1.User.find({ proxysetId: objectId }, { _id: 1, email: 1, phoneNumber: 1, firstName: 1, lastName: 1 }).sort({ createdAt: -1 });
        const proxyUsers = users.map(user => ({
            _id: user._id.toString(),
            email: user.email,
            phoneNumber: user.phoneNumber,
            firstName: user.firstName,
            lastName: user.lastName,
        }));
        return {
            status: true,
            data: proxyUsers
        };
    }
    catch (error) {
        return {
            status: false,
            data: []
        };
    }
};
exports.getUsersWhoSetMyProxyService = getUsersWhoSetMyProxyService;
//end admin login 
const adminLoginService = async (email, password) => {
    // user exists check
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        throw new Error("User not found");
    }
    // ❌ only admin allowed
    if (user.role !== user_interface_1.Role.ADMIN) {
        throw new Error("Access denied. Only admin can login.");
    }
    // password check
    const isPasswordMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error("Invalid password");
    }
    // token generate
    const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role, name: `${user.firstName ?? ""} ${user.lastName ?? ""}` }, index_1.config.jwt_secret, { expiresIn: "30d" });
    return { user, token };
};
exports.adminLoginService = adminLoginService;
