import type { Request, Response } from 'express';
import axios from 'axios';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

import Education from '../models/Education.js';

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

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
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
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: leaderboard
        });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
