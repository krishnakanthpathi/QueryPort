import express from 'express';
import {
    createCertification,
    getAllCertifications,
    getCertificationById,
    updateCertification,
    deleteCertification,
    getMyCertifications
} from '../controllers/certificationsController.js';
import { protect } from '../controllers/authController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public routes
router.get('/', getAllCertifications);
router.get('/id/:id', getCertificationById);

// Protected routes
router.use(protect);

router.post('/', upload.single('image'), createCertification);
router.get('/my-certifications', getMyCertifications);
router.patch('/id/:id', upload.single('image'), updateCertification);
router.delete('/id/:id', deleteCertification);

export default router;
