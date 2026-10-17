import cron from "node-cron";
import { processExpiredArchives } from "./processExpiredArchives";

export const startArchiveExpiryJob = () => {
  return cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        const result = await processExpiredArchives();

        console.info(
          "Daily archive expiry sweep completed",
          result,
        );
      } catch (error) {
        console.error(
          "Daily archive expiry sweep failed",
          error,
        );
      }
    },
    {
      name: "archive-expiry",
      timezone: "UTC",
      noOverlap: true,
    },
  );
};