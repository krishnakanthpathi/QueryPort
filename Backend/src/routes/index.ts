import express from 'express';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';
import projectRoutes from './projectsRoutes.js';
import achievementRoutes from './achievementsRoutes.js';
import certificationRoutes from './certificationsRoutes.js';
import skillRoutes from './skillRoutes.js';

import leetcodeRoutes from './leetcodeRoutes.js';


const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use("/projects", projectRoutes);
router.use("/achievements", achievementRoutes);
router.use("/certifications", certificationRoutes);
router.use("/skills", skillRoutes);
router.use("/leetcode", leetcodeRoutes);



export default router;
