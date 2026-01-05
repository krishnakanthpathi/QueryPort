import type { Request, Response, NextFunction } from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Public: Get Profile by Username
export const getProfileByUsername = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    const user = await User.findOne({ username } as any);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const profile = await Profile.findOne({ user: (user as any)._id } as any).populate('user', 'name email avatar username');

    if (!profile) {
        return next(new AppError('Profile not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});


// Public: Get Profile by User ID
export const getUserProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const profile = await Profile.findOne({ user: userId } as any).populate('user', 'name email avatar');

    if (!profile) {
        return next(new AppError('Profile not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});

// Protected: Get My Profile (Convenience)
export const getMyProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId } as any).populate('user', 'name email avatar');

    if (!profile) {
        return next(new AppError('Profile not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});

// Protected: Update My Profile
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    // Build profile object
    const profileFields: any = {};
    const { bio, title, socialLinks, resume, locations } = req.body;

    if (bio) profileFields.bio = bio;
    if (title) profileFields.title = title;
    if (resume) profileFields.resume = resume;
    if (locations) profileFields.locations = locations;
    if (socialLinks) profileFields.socialLinks = socialLinks;

    let profile = await Profile.findOne({ user: userId } as any);

    if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
            { user: userId } as any,
            { $set: profileFields },
            { new: true }
        );
    } else {
        // Create
        profileFields.user = userId;
        profile = await Profile.create(profileFields);
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});
