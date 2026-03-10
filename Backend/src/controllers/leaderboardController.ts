import type { Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Education from '../models/Education.js';
import Certification from '../models/Certification.js';
import Experience from '../models/Experience.js';
import Achievement from '../models/Achievement.js';

// --- Helper Functions to Fetch External Data ---

const fetchLeetCodeStats = async (username: string) => {
    try {
        const query = `
            query userProblemsSolved($username: String!) {
                matchedUser(username: $username) {
                    submitStats: submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                }
            }
        `;
        const response = await axios.post('https://leetcode.com/graphql', {
            query,
            variables: { username }
        }, {
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });

        if (response.data.data?.matchedUser?.submitStats?.acSubmissionNum) {
            const all = response.data.data.matchedUser.submitStats.acSubmissionNum.find((s: any) => s.difficulty === 'All');
            return { solved: all ? all.count : 0 };
        }
        return { solved: 0 };
    } catch (error) {
        console.error(`LeetCode fetch failed for ${username}`, error);
        return { solved: 0 };
    }
};

const fetchCodeforcesStats = async (handle: string) => {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`, { timeout: 5000 });
        if (response.data.status === 'OK' && response.data.result.length > 0) {
            const user = response.data.result[0];
            return { rating: user.rating || 0, maxRating: user.maxRating || 0 };
        }
        return { rating: 0, maxRating: 0 };
    } catch (error) {
        console.error(`Codeforces fetch failed for ${handle}`, error);
        return { rating: 0, maxRating: 0 };
    }
};

const fetchHackerRankStats = async (username: string) => {
    try {
        // Fetch badges
        const response = await axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000
        });

        let badges = 0;
        if (response.data.models) {
            // Filter badges that have at least 1 star
            const activeBadges = response.data.models.filter((b: any) => b.stars > 0);
            badges = activeBadges.length;
        }

        return { badges, points: 0 }; // Points require another call or scraping, keeping it simple for now
    } catch (error) {
        console.error(`HackerRank fetch failed for ${username}`, error);
        return { badges: 0, points: 0 };
    }
};

// --- Controllers ---

export const syncStats = async (req: Request, res: Response) => {
    // Expect user to be attached to req (middleware)
    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }

    try {
        // 1. Get Profile
        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ status: 'fail', message: 'Profile not found' });
        }

        // 2. Fetch Project Likes
        const projectStats = await Project.aggregate([
            { $match: { userId: profile.user } },
            { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
        ]);
        const totalLikes = projectStats.length > 0 ? projectStats[0].totalLikes : 0;

        // 3. Fetch External Stats
        const p = profile as any;
        const codingProfiles = p.codingProfiles || {};

        // Safely extract existing stats
        const currentStats = p.stats ? JSON.parse(JSON.stringify(p.stats)) : {};

        let leetcodeData = { solved: 0 };
        if (codingProfiles.leetcode) {
            leetcodeData = await fetchLeetCodeStats(codingProfiles.leetcode);
        }

        let codeforcesData = { rating: 0, maxRating: 0 };
        if (codingProfiles.codeforces) {
            codeforcesData = await fetchCodeforcesStats(codingProfiles.codeforces);
        }

        let hackerrankData = { badges: 0, points: 0 };
        if (codingProfiles.hackerrank) {
            hackerrankData = await fetchHackerRankStats(codingProfiles.hackerrank);
        }

        // 4. Fetch Education for CGPA & User Type
        const educationList = await Education.find({ userId: userId }).sort({ endDate: -1, startDate: -1 }); // Most recent first
        let cgpa = 0;
        let userType = 'Student'; // Default or fallback

        if (educationList.length > 0 && educationList[0]) {
            const recentEdu = educationList[0];

            // Try to extract CGPA
            if (recentEdu.score) {
                const parsed = parseFloat(recentEdu.score);
                if (!isNaN(parsed)) {
                    cgpa = parsed;
                }
            } else if (recentEdu.semesters && recentEdu.semesters.length > 0) {
                // Try to get max/latest cgpa from semesters if overall score is missing?
                // Or just leave as 0 if not explicitly in score.
                // Let's stick to overall score for now as per plan, or simpler logic.
                // Actually, let's try to check the last semester's CGPA if available
                const lastSem = recentEdu.semesters[recentEdu.semesters.length - 1];
                if (lastSem && lastSem.cgpa) {
                    const parsedSemCgpa = parseFloat(lastSem.cgpa);
                    if (!isNaN(parsedSemCgpa)) cgpa = parsedSemCgpa;
                }
            }

            // Infer Type
            // If any education is marked current -> Student
            const isStudent = educationList.some(edu => edu.current);
            userType = isStudent ? 'Student' : 'Professional';
            // Logic can be refined (e.g. Alumni if no current education but has a degree)
            // Sticking to simple Student vs Professional for now based on 'current' flag
        } else {
            userType = 'Other';
        }


        // 5. Update Profile
        const newStats = {
            totalLikes,
            leetcode: { ...(currentStats.leetcode || {}), solved: leetcodeData.solved },
            codeforces: { ...(currentStats.codeforces || {}), ...codeforcesData },
            hackerrank: { ...(currentStats.hackerrank || {}), badges: hackerrankData.badges },
            github: currentStats.github || { contributions: 0 },
            cgpa
        };

        profile.set('stats', newStats);
        profile.set('type', userType);

        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { stats: newStats, type: userType }
        });

    } catch (error: any) {
        console.error('Sync Stats Error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const MAX_EXPORT_LIMIT = 1000;

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        let limit = parseInt(req.query.limit as string) || 10;
        const exportMode = req.query.export === '1' || req.query.export === 'true';
        if (exportMode && limit > MAX_EXPORT_LIMIT) limit = MAX_EXPORT_LIMIT;
        else if (!exportMode && limit > 100) limit = 100;

        const sortBy = (req.query.sortBy as string) || 'likes';
        const sortOrder = (req.query.order as string) === 'asc' ? 1 : -1;
        const typeFilter = (req.query.type as string);
        const searchQuery = (req.query.search as string);
        const skip = (page - 1) * limit;

        let sortQuery: any = {};
        let filterQuery: any = {};

        if (typeFilter && typeFilter !== 'All') {
            filterQuery.type = typeFilter;
        }

        if (searchQuery) {
            const users = await User.find({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { username: { $regex: searchQuery, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            filterQuery.user = { $in: userIds };
        }

        // Profile stats range filters
        const minCgpa = req.query.minCgpa !== undefined && req.query.minCgpa !== '' ? parseFloat(req.query.minCgpa as string) : null;
        const maxCgpa = req.query.maxCgpa !== undefined && req.query.maxCgpa !== '' ? parseFloat(req.query.maxCgpa as string) : null;
        const minLeetcode = req.query.minLeetcode !== undefined && req.query.minLeetcode !== '' ? parseInt(req.query.minLeetcode as string, 10) : null;
        const maxLeetcode = req.query.maxLeetcode !== undefined && req.query.maxLeetcode !== '' ? parseInt(req.query.maxLeetcode as string, 10) : null;
        const minCodeforces = req.query.minCodeforces !== undefined && req.query.minCodeforces !== '' ? parseInt(req.query.minCodeforces as string, 10) : null;
        const maxCodeforces = req.query.maxCodeforces !== undefined && req.query.maxCodeforces !== '' ? parseInt(req.query.maxCodeforces as string, 10) : null;
        const minHackerrank = req.query.minHackerrank !== undefined && req.query.minHackerrank !== '' ? parseInt(req.query.minHackerrank as string, 10) : null;
        const maxHackerrank = req.query.maxHackerrank !== undefined && req.query.maxHackerrank !== '' ? parseInt(req.query.maxHackerrank as string, 10) : null;
        const minLikes = req.query.minLikes !== undefined && req.query.minLikes !== '' ? parseInt(req.query.minLikes as string, 10) : null;

        if (minCgpa != null && !isNaN(minCgpa)) filterQuery['stats.cgpa'] = { ...(filterQuery['stats.cgpa'] as object || {}), $gte: minCgpa };
        if (maxCgpa != null && !isNaN(maxCgpa)) filterQuery['stats.cgpa'] = { ...(filterQuery['stats.cgpa'] as object || {}), $lte: maxCgpa };
        if (minLeetcode != null && !isNaN(minLeetcode)) filterQuery['stats.leetcode.solved'] = { ...(filterQuery['stats.leetcode.solved'] as object || {}), $gte: minLeetcode };
        if (maxLeetcode != null && !isNaN(maxLeetcode)) filterQuery['stats.leetcode.solved'] = { ...(filterQuery['stats.leetcode.solved'] as object || {}), $lte: maxLeetcode };
        if (minCodeforces != null && !isNaN(minCodeforces)) filterQuery['stats.codeforces.rating'] = { ...(filterQuery['stats.codeforces.rating'] as object || {}), $gte: minCodeforces };
        if (maxCodeforces != null && !isNaN(maxCodeforces)) filterQuery['stats.codeforces.rating'] = { ...(filterQuery['stats.codeforces.rating'] as object || {}), $lte: maxCodeforces };
        if (minHackerrank != null && !isNaN(minHackerrank)) filterQuery['stats.hackerrank.badges'] = { ...(filterQuery['stats.hackerrank.badges'] as object || {}), $gte: minHackerrank };
        if (maxHackerrank != null && !isNaN(maxHackerrank)) filterQuery['stats.hackerrank.badges'] = { ...(filterQuery['stats.hackerrank.badges'] as object || {}), $lte: maxHackerrank };
        if (minLikes != null && !isNaN(minLikes)) filterQuery['stats.totalLikes'] = { ...(filterQuery['stats.totalLikes'] as object || {}), $gte: minLikes };

        if (req.query.hasResume === '1' || req.query.hasResume === 'true') {
            filterQuery.$and = filterQuery.$and || [];
            filterQuery.$and.push({ $and: [{ resume: { $exists: true } }, { resume: { $ne: '' } }] });
        }
        if (req.query.hasLocation === '1' || req.query.hasLocation === 'true') {
            filterQuery.$and = filterQuery.$and || [];
            filterQuery.$and.push({ $and: [{ locations: { $exists: true } }, { locations: { $ne: '' } }] });
        }
        const skillIdParam = req.query.skillId as string;
        if (skillIdParam && mongoose.Types.ObjectId.isValid(skillIdParam)) {
            filterQuery.skills = new mongoose.Types.ObjectId(skillIdParam);
        }

        // Relation-based filters: get distinct userIds and intersect with filterQuery.user
        const intersectUserIds = (userIds: mongoose.Types.ObjectId[]) => {
            if (userIds.length === 0) {
                filterQuery.user = { $in: [] };
                return;
            }
            if (filterQuery.user && filterQuery.user.$in) {
                const existing = new Set((filterQuery.user.$in as mongoose.Types.ObjectId[]).map((id: mongoose.Types.ObjectId) => id.toString()));
                const next = userIds.filter(id => existing.has(id.toString()));
                filterQuery.user = { $in: next };
            } else {
                filterQuery.user = { $in: userIds };
            }
        };

        const credentialId = (req.query.credentialId as string)?.trim();
        const issuingOrganization = (req.query.issuingOrganization as string)?.trim();
        const certificationName = (req.query.certificationName as string)?.trim();
        if (credentialId || issuingOrganization || certificationName) {
            const certFilter: any = {};
            if (credentialId) certFilter.credentialId = { $regex: credentialId, $options: 'i' };
            if (issuingOrganization) certFilter.issuingOrganization = { $regex: issuingOrganization, $options: 'i' };
            if (certificationName) certFilter.name = { $regex: certificationName, $options: 'i' };
            const certUserIds = await Certification.distinct('userId', certFilter);
            intersectUserIds(certUserIds);
        }

        const institution = (req.query.institution as string)?.trim();
        const degree = (req.query.degree as string)?.trim();
        const fieldOfStudy = (req.query.fieldOfStudy as string)?.trim();
        const currentStudent = req.query.currentStudent === '1' || req.query.currentStudent === 'true';
        if (institution || degree || fieldOfStudy || currentStudent) {
            const eduFilter: any = {};
            if (institution) eduFilter.institution = { $regex: institution, $options: 'i' };
            if (degree) eduFilter.degree = { $regex: degree, $options: 'i' };
            if (fieldOfStudy) eduFilter.fieldOfStudy = { $regex: fieldOfStudy, $options: 'i' };
            if (currentStudent) eduFilter.current = true;
            const eduUserIds = await Education.distinct('userId', eduFilter);
            intersectUserIds(eduUserIds);
        }

        const company = (req.query.company as string)?.trim();
        const role = (req.query.role as string)?.trim();
        const hasCurrentJob = req.query.hasCurrentJob === '1' || req.query.hasCurrentJob === 'true';
        if (company || role || hasCurrentJob) {
            const expFilter: any = {};
            if (company) expFilter.company = { $regex: company, $options: 'i' };
            if (role) expFilter.role = { $regex: role, $options: 'i' };
            if (hasCurrentJob) expFilter.current = true;
            const expUserIds = await Experience.distinct('userId', expFilter);
            intersectUserIds(expUserIds);
        }

        const achievementOrganization = (req.query.achievementOrganization as string)?.trim();
        const achievementTitle = (req.query.achievementTitle as string)?.trim();
        if (achievementOrganization || achievementTitle) {
            const achFilter: any = {};
            if (achievementOrganization) achFilter.organization = { $regex: achievementOrganization, $options: 'i' };
            if (achievementTitle) achFilter.title = { $regex: achievementTitle, $options: 'i' };
            const achUserIds = await Achievement.distinct('userId', achFilter);
            intersectUserIds(achUserIds);
        }

        const projectCategory = (req.query.projectCategory as string)?.trim();
        const minPublishedProjects = req.query.minPublishedProjects !== undefined && req.query.minPublishedProjects !== '' ? parseInt(req.query.minPublishedProjects as string, 10) : null;
        if (projectCategory && ['personal', 'professional', 'others'].includes(projectCategory)) {
            const projUserIds = await Project.distinct('userId', { status: 'published', category: projectCategory });
            intersectUserIds(projUserIds);
        }
        if (minPublishedProjects != null && !isNaN(minPublishedProjects) && minPublishedProjects > 0) {
            const publishedCounts = await Project.aggregate([
                { $match: { status: 'published' } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $match: { count: { $gte: minPublishedProjects } } },
                { $project: { _id: 1 } }
            ]);
            const projUserIds = publishedCounts.map((r: any) => r._id);
            intersectUserIds(projUserIds);
        }

        // Parse dynamic sort
        // Format: key:order,key:order (e.g. leetcode:desc,cgpa:asc)
        // If simple format (leetcode), use default order logic

        const sortMap: Record<string, string> = {
            'leetcode': 'stats.leetcode.solved',
            'codeforces': 'stats.codeforces.rating',
            'hackerrank': 'stats.hackerrank.badges',
            'cgpa': 'stats.cgpa',
            'likes': 'stats.totalLikes'
        };

        if (sortBy.includes(':') || sortBy.includes(',')) {
            const sorts = sortBy.split(',');
            sorts.forEach(s => {
                const parts = s.split(':');
                const key = parts[0];
                const order = parts[1];

                // Ensure key is valid string
                const dbField = (key && sortMap[key]) ? sortMap[key] : sortMap['likes'];
                const direction = order === 'asc' ? 1 : -1;

                // @ts-ignore
                if (dbField) sortQuery[dbField] = direction;
            });
        } else {
            // Fallback to old single-sort logic or specifically requested single sort
            switch (sortBy) {
                case 'overall':
                    sortQuery = {
                        'stats.leetcode.solved': -1,
                        'stats.hackerrank.badges': -1,
                        'stats.cgpa': -1
                    };
                    break;
                case 'leetcode':
                    sortQuery = { 'stats.leetcode.solved': sortOrder };
                    break;
                case 'codeforces':
                    sortQuery = { 'stats.codeforces.rating': sortOrder };
                    break;
                case 'hackerrank':
                    sortQuery = { 'stats.hackerrank.badges': sortOrder };
                    break;
                case 'cgpa':
                    sortQuery = { 'stats.cgpa': sortOrder };
                    break;
                case 'likes':
                default:
                    sortQuery = { 'stats.totalLikes': sortOrder };
                    break;
            }
        }

        const leaderboard = await Profile.find(filterQuery)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name username avatar'); // Populate user details

        const total = await Profile.countDocuments(filterQuery);

        res.status(200).json({
            status: 'success',
            results: leaderboard.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: leaderboard
        });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
