import type { Request, Response } from 'express';
import Experience from '../models/Experience.js';
import User from '../models/User.js';
import redis from '../utils/redis.js';

export const addExperience = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const experience = await Experience.create({ ...req.body, userId });
        const user = await User.findById(userId).select('username');
        if (user?.username) {
            try { await redis.del(`profile:${user.username}`); } catch (e) { /* ignore */ }
        }
        res.status(201).json({
            status: 'success',
            data: { experience }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

export const getMyExperience = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const experience = await Experience.find({ userId }).sort({ startDate: -1 });
        res.status(200).json({
            status: 'success',
            results: experience.length,
            data: { experience }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getExperienceByUsername = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ username: req.params.username as string });
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        const experience = await Experience.find({ userId: user._id }).sort({ startDate: -1 });
        res.status(200).json({
            status: 'success',
            results: experience.length,
            data: { experience }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateExperience = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const experience = await Experience.findOneAndUpdate(
            { _id: req.params.id, userId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!experience) {
            return res.status(404).json({ status: 'fail', message: 'Experience not found or unauthorized' });
        }

        const user = await User.findById(userId).select('username');
        if (user?.username) {
            try { await redis.del(`profile:${user.username}`); } catch (e) { /* ignore */ }
        }

        res.status(200).json({
            status: 'success',
            data: { experience }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

export const deleteExperience = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const experience = await Experience.findOneAndDelete({
            _id: req.params.id,
            userId
        });

        if (!experience) {
            return res.status(404).json({ status: 'fail', message: 'Experience not found or unauthorized' });
        }

        const user = await User.findById(userId).select('username');
        if (user?.username) {
            try { await redis.del(`profile:${user.username}`); } catch (e) { /* ignore */ }
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
