"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetHomeautoData = exports.HomeAutoUpdate = void 0;
const homeauto_service_1 = require("./homeauto.service");
const HomeAutoUpdate = async (req, res) => {
    let result = await (0, homeauto_service_1.HomeAutoService)(req);
    res.json(result);
};
exports.HomeAutoUpdate = HomeAutoUpdate;
const GetHomeautoData = async (req, res) => {
    const result = await (0, homeauto_service_1.HomeautoGetService)(req);
    return res.status(200).json(result);
};
exports.GetHomeautoData = GetHomeautoData;
