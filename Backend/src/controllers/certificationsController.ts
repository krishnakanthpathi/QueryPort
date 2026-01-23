import type { Request, Response, NextFunction } from 'express';
import Certification from '../models/Certification.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { cloudinary } from '../utils/cloudinary.js';

// Protected: Create New Certification
export const createCertification = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    // Handle file upload
    const file = req.file;
    let imageUrl = '';

    if (file) {
        imageUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'queryport/certifications/images',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            uploadStream.end(file.buffer);
        });
    }

    const {
        name,
        issuingOrganization,
        issueDate,
        credentialId,
        credentialUrl,
    } = req.body;

    // Use uploaded image or one provided in body
    const finalImage = imageUrl || req.body.image;

    const certification = await Certification.create({
        userId,
        name,
        issuingOrganization,
        issueDate,
        credentialId,
        credentialUrl,
        image: finalImage,
    });

    res.status(201).json({
        status: 'success',
        data: {
            certification,
        },
    });
});

// Public: Get All Certifications
export const getAllCertifications = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const skip = (page - 1) * limit;

    const [certifications, total] = await Promise.all([
        Certification.find()
            .populate('userId', 'name email avatar username')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Certification.countDocuments()
    ]);

    res.status(200).json({
        status: 'success',
        results: certifications.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: {
            certifications,
        },
    });
});

// Public: Get Certification by ID
export const getCertificationById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const certification = await Certification.findById(id).populate('userId', 'name email avatar username');

    if (!certification) {
        return next(new AppError('Certification not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            certification,
        },
    });
});

// Protected: Update Certification
export const updateCertification = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const file = req.file;

    let certification = await Certification.findById(id);

    if (!certification) {
        return next(new AppError('Certification not found', 404));
    }

    // Check if user is the owner
    // @ts-ignore
    if (certification.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to update this certification', 403));
    }

    let newImageUrl = '';

    if (file) {
        newImageUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'queryport/certifications/images',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            uploadStream.end(file.buffer);
        });
    }

    const {
        name,
        issuingOrganization,
        issueDate,
        credentialId,
        credentialUrl,
    } = req.body;

    const updateData: any = {
        name,
        issuingOrganization,
        issueDate,
        credentialId,
        credentialUrl,
        updatedAt: Date.now(),
    };

    if (newImageUrl) updateData.image = newImageUrl;

    // If no new file, but body has image url (e.g. keeping existing or changing to external url)
    if (!newImageUrl && req.body.image !== undefined) {
        updateData.image = req.body.image;
    }

    certification = await Certification.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        data: {
            certification,
        },
    });
});

// Protected: Delete Certification
export const deleteCertification = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const certification = await Certification.findById(id);

    if (!certification) {
        return next(new AppError('Certification not found', 404));
    }

    // Check if user is the owner
    // @ts-ignore
    if (certification.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to delete this certification', 403));
    }

    await Certification.findByIdAndDelete(id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Protected: Get My Certifications
export const getMyCertifications = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const skip = (page - 1) * limit;

    const [certifications, total] = await Promise.all([
        Certification.find({ userId })
            .populate('userId', 'name email avatar username')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }),
        Certification.countDocuments({ userId })
    ]);

    res.status(200).json({
        status: 'success',
        results: certifications.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: {
            certifications,
        },
    });
});
