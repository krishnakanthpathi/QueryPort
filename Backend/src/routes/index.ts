import express from 'express';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import projectRoutes from './projectsRoutes.js';
import achievementRoutes from './achievementsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use("/projects", projectRoutes);
router.use("/achievements", achievementRoutes);

export default router;
