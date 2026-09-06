"use strict";
// // "use strict";
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
exports.adminLoginService = exports.getUsersWhoSetMyProxyService = exports.UserAnalysisService = exports.getCountsService = exports.adminUpdateUserService = exports.updateUserService = exports.getNewUsersLast10DaysService = exports.getUserList = exports.updatePassword = exports.codeVerification = exports.verifyProxyOtp = exports.resetPasswordService = exports.verifyOtpService = exports.sendForgotPasswordEmail = exports.adminEmailService = exports.getUsersWhoAddedMeAsProxyService = exports.getAllUserDataService = exports.getAllOwnUserDataService = exports.getUserFullProfileService = exports.getProxysetData = exports.ProxysetService = exports.searchUsersService = exports.getallUsers = exports.createEmptyProfileForSignedInUser = exports.userSelfUpdateService = exports.adminDeleteUserService = exports.getprofileService = exports.LoginInUser = exports.existingUser = void 0;
const user_model_1 = require("./user.model");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../../config/index");
const mongoose_1 = __importStar(require("mongoose"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const report_model_1 = require("../report-Information/report.model");
const financial_model_1 = require("../financial-Information/financial.model");
const medical_model_1 = require("../../modules/medical-Information/medical.model");
const homeauto_model_1 = require("../homeAuto-Information/homeauto.model");
const personal_model_1 = require("../../modules/personal-Information/personal.model");
const profile_model_1 = require("../Profile-Information/profile.model");
const social_model_1 = require("../../modules/social-Information/social.model");
const user_interface_1 = require("./user.interface");
const auditLog_model_1 = require("../audit-log/auditLog.model");
const auditLog_interface_1 = require("../audit-log/auditLog.interface");
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
    // const userPercentage = Math.round((filledFields / FIELDS.length) * 100);
    // Create new user with calculated percentage
    const newUser = new user_model_1.User({
        ...body,
        password: hashedPassword,
        // userPercentage: userPercentage
    });
    await newUser.save();
    return newUser;
};
exports.existingUser = existingUser;
const LoginInUser = async (email, password) => {
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }
    await user_model_1.User.findByIdAndUpdate(user._id, {
        $set: {
            lastLoginAt: new Date(),
        },
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user._id.toString(),
        role: user.role,
    }, String(index_1.config.jwt_secret), { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" });
    return {
        user: {
            _id: user._id,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            accountStatus: user.accountStatus,
            imgUrl: user.imgUrl,
        },
        token,
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
        if (!userId)
            return { status: "failed", message: "Unauthorized" };
        const updateData = {};
        if (req.body.firstName !== undefined)
            updateData.firstName = req.body.firstName;
        if (req.body.lastName !== undefined)
            updateData.lastName = req.body.lastName;
        if (req.body.dateOfBirth !== undefined)
            updateData.dateOfBirth = req.body.dateOfBirth;
        if (req.body.address !== undefined)
            updateData.address = req.body.address;
        if (req.body.city !== undefined)
            updateData.city = req.body.city;
        if (req.body.state !== undefined)
            updateData.state = req.body.state;
        if (req.body.company !== undefined)
            updateData.company = req.body.company;
        if (req.body.yearStarted !== undefined)
            updateData.yearStarted = req.body.yearStarted;
        if (req.body.email !== undefined)
            updateData.email = req.body.email.toLowerCase();
        if (req.body.phoneNumber !== undefined)
            updateData.phoneNumber = req.body.phoneNumber;
        // if (req.body.imgUrl !== undefined) updateData.imgUrl = req.body.imgUrl;
        // const uploadedFile = (req as any).file;
        // if (uploadedFile?.path) {
        //   updateData.imgUrl = uploadedFile.path;
        // }
        if (req.body.role !== undefined) {
            delete req.body.role;
        }
        const fields = [
            updateData.firstName,
            updateData.lastName,
            updateData.dateOfBirth,
            updateData.address,
            updateData.city,
            updateData.state,
            updateData.company,
            updateData.yearStarted,
            updateData.phoneNumber,
            updateData.imgUrl,
        ];
        const filledFields = fields.filter((field) => {
            if (field === undefined || field === null)
                return false;
            if (typeof field === "string")
                return field.trim() !== "";
            return true;
        }).length;
        const totalFields = fields.length;
        const userPercentage = Math.round((filledFields / totalFields) * 100);
        updateData.userPercentage = userPercentage;
        const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
        if (!updatedUser) {
            return { status: "failed", message: "User not found" };
        }
        return {
            status: "success",
            message: "Profile updated successfully",
            data: updatedUser,
            userPercentage,
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.userSelfUpdateService = userSelfUpdateService;
const createEmptyProfileForSignedInUser = async (req) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return { status: "failed", message: "Unauthorized" };
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return { status: "failed", message: "User not found" };
        }
        const [medicalExists, financialExists, homeAutoExists, socialExists, personalExists, profileExists] = await Promise.all([
            medical_model_1.MedicalInfoModel.exists({ userID: userId }),
            financial_model_1.FinancialModel.exists({ userID: userId }),
            homeauto_model_1.HomeAutoModel.exists({ userID: userId }),
            social_model_1.SocialInfoModel.exists({ userID: userId }),
            personal_model_1.PersonalModel.exists({ userID: userId }),
            profile_model_1.ProfileModel.exists({ userID: userId }),
        ]);
        const createTasks = [];
        if (!medicalExists)
            createTasks.push(medical_model_1.MedicalInfoModel.create({ userID: userId }));
        if (!financialExists)
            createTasks.push(financial_model_1.FinancialModel.create({ userID: userId }));
        if (!homeAutoExists)
            createTasks.push(homeauto_model_1.HomeAutoModel.create({ userID: userId }));
        if (!socialExists)
            createTasks.push(social_model_1.SocialInfoModel.create({ userID: userId }));
        if (!personalExists)
            createTasks.push(personal_model_1.PersonalModel.create({ userID: userId }));
        if (!profileExists)
            createTasks.push(profile_model_1.ProfileModel.create({ userID: userId }));
        await Promise.all(createTasks);
        return {
            status: "success",
            message: "Missing profile sections created successfully",
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        return {
            status: "failed",
            message,
        };
    }
};
exports.createEmptyProfileForSignedInUser = createEmptyProfileForSignedInUser;
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
                as: "medicalInfo",
            },
        },
        {
            $lookup: {
                from: "personals",
                localField: "_id",
                foreignField: "userID",
                as: "personalInfo",
            },
        },
        {
            $project: {
                _id: 0,
                name: 1,
                email: 1,
                // financialPercentage: { $arrayElemAt: ["$financialInfo.financialPercentage", 0] },
                // socialInfo: { $arrayElemAt: ["$socialInfo.socialInfoPercentage", 0] },
                // homeAutoInfo: { $arrayElemAt: ["$homeAutoInfo.homeautoPercentage", 0] },
                // medicalsInfo: { $arrayElemAt: ["$medicalsInfo.medicalsPercentage", 0] },
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
    const [homeauto, medical, financial, socialInfo, personalInfo] = await Promise.all([
        homeauto_model_1.HomeAutoModel.find({ userID: loggedInUserId }),
        medical_model_1.MedicalInfoModel.find({ userID: loggedInUserId }),
        financial_model_1.FinancialModel.find({ userID: loggedInUserId }),
        social_model_1.SocialInfoModel.find({ userID: loggedInUserId }),
        personal_model_1.PersonalModel.find({ userID: loggedInUserId }),
        // User.find({ userID: loggedInUserId }),
    ]);
};
exports.getAllOwnUserDataService = getAllOwnUserDataService;
// 🔢 Calculate percentages
// const homeautoPercentage = homeauto.reduce(
//   (sum, item) => sum + (item.homeautoPercentage || 0),
//   0
// );
// const medicalPercentage = medical.reduce(
//   (sum, item) => sum + (item.medicalsPercentage || 0),
//   0
// );
// const financialPercentage = financial.reduce(
//   (sum, item) => sum + (item.financialPercentage || 0),
//   0
// );
// const socialInfoPercentage = socialInfo.reduce(
//   (sum, item) => sum + (item.socialInfoPercentage || 0),
//   0
// );
// userPercentage runtime only
// const userPercentage = user.userPercentage || 0;
// const totalPercentage =
//   homeautoPercentage +
//   medicalPercentage +
//   financialPercentage +
//   socialInfoPercentage; 
// + userPercentage;
// 💡 Suggestion logic (3 suggestions for every case)
// let suggestions: string[] = [];
// if (totalPercentage === 100) {
//   suggestions = [
//     "Profile is fully completed",
//     "You can now access all features without any limitation",
//     "Keep your profile updated for better experience"
//   ];
// } else if (totalPercentage >= 71) {
//   suggestions = [
//     "Your profile is almost completed",
//     "Complete remaining sections to reach 100%",
//     "Review and submit missing information"
//   ];
// } else if (totalPercentage >= 41) {
//   suggestions = [
//     "Your profile is partially completed",
//     "Add more information to improve profile strength",
//     "Completing all sections helps better service"
//   ];
// } else {
//   suggestions = [
//     "Your profile is very incomplete",
//     "Please start adding your personal information",
//     "Completing your profile unlocks more features"
//   ];
// }
// return { user,homeauto, medical, financial,socialInfo , percentages: {
//   homeautoPercentage,
//   medicalPercentage,
//   financialPercentage,
//   socialInfoPercentage,
//   // userPercentage,
//   totalPercentage
// }, suggestions };
// };
const getAllUserDataService = async (requestedUserId, loggedInUserId) => {
    const user = await user_model_1.User.findById(requestedUserId);
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const isOwnData = requestedUserId.toString() === loggedInUserId.toString();
    const isProxyUser = user.proxysetId.some((id) => id.toString() === loggedInUserId.toString());
    if (!isOwnData && !isProxyUser)
        throw new Error("ACCESS_DENIED");
    const [homeauto, medical, financial, socialInfo, personalInfo] = await Promise.all([
        homeauto_model_1.HomeAutoModel.find({ userID: user._id }),
        medical_model_1.MedicalInfoModel.find({ userID: user._id }),
        financial_model_1.FinancialModel.find({ userID: user._id }),
        social_model_1.SocialInfoModel.find({ userID: user._id }),
        personal_model_1.PersonalModel.find({ userID: user._id })
    ]);
    return {
        user,
        homeauto,
        medical,
        financial,
        socialInfo,
        personalInfo,
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
        let EmailSubject = `Planeer Admin email verification Code `;
        await (0, emailHelper_1.SendEmail)(EmailTo, EmailText, EmailSubject);
        await user_model_1.User.updateOne({ email: email }, { otp: code }, { upsert: true });
        return { status: "success", message: "6 digit code sent successfully" };
    }
    catch (error) {
        return { status: 'failed', data: error };
    }
};
exports.adminEmailService = adminEmailService;
// 1. SEND FORGOT PASSWORD EMAIL (sends OTP)
const sendForgotPasswordEmail = async (email) => {
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
    if (!user)
        throw new Error("User not found");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = code;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    const subject = "Planeer Password Reset Code";
    const text = `Your Planeer password reset code is: ${code}`;
    await (0, emailHelper_1.SendEmail)(email, subject, text);
    return { message: "6 digit code sent successfully" };
};
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
// 2. VERIFY OTP
const verifyOtpService = async (email, otp) => {
    const user = await user_model_1.User.findOne({
        email: email.toLowerCase(),
        otp,
        otpExpiresAt: { $gt: new Date() }
    });
    if (!user)
        throw new Error("Invalid or expired code");
    user.otpVerified = true;
    await user.save();
    return { message: "Code verified successfully" };
};
exports.verifyOtpService = verifyOtpService;
// 3. RESET PASSWORD (actual password change)
const resetPasswordService = async (email, password) => {
    const user = await user_model_1.User.findOne({ email: email.toLowerCase() });
    if (!user)
        throw new Error("User not found");
    if (!user.otpVerified)
        throw new Error("OTP not verified first");
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiresAt = null;
    user.otpVerified = false;
    await user.save();
    return { message: "Password updated successfully" };
};
exports.resetPasswordService = resetPasswordService;
// export const sendProxyInviteService = async (req: Request) => {
//   try {
//     const inviterId = req.user?.id;
//     const linky ="http://localhost:5173"; // replace with your frontend URL
//     const email = String(req.body.email || "").trim().toLowerCase();
//     const verifyLink = `${linky}/proxy-signup?email=${encodeURIComponent(email)}`;
//     const grantorName = req.body.grantorFullname || "Someone";
//     if (!inviterId) {
//       return { status: "failed", message: "Unauthorized" };
//     }
//     if (!email) {
//       return { status: "failed", message: "Email is required" };
//     }
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return { status: "failed", message: "User already exists" };
//     }
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const otpExpiresAt = new Date(Date.now() + 10 * 60 * 6000);
//     await User.updateOne(
//       { email },
//       {
//         $set: {
//           email,
//           otp,
//           otpExpiresAt,
//           otpPurpose: "proxy-verification",
//           password: "",
//         },
//       },
//       { upsert: true }
//     );
//       const subject = "Planeer Proxy Invitation";
//       const text = `This code expires in 10 minutes.`;
//       const htmlContent = `        
//            <p>You've been invited to be a proxy by ${grantorName}. Your verification code is: ${otp}. This code expires in 10 minutes.
//            Click or copy this link: <a href=" ${verifyLink} ">Click here</a> to Complete Proxy Signup</p>
//           `;    
//     await SendEmail(email, subject, text, htmlContent);
//     return {
//       status: "success",
//       message: "Invite email sent successfully",
//     };
//   } catch (error: any) {
//     return {
//       status: "failed",
//       message: error.message || "Something went wrong",
//     };
//   }
// };
const verifyProxyOtp = async (email, otp, password) => {
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedCode = otp.trim();
        const user = await user_model_1.User.findOne({
            email: normalizedEmail,
            otp: normalizedCode,
        });
        if (!user) {
            return {
                status: "failed",
                message: "Invalid or expired code ",
            };
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const updatedUser = await user_model_1.User.findOneAndUpdate({ _id: user._id }, {
            $set: {
                password: hashedPassword,
                otpVerified: true,
                role: "PROXY",
            },
            $unset: {
                otp: 1,
                otpExpiresAt: 1,
            },
        });
        if (!updatedUser) {
            return {
                status: "failed",
                message: "Failed to update users1",
            };
        }
        const token = jsonwebtoken_1.default.sign({
            userId: updatedUser._id,
            email: updatedUser.email,
            role: "proxy",
        }, process.env.JWT_SECRET, { expiresIn: "1d" });
        // console.log("Generated JWT Token:", token);
        return {
            status: "success",
            message: "Code verified successfully",
            data: {
                _id: updatedUser._id,
                email: updatedUser.email,
                role: "proxy",
                token,
            },
        };
    }
    catch (error) {
        return {
            status: "failed",
            message: error.message || "Proxy verification failed",
        };
    }
};
exports.verifyProxyOtp = verifyProxyOtp;
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
const getUserList = async (pageNo, perPage, searchKeyword) => {
    const skipRow = (pageNo - 1) * perPage;
    let data;
    if (searchKeyword !== "0") {
        const searchRegex = { $regex: searchKeyword, $options: "i" };
        const searchQuery = {
            $or: [
                { "profile.firstName": searchRegex },
                { "profile.lastName": searchRegex },
                { email: searchRegex },
                { phoneNumber: searchRegex },
            ],
        };
        const pipeline = [
            {
                $facet: {
                    Total: [{ $match: searchQuery }, { $count: "count" }],
                    Rows: [{ $match: searchQuery }, { $skip: skipRow }, { $limit: perPage }],
                },
            },
        ];
        data = await user_model_1.User.aggregate(pipeline);
    }
    else {
        const pipeline = [
            {
                $facet: {
                    Total: [{ $count: "count" }],
                    Rows: [{ $skip: skipRow }, { $limit: perPage }],
                },
            },
        ];
        data = await user_model_1.User.aggregate(pipeline);
    }
    return data;
};
exports.getUserList = getUserList;
// "use Strict";
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
        if (!adminId) {
            return {
                status: "failed",
                message: "Unauthorized",
            };
        }
        if (adminRole !== user_interface_1.Role.SUPER_ADMIN) {
            return {
                status: "failed",
                message: "Only a super admin can update users",
            };
        }
        if (!userId) {
            return {
                status: "failed",
                message: "User id is required",
            };
        }
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            return {
                status: "failed",
                message: "User not found",
            };
        }
        const allowedAccountStatuses = [
            user_interface_1.AccountStatus.ACTIVE,
            user_interface_1.AccountStatus.SUSPENDED,
            user_interface_1.AccountStatus.PENDING_VERIFICATION,
            user_interface_1.AccountStatus.DEACTIVATED,
        ];
        const allowedRoles = [
            user_interface_1.Role.USER,
            user_interface_1.Role.PROXY,
            user_interface_1.Role.ADMIN,
            user_interface_1.Role.SUPER_ADMIN,
        ];
        const updates = {};
        if (typeof req.body.phoneNumber === "string") {
            updates.phoneNumber = req.body.phoneNumber.trim();
        }
        if (req.body.accountStatus !== undefined) {
            if (!allowedAccountStatuses.includes(req.body.accountStatus)) {
                return {
                    status: "failed",
                    message: "Invalid account status",
                };
            }
            updates.accountStatus = req.body.accountStatus;
        }
        if (req.body.role !== undefined) {
            if (!allowedRoles.includes(req.body.role)) {
                return {
                    status: "failed",
                    message: "Invalid role",
                };
            }
            // Prevent a super admin from accidentally removing their own access.
            if (userId === adminId &&
                req.body.role !== user_interface_1.Role.SUPER_ADMIN) {
                return {
                    status: "failed",
                    message: "You cannot remove your own super-admin role",
                };
            }
            updates.role = req.body.role;
        }
        if (Object.keys(updates).length === 0) {
            return {
                status: "failed",
                message: "No allowed fields were provided to update",
            };
        }
        const before = {
            role: user.role,
            accountStatus: user.accountStatus,
        };
        const updatedUser = await user_model_1.User.findByIdAndUpdate(userId, { $set: updates }, {
            new: true,
            runValidators: true,
        }).select("_id email phoneNumber role accountStatus lastLoginAt mfa.enabled createdAt updatedAt");
        if (!updatedUser) {
            return {
                status: "failed",
                message: "User not found after update",
            };
        }
        const changedFields = Object.keys(updates);
        const roleChanged = updates.role !== undefined && updates.role !== before.role;
        const accountStatusChanged = updates.accountStatus !== undefined &&
            updates.accountStatus !== before.accountStatus;
        console.log("Creating audit log...", {
            actorId: adminId,
            targetUserId: userId,
            changedFields,
        });
        const auditLog = await auditLog_model_1.AuditLog.create({
            actorId: adminId,
            targetUserId: userId,
            action: roleChanged
                ? auditLog_interface_1.AuditAction.USER_ROLE_CHANGED
                : accountStatusChanged
                    ? auditLog_interface_1.AuditAction.USER_STATUS_CHANGED
                    : auditLog_interface_1.AuditAction.USER_UPDATED,
            changedFields,
            before: {
                role: before.role,
                accountStatus: before.accountStatus,
            },
            after: {
                role: updatedUser.role,
                accountStatus: updatedUser.accountStatus,
            },
        });
        console.log("Audit log saved:", auditLog._id.toString());
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
    const user = await user_model_1.User.findOne({ email });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isPasswordMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error("Invalid email or password");
    }
    if (user.role !== user_interface_1.Role.ADMIN &&
        user.role !== user_interface_1.Role.SUPER_ADMIN) {
        throw new Error("Access denied. Admin privileges are required.");
    }
    const token = jsonwebtoken_1.default.sign({
        userId: user._id,
        role: user.role,
    }, index_1.config.jwt_secret, { expiresIn: "30d" });
    return { user, token };
};
exports.adminLoginService = adminLoginService;
