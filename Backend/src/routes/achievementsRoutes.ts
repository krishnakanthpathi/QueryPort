import express from "express";
import {
    createAchievement,
    getAllAchievements,
    getAchievementById,
    updateAchievement,
    deleteAchievement,
    getMyAchievements
} from "../controllers/achievementsController.js";
import { protect } from "../controllers/authController.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Public Routes
router.get("/", getAllAchievements); // Get all achievements
router.get("/id/:id", getAchievementById); // Get achievement by ID

// Protected Routes
router.post("/", protect, upload.single('image'), createAchievement); // Create new achievement
router.patch("/id/:id", protect, upload.single('image'), updateAchievement); // Update achievement
router.delete("/id/:id", protect, deleteAchievement); // Delete achievement

// User specific routes
router.get("/my-achievements", protect, getMyAchievements); // Get logged in user's achievements

export default router;
