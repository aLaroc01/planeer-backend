

import express from "express";

import { auth } from '../../middleware/auth.middleware';

import { GetDigitalData, DigitalInformation } from "./digital.controller";





const router = express.Router();

// create Financial Information 
router.post("/CreateDigitalInfo",auth,DigitalInformation)
router.post("/UpdateDigitalInfo",auth,DigitalInformation)
router.get("/GetDigitalData",auth,GetDigitalData)




















export const digitalRoutes = router;