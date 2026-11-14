// // "use strict";

import { User } from "./user.model";
import bcrypt from "bcryptjs";
 import jwt from "jsonwebtoken";
import { config } from '../../config/index';
import {  Request } from "express";
import mongoose, { Types } from 'mongoose';
import { SendEmail } from "../../../helpers/emailHelper";
import { ReportModel } from "../report-Information/report.model";
import { FinancialModel } from "../financial-Information/financial.model";
import { MedicalInfoModel } from "../../modules/medical-Information/medical.model";
import { HomeAutoModel } from "../homeAuto-Information/homeauto.model";
import { PersonalModel } from "../../modules/personal-Information/personal.model";
import { ProfileModel } from "../Profile-Information/profile.model";
import { DigitalInfoModel } from "../digital-Information/digital.model";
import { ProxyUser, ProxyUserResponse, AccountStatus, Role } from "./user.interface";
import { AuditLog } from "../audit-log/auditLog.model";
import { AuditAction } from "../audit-log/auditLog.interface";
import { http } from "winston";
import { isValidObjectId } from "mongoose";
import { AccountStatusRequest } from "../account-status-request/accountStatusRequest.model";
import {
  AccountStatusRequestStatus,
  RequestedAccountStatus,
} from "../account-status-request/accountStatusRequest.interface";
// import { User } from "./user.model";
// import { StrictMode, use } from "react";


type PipelineStage = any;

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        id?: string;
        role?: string;
      };
    }
  }
}


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

class AccountStatusWorkflowError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AccountStatusWorkflowError";
  }
}

export const createAccountStatusRequestService = async (
  req: Request,
) => {
  try {
    const actorId = req.user?.id;
    const targetUserId = req.params.id;

    if (!actorId) {
      throw new AccountStatusWorkflowError(
        401,
        "Authentication is required.",
      );
    }

    if (
      typeof targetUserId !== "string" ||
      !isValidObjectId(targetUserId)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "A valid user id is required.",
      );
    }

    const requestedStatus = req.body?.requestedStatus;

    const requestableStatuses: RequestedAccountStatus[] = [
      AccountStatus.ACTIVE,
      AccountStatus.SUSPENDED,
      AccountStatus.DEACTIVATED,
    ];

    if (
      typeof requestedStatus !== "string" ||
      !requestableStatuses.includes(
        requestedStatus as RequestedAccountStatus,
      )
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "Requested status must be ACTIVE, SUSPENDED, or DEACTIVATED.",
      );
    }

    const internalNote =
      typeof req.body?.internalNote === "string"
        ? req.body.internalNote.trim()
        : "";

    if (internalNote.length < 10 || internalNote.length > 2000) {
      throw new AccountStatusWorkflowError(
        400,
        "An internal note between 10 and 2,000 characters is required.",
      );
    }

    const createdRequest = await User.db.transaction(
      async (session) => {
        // Re-read the actor rather than trusting submitted identity/role.
        const actor = await User.findById(actorId)
          .select("_id role accountStatus")
          .session(session);

        if (
          !actor ||
          actor.role !== Role.ADMIN ||
          actor.accountStatus !== AccountStatus.ACTIVE
        ) {
          throw new AccountStatusWorkflowError(
            403,
            "An active admin account is required to submit a request.",
          );
        }

        // Staff accounts are outside this customer-status workflow.
        const target = await User.findOne({
          _id: targetUserId,
          role: { $in: [Role.USER, Role.PROXY] },
        })
          .select("_id accountStatus")
          .session(session);

        if (!target) {
          throw new AccountStatusWorkflowError(
            404,
            "An eligible user account was not found.",
          );
        }

        if (target.accountStatus === requestedStatus) {
          throw new AccountStatusWorkflowError(
            409,
            "The account already has the requested status.",
          );
        }

        const pendingRequest = await AccountStatusRequest.findOne({
          targetUserId: target._id,
          status: AccountStatusRequestStatus.PENDING,
        })
          .select("_id")
          .session(session);

        if (pendingRequest) {
          throw new AccountStatusWorkflowError(
            409,
            "This account already has a pending status-change request.",
          );
        }

        const [request] = await AccountStatusRequest.create(
          [
            {
              targetUserId: target._id,
              requestedBy: actor._id,
              fromStatus: target.accountStatus,
              requestedStatus,
              internalNote,
              status: AccountStatusRequestStatus.PENDING,
            },
          ],
          { session },
        );

        await AuditLog.create(
          [
            {
              actorId: actor._id,
              targetUserId: target._id,
              action: AuditAction.USER_STATUS_CHANGE_REQUESTED,

              // No user fields have changed at submission time.
              changedFields: [],

              before: {
                accountStatus: target.accountStatus,
              },
              after: {
                accountStatus: target.accountStatus,
              },

              reason: internalNote,
              statusChangeRequestId: request._id,
            },
          ],
          { session },
        );

        return request.toObject();
      },
    );

    return {
      status: "success" as const,
      statusCode: 201,
      message: "Account-status request submitted for review.",
      data: createdRequest,
    };
  } catch (error: unknown) {
    if (error instanceof AccountStatusWorkflowError) {
      return {
        status: "failed" as const,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return {
        status: "failed" as const,
        statusCode: 409,
        message:
          "This account already has a pending status-change request.",
      };
    }

    console.error("Account-status request submission failed:", error);

    return {
      status: "failed" as const,
      statusCode: 500,
      message: "Could not submit the account-status request.",
    };
  }
};




