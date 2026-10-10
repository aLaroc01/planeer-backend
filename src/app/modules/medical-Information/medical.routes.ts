
import express from "express";

import { auth } from './../../middleware/auth.middleware';
import { GetMedicalData, GetMedicalForProxy, UpdateMedical } from "./medical.controller";
import { requireEntitledGrantor } from './../../middleware/requireEntitledGrantor';



const router = express.Router();

// create Financial Information 
router.post("/CreateMedical", auth, requireEntitledGrantor, UpdateMedical)
//update Medical Information
router.post("/UpdateMedical", auth, requireEntitledGrantor, UpdateMedical)

router.get("/GetMedicalData", auth, requireEntitledGrantor, GetMedicalData)

router.get("/GetMedicalForProxy/:grantorId", auth, GetMedicalForProxy);





export const medicalRoutes = router;