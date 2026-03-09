
import type { Request, Response, NextFunction } from "express";
import Skill from "../models/Skill.js";
import Profile from "../models/Profile.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

const normalizeSkillName = (name: string) => name.toLowerCase().trim();

// Catalog: create a new global skill
export const createGlobalSkill = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, image } = req.body;

        if (!name) {
            return next(new AppError("Skill name is required", 400));
        }

        const normalizedName = normalizeSkillName(name);

        // @ts-ignore
        const existingSkill = await Skill.findOne({
            normalizedName,
            scope: "global",
        });

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
            normalizedName,
            image,
            scope: "global",
            // @ts-ignore
            createdBy: req.user._id,
        });

        res.status(201).json({
            status: "success",
            data: {
                skill: newSkill,
            },
        });
    }
);

// Backwards-compatible alias for existing frontend calls
export const createSkill = createGlobalSkill;

// Catalog: get all global skills (with optional search)
export const getGlobalSkills = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 9;
        const skip = (page - 1) * limit;
        const search = (req.query.search as string) || (req.query.q as string) || "";

        const filter: any = { scope: "global" };

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { name: searchRegex },
                { normalizedName: searchRegex },
            ];
        }

        const [skills, total] = await Promise.all([
            Skill.find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ name: 1 }),
            Skill.countDocuments(filter),
        ]);

        res.status(200).json({
            status: "success",
            results: skills.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: {
                skills,
            },
        });
    }
);

// Backwards-compatible alias for existing frontend calls
export const getAllSkills = getGlobalSkills;

// User custom skills: create a skill owned by the user
export const createUserSkill = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { name, image } = req.body;

        if (!name) {
            return next(new AppError("Skill name is required", 400));
        }

        const normalizedName = normalizeSkillName(name);
        // @ts-ignore
        const ownerId = req.user._id;

        const existingSkill = await Skill.findOne({
            normalizedName,
            scope: "user",
            owner: ownerId,
        });

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
            normalizedName,
            image,
            scope: "user",
            owner: ownerId,
            createdBy: ownerId,
        });

        res.status(201).json({
            status: "success",
            data: {
                skill: newSkill,
            },
        });
    }
);

// User custom skills: list skills created by the authenticated user
export const getMyCreatedSkills = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;
        const skip = (page - 1) * limit;
        const search = (req.query.search as string) || (req.query.q as string) || "";

        // @ts-ignore
        const ownerId = req.user._id;

        const filter: any = {
            scope: "user",
            owner: ownerId,
        };

        if (search) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { name: searchRegex },
                { normalizedName: searchRegex },
            ];
        }

        const [skills, total] = await Promise.all([
            Skill.find(filter)
                .skip(skip)
                .limit(limit)
                .sort({ name: 1 }),
            Skill.countDocuments(filter),
        ]);

        res.status(200).json({
            status: "success",
            results: skills.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: {
                skills,
            },
        });
    }
);

// Get My skills (skills in user's profile)
export const getMySkills = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const profile = await Profile.findOne({ user: req.user._id }).populate(
            "skills"
        );

        if (!profile) {
            return next(new AppError("Profile not found", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                skills: profile.skills,
            },
        });
    }
);

// Add skill to profile (by id or by name/scope)
export const addSkillToProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { skillId, name, scope, image } = req.body as {
            skillId?: string;
            name?: string;
            scope?: "global" | "user";
            image?: string;
        };

        let finalSkillId = skillId;

        // If name is provided, find-or-create a skill then use its id
        if (!finalSkillId && name) {
            const normalizedName = normalizeSkillName(name);
            const requestedScope = scope === "user" ? "user" : "global";

            // @ts-ignore
            const ownerId = req.user._id;

            let filter: any;
            if (requestedScope === "global") {
                filter = { normalizedName, scope: "global" };
            } else {
                filter = { normalizedName, scope: "user", owner: ownerId };
            }

            let skill = await Skill.findOne(filter);

            if (!skill) {
                const payload: any = {
                    name,
                    normalizedName,
                    image,
                    scope: requestedScope,
                    // @ts-ignore
                    createdBy: req.user._id,
                };

                if (requestedScope === "user") {
                    payload.owner = ownerId;
                }

                skill = await Skill.create(payload);
            }

            // @ts-ignore
            finalSkillId = skill._id;
        }

        if (!finalSkillId) {
            return next(
                new AppError("Either skillId or name must be provided", 400)
            );
        }

        // Use findOneAndUpdate to avoid triggering validation on other fields (like socialLinks)
        // @ts-ignore
        const profile = await Profile.findOneAndUpdate(
            // @ts-ignore
            { user: req.user._id },
            { $addToSet: { skills: finalSkillId } }, // $addToSet handles "only add if not present"
            { new: true }
        ).populate("skills");

        if (!profile) {
            return next(new AppError("Profile not found", 404));
        }

        res.status(200).json({
            status: "success",
            data: {
                skills: profile.skills,
            },
        });
    }
);

// Remove skill from profile
export const removeSkillFromProfile = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
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
    }
);

// Delete a skill (only by its creator)
export const deleteSkill = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const { id } = req.params;

        const skill = await Skill.findById(id);

        if (!skill) {
            return next(new AppError("Skill not found", 404));
        }

        // Only the creator can delete the skill
        // @ts-ignore
        const currentUserId = req.user._id?.toString();
        const createdById = (skill as any).createdBy?.toString();

        if (!createdById || createdById !== currentUserId) {
            return next(
                new AppError("You are not allowed to delete this skill", 403)
            );
        }

        // Remove the skill reference from all profiles first
        await Profile.updateMany(
            { skills: id } as any,
            { $pull: { skills: id } }
        );

        await skill.deleteOne();

        res.status(200).json({
            status: "success",
            message: "Skill deleted successfully",
        });
    }
);
