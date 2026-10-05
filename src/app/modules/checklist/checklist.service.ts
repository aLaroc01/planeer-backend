import Checklist, { IChecklist, } from "./checklist.model";

import { requireActiveProxyConnection, } from "../services/proxyAccess.service";


type ChecklistPayload = Pick<IChecklist,"items">;

export default class ChecklistService {
  public createChecklist = async (
    userId: string,
    payload: ChecklistPayload
  ) => {
    return Checklist.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: payload.items,
        },

        $setOnInsert: {
          userId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );
  };


  public getChecklistByUserService = async (
    userId: string
  ) => {
    return Checklist.findOne({
      userId,
    }).lean();
  };


  public updateChecklistByUser = async (
    userId: string,
    payload: ChecklistPayload
  ) => {
    return Checklist.findOneAndUpdate(
      { userId },
      {
        $set: {
          items: payload.items,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );
  };


  public deleteChecklistByUser = async (
    userId: string
  ) => {
    return Checklist.findOneAndDelete({
      userId,
    });
  }
}

/*
 * Proxy read-only access:
 *
 * 1. Confirms the authenticated proxy has an active
 *    connection to the requested grantor.
 * 2. Returns only the grantor's checklist data.
 * 3. Treats a missing grantor checklist as a valid empty
 *    state rather than an error.
 */
export const getChecklistForProxy = async (
  proxyUserId: string,
  grantorId: string
) => {
  const access =
    await requireActiveProxyConnection({
      proxyUserId,
      grantorId,
    });

  if (!access.ok) {
    const error = new Error(access.message);

    Object.assign(error, {
      statusCode: access.statusCode,
    });

    throw error;
  }

  const checklist = await Checklist.findOne({
    userId: grantorId,
  })
    .select("userId items")
    .lean();

  return {
    status: "success",
    data: checklist || {
      userId: grantorId,
      items: [],
    },
  };
};