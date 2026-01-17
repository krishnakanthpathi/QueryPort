import type { Request, Response, NextFunction } from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { cloudinary } from '../utils/cloudinary.js';

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

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const profile = await Profile.findOne({ user: userId } as any).populate('user', 'name email avatar username');

    if (!profile) {
        // Return a minimal profile with user info
        return res.status(200).json({
            status: 'success',
            data: {
                profile: {
                    user,
                    bio: '',
                    title: '',
                    locations: '',
                    socialLinks: [],
                    resume: '',
                },
            },
        });
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});

// Protected: Get My Profile
export const getMyProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId } as any).populate('user', 'name email avatar username');

    if (!profile) {
        // Return null or minimal profile so frontend doesn't get 404
        return res.status(200).json({
            status: 'success',
            data: {
                // If we want to be helpful, we could fetch user and return it,
                // but for /me, the frontend acts on 'profile: null' by using its own user context.
                // However, returning a structure is safer to avoid client mutations on null.
                profile: null,
            },
        });
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
    const { bio, title, socialLinks, resume, locations } = req.body; // Removed avatar from here as it might come from file

    if (bio) profileFields.bio = bio;
    if (title) profileFields.title = title;
    if (resume) profileFields.resume = resume;
    if (locations) profileFields.locations = locations;
    if (socialLinks) {
        // socialLinks might come as string if sent via FormData, need to parse if it is string
        if (typeof socialLinks === 'string') {
            try {
                profileFields.socialLinks = JSON.parse(socialLinks);
            } catch (e) {
                // If parse fails, ignore or handle error. 
                // It might be that it's just not valid JSON.
            }
        } else {
            profileFields.socialLinks = socialLinks;
        }
    }

    // Handle File Upload
    if (req.file) {
        try {
            const result: any = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'queryport/profile' },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                uploadStream.end(req.file!.buffer);
            });

            // Update User Avatar
            await User.findByIdAndUpdate(userId, { avatar: result.secure_url });
        } catch (error) {
            return next(new AppError('Image upload failed', 500));
        }
    } else if (req.body.avatar) {
        // Fallback if avatar is sent as URL string (legacy support or if user pastes URL)
        await User.findByIdAndUpdate(userId, { avatar: req.body.avatar });
    }


    let profile = await Profile.findOne({ user: userId } as any);

    if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
            { user: userId } as any,
            { $set: profileFields },
            { new: true }
        ).populate('user', 'name email avatar username');
    } else {
        // Create
        profileFields.user = userId;
        profile = await Profile.create(profileFields);
        profile = await profile.populate('user', 'name email avatar username');
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});
