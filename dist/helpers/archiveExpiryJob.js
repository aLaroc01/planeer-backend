"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startArchiveExpiryJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const processExpiredArchives_1 = require("./processExpiredArchives");
const startArchiveExpiryJob = () => {
    return node_cron_1.default.schedule("0 0 * * *", async () => {
        try {
            const result = await (0, processExpiredArchives_1.processExpiredArchives)();
            console.info("Daily archive expiry sweep completed", result);
        }
        catch (error) {
            console.error("Daily archive expiry sweep failed", error);
        }
    }, {
        name: "archive-expiry",
        timezone: "UTC",
        noOverlap: true,
    });
};
exports.startArchiveExpiryJob = startArchiveExpiryJob;
