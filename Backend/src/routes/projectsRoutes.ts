import express from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getMyProjects
} from "../controllers/projectsController.js";
import { protect } from "../controllers/authController.js";

const router = express.Router();

// Public Routes
router.get("/", getAllProjects); // Get all projects
router.get("/id/:projectId", getProjectById); // Get project by ID

// Protected Routes
router.post("/", protect, createProject); // Create new project
router.patch("/id/:projectId", protect, updateProject); // Update project
router.delete("/id/:projectId", protect, deleteProject); // Delete project

// User specific routes
router.get("/my-projects", protect, getMyProjects); // Get logged in user's projects

export default router;