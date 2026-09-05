import express from "express";

import { auth } from '../../middleware/auth.middleware';
import { GetProfileData,  createProfile, UpdateProfile, updateSuggestionStatus } from './profile.controller';

const router = express.Router();

// create profile information
router.post("/profile/create", auth, createProfile);

// update profile information
router.post("/profile/update", auth, UpdateProfile);

// get profile information
router.get("/GetProfile", auth, GetProfileData);

router.patch(
  "/profile/suggestions/:key",
  auth,
  updateSuggestionStatus,
);

export const profileRoutes = router;