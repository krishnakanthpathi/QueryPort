import type { Request, Response, NextFunction } from 'express';
import Achievement from '../models/Achievement.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { cloudinary } from '../utils/cloudinary.js';

// Protected: Create New Achievement
export const createAchievement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    // Handle file upload
    const file = req.file;
    let imageUrl = '';

    if (file) {
        imageUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'talentlayer/achievements/images',
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
        title,
        description,
        organization,
        date,
        url,
    } = req.body;

    // Use uploaded image or one provided in body
    const finalImage = imageUrl || req.body.image;

    const achievement = await Achievement.create({
        userId,
        title,
        description,
        organization,
        date,
        url,
        image: finalImage,
    });

    res.status(201).json({
        status: 'success',
        data: {
            achievement,
        },
    });
});

// Public: Get All Achievements
export const getAllAchievements = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const achievements = await Achievement.find().populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        results: achievements.length,
        data: {
            achievements,
        },
    });
});

// Public: Get Achievement by ID
export const getAchievementById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const achievement = await Achievement.findById(id).populate('userId', 'name email avatar username');

    if (!achievement) {
        return next(new AppError('Achievement not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            achievement,
        },
    });
});

// Protected: Update Achievement
export const updateAchievement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const file = req.file;

    let achievement = await Achievement.findById(id);

    if (!achievement) {
        return next(new AppError('Achievement not found', 404));
    }

    // Check if user is the owner
    if (achievement.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to update this achievement', 403));
    }

    let newImageUrl = '';

    if (file) {
        newImageUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'talentlayer/achievements/images',
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
        title,
        description,
        organization,
        date,
        url,
    } = req.body;

    const updateData: any = {
        title,
        description,
        organization,
        date,
        url,
        updatedAt: Date.now(),
    };

    if (newImageUrl) updateData.image = newImageUrl;

    // If no new file, but body has image url (e.g. keeping existing or changing to external url)
    if (!newImageUrl && req.body.image !== undefined) {
        updateData.image = req.body.image;
    }

    achievement = await Achievement.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    }).populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        data: {
            achievement,
        },
    });
});

// Protected: Delete Achievement
export const deleteAchievement = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const achievement = await Achievement.findById(id);

    if (!achievement) {
        return next(new AppError('Achievement not found', 404));
    }

    // Check if user is the owner
    if (achievement.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to delete this achievement', 403));
    }

    await Achievement.findByIdAndDelete(id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Protected: Get My Achievements
export const getMyAchievements = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const achievements = await Achievement.find({ userId }).populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        results: achievements.length,
        data: {
            achievements,
        },
    });
});