export const existingUser = async (body: any) => {
  const { phoneNumber, email, password } = body;

  // Check if user already exists
  const user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
  if (user) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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

  // Create new user with calculated percentage
  const newUser = new User({
    ...body,
    password: hashedPassword,
    // userPercentage: userPercentage
  });
  

  await newUser.save();
  return newUser;
};




export const LoginInUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  await User.findByIdAndUpdate(user._id, {
    $set: {
      lastLoginAt: new Date(),
    },
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    String(config.jwt_secret),
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" } as any
  );

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




export const getprofileService =async (req:Request) => {
  try {

    let user_id=req.user?.id;
    let data=await User.findOne({"_id":user_id})
    return ({status:"success",message:"User profile successfully",data:data})
  } catch (error) {
    return {status:'failed', data: error};
  }
}





export const adminDeleteUserService = async (req: Request) => {
  try {
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    const deleteUserId = req.params.id;

    // 🔐 Auth check
    if (!adminId) {
      return { status: "failed", message: "Unauthorized" };
    }

    // 🔐 Role check
    if (adminRole !== Role.ADMIN) {
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

    const user = await User.findById(deleteUserId);

    if (!user) {
      return {
        status: "failed",
        message: "User not found",
      };
    }

    await User.deleteOne({ _id: deleteUserId });

    return {
      status: "success",
      message: "User deleted successfully",
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message,
    };
  }
};









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









export const userSelfUpdateService = async (req: Request) => {
  try {
    const userId = req.user?.id;
    if (!userId) return { status: "failed", message: "Unauthorized" };

    const updateData: Record<string, any> = {};

    if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
    if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
    if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.state !== undefined) updateData.state = req.body.state;
    if (req.body.company !== undefined) updateData.company = req.body.company;
    if (req.body.yearStarted !== undefined) updateData.yearStarted = req.body.yearStarted;
    if (req.body.email !== undefined) updateData.email = req.body.email.toLowerCase();
    if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.imgUrl !== undefined) updateData.imgUrl = req.body.imgUrl;
    
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return { status: "failed", message: "User not found" };
    }

    return {
      status: "success",
      message: "Profile updated successfully",
      data: updatedUser,
    };
  } catch (error: any) {
    return { status: "failed", message: error.message };
  }
};





export const createEmptyProfileForSignedInUser = async (req: Request) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return { status: "failed", message: "Unauthorized" };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { status: "failed", message: "User not found" };
    }

    const [medicalExists, financialExists, homeAutoExists, digitalExists, personalExists, profileExists] =
      await Promise.all([
        MedicalInfoModel.exists({ userID: userId }),
        FinancialModel.exists({ userID: userId }),
        HomeAutoModel.exists({ userID: userId }),
        DigitalInfoModel.exists({ userID: userId }),
        PersonalModel.exists({ userID: userId }),
        ProfileModel.exists({ userID: userId }),
      ]);

    const createTasks = [];

    if (!medicalExists) createTasks.push(MedicalInfoModel.create({ userID: userId }));
    if (!financialExists) createTasks.push(FinancialModel.create({ userID: userId }));
    if (!homeAutoExists) createTasks.push(HomeAutoModel.create({ userID: userId }));
    if (!digitalExists) createTasks.push(DigitalInfoModel.create({ userID: userId }));
    if (!personalExists) createTasks.push(PersonalModel.create({ userID: userId }));
    if (!profileExists) createTasks.push(ProfileModel.create({ userID: userId }));

    await Promise.all(createTasks);

    return {
      status: "success",
      message: "Missing profile sections created successfully",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Something went wrong"

    return {
      status: "failed",
      message,
    };
  }
};






export const getallUsers = async () => {
  try {

        const users = await User.find();
        return ({status:"success",Message:"Get All User Data successfully",data:users})
  } catch (error) {
    return {status:'failed', data: error};
  }

}






