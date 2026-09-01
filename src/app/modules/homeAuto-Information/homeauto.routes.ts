
import express from "express";

import { auth } from './../../middleware/auth.middleware';

import { GetHomeautoData, HomeAutoUpdate } from "./homeauto.controller";






const router = express.Router();

// create Financial Information 
router.post("/CreateHomeAuto",auth,HomeAutoUpdate)
//update Financial Information
router.post("/UpdateHomeAuto",auth,HomeAutoUpdate)

//get Financial Information
router.get("/GetHomeautoData",auth,GetHomeautoData)























export const homeautoRoutes = router;