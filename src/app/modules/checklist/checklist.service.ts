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

  public getChecklistByUser = async (userId: string) => {
    return Checklist.findOne({ userId });
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