import type { Request, Response } from 'express';
import Education from '../models/Education.js';
import User from '../models/User.js';

export const addEducation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const education = await Education.create({ ...req.body, userId });
        res.status(201).json({
            status: 'success',
            data: { education }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

export const getMyEducation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const education = await Education.find({ userId }).sort({ startDate: -1 });
        res.status(200).json({
            status: 'success',
            results: education.length,
            data: { education }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getEducationByUsername = async (req: Request, res: Response) => {
    try {
        const user = await User.findOne({ username: req.params.username as string });
        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found' });
        }
        const education = await Education.find({ userId: user._id }).sort({ startDate: -1 });
        res.status(200).json({
            status: 'success',
            results: education.length,
            data: { education }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateEducation = async (req: Request, res: Response) => {
    try {
        const education = await Education.findOneAndUpdate(
            { _id: req.params.id, userId: (req as any).user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!education) {
            return res.status(404).json({ status: 'fail', message: 'Education not found or unauthorized' });
        }

        res.status(200).json({
            status: 'success',
            data: { education }
        });
    } catch (error: any) {
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

export const deleteEducation = async (req: Request, res: Response) => {
    try {
        const education = await Education.findOneAndDelete({
            _id: req.params.id,
            userId: (req as any).user._id
        });

        if (!education) {
            return res.status(404).json({ status: 'fail', message: 'Education not found or unauthorized' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
