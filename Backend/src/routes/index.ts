import express from 'express';
import authRoutes from './authRoutes.js';
import profileRoutes from './profileRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;
