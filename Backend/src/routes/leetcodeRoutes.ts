import express from 'express';
import { getLeetCodeData } from '../controllers/leetcodeController.js';

const router = express.Router();

router.post('/', getLeetCodeData);

export default router;