export const searchUsersService = async (searchTerm: string) => {
  const users = await User.find(
    {
      $or: [
        { email: { $regex: searchTerm, $options: "i" } },
        { phoneNumber: { $regex: searchTerm, $options: "i" } },
      ],
    },
    { _id: 1, firstName: 1, lastName: 1, email: 1, phoneNumber: 1 }
  );

  return users;
};





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

export const ProxysetService = async (req: Request) => {
  try {
    const userId = req.user?.id;
    const ProxysetUserIdStr = Array.isArray(req.params.proxysetId)
      ? req.params.proxysetId[0]
      : req.params.proxysetId;

    if (!userId || !ProxysetUserIdStr || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ProxysetUserIdStr)) {
      return { status: 'failed', message: 'Invalid user or followed user ID' };
    }

    if (userId === ProxysetUserIdStr) {
      return { status: 'failed', message: "You cannot follow yourself" };
    }

    const ProxysetUserIdObjectId = new mongoose.Types.ObjectId(ProxysetUserIdStr);

    const user = await User.findById(userId);
    if (!user) return { status: 'failed', message: 'User not found' };

    const followedUser = await User.findById(ProxysetUserIdObjectId);
    if (!followedUser) return { status: 'failed', message: "Followed user not found" };

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
  } catch (error) {
    return { status: 'failed', data: error };
  }
};






export const getProxysetData = async (userId: string) => {
  try {
   
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
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
  } catch (error) {
    return {status:'failed', data: error};
  }
};








export const getUserFullProfileService = async (userId: string) => {
  const result = await User.aggregate([
    {
      $match: { _id: new Types.ObjectId(userId) },
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
        from: "digitalinfos",
        localField: "_id",
        foreignField: "userID",
        as: "digitalInfo",
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
      },
    },
  ]);

  return result[0] || null;
};





//proxysetId  data 


export const getAllOwnUserDataService = async (loggedInUserId: string) => {

  const user = await User.findById(loggedInUserId);
  if (!user) throw new Error("USER_NOT_FOUND");


  const [homeauto, medical, financial,digitalInfo, personalInfo] = await Promise.all([
    HomeAutoModel.find({ userID: loggedInUserId }),
    MedicalInfoModel.find({ userID: loggedInUserId }),
    FinancialModel.find({ userID: loggedInUserId }),
    DigitalInfoModel.find({ userID: loggedInUserId }),
    PersonalModel.find({ userID: loggedInUserId }), 
    // User.find({ userID: loggedInUserId }),
  
  ]);
};
 




export const getAllUserDataService = async (
  requestedUserId: string,
  loggedInUserId: string
) => {

  
  const user = await User.findById(requestedUserId);
  if (!user) throw new Error("USER_NOT_FOUND");

  const isOwnData =
    requestedUserId.toString() === loggedInUserId.toString();

  const isProxyUser = user.proxysetId.some(
    (id: any) => id.toString() === loggedInUserId.toString()
  );

  if (!isOwnData && !isProxyUser) throw new Error("ACCESS_DENIED");

  const [homeauto, medical, financial, digitalInfo, personalInfo] = await Promise.all([
    HomeAutoModel.find({ userID: user._id }),
    MedicalInfoModel.find({ userID: user._id }),
    FinancialModel.find({ userID: user._id }),
    DigitalInfoModel.find({ userID: user._id }),
    PersonalModel.find({ userID: user._id })
  ]);

  return {
    user,       
    homeauto,
    medical,
    financial,
    digitalInfo,
    personalInfo,
  };
};




export const getUsersWhoAddedMeAsProxyService = async (
  myUserId: string
) => {
  const users = await User.find({
    proxysetId: myUserId
  })
  .select("_id firstName lastName email imgUrl role");

  return users;
};





//admin routes


export const adminEmailService = async (req:Request) => {
  try {
    let { email } = req.body;
    let code = Math.floor(100000 + Math.random() * 900000);
    let EmailTo=email ;
    let EmailText = `Your code is= ${code}`;
    let EmailSubject = `Planeer Admin email verification Code `;
    await SendEmail(EmailTo, EmailText, EmailSubject)
    await User.updateOne(
      { email: email },
      { otp: code },
      { upsert: true }
    );

    return { status: "success", message: "6 digit code sent successfully" };
  } catch (error) {
     return {status:'failed', data: error};
  }
};



// 1. SEND FORGOT PASSWORD EMAIL (sends OTP)
export const sendForgotPasswordEmail = async (email: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.otp = code;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  const subject = "Planeer Password Reset Code";
  const text = `Your Planeer password reset code is: ${code}`;
  
  await SendEmail(email, subject, text);
  
  return { message: "6 digit code sent successfully" };
};


