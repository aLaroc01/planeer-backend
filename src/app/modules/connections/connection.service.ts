import { Request } from "express";
import crypto from "crypto";
import Connection from "./connection.model";
import { User } from "../auth/user.model";
import { ProfileModel } from "../Profile-Information/profile.model";
import { sendProxyInviteEmail } from "./sendProxyInviteEmail";
import { SendEmail } from "../../../helpers/emailHelper";
import { populate } from "dotenv";
import { connection, connections } from "mongoose";
import { Schema } from "zod";
import { profile } from "console";

/**
 * Helper: normalize email from body
 */
const getProxyEmail = (body: any) =>
  String(body.proxyEmail || body.email || "").trim().toLowerCase();

/**
 * Helper: enforce grantor-side limit and self-proxy check
 */
const canAddProxyForGrantor = async (grantorId: string, proxyUserId?: string | null) => {
  const currentUser = await User.findById(grantorId);
  if (!currentUser) {
    return { ok: false, message: "Current user not found" };
  }

  const currentProxyCount = Array.isArray(currentUser.proxysetId)
    ? currentUser.proxysetId.length
    : 0;

  if (currentProxyCount >= 2) {
    return { ok: false, message: "You can only have 2 proxies" };
  }

  if (proxyUserId && String(currentUser._id) === String(proxyUserId)) {
    return { ok: false, message: "You cannot add yourself as a proxy" };
  }

  return { ok: true, currentUser };
};

/**
 * Helper: enforce proxy-side limit (max 2 grantors per proxy)
 */
export const canAddGrantorForProxy = async (req: Request) => {
   const currentUserId = req.user?.id;
   const proxySearchEmail = String(req.body.proxyEmail || "").trim().toLowerCase();

   
   if (!currentUserId) {
    return { ok: false, message: "Unauthorized" };
  }

  if (!proxySearchEmail) {
    return { ok: false, message: "Proxy email is required" };
  }

  const activeProxyCount = await Connection.countDocuments({
    proxyEmail: proxySearchEmail,
    status: { $in: ["active", "invited", "PENDING VERIFICATION", "ACTIVE"] },
  });


  if (activeProxyCount >= 2) {
    return { ok: false, message: "This proxy already has 2 grantors" };
  }

  if (activeProxyCount === 0 ) {
    return { ok: false, message: "There is no user with this email"};
  }

// 2) Check if *this* grantor is already connected to this proxy
  const existingConnection = await Connection.findOne({
    proxyEmail: proxySearchEmail,
    grantorId: currentUserId,
    status: { $in: ["active", "invited"] },
  });

  if (existingConnection) {
    return {
      ok: false,
      message: "You are already connected or have invited this proxy",
    };
  }

  const proxyIdFound = await Connection.findOne({
    proxyEmail: proxySearchEmail,
    status: { $in: ["active", "invited"] },
  });


  const profile = await ProfileModel.findOne({ userID: proxyIdFound.proxyUserId, }).select(
      "firstName lastName city state"
    );

  const userImg = await User.findOne({_id: proxyIdFound.proxyUserId, }). select(
    "imgUrl"
  );


// console.log("info stuff:", profile?.firstName, profile?.lastName, profile?.city, profile?.state, userImg?.imgUrl)

  return {
    status: "success",
    data: {
      ok: true,
      userExists: Boolean(profile),
      profile: profile
        ? {
            firstName: profile.firstName,
            lastName: profile.lastName,
            city: profile.city,
            state: profile.state,
            imgUrl: userImg?.imgUrl,
            proxyId: proxyIdFound.proxyUserId,
          }
        : null,
    },
  };
};

/**
 * Service: create proxy invite OR direct connection
 * - If proxy exists as a user: enforce 2/2 limits and create active Connection
 * - If proxy does NOT exist: create an invited Connection and send email
 */


// export const getConnectionsForUserService = async (req: Request) => {
//   try {
//     const currentUserId = req.user?.id;

//     if (!currentUserId) {
//       return { status: "failed", message: "Unauthorized" };
//     }

//     // Fetch all connections where the user is either grantor or proxy, and populate the other party's basic info for display
//     const connections = await Connection.find({
//       $or: [
//         { grantorId: currentUserId },
//         { proxyUserId: currentUserId },
//       ],
//     })

//     if (!connections.length) {
//       return {
//         status: "success",
//         message: "No connections found",
//         data: [],
//       };
//     }

//     const proxyUserIds = connections?.map((conn) => conn.proxyUserId).filter(Boolean) || [];

//     // console.log("Proxy user IDs to fetch profiles for:", proxyUserIds);

