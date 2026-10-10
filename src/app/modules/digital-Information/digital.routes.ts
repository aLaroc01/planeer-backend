

import express from "express";

import { auth } from '../../middleware/auth.middleware';

import { GetDigitalData, DigitalInformation, GetDigitalForProxy } from "./digital.controller";
import { requireEntitledGrantor } from '../../middleware/requireEntitledGrantor';





const router = express.Router();

// create Financial Information 
router.post("/CreateDigitalInfo", auth, requireEntitledGrantor, DigitalInformation)

router.post("/UpdateDigitalInfo", auth, requireEntitledGrantor, DigitalInformation)

router.get("/GetDigitalData", auth, requireEntitledGrantor, GetDigitalData)

router.get("/GetDigitalForProxy/:grantorId", auth, GetDigitalForProxy);





export const digitalRoutes = router;