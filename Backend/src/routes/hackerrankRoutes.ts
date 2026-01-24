import express from 'express';
import { getBadges, getScores } from '../controllers/hackerrankController.js';

const router = express.Router();

router.get('/:username/badges', getBadges);
router.get('/:username/scores', getScores);

export default router;
