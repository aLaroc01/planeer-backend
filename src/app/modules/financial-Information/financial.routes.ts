import express from "express";
import { auth } from './../../middleware/auth.middleware';
import { GetFinancialData,  UpdateFinancial, GetFinancialForProxy } from "./financial.controller";
import { requireEntitledGrantor } from './../../middleware/requireEntitledGrantor';



const router = express.Router();

// create Financial Information 
router.post("/CreateFinancial", auth, requireEntitledGrantor, UpdateFinancial);
router.post("/UpdateFinancial", auth, requireEntitledGrantor, UpdateFinancial);
router.get("/GetFinancialData", auth, requireEntitledGrantor, GetFinancialData);
router.get("/GetFinancialForProxy/:grantorId", auth, GetFinancialForProxy);





export const financialRoutes = router;