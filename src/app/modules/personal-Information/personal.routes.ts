import express from "express";
import { auth } from './../../middleware/auth.middleware';
import { GetPersonalData,  GetPersonalForProxy,  UpdatePersonal } from "./personal.controller";





const router = express.Router();

// create personal Information 
// router.post("/CreateFinancial",auth,UpdatePersonal)

// update personal info
router.post("/updatePersonal",auth,UpdatePersonal)

// get personal info
router.get("/getPersonalData", auth, GetPersonalData)

router.get("/GetPersonalForProxy/:grantorId", auth, GetPersonalForProxy);





















export const personalRoutes = router;