//     // 3) Get profiles whose userID is in proxyUserIds
//     const proxyProfiles = await ProfileModel.find({
//       userID: { $in: proxyUserIds },
//     }).select("userId firstName lastName mainRole address city state");

//     // console.log("Proxy profiles found:", proxyProfiles); // works

//     const userImg = await User.findOne({_id: proxyUserIds, }).select(
//     "imgUrl"
//   );

//   console.log("user image link/url here", userImg);
//     // Build a map: userID -> profile
//     const profileMap = new Map(
//       proxyProfiles.map((p) => [String(p.userID), p])
//     );


//     // 4) Shape the result combining connection + proxy profile
//     const shaped = connections.map((conn) => {
//     const profile = profileMap.get(String(conn.proxyUserId));

//       return {
//         _id: conn._id,
//         proxyAddress: proxyProfiles[0]?.address || "",
//         city: proxyProfiles[0]?.city || "",
//         state: proxyProfiles[0]?.state || "", 
//         proxyUserId: proxyUserIds,
//         proxyFirstName: proxyProfiles[0]?.firstName || "",
//         proxyLastName: proxyProfiles[0]?.lastName || "",
//         connectionRole: proxyProfiles[0]?.mainRole || "",
//         imgUrl: userImg?.imgUrl,
//       };
//     });
//       return {
//         status: "success",
//         message: "Connections retrieved successfully",
//         data: shaped,
//       };
//   } catch (error: any) {
//     return {
//       status: "failed",
//       message: error.message || "Something went wrong",
//     };
//   }

// };

export const getConnectionsForUserService = async (req: Request) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return { status: "failed", message: "Unauthorized" };
    }

    // 1) Find all connections where current user is grantor OR proxy
    const connections = await Connection.find({
      $or: [
        { grantorId: currentUserId },
        { proxyUserId: currentUserId },
      ],
    });

    if (!connections.length) {
      return {
        status: "success",
        message: "No connections found",
        data: [],
      };
    }

    // 2) Collect all "other user" ids (the person on the other side)
    const otherUserIds: string[] = [];

    connections.forEach((conn) => {
      const isGrantor = String(conn.grantorId) === String(currentUserId);
      const otherId = isGrantor ? conn.proxyUserId : conn.grantorId;

      if (otherId) {
        otherUserIds.push(String(otherId));
      }
    });

    // 3) Fetch profiles for those other users
    const otherProfiles = await ProfileModel.find({
      userID: { $in: otherUserIds },
    }).select("userID firstName lastName mainRole address city state");

    // 4) Fetch user images for those other users
    const otherUsers = await User.find({
      _id: { $in: otherUserIds },
    }).select("_id imgUrl");

    // Build maps: userID -> profile / user
    const profileMap = new Map(
      otherProfiles.map((p) => [String(p.userID), p])
    );

    const userImgMap = new Map(
      otherUsers.map((u) => [String(u._id), u.imgUrl])
    );

    // 5) Shape the result as: viewer vs otherUser
    const shaped = connections.map((conn) => {
      const viewerIsGrantor =
        String(conn.grantorId) === String(currentUserId);

      const viewerRole = viewerIsGrantor ? "GRANTOR" : "PROXY";
      const otherUserId = viewerIsGrantor ? conn.proxyUserId : conn.grantorId;
      const otherRole = viewerIsGrantor ? "PROXY" : "GRANTOR";

      const profile = otherUserId
        ? profileMap.get(String(otherUserId))
        : null;

      const imgUrl = otherUserId
        ? userImgMap.get(String(otherUserId))
        : undefined;

      return {
        _id: conn._id,
        status: conn.status,
        viewerRole,       // role of current user in this connection
        otherUserRole: otherRole, // role of the other side
        otherUserId,
        otherFirstName: profile?.firstName || "",
        otherLastName: profile?.lastName || "",
        otherAddress: profile?.address || "",
        city: profile?.city || "",
        state: profile?.state || "",
        imgUrl: imgUrl || "",
      };
    });

    return {
      status: "success",
      message: "Connections retrieved successfully",
      data: shaped,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Something went wrong",
    };
  }
};



// Update the connections.emergencyPermissions
// export const emergencyPermissionsUpdateService = async (req: Request) => {
//
// }




