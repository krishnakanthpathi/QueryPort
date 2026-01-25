import express from 'express';
import { addEducation, getMyEducation, updateEducation, deleteEducation, getEducationByUsername } from '../controllers/educationController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.get('/u/:username', getEducationByUsername);

// Protected routes
router.use(protect);
router.get('/', getMyEducation);
router.post('/', addEducation);
router.patch('/:id', updateEducation);
router.delete('/:id', deleteEducation);

export default router;
