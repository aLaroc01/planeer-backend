"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetFinancialData = exports.UpdateFinancial = void 0;
const financial_service_1 = require("./financial.service");
const UpdateFinancial = async (req, res) => {
    let result = await (0, financial_service_1.FinancialUpdateService)(req);
    res.json(result);
};
exports.UpdateFinancial = UpdateFinancial;
const GetFinancialData = async (req, res) => {
    const result = await (0, financial_service_1.FinancialGetService)(req);
    return res.status(200).json(result);
};
exports.GetFinancialData = GetFinancialData;