// check if connection exist, check limit, if (no) to both then create connection request
export const sendConnectionRequestService = async (req: Request) => {

  const currentUserId = req.user?.id;
  // const body = req.body.body;
  const proxyEmail = req.body.proxyEmail;
  const proxyId = req.body.proxyUserId;
  console.log("got the info:", proxyEmail, proxyId);
try {
  // console.log("user info:", req.body);
  if (!currentUserId) {
      return { ok: false, message: "Current user not found" };
    }

  const currentUser = await Connection.findOne({
     grantorId: currentUserId,
     proxyEmail: proxyEmail,
  })
  
    if (currentUser) {
      return { ok: false, message: "You're already connected to this user" };
    }
    
    const activeProxyCount = await Connection.countDocuments({
      grantorId: currentUserId,
      status: { $in: ["active", "invited"] },
    });

    if (activeProxyCount >= 2) {
      return { ok: false, message: "You can only have 2 proxies" };
    }

    const connection = await Connection.create({
        grantorId: currentUserId,
        proxyEmail: proxyEmail,
        proxyUserId: proxyId, // will be set when proxy finishes signup
        status: "invited",
        otpPurpose: null,
      });
      console.log("new connection request:", connection);

      return {
        status: "success",
        message: "Connection request sent successfully",
        connection,
      };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Something went wrong",
    };
  }
}




export const createProxyConnectionService = async (req: Request) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // replace with your frontend URL
    const currentUserId = req.user?.id;
    const email = String(req.body.email || "").trim().toLowerCase();
    const grantorName = req.body.grantorFullname || "Someone";
    const verifyLink = `${frontendUrl}/proxy-signup?email=${encodeURIComponent(
      email
    )}`;

    // if (!currentUserId) {
    //   return { status: "failed", message: "Unauthorized" };
    // }

    if (!email) {
      return { status: "failed", message: "Proxy email is required" };
    }

    // Optional: enforce max 2 proxies for this grantor by counting Connections
    const activeProxyCount = await Connection.countDocuments({
      grantorId: currentUserId,
      email: email,
      status: { $in: ["active", "invited"] }, // count both active and invited to enforce limit upfront
    });
    if (activeProxyCount >= 1) {
      return { status: "failed", message: "You already have this proxy listed" };
    };
    

    // Check for existing invited/active connection with same grantor+email
    const existingConnection = await User.findOne({
      grantorId: currentUserId,
      status: { $in: ["invited", "active"] },
    });

    if (existingConnection) {
      return {
        status: "failed",
        message: "This proxy is already invited or connected",
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes: 10 * 60 * 1000 ms

    // If you want to keep inviteToken as well:
    // const inviteToken = crypto.randomBytes(32).toString("hex");

    await User.updateOne(
       { email },
      {
        $set: {
          email,
          otp,
          otpExpiresAt,
          otpPurpose: "proxy-verification",
          password: "",
        },
      },
      { upsert: true }
    );

    // Send email with OTP and verification link
    const subject = "Planeer Proxy Invitation";
    const text = "This code expires in 10 minutes.";
    const htmlContent = `
      <p>You've been invited to be a proxy by ${grantorName}.</p>
      <p>Your verification code is: <strong>${otp}</strong>. This code expires in 10 minutes.</p>
      <p>Click this link to complete your signup: 
        <a href="${verifyLink}">${verifyLink}</a>
      </p>
    `;

    await SendEmail(email, subject, text, htmlContent);

// 
    if (activeProxyCount === 0) {
      const connection = await Connection.create({
        grantorId: currentUserId,
        proxyEmail: email,
        proxyUserId: null, // will be set when proxy finishes signup
        otp,
        otpExpiresAt,
        otpPurpose: "proxy-verification",
        status: "invited",
      });

      return {
        status: "success",
        message: "Proxy connection email sent successfully",
      };
    }
    else if (activeProxyCount === 1) {
      const connection = await Connection.updateOne(
        { grantorId: currentUserId, proxyEmail: email },
        {
          $set: {
            otp,
            otpExpiresAt,
          }
        }
      );

      return {
        status: "success",
        message: "Resent Proxy connection email successfully",
        data: connection,
      };
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Something went wrong",
    };
  }
};

//     // Case 2: Proxy user does not exist yet -> create invite
//     const grantorCheck = await canAddProxyForGrantor(currentUserId, null);
//     if (!grantorCheck.ok) {
//       return { status: "failed", message: grantorCheck.message };
//     }

//     // Also enforce proxy-side limit by email once they sign up via invite
//     const inviteToken = crypto.randomBytes(32).toString("hex");
//     const inviteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

//     const connection = await Connection.create({
//       grantorId: currentUserId,
//       proxyEmail,
//       proxyUserId: null,
//       inviteToken,
//       inviteExpiresAt,
//       acceptedAt: null,
//       status: "invited",
//     });

//     const inviteUrl = `${process.env.CLIENT_URL}/accept-invite?token=${inviteToken}`;
//     await sendProxyInviteEmail({ to: proxyEmail, inviteUrl });

