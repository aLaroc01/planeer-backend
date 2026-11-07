"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChecklistForProxy = void 0;
const checklist_model_1 = __importDefault(require("./checklist.model"));
const proxyAccess_service_1 = require("../services/proxyAccess.service");
class ChecklistService {
    createChecklist = async (userId, payload) => {
        return checklist_model_1.default.findOneAndUpdate({ userId }, {
            $set: {
                items: payload.items,
            },
            $setOnInsert: {
                userId,
            },
        }, {
            upsert: true,
            new: true,
            runValidators: true,
        });
    };
    getChecklistByUserService = async (userId) => {
        return checklist_model_1.default.findOne({
            userId,
        }).lean();
    };
    updateChecklistByUser = async (userId, payload) => {
        return checklist_model_1.default.findOneAndUpdate({ userId }, {
            $set: {
                items: payload.items,
            },
        }, {
            new: true,
            runValidators: true,
        });
    };
    deleteChecklistByUser = async (userId) => {
        return checklist_model_1.default.findOneAndDelete({
            userId,
        });
    };
}
exports.default = ChecklistService;
/*
 * Proxy read-only access:
 *
 * 1. Confirms the authenticated proxy has an active
 *    connection to the requested grantor.
 * 2. Returns only the grantor's checklist data.
 * 3. Treats a missing grantor checklist as a valid empty
 *    state rather than an error.
 */
const getChecklistForProxy = async (proxyUserId, grantorId) => {
    const access = await (0, proxyAccess_service_1.requireActiveProxyConnection)({
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
    const checklist = await checklist_model_1.default.findOne({
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
exports.getChecklistForProxy = getChecklistForProxy;
