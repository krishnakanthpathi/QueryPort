import type { Request, Response } from 'express';
import axios from 'axios';
import Profile from '../models/Profile.js';
import Project from '../models/Project.js';

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
        const badges = response.data.models ? response.data.models.length : 0;
        return { badges, points: 0 }; // Points require another call or scraping, keeping it simple for now
    } catch (error) {
        console.error(`HackerRank fetch failed for ${username}`, error);
        return { badges: 0, points: 0 };
    }
};

// --- Controllers ---

export const syncStats = async (req: Request, res: Response) => {
    // Expect user to be authenticated and attached to req.user (middleware)
    // For manual sync, we use the logged-in user.
    // We can also allow an admin to sync others or sync by ID if needed, 
    // but typically users sync their own.

    // Assuming authMiddleware attaches user to req.body.user or req.user
    // But commonly in this project structure it seems we might need to look at how auth is handled.
    // Based on profileController, it seems we use `req.user` if extended, or maybe just passed.
    // Let's assume standard `req.user` from a middleware.

    const userId = (req as any).user?._id || (req as any).user?.id;

    if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'Unauthorized' });
    }

    try {
        // 1. Get Profile
        const profile = await Profile.findOne({ user: userId });
        if (!profile) {
            console.log('Profile not found for user:', userId);
            return res.status(404).json({ status: 'fail', message: 'Profile not found' });
        }
        console.log('Found profile:', profile._id);

        // 2. Fetch Project Likes
        // Aggregate total likes from all projects by this user
        console.log('Aggregating likes for userId:', profile.user);
        const projectStats = await Project.aggregate([
            { $match: { userId: profile.user } },
            { $group: { _id: null, totalLikes: { $sum: '$likes' } } }
        ]);
        console.log('Project stats result:', projectStats);
        const totalLikes = projectStats.length > 0 ? projectStats[0].totalLikes : 0;

        // 3. Fetch External Stats
        const p = profile as any;
        const codingProfiles = p.codingProfiles || {};

        // Safely extract existing stats
        const currentStats = p.stats ? JSON.parse(JSON.stringify(p.stats)) : {}; // Deep clone to avoid mongoose reference issues

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

        // 4. Update Profile
        // Construct new stats object
        const newStats = {
            totalLikes,
            leetcode: { ...(currentStats.leetcode || {}), solved: leetcodeData.solved },
            codeforces: { ...(currentStats.codeforces || {}), ...codeforcesData },
            hackerrank: { ...(currentStats.hackerrank || {}), badges: hackerrankData.badges },
            github: currentStats.github || { contributions: 0 }
        };

        // Explicitly set stats
        profile.set('stats', newStats);

        await profile.save();

        res.status(200).json({
            status: 'success',
            data: { stats: newStats }
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
        const sortBy = (req.query.sortBy as string) || 'likes'; // likes, leetcode, codeforces, hackerrank
        const skip = (page - 1) * limit;

        let sortQuery: any = {};

        switch (sortBy) {
            case 'leetcode':
                sortQuery = { 'stats.leetcode.solved': -1 };
                break;
            case 'codeforces':
                sortQuery = { 'stats.codeforces.rating': -1 };
                break;
            case 'hackerrank':
                sortQuery = { 'stats.hackerrank.badges': -1 };
                break;
            case 'likes':
            default:
                sortQuery = { 'stats.totalLikes': -1 };
                break;
        }

        const leaderboard = await Profile.find()
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name username avatar'); // Populate user details

        const total = await Profile.countDocuments();

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
