
import type { Request, Response, NextFunction } from "express";
import Skill from "../models/Skill.js";
import Profile from "../models/Profile.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

// Create a new global skill
export const createSkill = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, image } = req.body;

    // @ts-ignore
    const existingSkill = await Skill.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (existingSkill) {
        return res.status(200).json({
            status: "success",
            data: {
                skill: existingSkill,
            },
        });
    }

    const newSkill = await Skill.create({
        name,
        image,
        // @ts-ignore
        createdBy: req.user._id,
    });

    res.status(201).json({
        status: "success",
        data: {
            skill: newSkill,
        },
    });
});

// Get all global skills
export const getAllSkills = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const skills = await Skill.find();

    res.status(200).json({
        status: "success",
        results: skills.length,
        data: {
            skills,
        },
    });
});

// Get My skills (skills in user's profile)
export const getMySkills = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const profile = await Profile.findOne({ user: req.user._id }).populate('skills');

    if (!profile) {
        return next(new AppError("Profile not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            skills: profile.skills,
        },
    });
});


// Add skill to profile
export const addSkillToProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { skillId } = req.body;

    // Use findOneAndUpdate to avoid triggering validation on other fields (like socialLinks)
    // @ts-ignore
    const profile = await Profile.findOneAndUpdate(
        // @ts-ignore
        { user: req.user._id },
        { $addToSet: { skills: skillId } }, // $addToSet handles "only add if not present"
        { new: true }
    ).populate('skills');

    if (!profile) {
        return next(new AppError("Profile not found", 404));
    }

    res.status(200).json({
        status: "success",
        data: {
            skills: profile.skills,
        },
    });
});

// Remove skill from profile
export const removeSkillFromProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params; // skillId

    // @ts-ignore
    const profile = await Profile.findOneAndUpdate(
        // @ts-ignore
        { user: req.user._id },
        { $pull: { skills: id } },
        { new: true }
    );

    if (!profile) {
        return next(new AppError("Profile not found", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Skill removed from profile",
    });
});