// 2. VERIFY OTP
export const verifyOtpService = async (email: string, otp: string) => {
  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    otp,
    otpExpiresAt: { $gt: new Date() }
  });
  
  if (!user) throw new Error("Invalid or expired code");
  
  user.otpVerified = true;
  await user.save();
  
  return { message: "Code verified successfully" };
};


// 3. RESET PASSWORD (actual password change)
export const resetPasswordService = async (email: string, password: string) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("User not found");
  
  if (!user.otpVerified) throw new Error("OTP not verified first");

  const hashedPassword = await bcrypt.hash(password, 10);
  
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpiresAt = null;
  user.otpVerified = false;
  await user.save();
  
  return { message: "Password updated successfully" };
};










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

 


export const verifyProxyOtp = async (email: string, otp: string, password: string) => {
  
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = otp.trim();

    const user = await User.findOne({
      email: normalizedEmail,
      otp: normalizedCode,
    });

    if (!user) {
      return {
        status: "failed",
        message: "Invalid or expired code ",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          otpVerified: true,
          role: "PROXY",
        },
        $unset: {
          otp: 1,
          otpExpiresAt: 1,
        },
      },
    );

    if (!updatedUser) {
      return {
        status: "failed",
        message: "Failed to update users1",
      };
    }

    const token = jwt.sign(
      {
        userId: updatedUser._id,
        email: updatedUser.email,
        role: "proxy",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );


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
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Proxy verification failed",
    };
  }
};




export const codeVerification = async (email: string, code: string) => {

  const user = await User.findOne({ email:email, otp: code });
  if (!user) {
    throw new Error("User not found");
  }

  if (user.otp !== code) {
    throw new Error("Invalid code");
  }

  return { message: "Code verified successfully" };
};




export const updatePassword = async (email: string, password: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });
  if (!user) {
    throw new Error("User not found");
  }
  return { message: "Password updated successfully" };
};



export const getUserList = async (
  pageNo: number,
  perPage: number,
  searchKeyword: string
) => {
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

    const pipeline: PipelineStage[] = [
      {
        $facet: {
          Total: [{ $match: searchQuery }, { $count: "count" }],
          Rows: [{ $match: searchQuery }, { $skip: skipRow }, { $limit: perPage }],
        },
      },
    ];

    data = await User.aggregate(pipeline);
  } else {
    const pipeline: PipelineStage[] = [
      {
        $facet: {
          Total: [{ $count: "count" }],
          Rows: [{ $skip: skipRow }, { $limit: perPage }],
        },
      },
    ];

    data = await User.aggregate(pipeline);
  }

  return data;
};



// "use Strict";
export const getNewUsersLast10DaysService = async () => {
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  const count = await User.countDocuments({
    createdAt: { $gte: tenDaysAgo },
  });

  return count;
};


