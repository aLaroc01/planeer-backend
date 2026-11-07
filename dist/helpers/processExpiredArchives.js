"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExpiredArchives = void 0;
const user_model_1 = require("../app/modules/auth/user.model");
const user_interface_1 = require("../app/modules/auth/user.interface");
const restoreExpiredArchive_1 = require("./restoreExpiredArchive");
const processExpiredArchives = async () => {
    const cursor = user_model_1.User.find({
        planStatus: user_interface_1.PlanStatus.ARCHIVED,
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
            const restored = await (0, restoreExpiredArchive_1.restoreExpiredArchive)(user._id.toString());
            if (restored)
                restoredCount += 1;
        }
        catch (error) {
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
exports.processExpiredArchives = processExpiredArchives;
