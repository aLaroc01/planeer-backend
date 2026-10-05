

import express from "express";

import { auth } from '../../middleware/auth.middleware';

import { GetDigitalData, DigitalInformation, GetDigitalForProxy } from "./digital.controller";





const router = express.Router();

// create Financial Information 
router.post("/CreateDigitalInfo", auth, DigitalInformation)

router.post("/UpdateDigitalInfo", auth, DigitalInformation)

router.get("/GetDigitalData", auth,GetDigitalData)

router.get("/GetDigitalForProxy/:grantorId", auth, GetDigitalForProxy);




















export const digitalRoutes = router;