// Review account status request service
export const reviewAccountStatusRequestService = async (
  req: Request,
) => {
  try {
    const actorId = req.user?.id;
    const requestId = req.params.requestId;

    if (!actorId) {
      throw new AccountStatusWorkflowError(
        401,
        "Authentication is required.",
      );
    }

    if (
      typeof requestId !== "string" ||
      !isValidObjectId(requestId)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "A valid request id is required.",
      );
    }

    const decision = req.body?.decision;

    if (
      decision !== AccountStatusRequestStatus.APPROVED &&
      decision !== AccountStatusRequestStatus.REJECTED
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "Decision must be APPROVED or REJECTED.",
      );
    }

    const reviewNote =
      typeof req.body?.reviewNote === "string"
        ? req.body.reviewNote.trim()
        : "";

    if (reviewNote.length < 10 || reviewNote.length > 2000) {
      throw new AccountStatusWorkflowError(
        400,
        "A review note between 10 and 2,000 characters is required.",
      );
    }

    const isApproval =
      decision === AccountStatusRequestStatus.APPROVED;

    const reviewedRequest = await User.db.transaction(
      async (session) => {
        const reviewer = await User.findById(actorId)
          .select("_id role accountStatus")
          .session(session);

        if (
          !reviewer ||
          reviewer.role !== Role.SUPER_ADMIN ||
          reviewer.accountStatus !== AccountStatus.ACTIVE
        ) {
          throw new AccountStatusWorkflowError(
            403,
            "An active super-admin account is required.",
          );
        }

        const request = await AccountStatusRequest.findById(
          requestId,
        ).session(session);

        if (!request) {
          throw new AccountStatusWorkflowError(
            404,
            "Account-status request not found.",
          );
        }

        if (
          request.status !== AccountStatusRequestStatus.PENDING
        ) {
          throw new AccountStatusWorkflowError(
            409,
            "This request has already been reviewed.",
          );
        }

        // Approval requires independent review.
        // Rejection can also withdraw the reviewer's earlier request.
        if (
          isApproval &&
          request.requestedBy.toString() ===
            reviewer._id.toString()
        ) {
          throw new AccountStatusWorkflowError(
            403,
            "You cannot approve your own request. You may reject it to close it.",
          );
        }

        // Load the target without filtering its role:
        // rejection must work even if it became a staff account.
        const target = await User.findById(
          request.targetUserId,
        )
          .select("_id role accountStatus")
          .session(session);

        const beforeStatus = target?.accountStatus;
        let afterStatus = beforeStatus;

        if (isApproval) {
          if (!target) {
            throw new AccountStatusWorkflowError(
              409,
              "The target account no longer exists. Reject this request to close it.",
            );
          }

          if (
            target.role !== Role.USER &&
            target.role !== Role.PROXY
          ) {
            throw new AccountStatusWorkflowError(
              409,
              "The target is no longer an eligible customer account. Reject this request to close it.",
            );
          }

          if (target.accountStatus !== request.fromStatus) {
            throw new AccountStatusWorkflowError(
              409,
              "The account status changed after submission. Reject this request and submit a fresh request if needed.",
            );
          }

          if (
            target.accountStatus === request.requestedStatus
          ) {
            throw new AccountStatusWorkflowError(
              409,
              "The account already has the requested status. Reject this request to close it.",
            );
          }

          const updatedUser = await User.findOneAndUpdate(
            {
              _id: request.targetUserId,
              role: { $in: [Role.USER, Role.PROXY] },
              accountStatus: request.fromStatus,
            },
            {
              $set: {
                accountStatus: request.requestedStatus,
              },
            },
            {
              new: true,
              runValidators: true,
              session,
            },
          ).select("_id accountStatus");

          if (!updatedUser) {
            throw new AccountStatusWorkflowError(
              409,
              "The account changed during review. Refresh and review it again.",
            );
          }

          afterStatus = updatedUser.accountStatus;
        }

        // Rejection reaches this point even if the target is
        // deleted, is now staff, or has a different status.
        const updatedRequest =
          await AccountStatusRequest.findOneAndUpdate(
            {
              _id: request._id,
              status: AccountStatusRequestStatus.PENDING,
            },
            {
              $set: {
                status: decision,
                reviewedBy: reviewer._id,
                reviewNote,
                reviewedAt: new Date(),
              },
            },
            {
              new: true,
              runValidators: true,
              session,
            },
          );

        if (!updatedRequest) {
          throw new AccountStatusWorkflowError(
            409,
            "This request has already been reviewed.",
          );
        }

        await AuditLog.create(
          [
            {
              actorId: reviewer._id,

              // Preserve the original target ID even when
              // its user document no longer exists.
              targetUserId: request.targetUserId,

              action: isApproval
                ? AuditAction.USER_STATUS_REQUEST_APPROVED
                : AuditAction.USER_STATUS_REQUEST_REJECTED,

              changedFields: [],

              // Do not invent a current status for a deleted user.
              before:
                beforeStatus === undefined
                  ? {}
                  : { accountStatus: beforeStatus },

              after:
                afterStatus === undefined
                  ? {}
                  : { accountStatus: afterStatus },

              reason: reviewNote,
              statusChangeRequestId: request._id,
            },
          ],
          { session },
        );

        if (isApproval) {
          await AuditLog.create(
            [
              {
                actorId: reviewer._id,
                targetUserId: request.targetUserId,
                action: AuditAction.USER_STATUS_CHANGED,
                changedFields: ["accountStatus"],
                before: {
                  accountStatus: beforeStatus,
                },
                after: {
                  accountStatus: afterStatus,
                },
                reason: reviewNote,
                statusChangeRequestId: request._id,
              },
            ],
            { session },
          );
        }

        return updatedRequest.toObject();
      },
    );

    return {
      status: "success" as const,
      statusCode: 200,
      message: isApproval
        ? "Request approved and account status updated."
        : "Request rejected and closed. No account was changed.",
      data: reviewedRequest,
    };
  } catch (error: unknown) {
    if (error instanceof AccountStatusWorkflowError) {
      return {
        status: "failed" as const,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    console.error("Account-status request review failed:", error);

    return {
      status: "failed" as const,
      statusCode: 500,
      message: "Could not review the account-status request.",
    };
  }
};



// Service to change the account status of a user by a super-admin.
export const changeAccountStatusService = async (
  req: Request,
) => {
  try {
    const actorId = req.user?.id;
    const targetUserId = req.params.id;

    if (!actorId) {
      throw new AccountStatusWorkflowError(
        401,
        "Authentication is required.",
      );
    }

    if (
      typeof targetUserId !== "string" ||
      !isValidObjectId(targetUserId)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "A valid user id is required.",
      );
    }

    const accountStatus = req.body?.accountStatus;
    const expectedStatus = req.body?.expectedStatus;

    const destinations: RequestedAccountStatus[] = [
      AccountStatus.ACTIVE,
      AccountStatus.SUSPENDED,
      AccountStatus.DEACTIVATED,
    ];

    if (
      typeof accountStatus !== "string" ||
      !destinations.includes(
        accountStatus as RequestedAccountStatus,
      )
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "Status must be ACTIVE, SUSPENDED, or DEACTIVATED.",
      );
    }

    if (
      typeof expectedStatus !== "string" ||
      !Object.values(AccountStatus).includes(
        expectedStatus as AccountStatus,
      )
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "The account's displayed status is required.",
      );
    }

    const reason =
      typeof req.body?.reason === "string"
        ? req.body.reason.trim()
        : "";

    if (reason.length < 10 || reason.length > 2000) {
      throw new AccountStatusWorkflowError(
        400,
        "A reason between 10 and 2,000 characters is required.",
      );
    }

    const updatedUser = await User.db.transaction(
      async (session) => {
        const actor = await User.findById(actorId)
          .select("_id role accountStatus")
          .session(session);

        if (
          !actor ||
          actor.role !== Role.SUPER_ADMIN ||
          actor.accountStatus !== AccountStatus.ACTIVE
        ) {
          throw new AccountStatusWorkflowError(
            403,
            "An active super-admin account is required.",
          );
        }

        const target = await User.findOne({
          _id: targetUserId,
          role: { $in: [Role.USER, Role.PROXY] },
        })
          .select("_id accountStatus")
          .session(session);

        if (!target) {
          throw new AccountStatusWorkflowError(
            404,
            "An eligible user account was not found.",
          );
        }

        if (target.accountStatus !== expectedStatus) {
          throw new AccountStatusWorkflowError(
            409,
            "The account status changed. Refresh before trying again.",
          );
        }

        if (target.accountStatus === accountStatus) {
          throw new AccountStatusWorkflowError(
            409,
            "The account already has this status.",
          );
        }

        const pendingRequest =
          await AccountStatusRequest.findOne({
            targetUserId: target._id,
            status: AccountStatusRequestStatus.PENDING,
          })
            .select("_id")
            .session(session);

        if (pendingRequest) {
          throw new AccountStatusWorkflowError(
            409,
            "This account has a pending request. Review that request first.",
          );
        }

        const updated = await User.findOneAndUpdate(
          {
            _id: target._id,
            role: { $in: [Role.USER, Role.PROXY] },
            accountStatus: expectedStatus,
          },
          {
            $set: { accountStatus },
          },
          {
            new: true,
            runValidators: true,
            session,
          },
        ).select(
          "_id email phoneNumber role accountStatus planStatus createdAt updatedAt",
        );

        if (!updated) {
          throw new AccountStatusWorkflowError(
            409,
            "The account changed. Refresh before trying again.",
          );
        }

        await AuditLog.create(
          [
            {
              actorId: actor._id,
              targetUserId: target._id,
              action: AuditAction.USER_STATUS_CHANGED,
              changedFields: ["accountStatus"],
              before: {
                accountStatus: target.accountStatus,
              },
              after: {
                accountStatus: updated.accountStatus,
              },
              reason,
              statusChangeRequestId: null,
            },
          ],
          { session },
        );

        return updated.toObject();
      },
    );

    return {
      status: "success" as const,
      statusCode: 200,
      message: "Account status updated.",
      data: updatedUser,
    };
  } catch (error: unknown) {
    if (error instanceof AccountStatusWorkflowError) {
      return {
        status: "failed" as const,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    console.error("Direct account-status change failed:", error);

    return {
      status: "failed" as const,
      statusCode: 500,
      message: "Could not change the account status.",
    };
  }
};



// List account status requests for an admin or super admin
export const listAccountStatusRequestsService = async (
  req: Request,
) => {
  try {
    const actorId = req.user?.id;

    if (!actorId) {
      throw new AccountStatusWorkflowError(
        401,
        "Authentication is required.",
      );
    }

    const actor = await User.findById(actorId)
      .select("_id role accountStatus")
      .lean();

    if (
      !actor ||
      actor.accountStatus !== AccountStatus.ACTIVE ||
      (actor.role !== Role.ADMIN &&
        actor.role !== Role.SUPER_ADMIN)
    ) {
      throw new AccountStatusWorkflowError(
        403,
        "An active staff account is required.",
      );
    }

    const page = Number(req.query.pageNo ?? 1);
    const perPage = Number(req.query.perPage ?? 15);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(perPage) ||
      perPage < 1 ||
      perPage > 100 ||
      !Number.isSafeInteger((page - 1) * perPage)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "Use a valid page number and a page size between 1 and 100.",
      );
    }

    const status = req.query.status;

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !Object.values(AccountStatusRequestStatus).includes(
          status as AccountStatusRequestStatus,
        ))
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "Invalid request-status filter.",
      );
    }

    const isSuperAdmin = actor.role === Role.SUPER_ADMIN;

    const match: Record<string, unknown> = {};

    if (!isSuperAdmin) {
      // Aggregate pipelines require an actual ObjectId.
      match.requestedBy = new Types.ObjectId(
        actor._id.toString(),
      );
    }

    if (status !== undefined) {
      match.status = status;
    }

    const [result] = await AccountStatusRequest.aggregate([
      { $match: match },

      {
        $lookup: {
          from: User.collection.name,
          let: { targetId: "$targetUserId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$targetId"] },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1,
                role: 1,
                accountStatus: 1,
              },
            },
          ],
          as: "targetUser",
        },
      },

      {
        $unwind: {
          path: "$targetUser",
          preserveNullAndEmptyArrays: isSuperAdmin,
        },
      },

      ...(!isSuperAdmin
        ? [
            {
              $match: {
                "targetUser.role": {
                  $in: [Role.USER, Role.PROXY],
                },
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: User.collection.name,
          let: { requesterId: "$requestedBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$requesterId"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                email: 1,
              },
            },
          ],
          as: "requester",
        },
      },

      {
        $unwind: {
          path: "$requester",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          targetUserId: 1,
          targetUser: 1,
          requester: 1,
          fromStatus: 1,
          requestedStatus: 1,
          internalNote: 1,
          status: 1,
          reviewNote: 1,
          reviewedAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },

      {
        $facet: {
          rows: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ]);

    const total = result?.metadata?.[0]?.total ?? 0;

    return {
      status: "success" as const,
      statusCode: 200,
      message: "Account-status requests retrieved.",
      data: {
        rows: result?.rows ?? [],
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        total,
        perPage,
      },
    };
  } catch (error: unknown) {
    if (error instanceof AccountStatusWorkflowError) {
      return {
        status: "failed" as const,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    console.error("Account-status request listing failed:", error);

    return {
      status: "failed" as const,
      statusCode: 500,
      message: "Could not retrieve account-status requests.",
    };
  }
};


// Admin updates a user's details (phone number, account status, role)
export const adminUpdateUserService = async (req: Request) => {
  try {
    const adminId = req.user?.id;
    const userId = req.params.id;

    if (!adminId) {
      throw new AccountStatusWorkflowError(
        401,
        "Authentication is required.",
      );
    }

    if (
      typeof userId !== "string" ||
      !isValidObjectId(userId)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "A valid user id is required.",
      );
    }

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AccountStatusWorkflowError(
        400,
        "A valid update body is required.",
      );
    }

    // This endpoint accepts profile fields only.
    const unsupportedFields = Object.keys(body).filter(
      (field) => field !== "phoneNumber",
    );

    if (unsupportedFields.length > 0) {
      throw new AccountStatusWorkflowError(
        400,
        "Only phoneNumber can be updated here. Use the dedicated workflow for account-status changes. Role changes are not supported by this endpoint.",
      );
    }

    if (typeof body.phoneNumber !== "string") {
      throw new AccountStatusWorkflowError(
        400,
        "Phone number must be provided as a string.",
      );
    }

    // An empty string intentionally clears the optional phone number.
    const phoneNumber = body.phoneNumber.trim();

    if (phoneNumber.length > 50) {
      throw new AccountStatusWorkflowError(
        400,
        "Phone number must not exceed 50 characters.",
      );
    }

    const result = await User.db.transaction(
      async (session) => {
        const admin = await User.findById(adminId)
          .select("_id role accountStatus")
          .session(session);

        if (
          !admin ||
          admin.role !== Role.SUPER_ADMIN ||
          admin.accountStatus !== AccountStatus.ACTIVE
        ) {
          throw new AccountStatusWorkflowError(
            403,
            "An active super-admin account is required.",
          );
        }

        // Customer profile management does not modify staff accounts.
        const user = await User.findOne({
          _id: userId,
          role: { $in: [Role.USER, Role.PROXY] },
        })
          .select(
            "_id email phoneNumber role accountStatus planStatus lastLoginAt mfa.enabled createdAt updatedAt",
          )
          .session(session);

        if (!user) {
          throw new AccountStatusWorkflowError(
            404,
            "An eligible user account was not found.",
          );
        }

        if ((user.phoneNumber ?? "") === phoneNumber) {
          return {
            changed: false,
            user: user.toObject(),
          };
        }

        const before = {
          role: user.role,
          accountStatus: user.accountStatus,
          phoneNumber: user.phoneNumber ?? "",
        };

        const updatedUser = await User.findOneAndUpdate(
          {
            _id: user._id,
            role: { $in: [Role.USER, Role.PROXY] },
          },
          {
            $set: { phoneNumber },
          },
          {
            new: true,
            runValidators: true,
            session,
          },
        ).select(
          "_id email phoneNumber role accountStatus planStatus lastLoginAt mfa.enabled createdAt updatedAt",
        );

        if (!updatedUser) {
          throw new AccountStatusWorkflowError(
            409,
            "The account changed during the update. Refresh and try again.",
          );
        }

        await AuditLog.create(
          [
            {
              actorId: admin._id,
              targetUserId: user._id,
              action: AuditAction.USER_UPDATED,
              changedFields: ["phoneNumber"],
              before,
              after: {
                role: updatedUser.role,
                accountStatus: updatedUser.accountStatus,
                phoneNumber: updatedUser.phoneNumber ?? "",
              },
            },
          ],
          { session },
        );

        return {
          changed: true,
          user: updatedUser.toObject(),
        };
      },
    );

    return {
      status: "success" as const,
      statusCode: 200,
      message: result.changed
        ? "User profile updated successfully."
        : "No changes were needed.",
      data: result.user,
    };
  } catch (error: unknown) {
    if (error instanceof AccountStatusWorkflowError) {
      return {
        status: "failed" as const,
        statusCode: error.statusCode,
        message: error.message,
      };
    }

    console.error("Admin user-profile update failed:", error);

    return {
      status: "failed" as const,
      statusCode: 500,
      message: "Could not update the user profile.",
    };
  }
};



