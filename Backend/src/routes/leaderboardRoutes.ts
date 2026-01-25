import express from 'express';
import { getLeaderboard, syncStats } from '../controllers/leaderboardController.js';
import { protect } from '../controllers/authController.js';

const router = express.Router();

router.get('/', getLeaderboard);
router.post('/sync', protect, syncStats);

export default router;
