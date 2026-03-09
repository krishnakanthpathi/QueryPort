import express from 'express';
import { addExperience, getMyExperience, updateExperience, deleteExperience, getExperienceByUsername } from '../controllers/experienceController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.get('/u/:username', getExperienceByUsername);

// Protected routes
router.use(protect);
router.get('/', getMyExperience);
router.post('/', addExperience);
router.patch('/:id', updateExperience);
router.delete('/:id', deleteExperience);

export default router;
