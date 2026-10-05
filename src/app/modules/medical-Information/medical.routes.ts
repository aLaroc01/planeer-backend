
import express from "express";

import { auth } from './../../middleware/auth.middleware';
import { GetMedicalData, GetMedicalForProxy, UpdateMedical } from "./medical.controller";



const router = express.Router();

// create Financial Information 
router.post("/CreateMedical", auth, UpdateMedical)
//update Medical Information
router.post("/UpdateMedical", auth, UpdateMedical)

router.get("/GetMedicalData", auth, GetMedicalData)

router.get("/GetMedicalForProxy/:grantorId", auth, GetMedicalForProxy);





export const medicalRoutes = router;