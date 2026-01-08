import express from 'express';
import { signup, login, googleAuth } from '../controllers/authController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send(JSON.stringify({ message: 'Welcome to the Auth Routes' }));
});
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);

export default router;
