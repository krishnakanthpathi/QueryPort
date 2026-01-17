
import express from 'express';
import {
    createSkill,
    getAllSkills,
    getMySkills,
    addSkillToProfile,
    removeSkillFromProfile,
} from '../controllers/skillsController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

// Public routes (if any) - currently all protected as per typical use case, but viewing might be public later?
// For now, let's protect everything or at least modification.
// User needs to be logged in to create or add/remove skills.

router.use(protect);

router.route('/')
    .get(getAllSkills)
    .post(createSkill);

router.get('/my-skills', getMySkills);
router.post('/add-to-profile', addSkillToProfile);
router.delete('/remove-from-profile/:id', removeSkillFromProfile);

export default router;
