"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDigitalData = exports.DigitalInformation = void 0;
const digital_service_1 = require("./digital.service");
const DigitalInformation = async (req, res) => {
    let result = await (0, digital_service_1.DigitalInformationService)(req);
    res.json(result);
};
exports.DigitalInformation = DigitalInformation;
const GetDigitalData = async (req, res) => {
    const result = await (0, digital_service_1.DigitalGetService)(req);
    return res.status(200).json(result);
};
exports.GetDigitalData = GetDigitalData;
