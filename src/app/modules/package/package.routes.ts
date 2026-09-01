import express from 'express';

import { PackageController } from './package.controller';

import { auth } from '../../middleware/auth.middleware';



const router = express.Router();


router.post("/packages-create",auth, PackageController.createPackage);

// Update a package
router.put("/packages/:id", auth, PackageController.updatePackage);

// Get all packages (with query params)
router.get("/packages", auth, PackageController.getPackage);

// Get package details by ID
router.get("/packages/:id", auth, PackageController.packageDetails);

// Delete a package
router.delete("/packages/:id", auth, PackageController.deletePackage);

// Get packages by user (with query params)
router.get("/packages/user", auth, PackageController.getPackageByUser);


export const PackageRoutes = router;
