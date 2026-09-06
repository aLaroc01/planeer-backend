"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalGetService = exports.PersonalUpdateService = void 0;
const personal_model_1 = require("./personal.model");
const PersonalUpdateService = async (req) => {
    try {
        let user_id = req.user?.id;
        const token = req.headers.authorization?.split(" ")[1] || null;
        const answers = req.body.answers || [];
        const updateData = {
            userID: user_id,
            ...Object.fromEntries(answers.map((item) => [item.key, item.answer])),
        };
        const updatedPersonalData = await personal_model_1.PersonalModel.findOneAndUpdate({ userID: user_id }, { $set: updateData }, { upsert: true, new: true });
        return {
            status: "success",
            message: `Financial data updated successfully`,
            updatedPersonalData,
            token: token
        };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.PersonalUpdateService = PersonalUpdateService;
const PersonalGetService = async (req) => {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return { status: "failed", message: "Unauthorized" };
        }
        const personalData = await personal_model_1.PersonalModel.findOne({ userID: user_id }, "-createdAt -updatedAt");
        if (!personalData) {
            return { status: "failed", message: "No financial data found" };
        }
        console.log("ProfileGetService called. Retrieved profile data:", personalData);
        return {
            status: "success",
            data: personalData,
        };
        // const user_id = req.user?.id;
        // if (!user_id) {
        //   return { status: "failed", message: "Unauthorized" };
        // }
        // const personalData = await PersonalModel.findOne(
        //   { userID: user_id },
        //   "-createdAt -updatedAt"
        // );
        // if (!personalData) {
        //   return { status: "failed", message: "No personal data found" };
        // }
        // return {
        //   status: "success",
        //   data: personalData,
        // };
    }
    catch (error) {
        return { status: "failed", message: error.message };
    }
};
exports.PersonalGetService = PersonalGetService;