//     return {
//       status: "success",
//       message: "Invite sent successfully",
//       data: connection,
//     };
//   } catch (error: any) {
//     return {
//       status: "failed",
//       message: error.message || "Something went wrong",
//     };
//   }
// };


// deny connection invite AS proxy
export const denyProxyDirectService = async (req: Request) => {
  
    const proxyId = req.user?.id;
    const connectionId = req.body.connId;

    if (!proxyId) {
      return { status: "failed", message: "Unauthorized" };
    }
try {
    const connection = await Connection.findOneAndUpdate(
      { proxyUserId: proxyId,
         _id: connectionId,
      }, // find the connection where this user is the proxy with connection id
      {
        $set: {
          status: "denied",
          acceptedAt: new Date(), 
        },
      },
    );
    // console.log("deny updated connection:", connection);
    return {
        status: "success",
        message: "Proxy connection was denied!",
        data: connection,
      };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Failed to update your connection",
    };
  }
};



// accept connection invite AS proxy
export const acceptProxyDirectService = async (req: Request) => {
  
    const proxyId = req.user?.id;
    const connectionId = req.body.connId;
    // console.log("connections:", connectionId);
    if (!proxyId) {
      return { status: "failed", message: "Unauthorized" };
    }
try {
    const connection = await Connection.findOneAndUpdate(
      { proxyUserId: proxyId,
         _id: connectionId,
       }, // find the connection where this user is the proxy
      {
        $set: {
          status: "active",
          acceptedAt: new Date(), 
        },
      },
    );
    return {
        status: "success",
        message: "Proxy connection accepted!",
        data: connection,
      };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Failed to update your connection",
    };
  }
};



// update user connection information service
export const updateConnectionProxyService = async (req: Request) => {
  try {
    const proxyId = req.user?._id;

    if (!proxyId) {
      return { status: "failed", message: "Unauthorized" };
    }

    console.log("updateConnectionProxyService req.user:", req.user);

    const connection = await Connection.findOneAndUpdate(
      { proxyUserId: proxyId }, // find the connection where this user is the proxy
      {
        $set: {
          status: "active",
          acceptedAt: new Date(),
          proxyUserId: proxyId, // ensure proxyUserId is set in case it was null before 
        },
        $unset: {
          otp: 1,
          otpExpiresAt: 1,
          otpPurpose: 1,
          releaseStatus: 1, // TODO: adjust later if needed
        },
      },
      { new: true }
    );

    if (!connection) {
      return {
        status: "failed",
        message: "No connection found for this proxy user",
      };
    }

    return {
      status: "success",
      message: "Proxy connection updated successfully",
      data: connection,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Failed to update your connection",
    };
  }
};




export const updateConnectionPreauthorizedReleaseService = async (req: Request) => {
  try {
    const proxyId = req.user?._id;

     if (!proxyId) {
      return { status: "failed", message: "Unauthorized" };
    }

    // Try to find an existing connection by proxyEmail from invite
    let connection = await Connection.findOneAndUpdate(
      {
       proxyUserId: proxyId ,
      },
      {
        $set: {
          status: "active",
          acceptedAt: new Date(),
          otp: null,
          otpExpiresAt: null,
          otpPurpose: null,
        },
      },
      { new: true }
    );

    return {
      status: "success",
      message: "Proxy connection updated successfully",
      data: connection,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Failed to update your connection",
    };
  }
}



/**
 * Service: accept proxy invite AFTER the proxy has authenticated
 * - Attach proxyUserId (from user service / auth)
 * - Enforce proxy-side limit
 */
export const acceptProxyInviteService = async (req: Request) => {
  try {
    const proxyUserId = req.user?.id;
    const proxyEmail = String(req.body.email || req.body.proxyEmail || "").trim().toLowerCase();

    console.log("Accepting proxy invite for email:", proxyEmail, "and user ID:", proxyUserId);

    if (!proxyUserId) {
      return { status: "failed", message: "Unauthorized" };
    }

    if (!proxyEmail) {
      return { status: "failed", message: "Proxy email is required" };
    }

    const connection = await Connection.findOne({
      proxyEmail,
      status: "invited",
    });


    if (!connection) {
      return { status: "failed", message: "Invalid or pending invite not found" };
    }

    
    // connection.proxyUserId = proxyUserId;
    connection.status = "active";
    connection.acceptedAt = new Date();
    connection.proxyUserId = proxyUserId;

    connection.otp = null;
    connection.otpExpiresAt = null;
    connection.otpPurpose = null;

    await connection.save();

    return {
      status: "success",
      message: "Proxy invite accepted",
      data: connection,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message: error.message || "Failed to accept proxy invite",
    };
  }
};