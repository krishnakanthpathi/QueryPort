import type { Request, Response, NextFunction } from 'express';
import Project from '../models/Project.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { cloudinary } from '../utils/cloudinary.js';

// Helper to normalized array fields from FormData
const normalizeArray = (field: any) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    return [field];
}

// Protected: Create New Project
export const createProject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    // Handle multiple file fields
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.['newImages'] || [];
    const avatarFiles = files?.['avatarFile'] || [];

    let imageUrls: string[] = [];
    let avatarUrl: string = '';

    // Upload new images to Cloudinary (queryport/projects/images)
    if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'queryport/projects/images',
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result?.secure_url || '');
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        imageUrls = await Promise.all(uploadPromises);
    }

    // Upload Avatar to Cloudinary (queryport/projects/avatar)
    if (avatarFiles.length > 0) {
        avatarUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'queryport/projects/avatar',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            if (avatarFiles[0]) {
                uploadStream.end(avatarFiles[0].buffer);
            } else {
                resolve('');
            }
        });
    }

    const {
        title,
        description,
        tagline,
        skills,
        status,
        category,
        startDate,
        endDate,
        budget,
    } = req.body;

    const links = normalizeArray(req.body.links);
    const tags = normalizeArray(req.body.tags);
    const contributors = normalizeArray(req.body.contributors);
    const existingImages = normalizeArray(req.body.images);

    // Use uploaded avatar or one provided in body (if any, though file takes precedence usually)
    const finalAvatar = avatarUrl || req.body.avatar;

    const project = await Project.create({
        userId,
        title,
        description,
        tagline,
        skills,
        links,
        images: [...existingImages, ...imageUrls],
        avatar: finalAvatar,
        status,
        category,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budget ? Number(budget) : null,
        tags,
        contributors
    });

    res.status(201).json({
        status: 'success',
        data: {
            project,
        },
    });
});

// Public: Get All Projects
export const getAllProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Simple find all for now, can add pagination/filtering later
    const projects = await Project.find().populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        results: projects.length,
        data: {
            projects,
        },
    });
});

// Public: Get Project by ID
export const getProjectById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('userId', 'name email avatar username');

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            project,
        },
    });
});

// Protected: Update Project
export const updateProject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const imageFiles = files?.['newImages'] || [];
    const avatarFiles = files?.['avatarFile'] || [];

    let project = await Project.findById(projectId);

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    // Check if user is the owner
    if (project.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to update this project', 403));
    }

    let newImageUrls: string[] = [];
    let newAvatarUrl: string = '';

    // Upload new images
    if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => {
            return new Promise<string>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'queryport/projects/images',
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result?.secure_url || '');
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        newImageUrls = await Promise.all(uploadPromises);
    }

    // Upload new avatar
    if (avatarFiles.length > 0) {
        newAvatarUrl = await new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'queryport/projects/avatar',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result?.secure_url || '');
                }
            );
            if (avatarFiles[0]) {
                uploadStream.end(avatarFiles[0].buffer);
            } else {
                resolve('');
            }
        });
    }

    const {
        title,
        description,
        tagline,
        skills,
        status,
        category,
        startDate,
        endDate,
        budget,
    } = req.body;

    const links = req.body.links ? normalizeArray(req.body.links) : undefined;
    const tags = req.body.tags ? normalizeArray(req.body.tags) : undefined;
    const contributors = req.body.contributors ? normalizeArray(req.body.contributors) : undefined;
    const existingImages = req.body.images ? normalizeArray(req.body.images) : [];

    const allImages = [...existingImages, ...newImageUrls];

    const updateData: any = {
        title,
        description,
        tagline,
        skills,
        status,
        category,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budget ? Number(budget) : null,
        images: allImages
    };

    if (newAvatarUrl) updateData.avatar = newAvatarUrl;
    // Note: if req.body.avatar is present (string), it might be the existing one. 
    // If not uploading a file, we might want to respect req.body.avatar? 
    // Usually if user doesn't change avatar, frontend sends the existing URL or nothing?
    // Let's assume if file is not provided, we check body. if body is present we update.
    // If neither, we leave it alone (it's not in updateData yet unless added below)

    if (!newAvatarUrl && req.body.avatar !== undefined) {
        updateData.avatar = req.body.avatar;
    }


    if (links) updateData.links = links;
    if (tags) updateData.tags = tags;
    if (contributors) updateData.contributors = contributors;

    project = await Project.findByIdAndUpdate(projectId, updateData, {
        new: true,
        runValidators: true,
    }).populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        data: {
            project,
        },
    });
});

// Protected: Delete Project
export const deleteProject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;
    // @ts-ignore
    const userId = req.user.id;

    const project = await Project.findById(projectId);

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    // Check if user is the owner
    if (project.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to delete this project', 403));
    }

    await Project.findByIdAndDelete(projectId);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// Protected: Get My Projects
export const getMyProjects = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const projects = await Project.find({ userId }).populate('userId', 'name email avatar username');

    res.status(200).json({
        status: 'success',
        results: projects.length,
        data: {
            projects,
        },
    });
});
