"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPersonalData = exports.UpdatePersonal = void 0;
const personal_service_1 = require("./personal.service");
const UpdatePersonal = async (req, res) => {
    try {
        const result = await (0, personal_service_1.PersonalUpdateService)(req);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.UpdatePersonal = UpdatePersonal;
const GetPersonalData = async (req, res) => {
    try {
        const result = await (0, personal_service_1.PersonalGetService)(req);
        return res.status(result.status === "success" ? 200 : 400).json(result);
    }
    catch (error) {
        return res.status(500).json({
            status: "failed",
            message: error.message || "Something went wrong",
        });
    }
};
exports.GetPersonalData = GetPersonalData;
