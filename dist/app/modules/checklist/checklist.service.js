"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checklist_model_1 = __importDefault(require("./checklist.model"));
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
    getChecklistByUser = async (userId) => {
        return checklist_model_1.default.findOne({ userId });
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
        return checklist_model_1.default.findOneAndDelete({ userId });
    };
}
exports.default = ChecklistService;
