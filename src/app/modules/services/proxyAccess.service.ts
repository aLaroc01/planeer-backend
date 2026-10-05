import { Types } from "mongoose";
import Connection from "../connections/connection.model";

type ProxyAccessDenied = {
  ok: false;
  statusCode: 400 | 401 | 403;
  message: string;
};

type ProxyAccessGranted = {
  ok: true;
};

type ProxyAccessResult =
  | ProxyAccessDenied
  | ProxyAccessGranted;

export const getAuthenticatedUserId = (
  user?: {
    id?: unknown;
    userId?: unknown;
    _id?: unknown;
  }
) => {
  const id =
    user?.id ||
    user?.userId ||
    user?._id ||
    "";

  return String(id).trim();
};

export const requireActiveProxyConnection = async ({
  proxyUserId,
  grantorId,
}: {
  proxyUserId?: string;
  grantorId?: string;
}): Promise<ProxyAccessResult> => {
  const normalizedProxyUserId = String(
    proxyUserId || ""
  ).trim();

  const normalizedGrantorId = String(
    grantorId || ""
  ).trim();

  if (!normalizedProxyUserId) {
    return {
      ok: false,
      statusCode: 401,
      message: "Unauthorized",
    };
  }

  if (
    !Types.ObjectId.isValid(
      normalizedProxyUserId
    )
  ) {
    return {
      ok: false,
      statusCode: 401,
      message: "Invalid authenticated user.",
    };
  }

  if (
    !Types.ObjectId.isValid(
      normalizedGrantorId
    )
  ) {
    return {
      ok: false,
      statusCode: 400,
      message: "Invalid grantor ID.",
    };
  }

  const connection = await Connection.findOne({
    proxyUserId: new Types.ObjectId(
      normalizedProxyUserId
    ),
    grantorId: new Types.ObjectId(
      normalizedGrantorId
    ),
    status: "active",
  })
    .select("_id")
    .lean();

  if (!connection) {
    return {
      ok: false,
      statusCode: 403,
      message:
        "You do not have an active connection to this grantor.",
    };
  }

  return {
    ok: true,
  };
};