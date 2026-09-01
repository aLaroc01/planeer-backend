"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSocialData = exports.SocialInformation = void 0;
const social_service_1 = require("./social.service");
const SocialInformation = async (req, res) => {
    let result = await (0, social_service_1.SocialInformationService)(req);
    res.json(result);
};
exports.SocialInformation = SocialInformation;
const GetSocialData = async (req, res) => {
    const result = await (0, social_service_1.SocialGetService)(req);
    return res.status(200).json(result);
};
exports.GetSocialData = GetSocialData;
