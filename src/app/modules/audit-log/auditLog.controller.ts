import { Request, Response } from "express";
import { getUserAuditHistoryService } from "./auditLog.service";

export const getUserAuditHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getUserAuditHistoryService(
      req.params.userId,
      req.user?.role as Parameters<typeof getUserAuditHistoryService>[1]
    );

    const statusCode = result.status === "success" ? 200 : 403;

    res.status(statusCode).json(result);
  } catch (error: any) {
    res.status(500).json({
      status: "failed",
      message: error.message || "Unable to retrieve audit history",
    });
  }
};