import express from "express";

import { GetAllReviewsController, ReviewController, updateReportAdminController } from "./reviews.controller";
import { auth, isAdmin } from "../../middleware/auth.middleware";










const router = express.Router();

// create Financial Information 
router.post("/create-review",auth,ReviewController)

router.get("/all-reviews", auth,isAdmin,GetAllReviewsController);
// Only admins can update reports
router.put("/reviews/:id", auth,isAdmin, updateReportAdminController);















export const ReviewRoutes = router;