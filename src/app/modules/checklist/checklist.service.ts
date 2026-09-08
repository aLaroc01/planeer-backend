import Checklist, { IChecklist } from "./checklist.model";

type ChecklistPayload = Pick<IChecklist, "items">;

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
  

  public getChecklistByUserService = async (userId: string) => {
    const checklist = await Checklist.findOne({ userId }).lean();
    return checklist || null;
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

  public deleteChecklistByUser = async (userId: string) => {
    return Checklist.findOneAndDelete({ userId });
  };
}