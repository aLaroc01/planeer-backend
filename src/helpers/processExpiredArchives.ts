import { User } from "../app/modules/auth/user.model";
import { PlanStatus } from "../app/modules/auth/user.interface";
import { restoreExpiredArchive } from "./restoreExpiredArchive";

export const processExpiredArchives = async () => {
  const cursor = User.find({
    planStatus: PlanStatus.ARCHIVED,
    archiveExpiresAt: {
      $type: "date",
      $lte: new Date(),
    },
  })
    .select("_id")
    .lean()
    .cursor();

  let restoredCount = 0;
  let failedCount = 0;

  for await (const user of cursor) {
    try {
      const restored = await restoreExpiredArchive(
        user._id.toString(),
      );

      if (restored) restoredCount += 1;
    } catch (error) {
      failedCount += 1;

      console.error("Archive restoration failed", {
        userId: user._id.toString(),
        error,
      });
    }
  }

  return {
    restoredCount,
    failedCount,
  };
};