export const getCountsService = async (req: Request) => {
  try {
    const now = new Date();

    const startOfThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
      0,
      0,
      0,
      0,
    );

    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeUsersLastMonth,
      inactiveUsersLastMonth,
      totalReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "ACTIVE" }),
      User.countDocuments({
        createdAt: {
          $gte: startOfThisMonth,
          $lte: now,
        },
      }),
      User.countDocuments({
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),
      User.countDocuments({
        accountStatus: "ACTIVE",
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),
      User.countDocuments({
        accountStatus: { $ne: "ACTIVE" },
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      }),
      ReportModel.countDocuments(),
    ]);


    const inactiveUsers = totalUsers - activeUsers;


    const calculatePercentage = (
      current: number,
      previous: number,
    ): number => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }

      return Number(
        (((current - previous) / previous) * 100).toFixed(2),
      );
    };


    const newUsersPercent = calculatePercentage(
      newUsersThisMonth,
      newUsersLastMonth,
    );


    const activeUsersPercent = calculatePercentage(
      activeUsers,
      activeUsersLastMonth,
    );


    const inactiveUsersPercent = calculatePercentage(
      inactiveUsers,
      inactiveUsersLastMonth,
    );


    return {
      status: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers: newUsersThisMonth,
        newUsersPercent,
        activeUsersPercent,
        inactiveUsersPercent,
        totalReports,
      },
    };
  } catch (error) {
    return {
      status: false,
      data: error,
    };
  }
};








export class UserAnalysisService {
  // Daily analysis (last 7 days)
  static async getDailyAnalysis() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const data = await User.aggregate([
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
    const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
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

    const data = await User.aggregate([
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

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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

    const data = await User.aggregate([
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




export const getUsersWhoSetMyProxyService = async (
  myUserId: string
): Promise<ProxyUserResponse> => {
  try {
    const objectId = new Types.ObjectId(myUserId);

    const users = await User.find(
      { proxysetId: objectId },
      { _id: 1, email: 1,phoneNumber:1 ,firstName:1,lastName:1}
    ).sort({ createdAt: -1 });

    const proxyUsers: ProxyUser[] = users.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber,
    }));

    return {
      status: true,
      data: proxyUsers
    };
  } catch (error) {
    return {
      status: false,
      data: []
    };
  }
};






//end admin login 




export const adminLoginService = async (
  email: string,
  password: string
) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  if (
    user.role !== Role.ADMIN &&
    user.role !== Role.SUPER_ADMIN
  ) {
    throw new Error("Access denied. Admin privileges are required.");
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    config.jwt_secret as string,
    { expiresIn: "30d" }
  );

  return { user, token };
};