

import express from "express";

import { auth } from './../../middleware/auth.middleware';

import { GetSocialData, SocialInformation } from "./social.controller";





const router = express.Router();

// create Financial Information 
router.post("/CreateSocialInfo",auth,SocialInformation)
router.post("/UpdateSocialInfo",auth,SocialInformation)
router.get("/GetSocialData",auth,GetSocialData)




















export const socialRoutes = router;