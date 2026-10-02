import express from "express";
import { auth } from './../../middleware/auth.middleware';
import { GetFinancialData,  UpdateFinancial, GetFinancialForProxy } from "./financial.controller";



const router = express.Router();

// create Financial Information 
router.post("/CreateFinancial", auth, UpdateFinancial);
router.post("/UpdateFinancial", auth, UpdateFinancial);
router.get("/GetFinancialData", auth, GetFinancialData);
router.get("/GetFinancialForProxy/:grantorId", auth, GetFinancialForProxy);





















export const financialRoutes = router;