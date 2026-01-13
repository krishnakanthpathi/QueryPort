import type { Request, Response, NextFunction } from 'express';
import Project from '../models/Project.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

// Protected: Create New Project
export const createProject = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;

    const {
        title,
        description,
        tagline,
        skills,
        links,
        images,
        avatar,
        status,
        category,
        startDate,
        endDate,
        budget,
        tags,
        contributors
    } = req.body;

    const project = await Project.create({
        userId,
        title,
        description,
        tagline,
        skills,
        links,
        images,
        avatar,
        status,
        category,
        startDate,
        endDate,
        budget,
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

    let project = await Project.findById(projectId);

    if (!project) {
        return next(new AppError('Project not found', 404));
    }

    // Check if user is the owner
    // project.userId is an ObjectId, convert to string for comparison
    if (project.userId.toString() !== userId) {
        return next(new AppError('You are not authorized to update this project', 403));
    }

    project = await Project.findByIdAndUpdate(projectId, req.body, {
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
