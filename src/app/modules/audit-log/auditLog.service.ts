import { AuditLog } from "./auditLog.model";
import { Role } from "../auth/user.interface";

export const getUserAuditHistoryService = async (
  userId: string,
  requesterRole?: Role
) => {
  if (requesterRole !== Role.SUPER_ADMIN) {
    return {
      status: "failed",
      message: "Only a super admin can view audit history",
    };
  }

  const logs = await AuditLog.find({
    targetUserId: userId,
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .populate({
      path: "actorId",
      select: "email role",
    })
    .select(
      "action changedFields before after actorId createdAt"
    )
    .lean();

  return {
    status: "success",
    data: logs,
  };
};