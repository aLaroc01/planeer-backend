import express from "express";
import { auth } from './../../middleware/auth.middleware';
import { GetPersonalData,  GetPersonalForProxy,  UpdatePersonal } from "./personal.controller";
import { requireEntitledGrantor } from './../../middleware/requireEntitledGrantor';



const router = express.Router();


// update personal info
router.post("/updatePersonal",auth,requireEntitledGrantor,UpdatePersonal)
// get personal info
router.get("/getPersonalData", auth, requireEntitledGrantor, GetPersonalData)
router.get("/GetPersonalForProxy/:grantorId", auth, GetPersonalForProxy);




export const personalRoutes = router;