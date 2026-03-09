import type { Request, Response, NextFunction } from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Achievement from '../models/Achievement.js';
import Certification from '../models/Certification.js';
import Education from '../models/Education.js';
import Experience from '../models/Experience.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { cloudinary } from '../utils/cloudinary.js';
import redis from '../utils/redis.js';

// Public: Get Profile by Username
export const getProfileByUsername = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.params;

    // Check Redis Cache
    const cacheKey = `profile:${username}`;
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                status: 'success',
                source: 'cache',
                data: JSON.parse(cachedData)
            });
        }
    } catch (error) {
        console.error('Redis error:', error);
    }

    const user = await User.findOne({ username } as any);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const userId = (user as any)._id;

    const profilePromise = Profile.findOne({ user: userId } as any)
        .populate('user', 'name email avatar username')
        .populate('skills');

    // Fetch related data in parallel
    const [profile, projects, achievements, certifications, education, experience] = await Promise.all([
        profilePromise,
        Project.find({ userId: userId, status: 'published' }).sort({ createdAt: -1 }),
        Achievement.find({ userId: userId }).sort({ date: -1 }),
        Certification.find({ userId: userId }).sort({ issueDate: -1 }),
        Education.find({ userId: userId }).sort({ startDate: -1 }),
        Experience.find({ userId: userId }).sort({ startDate: -1 })
    ]);

    if (!profile) {
        // Instead of 404, return minimal structure with user info
        return res.status(200).json({
            status: 'success',
            data: {
                profile: {
                    user: user, // user is already found above
                    bio: '',
                    title: '',
                    locations: '',
                    socialLinks: [],
                    codingProfiles: {}
                },
                projects,
                achievements,
                certifications,
                education,
                experience
            },
        });
    }

    const responseData = {
        profile,
        projects,
        achievements,
        certifications,
        education,
        experience
    };

    // Set Redis Cache
    try {
        await redis.set(cacheKey, JSON.stringify(responseData), 'EX', 600);
    } catch (error) {
        console.error('Redis error:', error);
    }

    res.status(200).json({
        status: 'success',
        data: responseData,
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
    const { bio, title, socialLinks, resume, locations, codingProfiles } = req.body; // Removed avatar from here as it might come from file

    if (bio) profileFields.bio = bio;
    if (title) profileFields.title = title;
    if (resume) profileFields.resume = resume;
    if (locations) profileFields.locations = locations;

    if (codingProfiles) {
        if (typeof codingProfiles === 'string') {
            try {
                profileFields.codingProfiles = JSON.parse(codingProfiles);
            } catch (e) {
                // ignore
            }
        } else {
            profileFields.codingProfiles = codingProfiles;
        }
    }
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

    // Invalidate Redis Cache
    if (profile && profile.user) {
        const username = (profile.user as any).username;
        if (username) {
            await redis.del(`profile:${username}`);
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            profile,
        },
    });
});

// Public: Search Users
export const searchUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { q, limit } = req.query;

    if (!q) {
        return res.status(200).json({
            status: 'success',
            data: {
                users: []
            }
        });
    }

    const searchQuery = new RegExp(q as string, 'i');
    const limitNum = parseInt(limit as string) || 5;

    const users = await User.find({
        $or: [
            { name: searchQuery },
            { username: searchQuery }
        ]
    })
        .select('name username avatar')
        .limit(limitNum);

    res.status(200).json({
        status: 'success',
        data: {
            users
        }
    });
});
