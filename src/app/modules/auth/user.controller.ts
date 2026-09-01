import { NextFunction, Request, Response } from "express";
import { adminDeleteUserService, adminEmailService, adminLoginService, adminUpdateUserService, codeVerification,  existingUser,   getAllOwnUserDataService,   getAllUserDataService,  getallUsers, getCountsService, getNewUsersLast10DaysService, getprofileService, getProxysetData, getUserFullProfileService,getUsersWhoAddedMeAsProxyService,getUsersWhoSetMyProxyService,LoginInUser,  ProxysetService, searchUsersService,  updatePassword, updateUserService, UserAnalysisService, userSelfUpdateService } from "./user.service";
import { ProxyUser } from "./user.interface";
import { User } from "./user.model";
import { logSuccess } from "../../../helpers/successLogger";
import logger from "../../../helpers/logger";
import { getErrorCount, incrementErrorCount } from "../../../helpers/errorCounter";
 import jwt from "jsonwebtoken";
 import { config } from './../../config/index';
 import bcrypt from "bcryptjs";











export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await existingUser(req.body);
  
       // password get করা
      const { password } = req.body;
     const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid password");
        }
    
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            config.jwt_secret as string, { expiresIn: "1d" }
        );

      logSuccess(req, "User registered successfully", { userId: user._id, email: user.email });
    return res.status(201).json({success: true,message: "User registered successfully",statusCode: 201, data:{ _id: user._id ,phoneNumber: user.phoneNumber,email: user.email,role: user.role, userPercentage: user.userPercentage, token:token },meta: null});
  } catch (error) {
    next(error);
  }
};






export const loginUser = async (req:Request, res:Response, next:NextFunction) => {
    try{
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const { user,token} = await LoginInUser(email, password);

      
          // 🔹 Success log
    logSuccess(req, "User logged in successfully", { userId: user._id, email: user.email });


      return res.status(200).json({ success: true, message: "User logged in successfully",statusCode: 200, data: {_id: user._id,phoneNumber: user.phoneNumber, email: user.email, role: user.role, token: token },
       meta: null
      });


    }catch(error){
        next(error);
    }
}   










export const GetProfileData=async (req:Request,res:Response,next:NextFunction) => {
  
    let result = await getprofileService(req);
      // 🔹 Success log
    logSuccess(req, "Fetched user profile");
    res.json(result);

}


export const userSelfUpdate = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await userSelfUpdateService(req);

  if (result.status === "success") {
    logSuccess(req, "User updated own profile", {
      userId: req.user?.id,
    });
  }
  
  res.json(result);
};


export const adminDeleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await adminDeleteUserService(req);

  if (result.status === "success") {
    logSuccess(req, "Admin deleted a user", {
      adminId: req.user?.id,
      deletedUserId: req.params.id,
    });
  }

  res.json(result);
};













export const GetAllProfile=async (req:Request,res:Response) => {
  
    let result = await getallUsers();
    res.json(result);

}



export const searchUsersController = async (req: Request, res: Response, next: NextFunction) => {
  const searchTerm = req.query.searchTerm as string;

  if (!searchTerm || typeof searchTerm !== "string") {
    return res.status(400).json({ message: "Search term is required and must be a string" });
  }

  try {
    const users = await searchUsersService(searchTerm);

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
// 🔹 Success log
    logSuccess(req, "Search users successfully", { searchTerm, count: users.length });


    return res.status(200).json({
      status: "success",
      message: "Search results successfully fetched",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ status: "failed", data: error });
  }
};











export const ProxysetController = async (req: Request, res: Response) => {
  const result = await ProxysetService(req);
  logSuccess(req, "Proxy set fetched successfully");
  return res.json(result);
};



// export const getAllProxysetController = async (req: Request, res: Response) => {
//   const { id } = req.params; 
//   const result = await getProxysetData(id);
//   logSuccess(req, "User updated successfully", { userId: req.user?.id || req.params.id });
//   return res.json(result);
// };

export const getAllProxysetController = async (req: Request, res: Response) => {
  // ✅ Convert id safely
  const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const result = await getProxysetData(idStr);

  logSuccess(req, "User updated successfully", { userId: req.user?.id ?? idStr });
  return res.json(result);
};









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


