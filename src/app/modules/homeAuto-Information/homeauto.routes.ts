
import express from "express";
import { auth } from './../../middleware/auth.middleware';
import { GetHomeautoData, GetHomeAutoForProxy, HomeAutoUpdate } from "./homeauto.controller";
import { requireEntitledGrantor } from './../../middleware/requireEntitledGrantor';






const router = express.Router();

// create Financial Information 
router.post("/CreateHomeAuto", auth, requireEntitledGrantor, HomeAutoUpdate);

//update Financial Information
router.post("/UpdateHomeAuto", auth, requireEntitledGrantor, HomeAutoUpdate);

//get Financial Information
router.get("/GetHomeautoData", auth, requireEntitledGrantor, GetHomeautoData);

router.get("/GetHomeAutoForProxy/:grantorId", auth, GetHomeAutoForProxy);




export const homeautoRoutes = router;