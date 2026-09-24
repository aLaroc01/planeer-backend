import { Request } from "express";
import { Types } from "mongoose";
import Connection from "./connection.model";
import { User } from "../auth/user.model";
import { ProfileModel } from "../Profile-Information/profile.model";
import { sendProxyInviteEmail } from "./sendProxyInviteEmail";
import { SendEmail } from "../../../helpers/emailHelper";
import { populate } from "dotenv";
import { connection, connections } from "mongoose";
import { Schema } from "zod";
import { profile } from "console";
import Checklist from "../checklist/checklist.model";
import mongoose from "mongoose";

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
export const canAddGrantorForProxy = async (
  req: Request,
) => {
  try {
    const currentUserId = req.user?.id;

    const proxyEmail = String(
      req.body?.proxyEmail || "",
    )
      .trim()
      .toLowerCase();

    if (!currentUserId) {
      return {
        status: "failed",
        message: "Unauthorized.",
      };
    }

    if (!proxyEmail) {
      return {
        status: "failed",
        message: "Proxy email is required.",
      };
    }

    const proxyUser = await User.findOne({
      email: proxyEmail,
    })
      .select("_id email")
      .lean();

    if (!proxyUser) {
      return {
        status: "failed",
        message: "No Planeer user exists with this email.",
      };
    }

    const existingConnection = await Connection.findOne({
      grantorId: currentUserId,
      proxyUserId: proxyUser._id,
      status: {
        $in: ["invited", "active"],
      },
    }).lean();

    if (existingConnection) {
      return {
        status: "failed",
        message:
          "You are already connected to or have invited this person.",
      };
    }

    const proxyGrantorCount =
      await Connection.countDocuments({
        proxyUserId: proxyUser._id,
        status: {
          $in: ["invited", "active"],
        },
      });

    /*
      0 connections → invitation allowed
      1 connection  → invitation allowed
      2 connections → blocked
    */
    if (proxyGrantorCount >= 2) {
      return {
        status: "failed",
        message: "This proxy already has 2 grantors.",
      };
    }

    const profile = await ProfileModel.findOne({
      userID: proxyUser._id,
    })
      .select(
        "firstName lastName city state imgUrl",
      )
      .lean();

    return {
      status: "success",
      data: {
        ok: true,
        userExists: true,
        proxyUserId: String(proxyUser._id),
        currentGrantorCount: proxyGrantorCount,
        remainingGrantorSlots: 2 - proxyGrantorCount,
        profile: {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          email: proxyUser.email,
          city: profile?.city || "",
          state: profile?.state || "",
          imgUrl: profile?.imgUrl || "",
        },
      },
    };
  } catch (error: any) {
    console.error(
      "canAddGrantorForProxy error:",
      error,
    );

    return {
      status: "failed",
      message:
        error?.message ||
        "Unable to search for this proxy.",
    };
  }
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
   const currentUserId = req.user?.id;
  try {
    if (!currentUserId) {
      return {
        status: "failed",
        message: "Current user not found.",
      };
    }

    const currentUserObjectId = new Types.ObjectId(currentUserId);

    const connections = await Connection.find({
      $or: [
        { grantorId: currentUserObjectId },
        { proxyUserId: currentUserObjectId },
      ],
      status: {
        $in: ["invited", "active"],
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const otherUserIds = connections
      .map((connection) => {
        const viewerIsGrantor =
          String(connection.grantorId) === String(currentUserObjectId);

        return viewerIsGrantor
          ? connection.proxyUserId
          : connection.grantorId;
      })
      .filter(Boolean)
      .map((id) => new Types.ObjectId(String(id)));

    const uniqueOtherUserIds = [
      ...new Map(
        otherUserIds.map((id) => [String(id), id]),
      ).values(),
    ];

    const [otherUsers, otherProfiles] = await Promise.all([
      User.find({
        _id: { $in: uniqueOtherUserIds },
      })
        .select("_id email")
        .lean(),

      ProfileModel.find({
        userID: { $in: uniqueOtherUserIds },
      })
        .select("userID firstName lastName city state imgUrl")
        .lean(),
    ]);

    const usersById = new Map(
      otherUsers.map((user) => [String(user._id), user]),
    );

    const profilesByUserId = new Map(
      otherProfiles.map((profile) => [
        String(profile.userID),
        profile,
      ]),
    );

    const formattedConnections = connections.map((connection) => {
      const viewerIsGrantor =
        String(connection.grantorId) ===
        String(currentUserObjectId);

      const otherUserId = viewerIsGrantor
        ? connection.proxyUserId
        : connection.grantorId;

      const otherUser = otherUserId
        ? usersById.get(String(otherUserId))
        : null;

      const otherProfile = otherUserId
        ? profilesByUserId.get(String(otherUserId))
        : null;

      return {
        _id: connection._id,
        status: connection.status,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,

        viewerRole: viewerIsGrantor ? "grantor" : "proxy",

        otherPerson: {
          userId: otherUserId || null,

          // The email fallback is essential for a newly invited,
          // not-yet-registered proxy.
          email:
            otherUser?.email ||
            (viewerIsGrantor ? connection.proxyEmail : null) ||
            "",

          firstName: otherProfile?.firstName || "",
          lastName: otherProfile?.lastName || "",
          city: otherProfile?.city || "",
          state: otherProfile?.state || "",
          imgUrl: otherProfile?.imgUrl || "",
        },
      };
    });

    return {
      status: "success",
      data: formattedConnections,
    };
  } catch (error: any) {
    return {
      status: "failed",
      message:
        error?.message || "Unable to retrieve connections.",
    };
  }
};

// Update the connections.emergencyPermissions
// export const emergencyPermissionsUpdateService = async (req: Request) => {
//
// }

// check if connection exist, check limit, if (no) to both then create connection request
export const sendConnectionRequestService = async (
  req: Request,
) => {
  try {
    const currentUserId = req.user?.id;

    const proxyEmail = String(
      req.body?.data.proxyEmail || "",
    )
      .trim()
      .toLowerCase();

    const proxyUserId = String(
      req.body?.data.proxyUserId || "",
    ).trim();

    if (!currentUserId) {
      return {
        status: "failed",
        message: "Current user not found.",
      };
    }

    if (!proxyEmail || !proxyUserId) {
      return {
        status: "failed",
        message:
          "A proxy email and proxy user ID are required.",
      };
    }

    const existingConnection = await Connection.findOne({
      grantorId: currentUserId,
      proxyUserId,
      status: {
        $in: ["invited", "active"],
      },
    }).lean();

    if (existingConnection) {
      return {
        status: "failed",
        message:
          "You are already connected to or have invited this person.",
      };
    }

    const proxyGrantorCount =
      await Connection.countDocuments({
        proxyUserId,
        status: {
          $in: ["invited", "active"],
        },
      });

    if (proxyGrantorCount >= 2) {
      return {
        status: "failed",
        message:
          "This proxy already has 2 grantors.",
      };
    }

    const connection = await Connection.create({
      grantorId: currentUserId,
      proxyEmail,
      proxyUserId,
      status: "invited",
      otpPurpose: null,
    });

    return {
      status: "success",
      message: "Connection request sent successfully.",
      data: {
        connection,
      },
    };
  } catch (error: any) {
    console.error(
      "sendConnectionRequestService error:",
      error,
    );

    return {
      status: "failed",
      message:
        error?.message ||
        "Unable to send connection request.",
    };
  }
};




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

    if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
      return { status: "failed", message: "Invalid connection ID" };
    }

    try {
      const connection = await Connection.findOneAndUpdate(
        {
          proxyUserId: new mongoose.Types.ObjectId(proxyId),
          _id: new mongoose.Types.ObjectId(connectionId),
        },
        {
          $set: {
            status: "active",
            acceptedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!connection) {
        return {
          status: "failed",
          message: "Connection not found",
        };
      }

      const grantorId = connection.grantorId.toString();
      const proxyIdStr = connection.proxyUserId.toString();

      // Count active proxies for this grantor
      const activeConnections = await Connection.find({
        grantorId: new mongoose.Types.ObjectId(grantorId),
        status: "active",
        acceptedAt: { $exists: true, $ne: null },
      })
        .sort({ acceptedAt: 1 })
        .select("proxyUserId proxyRole acceptedAt")
        .lean();

      // Enforce max 2 proxies
      if (activeConnections.length > 2) {
        // Revert this connection to non-active or just reject
        await Connection.findByIdAndUpdate(connection._id, {
          $set: { status: "pending" }, // or "rejected" / "disabled" as you prefer
        });

        return {
          status: "failed",
          message: "Maximum of 2 proxies allowed",
        };
      }

      // Assign proxyRole based on order
      const existingPrimary = activeConnections.find(c => c.proxyRole === "primary");
      const existingSecondary = activeConnections.find(c => c.proxyRole === "secondary");

      let assignedRole: "primary" | "secondary" = "primary";

      if (!existingPrimary) {
        assignedRole = "primary";
      } else if (!existingSecondary) {
        assignedRole = "secondary";
      } else {
        // Both already assigned; this should not happen due to the >2 check,
        // but if it does, reject.
        await Connection.findByIdAndUpdate(connection._id, {
          $set: { status: "pending" },
        });
        return {
          status: "failed",
          message: "Maximum of 2 proxies allowed",
        };
      }

      // Set proxyRole on this connection
      await Connection.findByIdAndUpdate(connection._id, {
        $set: { proxyRole: assignedRole },
      });

      // Update checklist (if exists)
      const existingChecklist = await Checklist.findOne({
        userId: new mongoose.Types.ObjectId(grantorId),
      });

      if (!existingChecklist) {
        return {
          status: "success",
          message: "Proxy connection accepted!",
          data: { connection },
        };
      }

      const primaryProxyId =
        activeConnections.find(c => c.proxyRole === "primary")?.proxyUserId?.toString() || null;

      const secondaryProxyId =
        activeConnections.find(c => c.proxyRole === "secondary")?.proxyUserId?.toString() || null;

      const updatedChecklist = await Checklist.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(grantorId) },
        {
          primaryProxyId: primaryProxyId ? new mongoose.Types.ObjectId(primaryProxyId) : null,
          secondaryProxyId: secondaryProxyId ? new mongoose.Types.ObjectId(secondaryProxyId) : null,
        },
        { new: true }
      );

      return {
        status: "success",
        message: "Proxy connection accepted!",
        data: {
          connection,
          checklist: updatedChecklist,
        },
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