export const alldatapercentage = async (req: Request, res: Response) => {
  try {
    // ✅ Handle string | string[] safely
    const userId: string = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const userProfile = await getUserFullProfileService(userId);

    // 🔹 Success log
    logSuccess(req, "Fetched full user profile", { userId });

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
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};





















// Example: Admin Email
export const AdminEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminEmailService(req);

    logSuccess(req, "Admin email fetched");

    res.json(result);
  } catch (error) {
    next(error);
  }
};






export const codeverify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and otp are required" });
    }

    const result = await codeVerification(email, otp);
    logSuccess(req, "OTP code verified", { email });

    return res.json({ status: "success", message: result.message });
  } catch (error) {
    next(error);
  }
};








export const forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    // If OTP is "0" or not provided, skip verification
    if (otp !== "0" && otp) {
      const result = await codeVerification(email, otp);
      if(result.message !== "Code verified successfully"){
        return res.status(400).json({ message: result.message });
      }
    }

    await updatePassword(email, password);
     logSuccess(req, "User password updated", { email })
    return res.json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};









export const UserList = async (req: Request, res: Response): Promise<void> => {
  try {
    const pageNo = Number(req.query.pageNo) || 1;
    const perPage = Number(req.query.perPage) || 10;
    const searchKeyword = (req.query.searchKeyword as string) || "";

    let matchStage: any = {};
    let addFieldsStage: any = {};

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
    } else {
      addFieldsStage = { isMatched: 0 };
    }

    const total = await User.countDocuments();

    const users = await User.aggregate([
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
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};









export const getNewUsersLast10Days = async (req: Request, res: Response) => {
  try {
    const newUserCount = await getNewUsersLast10DaysService();

    return res.status(200).json({
      success: true,
      message: "Last 10 days new user count fetched successfully",
      count: newUserCount,
    });
  } catch (error) {
    console.error("Error counting last 10 days users:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while counting last 10 days users",
    });
  }
};






    export const updateUserController = async (req:Request,res:Response) => {
    let result = await updateUserService(req);
    res.json(result);

    }


    
   




export const getCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getCountsService(req);

    if (result.status) {
      res.status(200).json({ status: "success", data: result.data });
    } else {
      res.status(500).json({ status: "error", message: "Failed to fetch counts", error: result.data });
    }
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
};










export class UserAnalysisController {
  static async getAnalysis(req: Request, res: Response) {
    try {
      const daily = await UserAnalysisService.getDailyAnalysis();
      const monthly = await UserAnalysisService.getMonthlyAnalysis();
      const yearly = await UserAnalysisService.getYearlyAnalysis();

      res.json({
        success: true,
        daily,
        monthly,
        yearly
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}











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

export const getAllOwnUserDataController = async (req: Request, res: Response) => {
  try {
    // ✅ Handle string | string[] safely
    const loggedInUserId: string = Array.isArray(req.user?.id)
      ? req.user?.id[0] 
      : req.user?.id || ""; 

    if (!loggedInUserId) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const data = await getAllOwnUserDataService(loggedInUserId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};





















export const getAllUserDataController = async (
  req: Request,
  res: Response
) => {
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

    const data = await getAllUserDataService(
      userId,
      loggedInUserId
    );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error: any) {

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



export const getUsersWhoAddedMeAsProxyController = async (
  req: Request,
  res: Response
) => {
  try {
    const myUserId = req.user?.id;

    const users = await getUsersWhoAddedMeAsProxyService(myUserId);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




export const getUsersWhoSetMyProxy = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const myUserId = req.user?.id;

    if (!myUserId) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    const result = await getUsersWhoSetMyProxyService(myUserId);

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
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
};


export const adminLoginController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { user, token } = await adminLoginService(email, password);
    logSuccess(req, "Admin logged in successfully", { userId: user._id, email });
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
  } catch (error) {
    next(error);
  }
};









export const getSystemPerformance = async (req: Request, res: Response, next: NextFunction) => {
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
    logSuccess(req, "System performance fetched successfully", performanceData);

    res.status(200).json({
      status: "success",
      message: "System performance fetched successfully",
      data: performanceData,
      meta: {
        totalErrors: getErrorCount(), // এখন পর্যন্ত কতবার error হয়েছে
        timestamp: new Date(),
      },
    });
  } catch (error: any) {
    incrementErrorCount(); // 🔹 error count বৃদ্ধি
    logger.error("Error fetching system performance", {
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





export const adminUpdateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const result = await adminUpdateUserService(req);

  if (result.status === "success") {
    logSuccess(req, "Admin updated user data", {
      adminId: req.user?.id,
      updatedUserId: req.params.id,
    });
  }

  res.json(result);
};