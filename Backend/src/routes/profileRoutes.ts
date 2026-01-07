import express from 'express';
import { getUserProfile, updateProfile, getProfileByUsername } from '../controllers/profileController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Public
router.get('/u/:username', getProfileByUsername);
router.get('/:userId', getUserProfile);

// Protected
router.use(protect);
router.patch('/me', updateProfile);

export default router;
