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
import { SocialInfoModel } from "../../modules/social-Information/social.model";
import { ProxyUser, ProxyUserResponse, AccountStatus, Role } from "./user.interface";
import { AuditLog } from "../audit-log/auditLog.model";
import { AuditAction } from "../audit-log/auditLog.interface";
import { http } from "winston";
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

  const filledFields = FIELDS.filter(field => {
    const value = body[field];
    if (!value) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    return true;
  }).length;

  // const userPercentage = Math.round((filledFields / FIELDS.length) * 100);

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
      if (field === undefined || field === null) return false;
      if (typeof field === "string") return field.trim() !== "";
      return true;
    }).length;

    const totalFields = fields.length;
    const userPercentage = Math.round((filledFields / totalFields) * 100);

    updateData.userPercentage = userPercentage;

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
      userPercentage,
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

    const [medicalExists, financialExists, homeAutoExists, socialExists, personalExists, profileExists] =
      await Promise.all([
        MedicalInfoModel.exists({ userID: userId }),
        FinancialModel.exists({ userID: userId }),
        HomeAutoModel.exists({ userID: userId }),
        SocialInfoModel.exists({ userID: userId }),
        PersonalModel.exists({ userID: userId }),
        ProfileModel.exists({ userID: userId }),
      ]);

    const createTasks = [];

    if (!medicalExists) createTasks.push(MedicalInfoModel.create({ userID: userId }));
    if (!financialExists) createTasks.push(FinancialModel.create({ userID: userId }));
    if (!homeAutoExists) createTasks.push(HomeAutoModel.create({ userID: userId }));
    if (!socialExists) createTasks.push(SocialInfoModel.create({ userID: userId }));
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





//proxysetId  data 


// export const getAllOwnUserDataService = async (loggedInUserId: string) => {

//   const user = await User.findById(loggedInUserId);
//   if (!user) throw new Error("USER_NOT_FOUND");


//   const [homeauto, medical, financial,socialInfo, personalInfo] = await Promise.all([
//     HomeAutoModel.find({ userID: loggedInUserId }),
//     MedicalModel.find({ userID: loggedInUserId }),
//     FinancialModel.find({ userID: loggedInUserId }),
//     SocialInfoModel.find({ userID: loggedInUserId }),
//     PersonalModel.find({ userID: loggedInUserId }), 
//     // User.find({ userID: loggedInUserId }),
  
//   ]);
// };

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

  const [homeauto, medical, financial, socialInfo, personalInfo] = await Promise.all([
    HomeAutoModel.find({ userID: user._id }),
    MedicalInfoModel.find({ userID: user._id }),
    FinancialModel.find({ userID: user._id }),
    SocialInfoModel.find({ userID: user._id }),
    PersonalModel.find({ userID: user._id })
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





export const updateUserService = async (req:Request) => {
  try {
       let user_id=req.params.id;
        let requestBody = req.body;
     
        await User.updateOne({_id: user_id}, requestBody, {upsert: true})
        return ({status: true ,message:"User Update successfully"})

  } catch (error) {
    return {status: false, data: error};
  }
}






export const adminUpdateUserService = async (req: Request) => {
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

    if (adminRole !== Role.SUPER_ADMIN) {
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

    const user = await User.findById(userId);

    if (!user) {
      return {
        status: "failed",
        message: "User not found",
      };
    }

    const allowedAccountStatuses = [
      AccountStatus.ACTIVE,
      AccountStatus.SUSPENDED,
      AccountStatus.PENDING_VERIFICATION,
      AccountStatus.DEACTIVATED,
    ];

    const allowedRoles = [
      Role.USER,
      Role.PROXY,
      Role.ADMIN,
      Role.SUPER_ADMIN,
    ];

    const updates: Record<string, string> = {};

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
      if (
        userId === adminId &&
        req.body.role !== Role.SUPER_ADMIN
      ) {
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

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "_id email phoneNumber role accountStatus lastLoginAt mfa.enabled createdAt updatedAt"
    );

    if (!updatedUser) {
      return {
        status: "failed",
        message: "User not found after update",
      };
    }

    const changedFields = Object.keys(updates);

    const roleChanged =
      updates.role !== undefined && updates.role !== before.role;

    const accountStatusChanged =
      updates.accountStatus !== undefined &&
      updates.accountStatus !== before.accountStatus;

    console.log("Creating audit log...", {
        actorId: adminId,
        targetUserId: userId,
        changedFields,
      });

      const auditLog = await AuditLog.create({
        actorId: adminId,
        targetUserId: userId,
        action: roleChanged
          ? AuditAction.USER_ROLE_CHANGED
          : accountStatusChanged
          ? AuditAction.USER_STATUS_CHANGED
          : AuditAction.USER_UPDATED,
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

    

  } catch (error: any) {
    return {
      status: "failed",
      message: error.message,
    };
  }
};






export const getCountsService = async (req: Request) => {
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

    const [
      totalUsers,
      newUsersLastNDays,
      lastMonthUsers,
      currentMonthUsers,
      totalReports
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: nDaysAgo } }),
      User.countDocuments({
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
      }),
      User.countDocuments({
        createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth }
      }),
      ReportModel.countDocuments()
    ]);

    const calculatePercentage = (current: number, previous: number) => {
      if (previous === 0) return 100;
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
  } catch (error) {
    return { status: false, data: error };
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